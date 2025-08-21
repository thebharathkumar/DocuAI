import { useState } from "react";

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileTreeNode[];
}

interface FileTreeProps {
  fileStructure: FileTreeNode[];
  onFileSelect: (filePath: string) => void;
}

export default function FileTree({ fileStructure, onFileSelect }: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'fas fa-file-code text-yellow-600';
      case 'ts':
      case 'tsx':
        return 'fas fa-file-code text-blue-600';
      case 'py':
        return 'fas fa-file-code text-green-600';
      case 'md':
        return 'fas fa-file-alt text-gray-600';
      case 'json':
        return 'fas fa-file text-purple-600';
      default:
        return 'fas fa-file text-gray-500';
    }
  };

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    
    return (
      <div key={node.path}>
        <div 
          className={`flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm transition-colors ${depth > 0 ? 'ml-' + (depth * 4) : ''}`}
          onClick={() => {
            if (node.type === 'dir') {
              toggleDir(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
          data-testid={`file-tree-${node.type}-${node.path}`}
        >
          {node.type === 'dir' ? (
            <>
              <i className={`fas ${isExpanded ? 'fa-folder-open' : 'fa-folder'} text-github-blue mr-2`}></i>
              <span>{node.name}/</span>
            </>
          ) : (
            <>
              <i className={`${getFileIcon(node.name)} mr-2`}></i>
              <span>{node.name}</span>
            </>
          )}
        </div>
        
        {node.type === 'dir' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {fileStructure.map(node => renderNode(node))}
    </div>
  );
}
