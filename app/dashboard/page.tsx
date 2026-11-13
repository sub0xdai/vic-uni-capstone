
"use client";

import { useState } from "react";

export default function Home() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("Friendly and professional");
  const [contentType, setContentType] = useState("Instagram post");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setContent("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          industry,
          targetAudience,
          tone,
          contentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Content generation failed.");
      }

      setContent(data.content || "No content was returned.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            AI Marketing Content Generator
          </h1>
          <p className="mt-3 text-gray-600">
            Create marketing content for your small business using Gemini AI.
          </p>
        </header>

        <form
          onSubmit={generateContent}
          className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="businessName" className="mb-1 block font-medium">
              Business name *
            </label>
            <input
              id="businessName"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="e.g. Harbour Coffee"
            />
          </div>

          <div>
            <label htmlFor="industry" className="mb-1 block font-medium">
              Industry *
            </label>
            <input
              id="industry"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="e.g. Cafe, retail, fitness"
            />
          </div>

          <div>
            <label htmlFor="targetAudience" className="mb-1 block font-medium">
              Target audience
            </label>
            <input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="e.g. Local customers"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="tone" className="mb-1 block font-medium">
                Tone of voice
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-lg border bg-white p-3"
              >
                <option>Friendly and professional</option>
                <option>Fun and energetic</option>
                <option>Formal</option>
                <option>Persuasive</option>
                <option>Relaxed and casual</option>
              </select>
            </div>

            <div>
              <label htmlFor="contentType" className="mb-1 block font-medium">
                Content type
              </label>
              <select
                id="contentType"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full rounded-lg border bg-white p-3"
              >
                <option>Instagram post</option>
                <option>Facebook post</option>
                <option>Product description</option>
                <option>Marketing email</option>
                <option>Business advertisement</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating content..." : "Generate Content"}
          </button>
        </form>

        {error && (
          <div role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {content && (
          <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Generated Content</h2>
            <div className="whitespace-pre-wrap leading-7">{content}</div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(content)}
              className="mt-5 rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
            >
              Copy content
            </button>
          </section>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          AI-generated content should be reviewed before publication.
        </p>
      </div>
    </main>
  );
}
