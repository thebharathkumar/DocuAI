import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { insertRepositorySchema, insertDocumentationSchema } from "@shared/schema";
import { GitHubService } from "./services/github";
import { ASTParser } from "./services/parser";
import { generateReadme, generateApiDocumentation, generateCodeComments, analyzeCodeQuality } from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  const githubService = new GitHubService();
  const astParser = new ASTParser();

  // Analyze repository endpoint
  app.post("/api/repositories/analyze", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "Repository URL is required" });
      }

      // Check if repository already exists
      let repository = await storage.getRepositoryByUrl(url);
      
      if (!repository) {
        // Fetch repository info from GitHub
        const repoInfo = await githubService.getRepository(url);
        const fileTree = await githubService.getFileTree(url);
        
        repository = await storage.createRepository({
          url,
          name: repoInfo.name,
          owner: repoInfo.full_name.split('/')[0],
          description: repoInfo.description,
          language: repoInfo.language,
          fileStructure: fileTree,
          analysisStatus: "pending"
        });
      }

      // Create or update analysis job
      let analysisJob = await storage.getAnalysisJobByRepo(repository.id);
      if (!analysisJob) {
        analysisJob = await storage.createAnalysisJob({
          repositoryId: repository.id,
          status: "queued",
          progress: "0"
        });
      }

      // Start background analysis
      processRepositoryAnalysis(repository.id, url).catch(console.error);

      res.json({ repository, analysisJob });
    } catch (error) {
      console.error("Repository analysis error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get repository details
  app.get("/api/repositories/:id", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      const analysisJob = await storage.getAnalysisJobByRepo(repository.id);
      const documentations = await storage.getDocumentationByRepo(repository.id);
      
      res.json({ repository, analysisJob, documentations });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get file content
  app.get("/api/repositories/:id/files/*", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }

      const filePath = (req.params as any)['0'] || "";
      const content = await githubService.getFileContent(repository.url, filePath);
      
      res.json({ content, filePath });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Generate documentation
  app.post("/api/repositories/:id/generate/:type", async (req, res) => {
    try {
      const { id, type } = req.params;
      const repository = await storage.getRepository(id);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }

      let content = "";
      let metadata = {};

      if (type === "readme") {
        const mainFiles = githubService.getMainFiles(repository.fileStructure as any);
        const readmeResult = await generateReadme({
          name: repository.name,
          description: repository.description || "",
          files: mainFiles,
          structure: repository.fileStructure
        });
        content = readmeResult.content;
        if (readmeResult.imagePath) {
          metadata = { imagePath: readmeResult.imagePath };
        }
      } else if (type === "api") {
        const mainFiles = githubService.getMainFiles(repository.fileStructure as any);
        const fileContents = await githubService.getMultipleFileContents(repository.url, mainFiles.slice(0, 5));
        
        const allFunctions: any[] = [];
        const allClasses: any[] = [];
        
        for (const [fileName, fileContent] of Object.entries(fileContents)) {
          const parsed = astParser.parseFile(fileName, fileContent);
          allFunctions.push(...parsed.functions);
          allClasses.push(...parsed.classes);
        }
        
        content = await generateApiDocumentation(allFunctions.map(f => ({
          name: f.name,
          params: f.params || [],
          returnType: f.returnType,
          description: f.description
        })));
      } else if (type === "comments") {
        const mainFiles = githubService.getMainFiles(repository.fileStructure as any);
        const fileContents = await githubService.getMultipleFileContents(repository.url, mainFiles.slice(0, 3));
        
        const allSuggestions: any[] = [];
        
        for (const [fileName, fileContent] of Object.entries(fileContents)) {
          const parsed = astParser.parseFile(fileName, fileContent);
          const suggestions = await generateCodeComments(fileContent, fileName);
          allSuggestions.push(...suggestions.map(s => ({ ...s, fileName })));
        }
        
        content = JSON.stringify(allSuggestions, null, 2);
        metadata = { suggestions: allSuggestions };
      }

      const documentation = await storage.createDocumentation({
        repositoryId: id,
        type,
        content,
        metadata
      });

      res.json(documentation);
    } catch (error) {
      console.error("Documentation generation error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get analysis status
  app.get("/api/analysis/:repositoryId", async (req, res) => {
    try {
      const analysisJob = await storage.getAnalysisJobByRepo(req.params.repositoryId);
      if (!analysisJob) {
        return res.status(404).json({ message: "Analysis job not found" });
      }
      
      res.json(analysisJob);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Serve generated images
  app.get("/api/images/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const imagePath = path.join(process.cwd(), 'generated_images', filename);
      
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.sendFile(imagePath);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  async function processRepositoryAnalysis(repositoryId: string, repoUrl: string) {
    try {
      // Update job status
      await storage.updateAnalysisJob(repositoryId, {
        status: "processing",
        progress: "10",
        currentFile: "Fetching file structure..."
      });

      const repository = await storage.getRepository(repositoryId);
      if (!repository) return;

      // Get main files for analysis
      const mainFiles = githubService.getMainFiles(repository.fileStructure as any);
      
      await storage.updateAnalysisJob(repositoryId, {
        progress: "30",
        currentFile: "Analyzing code structure..."
      });

      // Fetch file contents
      const fileContents = await githubService.getMultipleFileContents(repoUrl, mainFiles.slice(0, 5));
      
      await storage.updateAnalysisJob(repositoryId, {
        progress: "60",
        currentFile: "Running quality analysis..."
      });

      // Analyze code quality
      const qualityMetrics = await analyzeCodeQuality(Object.entries(fileContents).map(([name, content]) => ({
        name,
        content
      })));
      
      await storage.updateAnalysisJob(repositoryId, {
        progress: "90",
        currentFile: "Finalizing analysis..."
      });

      // Update repository with analysis results
      await storage.updateRepository(repositoryId, {
        analysisStatus: "completed"
      });

      await storage.updateAnalysisJob(repositoryId, {
        status: "completed",
        progress: "100",
        currentFile: "Analysis complete"
      });

    } catch (error) {
      console.error("Background analysis error:", error);
      await storage.updateAnalysisJob(repositoryId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
