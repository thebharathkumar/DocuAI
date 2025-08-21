import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DocumentationModalProps {
  documentation: any;
  onClose: () => void;
}

export default function DocumentationModal({ documentation, onClose }: DocumentationModalProps) {
  const exportDocumentation = () => {
    const element = document.createElement('a');
    const file = new Blob([documentation.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${documentation.type}-documentation.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col m-4">
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h2 className="text-lg font-semibold">
            <i className="fas fa-file-alt text-github-blue mr-2"></i>
            Generated {documentation.type.toUpperCase()} Documentation
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-modal"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="prose max-w-none">
            <div className="bg-code-bg rounded-lg p-4 border border-border-light">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {documentation.content}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border-light">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel-modal"
          >
            Cancel
          </Button>
          <Button 
            onClick={exportDocumentation}
            className="bg-success-green hover:bg-green-800"
            data-testid="button-export-docs"
          >
            <i className="fas fa-download mr-2"></i>Export Documentation
          </Button>
        </div>
      </Card>
    </div>
  );
}
