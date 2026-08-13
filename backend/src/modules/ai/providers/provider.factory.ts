import { env } from "../../../config/env";

import { AIProvider } from "./ai-provider";
import { GeminiProvider } from "./gemini.provider";

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (provider) {
    return provider;
  }

  switch (env.AI_PROVIDER) {
    case "gemini":
      provider = new GeminiProvider();
      break;

    default:
      throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
  }

  return provider;
}