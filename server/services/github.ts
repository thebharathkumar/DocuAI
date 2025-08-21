interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  children?: GitHubFile[];
}

interface GitHubRepository {
  name: string;
  full_name: string;
  description: string;
  language: string;
  default_branch: string;
}

export class GitHubService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY || "";
  }

  private async makeGitHubRequest(url: string): Promise<any> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DocuMind-AI'
    };

    if (this.apiKey) {
      headers['Authorization'] = `token ${this.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found or is private');
      }
      if (response.status === 403) {
        throw new Error('API rate limit exceeded or access denied');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  parseRepositoryUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  async getRepository(url: string): Promise<GitHubRepository> {
    const { owner, repo } = this.parseRepositoryUrl(url);
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    
    return this.makeGitHubRequest(apiUrl);
  }

  async getFileTree(url: string): Promise<GitHubFile[]> {
    const { owner, repo } = this.parseRepositoryUrl(url);
    const repository = await this.getRepository(url);
    const branch = repository.default_branch;
    
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const response = await this.makeGitHubRequest(apiUrl);

    return this.buildFileTree(response.tree);
  }

  private buildFileTree(flatTree: any[]): GitHubFile[] {
    const tree: GitHubFile[] = [];
    const pathMap: Map<string, GitHubFile> = new Map();

    // Sort by path to ensure parents are processed before children
    flatTree.sort((a, b) => a.path.localeCompare(b.path));

    for (const item of flatTree) {
      const file: GitHubFile = {
        name: item.path.split('/').pop() || '',
        path: item.path,
        type: item.type === 'tree' ? 'dir' : 'file',
        size: item.size,
        children: item.type === 'tree' ? [] : undefined,
      };

      pathMap.set(item.path, file);

      const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
      if (parentPath) {
        const parent = pathMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(file);
        }
      } else {
        tree.push(file);
      }
    }

    return tree;
  }

  async getFileContent(url: string, filePath: string): Promise<string> {
    const { owner, repo } = this.parseRepositoryUrl(url);
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    
    const response = await this.makeGitHubRequest(apiUrl);
    
    if (response.content) {
      return Buffer.from(response.content, 'base64').toString('utf-8');
    }
    
    throw new Error('File content not found');
  }

  async getMultipleFileContents(url: string, filePaths: string[]): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};
    
    for (const filePath of filePaths) {
      try {
        contents[filePath] = await this.getFileContent(url, filePath);
      } catch (error) {
        console.warn(`Failed to fetch ${filePath}:`, error instanceof Error ? error.message : "Unknown error");
      }
    }
    
    return contents;
  }

  getMainFiles(fileTree: GitHubFile[]): string[] {
    const mainFiles: string[] = [];
    
    const findMainFiles = (files: GitHubFile[]) => {
      for (const file of files) {
        if (file.type === 'file') {
          const name = file.name.toLowerCase();
          if (
            name === 'readme.md' ||
            name === 'index.js' ||
            name === 'index.ts' ||
            name === 'main.py' ||
            name === 'app.py' ||
            name === 'package.json' ||
            name.endsWith('.py') ||
            name.endsWith('.js') ||
            name.endsWith('.ts')
          ) {
            mainFiles.push(file.path);
          }
        } else if (file.children) {
          findMainFiles(file.children);
        }
      }
    };

    findMainFiles(fileTree);
    return mainFiles.slice(0, 10); // Limit to first 10 main files
  }
}
