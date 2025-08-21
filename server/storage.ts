import { type Repository, type InsertRepository, type Documentation, type InsertDocumentation, type AnalysisJob, type InsertAnalysisJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Repository methods
  getRepository(id: string): Promise<Repository | undefined>;
  getRepositoryByUrl(url: string): Promise<Repository | undefined>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  updateRepository(id: string, updates: Partial<Repository>): Promise<Repository | undefined>;

  // Documentation methods
  getDocumentation(id: string): Promise<Documentation | undefined>;
  getDocumentationByRepo(repositoryId: string, type?: string): Promise<Documentation[]>;
  createDocumentation(documentation: InsertDocumentation): Promise<Documentation>;

  // Analysis job methods
  getAnalysisJob(id: string): Promise<AnalysisJob | undefined>;
  getAnalysisJobByRepo(repositoryId: string): Promise<AnalysisJob | undefined>;
  createAnalysisJob(job: InsertAnalysisJob): Promise<AnalysisJob>;
  updateAnalysisJob(id: string, updates: Partial<AnalysisJob>): Promise<AnalysisJob | undefined>;
}

export class MemStorage implements IStorage {
  private repositories: Map<string, Repository>;
  private documentations: Map<string, Documentation>;
  private analysisJobs: Map<string, AnalysisJob>;

  constructor() {
    this.repositories = new Map();
    this.documentations = new Map();
    this.analysisJobs = new Map();
  }

  async getRepository(id: string): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoryByUrl(url: string): Promise<Repository | undefined> {
    return Array.from(this.repositories.values()).find(
      (repo) => repo.url === url,
    );
  }

  async createRepository(insertRepository: InsertRepository): Promise<Repository> {
    const id = randomUUID();
    const repository: Repository = { 
      ...insertRepository, 
      id,
      createdAt: new Date(),
      description: insertRepository.description || null,
      language: insertRepository.language || null,
      fileStructure: insertRepository.fileStructure || null,
      analysisStatus: insertRepository.analysisStatus || "pending"
    };
    this.repositories.set(id, repository);
    return repository;
  }

  async updateRepository(id: string, updates: Partial<Repository>): Promise<Repository | undefined> {
    const existing = this.repositories.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.repositories.set(id, updated);
    return updated;
  }

  async getDocumentation(id: string): Promise<Documentation | undefined> {
    return this.documentations.get(id);
  }

  async getDocumentationByRepo(repositoryId: string, type?: string): Promise<Documentation[]> {
    const docs = Array.from(this.documentations.values()).filter(
      (doc) => doc.repositoryId === repositoryId && (!type || doc.type === type)
    );
    return docs;
  }

  async createDocumentation(insertDocumentation: InsertDocumentation): Promise<Documentation> {
    const id = randomUUID();
    const documentation: Documentation = { 
      ...insertDocumentation, 
      id,
      createdAt: new Date(),
      metadata: insertDocumentation.metadata || null
    };
    this.documentations.set(id, documentation);
    return documentation;
  }

  async getAnalysisJob(id: string): Promise<AnalysisJob | undefined> {
    return this.analysisJobs.get(id);
  }

  async getAnalysisJobByRepo(repositoryId: string): Promise<AnalysisJob | undefined> {
    return Array.from(this.analysisJobs.values()).find(
      (job) => job.repositoryId === repositoryId
    );
  }

  async createAnalysisJob(insertJob: InsertAnalysisJob): Promise<AnalysisJob> {
    const id = randomUUID();
    const job: AnalysisJob = { 
      ...insertJob, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertJob.status ?? "queued",
      progress: insertJob.progress || null,
      currentFile: insertJob.currentFile || null,
      error: insertJob.error || null
    };
    this.analysisJobs.set(id, job);
    return job;
  }

  async updateAnalysisJob(id: string, updates: Partial<AnalysisJob>): Promise<AnalysisJob | undefined> {
    const existing = this.analysisJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.analysisJobs.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
