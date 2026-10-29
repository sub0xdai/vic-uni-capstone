export type Scores = {
  overallScore: number
  readabilityScore: number
  toneScore: number
  keywordScore: number
  structureScore: number
  userSatisfactionScore: number
}

const TONE_MARKERS: Record<string, string[]> = {
  Professional: ['furthermore', 'we recommend', 'our solution', 'expertise', 'quality', 'committed'],
  Casual: ['hey', 'check out', 'awesome', "you'll love", 'grab', 'come on'],
  Friendly: ["we'd love to", 'just for you', 'happy to help', 'welcome', 'join us', 'come say hi'],
}

export function evaluateContent(
  content: string,
  opts: { brandTone: string; businessName: string; industry: string; contentType: string; pastRatings: number[] }
): Scores {
  const text = content.toLowerCase()

  // Readability: sentence length and word length (report 6.2)
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const words = content.split(/\s+/).filter(Boolean)
  const avgSentence = words.length / Math.max(sentences.length, 1)
  const avgWord = words.join('').length / Math.max(words.length, 1)
  let readabilityScore = 0.7
  if (avgSentence >= 12 && avgSentence <= 22 && avgWord < 7) readabilityScore = 1.0
  else if (avgSentence > 30 || avgWord > 8) readabilityScore = 0.3

  // Tone: two matching phrases = full marks (simplified from the pseudocode)
  const markers = TONE_MARKERS[opts.brandTone] || []
  const toneMatches = markers.filter((m) => text.includes(m)).length
  const toneScore = Math.min(toneMatches / 2, 1)

  // Keywords: business name and industry should appear
  const terms = [opts.businessName, opts.industry].filter(Boolean).map((t) => t.toLowerCase())
  const found = terms.filter((t) => text.includes(t)).length
  const keywordScore = terms.length === 0 ? 1 : found / terms.length

  // Structure by content type
  const hasCTA = /(shop now|learn more|visit|order|book|call|join|sign up|contact|come)/.test(text)
  let structureScore = 0.5
  if (opts.contentType === 'Instagram Caption') {
    structureScore = text.includes('#') && hasCTA ? 1.0 : 0.6
  } else if (opts.contentType === 'Blog Outline') {
    const headings = content.split('\n').filter((l) => /^\s*(\d+[.)]|[-*•]|#+)\s+/.test(l)).length
    structureScore = headings >= 3 ? 1.0 : headings >= 1 ? 0.6 : 0.3
  } else if (opts.contentType === 'Email Newsletter') {
    structureScore = text.includes('subject') && hasCTA ? 1.0 : 0.5
  }

  // User satisfaction: average of past star ratings, neutral 0.7 if fewer than 3
  const userSatisfactionScore =
    opts.pastRatings.length >= 3
      ? opts.pastRatings.reduce((a, b) => a + b, 0) / opts.pastRatings.length / 5
      : 0.7

  const overallScore =
    readabilityScore * 0.1 +
    toneScore * 0.2 +
    keywordScore * 0.2 +
    structureScore * 0.15 +
    userSatisfactionScore * 0.35

  return { overallScore, readabilityScore, toneScore, keywordScore, structureScore, userSatisfactionScore }
}