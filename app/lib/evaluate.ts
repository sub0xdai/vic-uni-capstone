export type Scores = {
  overallScore: number
  readabilityScore: number
  toneScore: number
  keywordScore: number
  structureScore: number
  userSatisfactionScore: number
}

const FORMAL = ['quality', 'expert', 'committed', 'professional', 'trusted', 'excellence', 'crafted', 'tradition', 'authentic', 'premium', 'recommend', 'heritage', 'respect']
const INFORMAL = ['just', 'stop by', 'drop by', 'tonight', 'love', 'fun', 'easy', 'grab', 'slice', 'check out', 'hey', 'awesome', 'come', 'like', 'forget', 'craving']
const WARM = ['welcome', 'join us', 'come say hi', 'neighbor', 'family', 'together', 'warm', 'invite', 'invitation', 'share', 'sharing', 'community', 'home', 'nonna', 'friends']

function countMatches(text: string, list: string[]): number {
  return list.filter((w) => text.includes(w)).length
}

// Tone: judge the writing style against the brand tone the user chose
function scoreTone(tone: string, content: string): number {
  const text = content.toLowerCase()
  const hasExclamation = content.includes('!')
  const hasContraction = /\b\w+'(s|re|ll|ve|d|t)\b/.test(text)
  const speaksToReader = /\b(you|your|we|our|us)\b/.test(text)
  const informal = countMatches(text, INFORMAL)
  const formal = countMatches(text, FORMAL)
  const warm = countMatches(text, WARM)

  let signals: boolean[]
  if (tone === 'Casual') {
    signals = [hasExclamation, hasContraction, speaksToReader, informal >= 1, informal >= 3]
    return Math.min(signals.filter(Boolean).length / 4, 1)
  }
  if (tone === 'Friendly') {
    signals = [warm >= 1, warm >= 3, speaksToReader, hasExclamation || informal >= 1]
    return Math.min(signals.filter(Boolean).length / 3, 1)
  }
  if (tone === 'Professional') {
    signals = [formal >= 1, formal >= 3, !hasExclamation, !hasContraction]
    return Math.min(signals.filter(Boolean).length / 3, 1)
  }
  return 0.7
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

  const toneScore = scoreTone(opts.brandTone, content)

  // Keywords: each word of the business name, plus the industry word, counts
  const nameWords = opts.businessName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3)
  const terms = [...nameWords, opts.industry.toLowerCase()].filter(Boolean)
  const found = terms.filter((t) => text.includes(t)).length
  const keywordScore = terms.length === 0 ? 1 : Math.min(found / Math.max(terms.length - 1, 1), 1)

  // Structure by content type
  const hasCTA = /(shop now|learn more|visit|order|book|call|join|sign up|contact|come|drop by|reserve)/.test(text)
  let structureScore = 0.5
  if (opts.contentType === 'Instagram Caption') {
    structureScore = text.includes('#') && hasCTA ? 1.0 : 0.6
  } else if (opts.contentType === 'Blog Outline') {
    const headings = content.split('\n').filter((l) => /^\s*(\d+[.)]|[IVX]+[.)]|[A-Z][.)]|[-*•]|#+)\s+/.test(l)).length
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