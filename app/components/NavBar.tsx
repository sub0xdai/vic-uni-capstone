'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const linkStyle = { color: '#4af', textDecoration: 'none', marginRight: '20px' }

export default function NavBar() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 24px',
        borderBottom: '1px solid #333',
        backgroundColor: '#111',
      }}
    >
      <strong style={{ color: 'white', marginRight: '30px' }}>AI Content Engine</strong>

      {loggedIn ? (
        <>
          <a href="/dashboard" style={linkStyle}>Dashboard</a>
          <a href="/profile" style={linkStyle}>Business Profile</a>
                    <a href="/generate" style={linkStyle}>Generate</a>
          <button
            onClick={handleSignOut}
            style={{ marginLeft: 'auto', padding: '6px 14px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </>
      ) : (
        <a href="/login" style={linkStyle}>Log In</a>
      )}
    </nav>
  )
}