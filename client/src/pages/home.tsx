import { useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import CodePreview from "@/components/code-preview";
import AISuggestions from "@/components/ai-suggestions";
import DocumentationModal from "@/components/documentation-modal";

export default function Home() {
  const [selectedRepository, setSelectedRepository] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "docs" | "export">("code");
  const [showDocModal, setShowDocModal] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          selectedRepository={selectedRepository}
          onRepositorySelect={setSelectedRepository}
          onFileSelect={setSelectedFile}
          onGenerateDoc={(type, doc) => {
            setGeneratedDoc(doc);
            setShowDocModal(true);
          }}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Content Tabs */}
          <div className="bg-white border-b border-border-light">
            <div className="flex items-center px-4">
              <button 
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "code" 
                    ? "border-github-blue text-github-blue" 
                    : "border-transparent text-text-medium hover:text-github-dark"
                }`}
                onClick={() => setActiveTab("code")}
                data-testid="tab-code"
              >
                <i className="fas fa-code mr-2"></i>Code Preview
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "docs" 
                    ? "border-github-blue text-github-blue" 
                    : "border-transparent text-text-medium hover:text-github-dark"
                }`}
                onClick={() => setActiveTab("docs")}
                data-testid="tab-docs"
              >
                <i className="fas fa-file-alt mr-2"></i>Generated Docs
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "export" 
                    ? "border-github-blue text-github-blue" 
                    : "border-transparent text-text-medium hover:text-github-dark"
                }`}
                onClick={() => setActiveTab("export")}
                data-testid="tab-export"
              >
                <i className="fas fa-download mr-2"></i>Export
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            <CodePreview 
              repository={selectedRepository}
              selectedFile={selectedFile}
              activeTab={activeTab}
            />
            
            {activeTab === "code" && (
              <AISuggestions 
                repository={selectedRepository}
                selectedFile={selectedFile}
              />
            )}
          </div>
        </div>
      </div>

      {showDocModal && (
        <DocumentationModal
          documentation={generatedDoc}
          onClose={() => setShowDocModal(false)}
        />
      )}
    </div>
  );
}
