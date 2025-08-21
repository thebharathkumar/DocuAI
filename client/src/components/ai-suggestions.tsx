import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AISuggestionsProps {
  repository: any;
  selectedFile: string | null;
}

export default function AISuggestions({ repository, selectedFile }: AISuggestionsProps) {
  const { data: commentSuggestions } = useQuery({
    queryKey: ["/api/repositories", repository?.id, "documentations"],
    enabled: !!repository,
    select: (data: any) => {
      const commentsDoc = data?.documentations?.find((doc: any) => doc.type === "comments");
      return commentsDoc?.metadata?.suggestions || [];
    }
  });

  const mockQualityScores = {
    overallScore: 85,
    functionComments: 92,
    typeAnnotations: 78,
    readmeCompleteness: 65
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success-green";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="w-96 bg-gray-50 border-l border-border-light overflow-auto">
      <div className="p-4">
        <div className="space-y-4">
          {/* AI Analysis Status */}
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <i className="fas fa-brain text-github-blue"></i>
              <h3 className="text-sm font-semibold">AI Analysis</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-success-green">
                <i className="fas fa-check-circle mr-2"></i>
                AST parsing complete
              </div>
              <div className="flex items-center text-success-green">
                <i className="fas fa-check-circle mr-2"></i>
                Function signatures extracted
              </div>
              <div className="flex items-center text-github-blue">
                <i className="fas fa-check-circle mr-2"></i>
                Analysis ready
              </div>
            </div>
          </Card>

          {/* Comment Suggestions */}
          {commentSuggestions && commentSuggestions.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                  Suggested Comments
                </h3>
                <Badge variant="secondary" data-testid="badge-suggestions-count">
                  {commentSuggestions.length} new
                </Badge>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {commentSuggestions.slice(0, 3).map((suggestion: any, index: number) => (
                  <div key={index} className="border border-green-200 bg-green-50 rounded p-3">
                    <div className="text-xs text-text-medium mb-1">
                      {suggestion.fileName} - Line {suggestion.lineNumber} - {suggestion.functionName}()
                    </div>
                    <div className="text-sm font-mono text-success-green mb-2 bg-white p-2 rounded">
                      {suggestion.suggestedComment}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-success-green hover:bg-green-800 text-xs"
                        data-testid={`button-accept-suggestion-${index}`}
                      >
                        <i className="fas fa-check mr-1"></i>Accept
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        data-testid={`button-dismiss-suggestion-${index}`}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documentation Quality Score */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">
              <i className="fas fa-chart-line text-github-blue mr-2"></i>
              Documentation Quality
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Score</span>
                <span className={`text-lg font-bold ${getScoreColor(mockQualityScores.overallScore)}`}>
                  {mockQualityScores.overallScore}%
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Function Comments</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={mockQualityScores.functionComments} 
                      className="w-16 h-2" 
                    />
                    <span className={getScoreColor(mockQualityScores.functionComments)}>
                      {mockQualityScores.functionComments}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Type Annotations</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={mockQualityScores.typeAnnotations} 
                      className="w-16 h-2" 
                    />
                    <span className={getScoreColor(mockQualityScores.typeAnnotations)}>
                      {mockQualityScores.typeAnnotations}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>README Completeness</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={mockQualityScores.readmeCompleteness} 
                      className="w-16 h-2" 
                    />
                    <span className={getScoreColor(mockQualityScores.readmeCompleteness)}>
                      {mockQualityScores.readmeCompleteness}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
