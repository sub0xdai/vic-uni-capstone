'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

const inputStyle = {
  width: '100%',
  padding: '8px',
  backgroundColor: 'white',
  color: 'black',
  border: '1px solid #ccc',
  borderRadius: '4px',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignUp() {
    setMessage('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage('Sign up error: ' + error.message)
    } else {
      setMessage('Signed up! You can now log in (check your email if confirmation is required).')
    }
  }

    async function handleLogin() {
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('Login error: ' + error.message)
    } else {
      window.location.href = '/profile'
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', color: 'white' }}>
      <h1>Login / Sign Up</h1>

      <div style={{ marginBottom: '15px' }}>
        <label>Email</label><br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Password</label><br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      <button onClick={handleLogin} style={{ padding: '10px 20px', marginRight: '10px' }}>
        Log In
      </button>
      <button onClick={handleSignUp} style={{ padding: '10px 20px' }}>
        Sign Up
      </button>

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}

      <p style={{ marginTop: '20px' }}>
        <a href="/profile" style={{ color: '#4af' }}>Go to Business Profile</a>
      </p>
      <p style={{ marginTop: '10px' }}>
        <a href="/dashboard" style={{ color: '#4af' }}>Go to Dashboard</a>
      </p>

    </div>
  )
}
