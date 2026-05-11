import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";

type AIModules = {
  generateText: typeof generateText;
  streamText: typeof streamText;
  google: typeof google;
};

export async function getAI(): Promise<AIModules | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;
  return { generateText, streamText, google };
}
