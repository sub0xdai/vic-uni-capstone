import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FIELD_LENGTH = 500;

function readText(value: unknown, fallback: string): string | null {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_FIELD_LENGTH ? trimmed : null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const businessName = readText(input.businessName, "");
  const industry = readText(input.industry, "");
  const targetAudience = readText(input.targetAudience, "General customers");
  const tone = readText(input.tone, "Friendly and professional");
  const contentType = readText(input.contentType, "Instagram post");

  if (businessName === null || industry === null || !businessName || !industry) {
    return NextResponse.json(
      { error: "Business name and industry are required and must be 500 characters or fewer." },
      { status: 400 },
    );
  }

  if (targetAudience === null || tone === null || contentType === null) {
    return NextResponse.json(
      { error: "Audience, tone, and content type must be 500 characters or fewer." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "The AI service is not configured." }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a professional marketing copywriter. Create complete marketing content for this business.

Business: ${businessName}
Industry: ${industry}
Target audience: ${targetAudience}
Tone: ${tone}
Content type: ${contentType}

Requirements:
- Write the complete requested content, not just a title or subject.
- For a marketing email, include a subject line, greeting, at least two body paragraphs, a clear call to action, and a sign-off.
- For a social media post, include a headline, full post text, call to action, and relevant hashtags.
- For other content types, provide complete content appropriate to the selected type.
- Do not invent business facts, prices, or special offers.
- Keep the response under 200 words and return plain text without Markdown formatting.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const content = result.text?.trim();
    if (!content) {
      console.error("Gemini returned no text.");
      return NextResponse.json({ error: "The AI service returned no content. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("Gemini generation error:", error);
    return NextResponse.json(
      { error: "Content generation failed. Please try again." },
      { status: 502 },
    );
  }
}
