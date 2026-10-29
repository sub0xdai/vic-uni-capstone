'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { evaluateContent, Scores } from '../lib/evaluate'

type Profile = {
  business_name: string
  industry: string
  target_audience: string
  brand_tone: string
}

const CONTENT_TYPES = ['Instagram Caption', 'Blog Outline', 'Email Newsletter']

const inputStyle = {
  width: '100%',
  padding: '8px',
  backgroundColor: 'white',
  color: 'black',
  border: '1px solid #ccc',
  borderRadius: '4px',
}

export default function GeneratePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const [result, setResult] = useState('')
  const [scores, setScores] = useState<Scores | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage('You must be logged in to generate content.')
        return
      }
      const { data } = await supabase
        .from('business_profile')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (data) setProfile(data as Profile)
      else setMessage('Please create your business profile first.')
    }
    load()
  }, [])

  async function handleGenerate() {
    if (!profile) return
    setMessage('')
    setResult('')
    setScores(null)
    setLoading(true)
    setSeconds(0)
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage('You must be logged in.')
        return
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: profile.business_name,
          industry: profile.industry,
          targetAudience: profile.target_audience,
          tone: profile.brand_tone,
          contentType,
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error || !data.content) {
        setMessage('Generation failed: ' + (data.error || 'AI service unavailable. Please try again.'))
        return
      }

      const past = await supabase
        .from('generated_content')
        .select('rating')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .not('rating', 'is', null)
      const pastRatings = (past.data || []).map((r: { rating: number }) => r.rating)

      const result = evaluateContent(data.content, {
        brandTone: profile.brand_tone,
        businessName: profile.business_name,
        industry: profile.industry,
        contentType,
        pastRatings,
      })

      setResult(data.content)
      setScores(result)

      const { error } = await supabase.from('generated_content').insert({
        user_id: user.id,
        content_type: contentType,
        content_text: data.content,
        quality_score: Number(result.overallScore.toFixed(2)),
        analysis_json: result,
        status: 'saved',
      })

      setMessage(error ? 'Generated, but could not save: ' + error.message : 'Saved to your dashboard.')
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', color: 'white' }}>
      <h1>Generate Content</h1>

      {profile && (
        <p style={{ color: '#aaa' }}>
          Using your profile: {profile.business_name} ({profile.industry}, {profile.brand_tone})
        </p>
      )}

      <div style={{ margin: '15px 0' }}>
        <label>Content type</label><br />
        <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={inputStyle}>
          {CONTENT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <button onClick={handleGenerate} disabled={loading || !profile} style={{ padding: '10px 20px' }}>
        {loading ? 'Generating... ' + seconds + 's' : 'Generate'}
      </button>

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #444', borderRadius: '6px', backgroundColor: '#1a1a1a', whiteSpace: 'pre-wrap' }}>
          {result}
        </div>
      )}

      {scores && (
        <p style={{ marginTop: '10px' }}>
          Quality score: {Math.round(scores.overallScore * 100)}% (Readability {Math.round(scores.readabilityScore * 100)}%,
          Tone {Math.round(scores.toneScore * 100)}%, Keywords {Math.round(scores.keywordScore * 100)}%)
        </p>
      )}

      <p style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ color: '#4af' }}>Go to Dashboard</a>
      </p>
    </div>
  )
}