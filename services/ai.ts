import { GoogleGenAI } from "@google/genai";
import { Platform } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

export const generatePostContent = async (
  topic: string,
  platform: Platform,
  tone: string = "professional"
): Promise<string> => {
  try {
    const prompt = `
      You are a social media expert. Write a ${tone} post for ${platform} about "${topic}".
      Include emojis where appropriate.
      Include 3-5 relevant hashtags at the end.
      Return ONLY the post text content, no other conversational filler.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content. Please check your API key.");
  }
};

export const generateHashtags = async (
  content: string,
  platform: Platform
): Promise<string[]> => {
  try {
    const prompt = `
      Generate 8 relevant hashtags for this ${platform} social media post: "${content}".
      Return ONLY a comma-separated list of hashtags starting with #, no extra text.
      Example format: #Marketing, #SocialMedia, #Business
    `;
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    const raw = response.text?.trim() || '';
    return raw.split(',').map(t => t.trim()).filter(t => t.startsWith('#'));
  } catch {
    return [];
  }
};

export const optimizePostTime = async (
  content: string,
  platform: Platform
): Promise<string> => {
    // Mocking an analysis, or actually asking Gemini for general best practices
    try {
        const prompt = `
          Analyze this social media post content for ${platform}: "${content}".
          Suggest the single best time of day (e.g., "10:00 AM", "6:30 PM") to post this for maximum engagement targeting a general tech audience.
          Return ONLY the time string.
        `;
    
        const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
        });
    
        return response.text?.trim() || "12:00 PM";
      } catch (error) {
        return "09:00 AM";
      }
}