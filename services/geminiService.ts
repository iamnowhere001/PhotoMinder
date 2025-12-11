import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from '../utils';

// Initialize Gemini
// Note: In a real production app, you might proxy this request to keep the key secure.
// For this client-side demo, we use the injected process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImage = async (file: File) => {
  try {
    const base64Data = await fileToBase64(file);
    
    // We want a JSON response with a description and tags
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: "Analyze this image. Provide a concise description (max 2 sentences) and a list of 5 relevant tags."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as { description: string, tags: string[] };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};
