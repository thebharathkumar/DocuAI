import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import FileTree from "@/components/file-tree";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  selectedRepository: any;
  onRepositorySelect: (repo: any) => void;
  onFileSelect: (filePath: string) => void;
  onGenerateDoc: (type: string, doc: any) => void;
  onAnalysisStart?: (message: string) => void;
  onAnalysisEnd?: () => void;
}

export default function Sidebar({ 
  selectedRepository, 
  onRepositorySelect, 
  onFileSelect,
  onGenerateDoc,
  onAnalysisStart,
  onAnalysisEnd
}: SidebarProps) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const { toast } = useToast();

  const analyzeRepoMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/repositories/analyze", { url });
      return response.json();
    },
    onSuccess: (data) => {
      onRepositorySelect(data.repository);
      onAnalysisEnd?.();
      toast({
        title: "Analysis Started",
        description: "Repository analysis has begun. Check the progress below.",
      });
    },
    onError: (error) => {
      onAnalysisEnd?.();
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateDocMutation = useMutation({
    mutationFn: async ({ repositoryId, type }: { repositoryId: string; type: string }) => {
      const response = await apiRequest("POST", `/api/repositories/${repositoryId}/generate/${type}`);
      return response.json();
    },
    onSuccess: (data, variables) => {
      onGenerateDoc(variables.type, data);
      toast({
        title: "Documentation Generated",
        description: `${variables.type.toUpperCase()} documentation has been created.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: analysisStatus } = useQuery({
    queryKey: ["/api/analysis", selectedRepository?.id],
    enabled: !!selectedRepository,
    refetchInterval: selectedRepository && ["queued", "processing"].includes(selectedRepository.analysisStatus) ? 2000 : false,
  }) as { data?: { status?: string; progress?: string; currentFile?: string } };

  const handleAnalyze = () => {
    if (!repositoryUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid GitHub repository URL.",
        variant: "destructive",
      });
      return;
    }
    onAnalysisStart?.("Analyzing repository...");
    analyzeRepoMutation.mutate(repositoryUrl);
  };

  const handleGenerateDoc = (type: string) => {
    if (!selectedRepository) return;
    generateDocMutation.mutate({ repositoryId: selectedRepository.id, type });
  };

  const isAnalyzing = analysisStatus?.status === "processing" || analysisStatus?.status === "queued";
  const progress = analysisStatus?.progress ? parseInt(analysisStatus.progress) : 0;

  return (
    <div className="w-80 bg-white border-r border-border-light flex flex-col">
      {/* Repository Input Section */}
      <div className="p-4 border-b border-border-light">
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fab fa-github mr-2"></i>GitHub Repository URL
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="https://github.com/username/repository"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                className="font-mono text-sm"
                data-testid="input-repository-url"
              />
              <button 
                className="absolute right-2 top-2 text-github-blue hover:text-blue-700 transition-colors"
                onClick={handleAnalyze}
                disabled={analyzeRepoMutation.isPending}
                data-testid="button-search-repo"
              >
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={analyzeRepoMutation.isPending}
            className="w-full bg-github-blue hover:bg-blue-700"
            data-testid="button-analyze-repository"
          >
            <i className="fas fa-play mr-2"></i>
            {analyzeRepoMutation.isPending ? "Analyzing..." : "Analyze Repository"}
          </Button>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="p-4 border-b border-border-light bg-blue-50" data-testid="analysis-progress">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-github-blue">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {analysisStatus?.currentFile || "Analyzing repository structure..."}
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-xs text-text-medium">
              {analysisStatus?.currentFile && `${progress}% complete`}
            </div>
          </div>
        </div>
      )}

      {/* File Tree Navigation */}
      {selectedRepository && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 mb-2 px-2">
              <i className="fas fa-folder-open mr-2"></i>Repository Structure
            </div>
            <FileTree 
              fileStructure={selectedRepository.fileStructure || []}
              onFileSelect={onFileSelect}
            />
          </div>
        </div>
      )}

      {/* Documentation Controls */}
      {selectedRepository && (
        <div className="p-4 border-t border-border-light bg-gray-50">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              <i className="fas fa-magic mr-2"></i>Generate Documentation
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateDoc("readme")}
                disabled={generateDocMutation.isPending}
                data-testid="button-generate-readme"
              >
                <i className="fas fa-file-alt mr-1"></i>README
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateDoc("api")}
                disabled={generateDocMutation.isPending}
                data-testid="button-generate-api"
              >
                <i className="fas fa-code mr-1"></i>API Docs
              </Button>
            </div>
            <Button 
              onClick={() => handleGenerateDoc("comments")}
              disabled={generateDocMutation.isPending}
              className="w-full bg-success-green hover:bg-green-800"
              data-testid="button-generate-comments"
            >
              <i className="fas fa-comments mr-2"></i>Code Comments
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
