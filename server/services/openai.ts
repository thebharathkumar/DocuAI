import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ReadmeGenerationOptions {
  repositoryName: string;
  description?: string;
  language: string;
  fileStructure: any;
  mainFiles: string[];
}

export interface ApiDocOptions {
  functions: Array<{
    name: string;
    parameters: any[];
    returnType: string;
    description?: string;
  }>;
  classes: Array<{
    name: string;
    methods: any[];
    properties: any[];
  }>;
}

export interface CommentSuggestion {
  lineNumber: number;
  functionName: string;
  suggestedComment: string;
  confidence: number;
}

export async function generateReadme(options: ReadmeGenerationOptions): Promise<string> {
  try {
    const prompt = `Generate a comprehensive README.md file for a ${options.language} repository named "${options.repositoryName}".

Repository details:
- Name: ${options.repositoryName}
- Description: ${options.description || 'No description provided'}
- Primary language: ${options.language}
- Main files: ${options.mainFiles.join(', ')}
- File structure: ${JSON.stringify(options.fileStructure, null, 2)}

Create a professional README that includes:
1. Project title and description
2. Installation instructions
3. Usage examples
4. API documentation (if applicable)
5. Contributing guidelines
6. License information

Make it engaging and developer-friendly with proper markdown formatting, badges, and code examples.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error(`Failed to generate README: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateApiDocumentation(options: ApiDocOptions): Promise<string> {
  try {
    const prompt = `Generate comprehensive API documentation in markdown format for the following code structure:

Functions:
${JSON.stringify(options.functions, null, 2)}

Classes:
${JSON.stringify(options.classes, null, 2)}

Create detailed API documentation that includes:
1. Function signatures with parameter types
2. Return value descriptions
3. Usage examples
4. Error handling information
5. Class method documentation

Format as clean, professional markdown suitable for developer documentation.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error(`Failed to generate API documentation: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateCodeComments(
  fileName: string,
  code: string,
  functions: Array<{name: string; startLine: number; parameters: any[]}>
): Promise<CommentSuggestion[]> {
  try {
    const prompt = `Analyze the following ${fileName} code and suggest JSDoc/docstring comments for functions that lack proper documentation.

Code:
${code}

Functions to analyze:
${JSON.stringify(functions, null, 2)}

Generate comment suggestions in JSON format with this structure:
{
  "suggestions": [
    {
      "lineNumber": number,
      "functionName": "string",
      "suggestedComment": "string (properly formatted JSDoc/docstring)",
      "confidence": number (0-1)
    }
  ]
}

Focus on functions that are missing documentation or have insufficient comments. Include parameter descriptions, return values, and any important notes about the function's behavior.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch (error) {
    throw new Error(`Failed to generate code comments: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function analyzeCodeQuality(fileContents: Record<string, string>): Promise<{
  overallScore: number;
  functionComments: number;
  typeAnnotations: number;
  readmeCompleteness: number;
}> {
  try {
    const prompt = `Analyze the code quality and documentation completeness for the following files:

${Object.entries(fileContents).map(([file, content]) => `
File: ${file}
${content}
`).join('\n')}

Provide a quality assessment in JSON format:
{
  "overallScore": number (0-100),
  "functionComments": number (0-100),
  "typeAnnotations": number (0-100),
  "readmeCompleteness": number (0-100)
}

Evaluate based on:
- Function/method documentation coverage
- Type annotation usage (for TypeScript/Python)
- Code organization and structure
- README file quality and completeness`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      overallScore: result.overallScore || 0,
      functionComments: result.functionComments || 0,
      typeAnnotations: result.typeAnnotations || 0,
      readmeCompleteness: result.readmeCompleteness || 0,
    };
  } catch (error) {
    throw new Error(`Failed to analyze code quality: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
