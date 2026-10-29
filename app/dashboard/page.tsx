'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Profile = {
  id: number
  business_name: string
  industry: string
  description: string
  target_audience: string
  brand_tone: string
  created_at: string
}

type Analysis = {
  readabilityScore?: number
  toneScore?: number
  keywordScore?: number
  structureScore?: number
}

type Content = {
  id: number
  created_at: string
  content_type: string
  content_text: string
  quality_score: number | null
  analysis_json: Analysis | null
  rating: number | null
  status: string | null
}

const MONTHLY_LIMIT = 20

function ScoreBar({ label, value }: { label: string; value?: number }) {
  const pct = Math.round((value ?? 0) * 100)
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span>{label}</span>
        <span>{value === undefined ? '-' : pct + '%'}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#333', borderRadius: '3px' }}>
        <div style={{ width: pct + '%', height: '100%', backgroundColor: '#4af', borderRadius: '3px' }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setMessage('You must be logged in to view your dashboard.')
      setLoading(false)
      return
    }

    const profileResult = await supabase
      .from('business_profile')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (profileResult.error) {
      setMessage('Error loading profiles: ' + profileResult.error.message)
    } else {
      setProfiles(profileResult.data as Profile[])
    }

    const contentResult = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (contentResult.error) {
      setMessage('Error loading content: ' + contentResult.error.message)
    } else {
      setContents(contentResult.data as Content[])
    }

    setLoading(false)
  }

  async function handleDeleteProfile(id: number) {
    const { error } = await supabase.from('business_profile').delete().eq('id', id)
    if (error) {
      setMessage('Error deleting: ' + error.message)
    } else {
      setProfiles(profiles.filter((p) => p.id !== id))
    }
  }

  async function handleRate(id: number, rating: number) {
    const { data, error } = await supabase
      .from('generated_content')
      .update({ rating })
      .eq('id', id)
      .select()

    if (error || !data || data.length === 0) {
      setMessage('Could not save rating.' + (error ? ' ' + error.message : ''))
    } else {
      setContents(contents.map((c) => (c.id === id ? { ...c, rating } : c)))
    }
  }

  async function handleStatus(id: number, status: string) {
    const { data, error } = await supabase
      .from('generated_content')
      .update({ status, edited_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error || !data || data.length === 0) {
      setMessage('Could not update status.' + (error ? ' ' + error.message : ''))
    } else {
      setContents(contents.map((c) => (c.id === id ? { ...c, status } : c)))
    }
  }

  async function handleDeleteContent(id: number) {
    const { error } = await supabase.from('generated_content').delete().eq('id', id)
    if (error) {
      setMessage('Error deleting: ' + error.message)
    } else {
      setContents(contents.filter((c) => c.id !== id))
    }
  }

  const scored = contents.filter((c) => c.quality_score !== null)
  const avgScore =
    scored.length === 0
      ? 0
      : Math.round((scored.reduce((sum, c) => sum + (c.quality_score ?? 0), 0) / scored.length) * 100)

  const now = new Date()
  const usedThisMonth = contents.filter((c) => {
    const d = new Date(c.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const limitReached = usedThisMonth >= MONTHLY_LIMIT

  const favourites = contents.filter((c) => (c.rating ?? 0) >= 4 && c.status !== 'discarded')

  const cardStyle = {
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#1a1a1a',
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px', color: 'white' }}>
      <h1>Dashboard</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <a
          href="/profile"
          style={{ display: 'inline-block', padding: '8px 18px', backgroundColor: '#4af', color: '#000', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none' }}
        >
          Edit Business Profile
        </a>
        <button
          onClick={handleSignOut}
          style={{ padding: '8px 18px', backgroundColor: 'transparent', color: '#f66', border: '2px solid #f66', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

      <h2>Overview</h2>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
        <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>{contents.length}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Total drafts</div>
        </div>
        <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>{avgScore}%</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Average quality score</div>
        </div>
        <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: limitReached ? '#f66' : 'white' }}>
            {usedThisMonth} / {MONTHLY_LIMIT}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Generated this month</div>
        </div>
      </div>
      {limitReached && (
        <p style={{ color: '#f66', marginBottom: '25px' }}>
          You have reached your monthly generation limit.
        </p>
      )}
      {!limitReached && <div style={{ marginBottom: '25px' }} />}

      <h2>Top Favourites</h2>
      {!loading && favourites.length === 0 && (
        <p style={{ color: '#aaa' }}>Rate a draft 4 or 5 stars and it will show up here.</p>
      )}
      {favourites.map((c) => (
        <div key={'fav-' + c.id} style={{ ...cardStyle, borderColor: '#fc4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{c.content_type}</strong>
            <span style={{ color: '#fc4' }}>{'★'.repeat(c.rating ?? 0)}</span>
          </div>
          <p style={{ margin: '10px 0' }}>
            {c.content_text.length > 160 ? c.content_text.slice(0, 160) + '...' : c.content_text}
          </p>
          <small style={{ color: '#aaa' }}>
            Quality: {c.quality_score === null ? 'Not scored' : Math.round(c.quality_score * 100) + '%'}
          </small>
        </div>
      ))}

      <h2>Generated Content</h2>
      {!loading && contents.length === 0 && <p>No generated content yet.</p>}

      {contents.map((c) => (
        <div key={c.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{c.content_type}</strong>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{c.status}</span>
          </div>
          <p style={{ margin: '10px 0' }}>{c.content_text}</p>

          <p style={{ marginBottom: '8px' }}>
            <strong>Quality score: </strong>
            {c.quality_score === null ? 'Not scored' : Math.round(c.quality_score * 100) + '%'}
          </p>
          <ScoreBar label="Readability" value={c.analysis_json?.readabilityScore} />
          <ScoreBar label="Tone" value={c.analysis_json?.toneScore} />
          <ScoreBar label="Keywords" value={c.analysis_json?.keywordScore} />

          <p style={{ marginTop: '10px' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                onClick={() => handleRate(c.id, n)}
                style={{ cursor: 'pointer', fontSize: '22px', color: n <= (c.rating ?? 0) ? '#fc4' : '#666' }}
              >
                {n <= (c.rating ?? 0) ? '★' : '☆'}
              </span>
            ))}
          </p>
          <p><small>Created: {new Date(c.created_at).toLocaleString()}</small></p>

          <button
            onClick={() => handleStatus(c.id, 'published')}
            disabled={c.status === 'published'}
            style={{ padding: '6px 12px', backgroundColor: '#2a7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', opacity: c.status === 'published' ? 0.4 : 1 }}
          >
            Publish
          </button>
          <button
            onClick={() => handleStatus(c.id, 'discarded')}
            disabled={c.status === 'discarded'}
            style={{ padding: '6px 12px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', opacity: c.status === 'discarded' ? 0.4 : 1 }}
          >
            Discard
          </button>
          <button
            onClick={() => handleDeleteContent(c.id)}
            style={{ padding: '6px 12px', backgroundColor: '#a33', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      ))}

      <h2>Business Profile</h2>
      {!loading && profiles.length === 0 && !message && <p>No saved profiles yet.</p>}

      {profiles.map((profile) => (
        <div key={profile.id} style={cardStyle}>
          <h3>{profile.business_name}</h3>
          <p><strong>Industry:</strong> {profile.industry}</p>
          <p><strong>Description:</strong> {profile.description}</p>
          <p><strong>Target Audience:</strong> {profile.target_audience}</p>
          <p><strong>Brand Tone:</strong> {profile.brand_tone}</p>
          <p><small>Created: {new Date(profile.created_at).toLocaleString()}</small></p>
          <button
            onClick={() => handleDeleteProfile(profile.id)}
            style={{ padding: '6px 12px', backgroundColor: '#a33', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}