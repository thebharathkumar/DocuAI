import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// Initialize Gemini AI with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateReadme(
  repoInfo: {
    name: string;
    description?: string;
    files: string[];
    structure: any;
  }
): Promise<{ content: string; imagePath?: string }> {
  try {
    // First generate the README content
    const readmePrompt = `Generate a comprehensive README.md file for a GitHub repository with the following information:

Repository: ${repoInfo.name}
Description: ${repoInfo.description || 'No description provided'}
Files: ${repoInfo.files.slice(0, 20).join(', ')}${repoInfo.files.length > 20 ? '...' : ''}

Structure:
${JSON.stringify(repoInfo.structure, null, 2)}

Create a professional README that includes:
1. Project title and description
2. Installation instructions
3. Usage examples
4. Features list
5. Contributing guidelines
6. License information
7. Author credit: "Made by Bharath"

Make it engaging and informative for developers. Include "Made by Bharath" prominently in the README.`;

    const readmeResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: readmePrompt,
    });

    const readmeContent = readmeResponse.text || "Failed to generate README";

    // Generate a relevant image for the repository
    const imagePrompt = `Create a professional, modern banner image for a software project called "${repoInfo.name}". 
${repoInfo.description ? `The project is about: ${repoInfo.description}` : ''}
Style: Clean, modern tech aesthetic with subtle gradients, geometric shapes, and professional typography. 
Colors: Use a modern tech color palette with blues, purples, or teals. 
Include the project name prominently. Make it suitable for a GitHub repository header.`;

    let imagePath: string | undefined;
    
    try {
      // Ensure images directory exists
      const imagesDir = path.join(process.cwd(), 'generated_images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      imagePath = path.join(imagesDir, `${repoInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_banner.jpg`);

      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidates = imageResponse.candidates;
      if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const imageData = Buffer.from(part.inlineData.data, "base64");
              fs.writeFileSync(imagePath, imageData);
              console.log(`Generated banner image: ${imagePath}`);
              break;
            }
          }
        }
      }
    } catch (imageError) {
      console.warn("Failed to generate image:", imageError);
      imagePath = undefined;
    }

    // Add image to README if generated successfully
    let finalReadmeContent = readmeContent;
    if (imagePath && fs.existsSync(imagePath)) {
      const filename = path.basename(imagePath);
      const imageUrl = `/api/images/${filename}`;
      const imageMarkdown = `![${repoInfo.name} Banner](${imageUrl})\n\n`;
      finalReadmeContent = imageMarkdown + readmeContent;
    }

    return { content: finalReadmeContent, imagePath };
  } catch (error) {
    throw new Error(`Failed to generate README: ${error}`);
  }
}

export async function generateApiDocumentation(
  functions: Array<{
    name: string;
    params: string[];
    returnType?: string;
    description?: string;
  }>
): Promise<string> {
  try {
    const prompt = `Generate comprehensive API documentation for the following functions:

${functions.map(fn => `
Function: ${fn.name}
Parameters: ${fn.params.join(', ')}
Return Type: ${fn.returnType || 'unknown'}
Description: ${fn.description || 'No description'}
`).join('\n')}

Create detailed API documentation in markdown format that includes:
1. Function signatures
2. Parameter descriptions
3. Return value descriptions
4. Usage examples
5. Error handling information

Make it developer-friendly and comprehensive.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text || "Failed to generate API documentation";
  } catch (error) {
    throw new Error(`Failed to generate API documentation: ${error}`);
  }
}

export async function generateCodeComments(
  code: string,
  filename: string
): Promise<Array<{ line: number; comment: string; type: 'improvement' | 'explanation' | 'warning' }>> {
  try {
    const systemPrompt = `You are a code review expert. Analyze the provided code and suggest meaningful comments.
Return a JSON array of objects with this format:
[{"line": number, "comment": "suggestion text", "type": "improvement|explanation|warning"}]

Focus on:
- Complex logic that needs explanation
- Potential improvements
- Best practice violations
- Performance concerns
- Security issues

Only suggest valuable comments, not obvious ones.`;

    const prompt = `Analyze this ${filename} file and suggest code comments:

\`\`\`
${code}
\`\`\``;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              line: { type: "number" },
              comment: { type: "string" },
              type: { type: "string", enum: ["improvement", "explanation", "warning"] }
            },
            required: ["line", "comment", "type"]
          }
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    throw new Error(`Failed to generate code comments: ${error}`);
  }
}

export async function analyzeCodeQuality(
  files: Array<{ name: string; content: string }>
): Promise<{
  score: number;
  issues: Array<{
    file: string;
    line?: number;
    type: 'error' | 'warning' | 'suggestion';
    message: string;
  }>;
  suggestions: string[];
}> {
  try {
    const systemPrompt = `You are a code quality expert. Analyze the provided files and return a quality assessment.
Return JSON in this format:
{
  "score": number (0-100),
  "issues": [{"file": "filename", "line": number, "type": "error|warning|suggestion", "message": "description"}],
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"]
}

Evaluate:
- Code structure and organization
- Best practices adherence
- Potential bugs or security issues
- Performance considerations
- Maintainability`;

    const filesContent = files.map(f => `
File: ${f.name}
\`\`\`
${f.content.slice(0, 2000)}${f.content.length > 2000 ? '...' : ''}
\`\`\`
`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  file: { type: "string" },
                  line: { type: "number" },
                  type: { type: "string", enum: ["error", "warning", "suggestion"] },
                  message: { type: "string" }
                },
                required: ["file", "type", "message"]
              }
            },
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["score", "issues", "suggestions"]
        }
      },
      contents: `Analyze these code files for quality:\n${filesContent}`,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    throw new Error(`Failed to analyze code quality: ${error}`);
  }
}