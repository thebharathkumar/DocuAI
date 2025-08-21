import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface ParsedFunction {
  name: string;
  startLine: number;
  endLine: number;
  parameters: Array<{
    name: string;
    type?: string;
    defaultValue?: any;
  }>;
  returnType?: string;
  description?: string;
  isAsync: boolean;
  isExported: boolean;
}

export interface ParsedClass {
  name: string;
  startLine: number;
  endLine: number;
  methods: ParsedFunction[];
  properties: Array<{
    name: string;
    type?: string;
    isStatic: boolean;
  }>;
  isExported: boolean;
}

export interface ParsedFile {
  fileName: string;
  language: 'javascript' | 'typescript' | 'python';
  functions: ParsedFunction[];
  classes: ParsedClass[];
  imports: Array<{
    source: string;
    imports: string[];
  }>;
  exports: string[];
}

export class ASTParser {
  parseJavaScript(fileName: string, code: string): ParsedFile {
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const imports: Array<{ source: string; imports: string[] }> = [];
    const exports: string[] = [];

    try {
      const ast = babelParser.parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport'
        ]
      });

      const parser = this;
      traverse(ast, {
        FunctionDeclaration(path: any) {
          const func = parser.extractFunction(path.node, path);
          if (func) functions.push(func);
        },

        ArrowFunctionExpression(path: any) {
          if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
            const func = parser.extractArrowFunction(path.node, path.parent.id.name, path);
            if (func) functions.push(func);
          }
        },

        ClassDeclaration(path: any) {
          const cls = parser.extractClass(path.node, path);
          if (cls) classes.push(cls);
        },

        ImportDeclaration(path: any) {
          const importInfo = parser.extractImport(path.node);
          if (importInfo) imports.push(importInfo);
        },

        ExportNamedDeclaration(path: any) {
          if (path.node.declaration) {
            if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
              exports.push(path.node.declaration.id.name);
            } else if (t.isClassDeclaration(path.node.declaration) && path.node.declaration.id) {
              exports.push(path.node.declaration.id.name);
            }
          }
        }
      });

    } catch (error) {
      console.warn(`Failed to parse ${fileName}:`, error instanceof Error ? error.message : "Unknown error");
    }

    return {
      fileName,
      language: fileName.endsWith('.ts') || fileName.endsWith('.tsx') ? 'typescript' : 'javascript',
      functions,
      classes,
      imports,
      exports
    };
  }

  private extractFunction(node: t.FunctionDeclaration, path: any): ParsedFunction | null {
    if (!node.id) return null;

    return {
      name: node.id.name,
      startLine: node.loc?.start.line || 0,
      endLine: node.loc?.end.line || 0,
      parameters: node.params.map(param => this.extractParameter(param)),
      isAsync: node.async,
      isExported: false // Will be updated by export detection
    };
  }

  private extractArrowFunction(node: t.ArrowFunctionExpression, name: string, path: any): ParsedFunction {
    return {
      name,
      startLine: node.loc?.start.line || 0,
      endLine: node.loc?.end.line || 0,
      parameters: node.params.map(param => this.extractParameter(param)),
      isAsync: node.async,
      isExported: false
    };
  }

  private extractClass(node: t.ClassDeclaration, path: any): ParsedClass | null {
    if (!node.id) return null;

    const methods: ParsedFunction[] = [];
    const properties: Array<{ name: string; type?: string; isStatic: boolean }> = [];

    node.body.body.forEach(member => {
      if (t.isClassMethod(member) && t.isIdentifier(member.key)) {
        const method: ParsedFunction = {
          name: member.key.name,
          startLine: member.loc?.start.line || 0,
          endLine: member.loc?.end.line || 0,
          parameters: member.params.map((param: any) => this.extractParameter(param)),
          isAsync: member.async || false,
          isExported: false
        };
        methods.push(method);
      } else if (t.isClassProperty(member) && t.isIdentifier(member.key)) {
        properties.push({
          name: member.key.name,
          isStatic: member.static || false
        });
      }
    });

    return {
      name: node.id.name,
      startLine: node.loc?.start.line || 0,
      endLine: node.loc?.end.line || 0,
      methods,
      properties,
      isExported: false
    };
  }

  private extractParameter(param: any): { name: string; type?: string; defaultValue?: any } {
    if (t.isIdentifier(param)) {
      return { name: param.name };
    } else if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
      return {
        name: param.left.name,
        defaultValue: this.extractLiteralValue(param.right)
      };
    } else if (t.isObjectPattern(param)) {
      return { name: 'destructured' };
    } else if (t.isArrayPattern(param)) {
      return { name: 'arrayDestructured' };
    }
    return { name: 'unknown' };
  }

  private extractImport(node: t.ImportDeclaration): { source: string; imports: string[] } | null {
    if (!t.isStringLiteral(node.source)) return null;

    const imports = node.specifiers.map(spec => {
      if (t.isImportDefaultSpecifier(spec)) {
        return spec.local.name;
      } else if (t.isImportSpecifier(spec)) {
        return spec.local.name;
      } else if (t.isImportNamespaceSpecifier(spec)) {
        return spec.local.name;
      }
      return 'unknown';
    });

    return {
      source: node.source.value,
      imports
    };
  }

  private extractLiteralValue(node: any): any {
    if (t.isStringLiteral(node)) return node.value;
    if (t.isNumericLiteral(node)) return node.value;
    if (t.isBooleanLiteral(node)) return node.value;
    if (t.isNullLiteral(node)) return null;
    return undefined;
  }

  parsePython(fileName: string, code: string): ParsedFile {
    // Basic Python parsing - would need python-ast or similar for full AST
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const imports: Array<{ source: string; imports: string[] }> = [];

    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Simple function detection
      const funcMatch = line.match(/^def\s+(\w+)\s*\(([^)]*)\):/);
      if (funcMatch) {
        functions.push({
          name: funcMatch[1],
          startLine: i + 1,
          endLine: this.findPythonBlockEnd(lines, i),
          parameters: this.parsePythonParameters(funcMatch[2]),
          isAsync: line.startsWith('async def'),
          isExported: true // Python functions are generally exported
        });
      }

      // Simple class detection
      const classMatch = line.match(/^class\s+(\w+).*:/);
      if (classMatch) {
        classes.push({
          name: classMatch[1],
          startLine: i + 1,
          endLine: this.findPythonBlockEnd(lines, i),
          methods: [],
          properties: [],
          isExported: true
        });
      }

      // Import detection
      const importMatch = line.match(/^(?:from\s+(\S+)\s+)?import\s+(.+)/);
      if (importMatch) {
        imports.push({
          source: importMatch[1] || 'builtin',
          imports: importMatch[2].split(',').map(s => s.trim())
        });
      }
    }

    return {
      fileName,
      language: 'python',
      functions,
      classes,
      imports,
      exports: [...functions.map(f => f.name), ...classes.map(c => c.name)]
    };
  }

  private findPythonBlockEnd(lines: string[], startIndex: number): number {
    const startIndent = lines[startIndex].length - lines[startIndex].trimStart().length;
    
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      
      const indent = line.length - line.trimStart().length;
      if (indent <= startIndent) {
        return i;
      }
    }
    
    return lines.length;
  }

  private parsePythonParameters(paramStr: string): Array<{ name: string; type?: string; defaultValue?: any }> {
    if (!paramStr.trim()) return [];
    
    return paramStr.split(',').map(param => {
      const trimmed = param.trim();
      const [name] = trimmed.split('=');
      return { name: name.trim() };
    });
  }

  parseFile(fileName: string, code: string): ParsedFile {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'py') {
      return this.parsePython(fileName, code);
    } else if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
      return this.parseJavaScript(fileName, code);
    }
    
    // Return empty structure for unsupported files
    return {
      fileName,
      language: 'javascript',
      functions: [],
      classes: [],
      imports: [],
      exports: []
    };
  }
}
