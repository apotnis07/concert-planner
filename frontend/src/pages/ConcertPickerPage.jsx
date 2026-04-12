import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, width: '100%', zIndex: 50,
      backgroundColor: 'rgba(19,19,19,0.6)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      padding: '1rem 2rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <a href="/">THE SONIC CURATOR</a>
      </span>
      {/* <span className="material-symbols-outlined" style={{ color: '#BCCBB9', cursor: 'pointer' }}>
        account_circle
      </span> */}
    </nav>
  )
}

// ── Concert Card ──────────────────────────────────────────────────────────────
function ConcertCard({ concert, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: selected ? '#1a2e1f' : '#141414',
        border: selected ? '2px solid #1DB954' : '2px solid rgba(71,69,84,0.2)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        boxShadow: selected ? '0 0 30px rgba(29,185,84,0.15)' : 'none',
      }}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.borderColor = 'rgba(29,185,84,0.4)'
      }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.borderColor = 'rgba(71,69,84,0.2)'
      }}
    >
      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          backgroundColor: '#1DB954', borderRadius: '9999px',
          width: '1.75rem', height: '1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#000' }}>check</span>
        </div>
      )}

      {/* Artist + Event */}
      <div style={{ marginBottom: '1rem', paddingRight: selected ? '2rem' : '0' }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#1DB954', marginBottom: '0.25rem',
        }}>
          {concert.artist}
        </p>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem',
          fontWeight: 700, lineHeight: 1.2, color: '#E5E2E1',
        }}>
          {concert.event_name}
        </h3>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#BCCBB9', fontSize: '0.875rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span>
          <span>{concert.venue_name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#BCCBB9', fontSize: '0.875rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>calendar_today</span>
          <span>{concert.date}{concert.time ? ` • ${concert.time}` : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#BCCBB9', fontSize: '0.875rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_city</span>
          <span>{concert.venue_address}</span>
        </div>
      </div>

      {/* Price badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {concert.price_available ? (
          <span style={{
            backgroundColor: 'rgba(255,185,101,0.15)',
            color: '#ffb965', fontSize: '0.8rem', fontWeight: 700,
            padding: '0.25rem 0.75rem', borderRadius: '9999px',
          }}>
            ${concert.min_price} – ${concert.max_price}
          </span>
        ) : (
          // <span style={{
          //   backgroundColor: 'rgba(71,69,84,0.3)',
          //   color: '#BCCBB9', fontSize: '0.8rem',
          //   padding: '0.25rem 0.75rem', borderRadius: '9999px',
          // }}>
          //   Price TBA
          // </span>
          <span></span>
        )}
        {concert.url && (
          <a
            href={concert.url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: '#BCCBB9', fontSize: '0.75rem', textDecoration: 'underline', textUnderlineOffset: '4px', transition: 'all 0.5s ease',
              position: 'absolute', bottom: '1.5rem', right: '1rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F8FAFC'; // Brighten text color on hover
              e.currentTarget.style.textShadow = '0 0 8px #BCCBB9, 0 0 12px rgba(188, 203, 185, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#BCCBB9'; // Revert text color
              e.currentTarget.style.textShadow = 'none'; // Remove glow
            }}
          >
            Get Tickets
          </a>
        )}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ artists }) {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '480px', margin: '0 auto' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#474554', display: 'block', marginBottom: '1rem' }}>
        music_off
      </span>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        No upcoming concerts found
      </h2>
      <p style={{ color: '#BCCBB9', lineHeight: 1.6, marginBottom: '0.5rem' }}>
        We searched Ticketmaster for upcoming Chicago shows from your followed artists but came up empty.
      </p>
      {artists?.length > 0 && (
        <p style={{ color: '#474554', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Searched for: {artists.slice(0, 5).map(a => a.name).join(', ')}
          {artists.length > 5 ? ` and ${artists.length - 5} more` : ''}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/preferences')}
          style={{
            backgroundColor: '#1DB954', color: '#000', fontWeight: 700, fontSize: '1rem',
            padding: '0.75rem 1.5rem', borderRadius: '9999px',
            border: 'none', cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Preferences
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ConcertPickerPage() {

  const navigate = useNavigate()
  const [concerts, setConcerts] = useState([])
  const [artists, setArtists] = useState([])
  const [selectedConcert, setSelectedConcert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const hasFetched = useRef(false);
  const prefs = JSON.parse(sessionStorage.getItem('nop_preferences') || '{}')
  const displayCity = prefs.city || 'Chicago';

  useEffect(() => {
    const token = sessionStorage.getItem('nop_access_token')

    // Clear any previously selected concert so user always picks fresh
    sessionStorage.removeItem('nop_selected_concert')

    if (!token) { navigate('/'); return }

    const fetchConcerts = async () => {
      try {
        const res = await apiClient.get('/api/concerts', {
          params: { access_token: token, city: prefs.city || 'Chicago' }
        })
        setConcerts(res.data.concerts || [])
        setArtists(res.data.artists || [])
      } catch (err) {
        setError('Failed to load concerts. Please try again.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (hasFetched.current) return
    hasFetched.current = true
    fetchConcerts()
  }, [navigate])

  const handlePlanNight = () => {
    if (!selectedConcert) return
    // Store the selected concert so ResultsPage can pass it to the graph
    sessionStorage.setItem('nop_selected_concert', JSON.stringify(selectedConcert))
    navigate('/results')
  }

  return (
    <div style={{
      backgroundColor: '#0A0A0A', color: '#E5E2E1',
      fontFamily: "'Inter', sans-serif", minHeight: '100vh',
    }}>
      <Navbar />

      <main style={{ paddingTop: '7rem', padding: '7rem 2rem 6rem', maxWidth: '80rem', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700, letterSpacing: '-0.05em', marginBottom: '0.5rem',
          }}>
            Pick your concert
          </h1>
          <p style={{ color: '#BCCBB9', fontSize: '1.125rem' }}>
            {loading
              ? 'Searching Ticketmaster for your artists...'
              : concerts.length > 0
                ? `Found ${concerts.length} upcoming show${concerts.length > 1 ? 's' : ''} in ${displayCity}`
                : 'No shows found'
            }
          </p>
        </header>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#1DB954', animation: 'spin 1s linear infinite' }}>refresh</span>
            <p style={{ color: '#BCCBB9' }}>Finding concerts for your artists...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p style={{ color: '#ff767b', textAlign: 'center', padding: '2rem' }}>{error}</p>
        )}

        {/* Empty state */}
        {!loading && !error && concerts.length === 0 && (
          <EmptyState artists={artists} />
        )}

        {/* Concert grid */}
        {!loading && concerts.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
            marginBottom: '6rem',
          }}>
            {concerts.map((concert, i) => (
              <ConcertCard
                key={i}
                concert={concert}
                selected={selectedConcert === concert}
                onClick={() => setSelectedConcert(concert)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky bottom CTA — only shows when a concert is selected */}
      {selectedConcert && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, width: '100%',
          backgroundColor: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(71,69,84,0.2)',
          padding: '1rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 50,
          boxSizing: 'border-box',
        }}>
          <div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem' }}>
              {selectedConcert.artist} — {selectedConcert.venue_name}
            </p>
            <p style={{ color: '#BCCBB9', fontSize: '0.875rem' }}>{selectedConcert.date}</p>
          </div>
          <button
            onClick={handlePlanNight}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#1DB954', color: '#000',
              fontWeight: 700, padding: '0.875rem 1.75rem',
              borderRadius: '9999px', border: 'none',
              cursor: 'pointer', fontSize: '1rem',
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 0 30px rgba(29,185,84,0.3)',
              transition: 'transform 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Plan this night
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  )
}