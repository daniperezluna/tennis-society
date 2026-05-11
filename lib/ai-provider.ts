type AIModules = {
  generateText: (typeof import("ai"))["generateText"];
  streamText: (typeof import("ai"))["streamText"];
  google: (typeof import("@ai-sdk/google"))["google"];
};

export async function getAI(): Promise<AIModules | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;
  try {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [aiMod, googleMod] = await Promise.all([
      import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "ai" as any),
      import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "@ai-sdk/google" as any),
    ]);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return {
      generateText: aiMod.generateText,
      streamText: aiMod.streamText,
      google: googleMod.google,
    };
  } catch {
    return null;
  }
}
