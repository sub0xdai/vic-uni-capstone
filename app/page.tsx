'use client'

import { useEffect } from 'react'
import { supabase } from './lib/supabase'

export default function Home() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      window.location.href = data.user ? '/dashboard' : '/login'
    })
  }, [])

  return <p style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>Loading...</p>
}