'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const inputStyle = {
  width: '100%',
  padding: '8px',
  backgroundColor: 'white',
  color: 'black',
  border: '1px solid #ccc',
  borderRadius: '4px',
}

export default function BusinessProfilePage() {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [brandTone, setBrandTone] = useState('')
  const [message, setMessage] = useState('')
  const [existingProfileId, setExistingProfileId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExistingProfile()
  }, [])

  async function loadExistingProfile() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setMessage('You must be logged in to manage a profile.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('business_profile')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (data) {
      setExistingProfileId(data.id)
      setBusinessName(data.business_name || '')
      setIndustry(data.industry || '')
      setDescription(data.description || '')
      setTargetAudience(data.target_audience || '')
      setBrandTone(data.brand_tone || '')
    }

    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!businessName || !industry || !description || !targetAudience || !brandTone) {
      setMessage('Please fill in all fields.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setMessage('You must be logged in to save a profile.')
      return
    }

    if (existingProfileId) {
      // UPDATE existing profile
      const { error } = await supabase
        .from('business_profile')
        .update({
          business_name: businessName,
          industry: industry,
          description: description,
          target_audience: targetAudience,
          brand_tone: brandTone,
        })
        .eq('id', existingProfileId)

      if (error) {
        setMessage('Error updating profile: ' + error.message)
      } else {
        setMessage('Profile updated successfully!')
      }
    } else {
      // INSERT new profile
      const { data, error } = await supabase
        .from('business_profile')
        .insert({
          user_id: user.id,
          business_name: businessName,
          industry: industry,
          description: description,
          target_audience: targetAudience,
          brand_tone: brandTone,
        })
        .select()
        .single()

      if (error) {
        setMessage('Error saving profile: ' + error.message)
      } else {
        setMessage('Profile saved successfully!')
        setExistingProfileId(data.id)
      }
    }
  }

  if (loading) {
    return <p style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>Loading...</p>
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', color: 'white' }}>
      <h1>{existingProfileId ? 'Edit Business Profile' : 'Create Business Profile'}</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Business Name</label><br />
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Industry</label><br />
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select industry</option>
            <option value="Retail">Retail</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Health & Wellness">Health & Wellness</option>
            <option value="Professional Services">Professional Services</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Business Description</label><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Target Audience</label><br />
          <textarea
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Brand Tone</label><br />
          <select
            value={brandTone}
            onChange={(e) => setBrandTone(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select tone</option>
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Friendly">Friendly</option>
          </select>
        </div>

        <button type="submit" style={{ padding: '10px 20px' }}>
          {existingProfileId ? 'Update Profile' : 'Save Profile'}
        </button>

        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </form>

      <p style={{ marginTop: '20px' }}>
  <a href="/dashboard" style={{ color: '#4af' }}>Go to Dashboard</a>
</p>

    </div>
  )
}
