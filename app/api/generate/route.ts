
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      businessName,
      industry,
      targetAudience,
      tone,
      contentType,
    } = body;

    if (
      typeof businessName !== "string" ||
      !businessName.trim() ||
      typeof industry !== "string" ||
      !industry.trim()
    ) {
      return NextResponse.json(
        { error: "Business name and industry are required." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a professional marketing copywriter.

Create COMPLETE marketing content for this business.

Business: ${businessName}
Industry: ${industry}
Target audience: ${targetAudience || "General customers"}
Tone: ${tone || "Friendly and professional"}
Content type: ${contentType || "Instagram post"}

IMPORTANT REQUIREMENTS:
- Write the complete requested content, not just a title or subject.
- For a marketing email, include:
  1. Subject line
  2. Greeting
  3. A complete email body with at least two paragraphs
  4. A clear call to action
  5. A suitable sign-off
- For a social media post, include a headline, full post text, call to action, and relevant hashtags.
- For other content types, provide the complete content appropriate to the selected type.
- Do not invent business facts, prices, or special offers.
- Keep the response under 200 words.
- Return plain text without Markdown formatting.
`;

    // Wait for Gemini without imposing an artificial timeout.
    const result = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: prompt,
      generation_config: {
        thinking_level: "low",
        max_output_tokens: 500,
      },
    });

    const content = result.output_text?.trim();

    if (!content) {
      throw new Error("Gemini returned no text.");
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("Gemini generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Content generation failed.",
      },
      { status: 500 }
    );
  }
}
