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

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [])

async function handleSignOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}

  async function fetchProfiles() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setMessage('You must be logged in to view your dashboard.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('business_profile')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('Error loading profiles: ' + error.message)
    } else {
      setProfiles(data as Profile[])
    }
    setLoading(false)
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from('business_profile').delete().eq('id', id)
    if (error) {
      setMessage('Error deleting: ' + error.message)
    } else {
      setProfiles(profiles.filter((p) => p.id !== id))
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px', color: 'white' }}>
      <h1>Dashboard</h1>
      
      <button
  onClick={handleSignOut}
  style={{ padding: '6px 14px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}
>
  Sign Out
</button>

      <p style={{ marginBottom: '20px' }}>
  <a href="/profile" style={{ color: '#4af' }}>Edit Business Profile</a>
</p>
      

      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

      {!loading && profiles.length === 0 && !message && (
        <p>No saved profiles yet.</p>
      )}

      {profiles.map((profile) => (
        <div
          key={profile.id}
          style={{
            border: '1px solid #444',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#1a1a1a',
          }}
        >
          <h3>{profile.business_name}</h3>
          <p><strong>Industry:</strong> {profile.industry}</p>
          <p><strong>Description:</strong> {profile.description}</p>
          <p><strong>Target Audience:</strong> {profile.target_audience}</p>
          <p><strong>Brand Tone:</strong> {profile.brand_tone}</p>
          <p><small>Created: {new Date(profile.created_at).toLocaleString()}</small></p>

          <button
            onClick={() => handleDelete(profile.id)}
            style={{ padding: '6px 12px', backgroundColor: '#a33', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

