import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CodePreviewProps {
  repository: any;
  selectedFile: string | null;
  activeTab: "code" | "docs" | "export";
}

export default function CodePreview({ repository, selectedFile, activeTab }: CodePreviewProps) {
  const { data: fileContent, isLoading } = useQuery({
    queryKey: ["/api/repositories", repository?.id, "files", selectedFile],
    enabled: !!repository && !!selectedFile,
  }) as { data?: { content?: string } | undefined; isLoading: boolean };

  const { data: repositoryData } = useQuery({
    queryKey: ["/api/repositories", repository?.id],
    enabled: !!repository && activeTab === "docs",
  }) as { data?: { documentations?: any[] } };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getFileLanguage = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'JavaScript';
      case 'ts':
      case 'tsx':
        return 'TypeScript';
      case 'py':
        return 'Python';
      case 'md':
        return 'Markdown';
      case 'json':
        return 'JSON';
      default:
        return 'Text';
    }
  };

  const highlightCode = (code: string, language: string) => {
    // Basic syntax highlighting - in production, you'd use a library like Prism.js
    return code
      .replace(/\b(import|export|from|const|let|var|function|class|if|else|for|while|return|async|await)\b/g, '<span class="text-purple-600">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-blue-600">$1</span>')
      .replace(/'([^']*)'/g, '<span class="text-green-600">\'$1\'</span>')
      .replace(/"([^"]*)"/g, '<span class="text-green-600">"$1"</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="text-gray-500">$&</span>')
      .replace(/\/\/.*$/gm, '<span class="text-gray-500">$&</span>');
  };

  if (activeTab === "docs") {
    return (
      <div className="flex-1 bg-white overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Generated Documentation</h2>
          {repositoryData?.documentations && repositoryData.documentations.length > 0 ? (
            <div className="space-y-6">
              {repositoryData.documentations.map((doc: any) => (
                <div key={doc.id} className="border border-border-light rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-border-light">
                    <h3 className="font-semibold capitalize">{doc.type} Documentation</h3>
                  </div>
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap text-sm">{doc.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-medium">
              <i className="fas fa-file-alt text-4xl mb-4"></i>
              <p>No documentation generated yet.</p>
              <p className="text-sm">Use the sidebar controls to generate documentation.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "export") {
    return (
      <div className="flex-1 bg-white overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Export Documentation</h2>
          <div className="space-y-4">
            <div className="border border-border-light rounded-lg p-4">
              <h3 className="font-semibold mb-2">Export Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" data-testid="button-export-markdown">
                  <i className="fas fa-file-alt mr-2"></i>Markdown
                </Button>
                <Button variant="outline" data-testid="button-export-pdf">
                  <i className="fas fa-file-pdf mr-2"></i>PDF
                </Button>
                <Button variant="outline" data-testid="button-export-html">
                  <i className="fas fa-code mr-2"></i>HTML
                </Button>
                <Button variant="outline" data-testid="button-export-zip">
                  <i className="fas fa-file-archive mr-2"></i>ZIP Archive
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      {selectedFile && repository ? (
        <div className="p-4">
          <div className="bg-code-bg rounded-lg border border-border-light">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border-light bg-gray-100">
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-code text-yellow-600"></i>
                <span className="text-sm font-medium" data-testid="text-selected-file">{selectedFile}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-text-medium">
                <span>{getFileLanguage(selectedFile)}</span>
                <span>•</span>
                <span>{fileContent?.content?.split('\n').length || 0} lines</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(fileContent?.content || '')}
                  data-testid="button-copy-code"
                >
                  <i className="fas fa-copy"></i>
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <pre className="text-sm font-mono text-github-dark leading-relaxed">
                  <code 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightCode(fileContent?.content || '', getFileLanguage(selectedFile)) 
                    }}
                  />
                </pre>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-text-medium">
          <div className="text-center">
            <i className="fas fa-code text-4xl mb-4"></i>
            <h3 className="text-lg font-medium mb-2">Select a file to preview</h3>
            <p className="text-sm">Choose a file from the repository structure to view its contents</p>
          </div>
        </div>
      )}
    </div>
  );
}
