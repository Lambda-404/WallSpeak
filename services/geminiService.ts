import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserInput, GeneratedMessage, FriendshipMission, TopicSuggestion, TargetLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_ID = 'gemini-2.5-flash';

// Helper for retrying API calls
const generateWithRetry = async <T>(apiCall: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Gemini API Request Failed. Retrying... (${retries} attempts left). Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithRetry(apiCall, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Schema for Message Generation
const messageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedIntent: { type: Type.STRING, description: "If the user Intent is 'OTHERS', provide a short, specific 1-3 word label for the detected intent (e.g., 'Apology', 'Crush', 'Announcement') in the Target Language. If it is a standard intent, this can be null." },
    variations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING, enum: ['Warm', 'Playful', 'Polite', 'Direct'] },
          content: { type: Type.STRING },
          safetyNote: { type: Type.STRING, description: "A brief psychological safety note or self-reflection prompt for the sender." }
        },
        required: ['tone', 'content']
      }
    },
    safetyAlert: {
        type: Type.OBJECT,
        properties: {
            triggered: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
        },
        nullable: true
    }
  },
  required: ['variations']
};

export const generateDrafts = async (input: UserInput): Promise<{ variations: GeneratedMessage[], safetyAlert?: { triggered: boolean, message: string }, detectedIntent?: string }> => {
  const prompt = `
    You are an emotionally intelligent AI assistant for "WhisperWall", a campus app designed for personal connection and emotional expression.
    
    User Context:
    - Intent Category: ${input.intent}
    - Recipient: ${input.recipient}
    - Relationship: ${input.relationship}
    - Situation: ${input.context}
    - Target Language: ${input.targetLanguage}

    Task:
    1. Analyze the context.
    2. If the Intent Category is 'OTHERS', determine a specific label (1-3 words) for what the user is trying to do and put it in 'detectedIntent' (in ${input.targetLanguage}).
    
    CRITICAL CONTENT MODERATION POLICY:
    3. **STRICT BLOCK (Trigger Safety Alert):**
       - Self-harm or suicide ideation.
       - Hate speech targeting identity groups.
       - Credible threats of violence.
       - **POLITICAL TOPICS**: Any discussion of political figures, parties, elections, ideologies, international conflicts, or controversial public policy.
       -> If these are detected, set 'safetyAlert.triggered' to true and provide a neutral, firm coaching message in 'safetyAlert.message'. DO NOT generate drafts.

    4. **SOFT CENSORSHIP (Auto-Transform):**
       - For general profanity, insults, or aggressive frustration that does NOT violate the strict block rules above:
       - **DO NOT BLOCK.** Do not trigger safetyAlert.
       - **DO NOT LECTURE.**
       - Instead, generate the drafts as requested, but **SOFT-CENSOR** any explicit words in the output.
       - Censorship Rule: Keep the first letter, replace the rest with asterisks (e.g., "fuck" -> "f**k", "shit" -> "s**t", "stupid" -> "s****d").
       - Rewrite the sentiment to be communicable but maintain the user's emotional intensity if possible, just cleaned up visually.

    5. If safe (or soft-censored), generate 4 distinct message variations in ${input.targetLanguage}:
       - Warm (Sincere, emotional, soft)
       - Playful (Lighthearted, maybe emoji use, friendly)
       - Polite (Respectful, formal, indirect)
       - Direct (Short, clear, honest but kind - if input was aggressive, make this the "Firm but Civil" version)
    
    6. Ensure all outputs are psychologically safe, avoiding manipulation or pressure.
    7. For 'safetyNote', add a brief, supportive comment in ${input.targetLanguage}.
  `;

  try {
    const response = await generateWithRetry(() => ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: messageSchema,
        systemInstruction: "You are a supportive communication coach. You strictly enforce a ban on political/hate content, but you helpfully soft-censor general profanity instead of blocking it, ensuring users can still express frustration safely."
      }
    }));

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate messages. Please try again.");
  }
};

// Schema for Extras
const extrasSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        missions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Deep'] },
                    description: { type: Type.STRING }
                }
            }
        },
        topics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    starter: { type: Type.STRING }
                }
            }
        },
        relationshipScore: { type: Type.NUMBER, description: "0-100 estimated health/closeness based on context" }
    }
};

export const generateExtras = async (context: string, language: TargetLanguage): Promise<{ missions: FriendshipMission[], topics: TopicSuggestion[], relationshipScore: number }> => {
    const prompt = `
      Based on this social context: "${context}", suggest the following in ${language}:
      1. 3 Friendship 'Micro-Missions' (small actions to improve connection).
      2. 3 Conversation topics/starters.
      3. An estimated 'Relationship Temperature' score (0-100) based on the depth implied.
    `;

    try {
        const response = await generateWithRetry(() => ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: extrasSchema
            }
        }));
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error(e);
        return { missions: [], topics: [], relationshipScore: 50 };
    }
};

export const generateFormattedMessage = async (content: string, type: 'EMAIL' | 'SMS', language: TargetLanguage): Promise<{ subject?: string, body: string }> => {
  const prompt = `
    Refine this message for ${type} delivery in ${language}:
    "${content}"
    
    Rules:
    - If EMAIL: Create a compassionate or intriguing Subject line (max 6 words). Format body with clear paragraphs. Do not add [Name] placeholders, just use the text provided or generic greeting if needed.
    - If SMS: Keep it concise. Add 1-3 relevant emojis to enhance the emotional tone (warmth, playfulness, support).
  `;
  
  const schema: Schema = {
      type: Type.OBJECT,
      properties: {
          subject: { type: Type.STRING, nullable: true },
          body: { type: Type.STRING }
      }
  };

  try {
      const response = await generateWithRetry(() => ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      }));
      return JSON.parse(response.text || "{}");
  } catch (error) {
      console.error(error);
      return { body: content }; // Fallback
  }
};