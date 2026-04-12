import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// ── Shared Navbar (we'll extract to its own file in a later module) ──
function Navbar() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        backgroundColor: 'rgba(19,19,19,0.6)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          maxWidth: '80rem',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            color: '#E5E2E1',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <a href="/">THE SONIC CURATOR</a>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a
            href="/"
            style={{
              color: '#BCCBB9',
              textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E5E2E1')}
            onMouseLeave={e => (e.currentTarget.style.color = '#BCCBB9')}
          >
            How it works
          </a>
          <span className="material-symbols-outlined" style={{ color: '#BCCBB9', cursor: 'pointer' }}>
            account_circle
          </span>
        </nav>
      </div>
    </header>
  )
}

// ── Constants ──
const CUISINES = ['Any', 'Italian', 'Mexican', 'Japanese', 'Korean', 'Mediterranean', 'American', 'Seafood', 'Vegetarian']
const BUDGETS = [
  { label: '$', sub: 'Under $25', value: '$' },
  { label: '$$', sub: '$25–50', value: '$$' },
  { label: '$$$', sub: '$50–100', value: '$$$' },
  { label: '$$$$', sub: '$100+', value: '$$$$' },
]

export default function PreferencesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Grab the Spotify access token passed in the URL from /callback
  const accessToken = searchParams.get('access_token') || ''

  const [city, setCity] = useState('Chicago')
  const [origin, setOrigin] = useState('')
  const [selectedCuisines, setSelectedCuisines] = useState(['Any'])
  const [budget, setBudget] = useState('$$')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCuisine = (cuisine) => {
    if (cuisine === 'Any') {
      setSelectedCuisines(['Any'])
      return
    }
    setSelectedCuisines(prev => {
      const withoutAny = prev.filter(c => c !== 'Any')
      if (withoutAny.includes(cuisine)) {
        const updated = withoutAny.filter(c => c !== cuisine)
        return updated.length === 0 ? ['Any'] : updated
      }
      return [...withoutAny, cuisine]
    })
  }

  const handleSubmit = async () => {
    if (!accessToken) {
      // setError('No Spotify token found. Please connect Spotify first.')
      navigate('/');
      return
    }
    setLoading(true)
    setError('')

    // Store preferences + token in sessionStorage so ResultsPage can read them
    sessionStorage.removeItem('nop_selected_concert')
    sessionStorage.setItem('nop_access_token', accessToken)
    sessionStorage.setItem('nop_preferences', JSON.stringify({
      city,
      origin: origin || 'Chicago Union Station, 225 S Canal St, Chicago, IL 60606',
      cuisines: selectedCuisines,
      budget,
    }))

    navigate('/picker')
  }

  return (
    <div
      style={{
        backgroundColor: '#0A0A0A',
        color: '#E5E2E1',
        fontFamily: "'Inter', sans-serif",
        minHeight: '100vh',
        paddingBottom: '6rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Navbar />

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '25%', left: '-5rem', width: '24rem', height: '24rem', backgroundColor: 'rgba(143,126,255,0.06)', filter: 'blur(120px)', borderRadius: '9999px', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '25%', right: '-5rem', width: '24rem', height: '24rem', backgroundColor: 'rgba(29,185,84,0.04)', filter: 'blur(120px)', borderRadius: '9999px', zIndex: 0, pointerEvents: 'none' }} />

      <main
        style={{
          paddingTop: '8rem',
          padding: '8rem 1.5rem 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Page header */}
        <div style={{ width: '100%', maxWidth: '560px', marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '3rem',
              fontWeight: 700,
              letterSpacing: '-0.05em',
              color: '#fff',
              marginBottom: '0.75rem',
            }}
          >
            Set your preferences
          </h1>
          <p style={{ color: '#BCCBB9', fontSize: '1.125rem', fontWeight: 300 }}>
            Tell us a bit more to personalize your night out
          </p>
        </div>

        {/* Card */}
        <section
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#141414',
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* City */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={labelStyle}>Destination City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#1DB954')}
                onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
              />
            </div>

            {/* Starting location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={labelStyle}>Where are you starting from?</label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#474554', fontSize: '1.25rem' }}
                >
                  near_me
                </span>
                <input
                  type="text"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  placeholder="e.g. Chicago Union Station"
                  style={{ ...inputStyle, paddingLeft: '2.75rem' }}
                  onFocus={e => (e.target.style.borderColor = '#1DB954')}
                  onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                />
              </div>
            </div>

            {/* Cuisine multi-select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={labelStyle}>Any cuisine preferences?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {CUISINES.map(cuisine => {
                  const isSelected = selectedCuisines.includes(cuisine)
                  return (
                    <button
                      key={cuisine}
                      onClick={() => toggleCuisine(cuisine)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        border: isSelected ? 'none' : '1px solid #2A2A2A',
                        backgroundColor: isSelected ? '#1DB954' : '#1E1E1E',
                        color: isSelected ? '#000' : '#BCCBB9',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#1DB954'
                          e.currentTarget.style.color = '#fff'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#2A2A2A'
                          e.currentTarget.style.color = '#BCCBB9'
                        }
                      }}
                    >
                      {cuisine}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Budget segmented control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={labelStyle}>Dinner budget per person</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  backgroundColor: '#1E1E1E',
                  borderRadius: '0.75rem',
                  padding: '0.25rem',
                  gap: '0.25rem',
                }}
              >
                {BUDGETS.map(b => {
                  const isSelected = budget === b.value
                  return (
                    <button
                      key={b.value}
                      onClick={() => setBudget(b.value)}
                      style={{
                        padding: '0.75rem 0',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected ? '1px solid rgba(29,185,84,0.3)' : 'none',
                        backgroundColor: isSelected ? '#2A2A2A' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        gap: '2px',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: isSelected ? '#1DB954' : '#fff', fontSize: '1rem' }}>
                        {b.label}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: isSelected ? '#fff' : '#BCCBB9' }}>
                        {b.sub}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p style={{ color: '#ff767b', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>
            )}

            {/* CTA */}
            <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#155e30' : '#1DB954',
                  color: '#000',
                  fontWeight: 700,
                  padding: '1rem',
                  borderRadius: '9999px',
                  fontSize: '1.125rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 30px rgba(29,185,84,0.2)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.05)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
              >
                {loading ? 'Planning your night...' : 'Plan My Night'}
                {!loading && (
                  <span className="material-symbols-outlined">arrow_forward</span>
                )}
              </button>
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#474554',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                This usually takes 15–20 seconds
              </p>
            </div>

          </div>
        </section>
      </main>

  
    </div>
  )
}

// ── Shared style objects ──
const labelStyle = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#BCCBB9',
}

const inputStyle = {
  width: '100%',
  backgroundColor: '#1E1E1E',
  border: '1px solid #2A2A2A',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  color: '#fff',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 500,
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}
