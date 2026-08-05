import { AxiosError } from "axios";

import { buildReviewPrompt } from "../prompt.builder";
import { ReviewSchema } from "../review.schema";
import { FileReview } from "../ai.types";

import { AIProvider, ReviewRequest } from "./ai-provider";
import { geminiClient } from "./gemini.client";

export class GeminiProvider implements AIProvider {
  async review(
    request: ReviewRequest,
  ): Promise<FileReview> {
    const prompt = buildReviewPrompt(
      request.filename,
      request.patch,
    );

    try {
      const { data } = await geminiClient.post(
        "/models/gemini-2.5-flash:generateContent",
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        },
      );

      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Gemini returned empty response");
      }

      const parsed = ReviewSchema.parse(
        JSON.parse(text),
      );

      return {
        filename: request.filename,
        summary: parsed.summary,
        score: parsed.score,
        issues: parsed.issues,
        suggestions: parsed.suggestions,
      };
   } catch (error) {
  if (error instanceof AxiosError) {
    console.error(
      "Gemini Error:",
      error.response?.data ?? error.message,
    );

    throw new Error(
      `Gemini API Error (${error.response?.status ?? "Unknown"})`,
    );
  }

  throw error;
}
  }
}