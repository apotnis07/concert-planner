import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import apiClient from '../api/client'

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ displayName }) {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        backgroundColor: 'rgba(19,19,19,0.6)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <a href="/">THE SONIC CURATOR</a>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {displayName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#2a2931',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{displayName}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#BCCBB9' }}>account_circle</span>
          </div>
        )}
      </div>
    </nav>
  )
}

// ── Loading State ────────────────────────────────────────────────────────────
function LoadingState({ steps, currentStep }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Planning your night...
        </h2>
        <p style={{ color: '#BCCBB9' }}>Our AI agents are working on your plan</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
        {steps.map((step, i) => {
          const isDone = i < currentStep
          const isActive = i === currentStep
          return (
            <div
              key={step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: isActive ? '#1a1a1a' : 'transparent',
                border: isActive ? '1px solid rgba(29,185,84,0.3)' : '1px solid transparent',
                transition: 'all 0.3s',
              }}
            >
              {isDone ? (
                <span className="material-symbols-outlined" style={{ color: '#1DB954', fontSize: '1.25rem' }}>check_circle</span>
              ) : isActive ? (
                <span className="material-symbols-outlined" style={{ color: '#1DB954', fontSize: '1.25rem', animation: 'spin 1s linear infinite' }}>refresh</span>
              ) : (
                <span className="material-symbols-outlined" style={{ color: '#474554', fontSize: '1.25rem' }}>radio_button_unchecked</span>
              )}
              <span style={{ color: isDone ? '#E5E2E1' : isActive ? '#E5E2E1' : '#474554', fontSize: '0.875rem' }}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Concert Card ─────────────────────────────────────────────────────────────
function ConcertCard({ concert }) {
  if (!concert) return <EmptyCard title="The Show" icon="music_note" message="No upcoming concerts found for your followed artists in Chicago." />
  return (
    <div style={cardStyle}>
      <div >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '0.25rem' }}>
              {concert.artist}
            </h3>
            <p style={{ color: '#c8bfff', fontWeight: 500, letterSpacing: '0.02em' }}>{concert.event_name}</p>
          </div>
          {concert.price_available && (
            <span style={{ backgroundColor: '#201f27', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: '#ffb965', whiteSpace: 'nowrap' }}>
              ${concert.min_price} – ${concert.max_price}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#BCCBB9' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span>
            <span style={{ fontSize: '0.875rem' }}>{concert.venue_name} • {concert.venue_address}</span>
          </div>
          {concert.date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#BCCBB9' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>schedule</span>
              <span style={{ fontSize: '0.875rem' }}>
                {concert.date}{concert.time ? ` • ${concert.time}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
      {concert.url && (
        <a
          href={concert.url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '2px solid #1DB954',
            color: '#1DB954',
            fontWeight: 700,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all 0.2s',
            fontSize: '0.9rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1DB954'; e.currentTarget.style.color = '#000' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1DB954' }}
        >
          Get Tickets
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_outward</span>
        </a>
      )}
    </div>
  )
}

// ── Directions Card ───────────────────────────────────────────────────────────
function DirectionsModal({ mode, data, onClose }) {
  if (!data) return null

  const isTransit = mode === 'transit'
  const accentColor = isTransit ? '#1DB954' : '#c8bfff'
  const icon = isTransit ? 'train' : 'directions_car'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
        backgroundColor: '#141414',
        borderRadius: '1.25rem 1.25rem 0 0',
        padding: '2rem',
        maxHeight: '75vh',
        overflowY: 'auto',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Handle bar */}
        <div style={{ width: '2.5rem', height: '4px', backgroundColor: '#474554', borderRadius: '9999px', margin: '0 auto 1.5rem' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ color: accentColor }}>{icon}</span>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700 }}>
                {isTransit ? 'Transit Directions' : 'Driving Directions'}
              </h3>
            </div>
            <p style={{ color: '#BCCBB9', fontSize: '0.875rem' }}>
              {data.duration} • {data.distance}
              {data.summary ? ` • via ${data.summary}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: '#2a2931', border: 'none', borderRadius: '9999px', width: '2.25rem', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#BCCBB9' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>close</span>
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {data.steps?.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              {/* Connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: '1.75rem', height: '1.75rem', borderRadius: '9999px',
                  // backgroundColor: isTransit && step.line ? accentColor : '#2a2931',
                  backgroundColor: step.vehicle === 'BUS' ? '#1DB954' : (isTransit && step.line ? accentColor : '#2a2931'),
                  border: `2px solid ${isTransit && step.line ? accentColor : '#474554'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700,
                  color: isTransit && step.line ? '#000' : '#BCCBB9',
                  flexShrink: 0, marginTop: '0.75rem',
                }}>
                  {step.vehicle === 'WALK' ? (
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>directions_walk</span>
                  ) : (
                    isTransit && step.line ? step.line : i + 1
                  )}                </div>
                {i < (data.steps.length - 1) && (
                  <div style={{ width: '2px', flexGrow: 1, minHeight: '1.5rem', backgroundColor: '#2a2931', margin: '2px 0' }} />
                )}
              </div>

              {/* Step content */}
              <div style={{ padding: '0.75rem 0', borderBottom: i < data.steps.length - 1 ? '1px solid rgba(71,69,84,0.15)' : 'none', flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: '#E5E2E1', lineHeight: 1.5, marginBottom: '0.35rem' }}>
                  {step.instruction}
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {step.duration && (
                    <span style={{ fontSize: '0.75rem', color: '#474554' }}>{step.duration}</span>
                  )}
                  {step.distance && (
                    <span style={{ fontSize: '0.75rem', color: '#474554' }}>{step.distance}</span>
                  )}
                  {step.departure_stop && (
                    <span style={{ fontSize: '0.75rem', color: '#474554' }}>
                      {step.departure_stop} → {step.arrival_stop}
                    </span>
                  )}
                  {step.num_stops && (
                    <span style={{ fontSize: '0.75rem', color: accentColor }}>{step.num_stops} stops</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function DirectionsCard({ directions }) {
  const [modal, setModal] = useState(null) // 'transit' | 'driving' | null

  const transit = directions?.find(d => d.mode === 'transit' && d.available)
  const driving = directions?.find(d => d.mode === 'driving' && d.available)

  if (!transit && !driving) return (
    <EmptyCard title="Getting There" icon="directions_car" message="Directions unavailable." />
  )

  return (
    <>
      <div style={cardStyle}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#c8bfff' }}>directions_car</span>
          Getting There
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Transit */}
          {transit && (
            <div
              onClick={() => setModal('transit')}
              style={{
                position: 'relative', padding: '1rem',
                borderRadius: '0.5rem', backgroundColor: '#231F1E',
                border: '1px solid rgba(29,185,84,0.3)',
                cursor: 'pointer', transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#252433')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#201f27')}
            >
              <div style={{ position: 'absolute', top: '-0.625rem', left: '1rem', backgroundColor: '#1DB954', color: '#000', fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recommended
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>train</span>
                  Transit
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700 }}>{transit.duration}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#BCCBB9' }}>chevron_right</span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#BCCBB9' }}>{transit.distance} • CTA • Tap for steps</p>
            </div>
          )}

          {/* Driving */}
          {driving && (
            <div
              onClick={() => setModal('driving')}
              style={{
                padding: '1rem', borderRadius: '0.5rem',
                backgroundColor: '#1c1b23',
                border: '1px solid rgba(71,69,84,0.15)',
                cursor: 'pointer', transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#252433')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1c1b23')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#BCCBB9' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>directions_car</span>
                  Driving
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#BCCBB9' }}>{driving.duration}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#BCCBB9' }}>chevron_right</span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#BCCBB9' }}>
                {driving.distance}{driving.summary ? ` • via ${driving.summary}` : ''} • Tap for steps
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal — rendered outside the card */}
      {modal && (
        <DirectionsModal
          mode={modal}
          data={modal === 'transit' ? transit : driving}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

// ── Cost Card ─────────────────────────────────────────────────────────────────
function CostCard({ costEstimate }) {
  const breakdown = costEstimate?.breakdown
  const total = breakdown?.total

  if (!breakdown) return <EmptyCard title="Cost Estimate" icon="payments" message="Cost estimate unavailable." />

  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#BCCBB9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        Total Estimate
      </h3>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 700, color: '#c8bfff', marginBottom: '2rem' }}>
        ${total?.min} — ${total?.max}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          { label: 'Tickets', data: breakdown.ticket },
          { label: 'Transport', data: { min: Math.min(breakdown.transport?.transit.min, breakdown.transport?.driving.min), max: Math.max(breakdown.transport?.transit.max, breakdown.transport?.driving.max) } },
          { label: 'Dinner', data: breakdown.dinner },
        ].map(({ label, data }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(71,69,84,0.3)', paddingBottom: '0.5rem' }}>
            <span style={{ color: '#BCCBB9' }}>{label}</span>
            <span style={{ fontWeight: 500 }}>
              {data ? `$${data.min}–$${data.max}` : '—'}
            </span>
          </div>
        ))}
      </div>
      {total?.note && (
        <p style={{ fontSize: '0.75rem', color: '#474554', marginTop: '1rem', lineHeight: 1.5 }}>{total.note}</p>
      )}
    </div>
  )
}

// ── Restaurant Cards ──────────────────────────────────────────────────────────
function RestaurantSection({ restaurants }) {
  if (!restaurants?.length) return (
    <section style={{ marginBottom: '3rem' }}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Food</h3>
      <p style={{ color: '#BCCBB9' }}>No restaurant recommendations available.</p>
    </section>
  )

  return (
    <section style={{ marginBottom: '3rem' }}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#E5E2E1' }}>Food</h3>
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '1.5rem',
          scrollSnapType: 'x mandatory',
        }}
      >
        {restaurants.map((r, i) => (
          <div
            key={i}
            style={{
              width: '320px',
              backgroundColor: '#141414', // Matches ConcertCard background
              border: '2px solid rgba(71,69,84,0.2)', // Matches ConcertCard border
              borderRadius: '0.75rem',
              padding: '1.5rem', // Consistent padding with ConcertCard
              scrollSnapAlign: 'start',
              flexShrink: 0,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Status Badge (Top Right) */}
            <div
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                backgroundColor: r.open_now ? 'rgba(29,185,84,0.15)' : 'rgba(71,69,84,0.3)',
                color: r.open_now ? '#1DB954' : '#BCCBB9',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {r.open_now ? 'Open now' : 'Closed'}
            </div>

            {/* Header: Type + Name */}
            <div style={{ marginBottom: '1rem', paddingRight: '5rem' }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#1DB954', marginBottom: '0.25rem',
              }}>
                {r.type || 'Restaurant'}
              </p>
              <h4 style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem',
                fontWeight: 700, lineHeight: 1.2, color: '#E5E2E1', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {r.name}
              </h4>
            </div>

            {/* Details: Price + Rating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#BCCBB9', fontSize: '0.875rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>payments</span>
                <span>Price: {r.price || 'N/A'}</span>
              </div>

              {r.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffb965', fontSize: '0.875rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span style={{ fontWeight: 700 }}>{r.rating} / 5.0</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#BCCBB9', fontSize: '0.875rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>location_on</span>
                <span>{r.address || ''}</span>
              </div>
            </div>
            {/* Footer: Action Link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {r.google_maps_url && (
                <a
                  href={r.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', // Keeps it tight to the content
                    alignItems: 'center',
                    gap: '0.4rem', 
                    textDecoration: 'none', 
                    color: '#BCCBB9', 
                    fontSize: '0.75rem',
                    borderBottom: '1px solid transparent', // The "invisible" line
                    paddingBottom: '2px', // Space between text and line
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#F8FAFC';
                    e.currentTarget.style.borderBottomColor = '#F8FAFC'; // Animates the line in
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#BCCBB9';
                    e.currentTarget.style.borderBottomColor = 'transparent'; // Hides the line
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>near_me</span>
                  <span>Directions</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Refinement Bar ────────────────────────────────────────────────────────────
// function RefinementBar({ onRefine }) {
//   const [input, setInput] = useState('')
//   const suggestions = ['Find a vegetarian restaurant', 'Show a different concert', 'Cheaper transport option']

//   const handleSend = () => {
//     if (!input.trim()) return
//     onRefine(input)
//     setInput('')
//   }

//   return (
//     <section style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 1rem', borderTop: '1px solid rgba(71,69,84,0.15)' }}>
//       <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
//         {suggestions.map(s => (
//           <button
//             key={s}
//             onClick={() => setInput(s)}
//             style={{
//               whiteSpace: 'nowrap',
//               padding: '0.5rem 1rem',
//               borderRadius: '9999px',
//               backgroundColor: '#201f27',
//               fontSize: '0.75rem',
//               fontWeight: 500,
//               border: '1px solid rgba(71,69,84,0.3)',
//               color: '#E5E2E1',
//               cursor: 'pointer',
//               transition: 'background-color 0.2s',
//             }}
//             onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#35343c')}
//             onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#201f27')}
//           >
//             {s}
//           </button>
//         ))}
//       </div>
//       <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
//         <input
//           type="text"
//           value={input}
//           onChange={e => setInput(e.target.value)}
//           onKeyDown={e => e.key === 'Enter' && handleSend()}
//           placeholder="Ask me to refine your plan..."
//           style={{
//             width: '100%',
//             backgroundColor: '#2a2931',
//             border: 'none',
//             borderRadius: '9999px',
//             padding: '1rem 4rem 1rem 1.5rem',
//             color: '#E5E2E1',
//             fontSize: '1rem',
//             outline: 'none',
//             boxSizing: 'border-box',
//           }}
//         />
//         <button
//           onClick={handleSend}
//           style={{
//             position: 'absolute',
//             right: '0.5rem',
//             padding: '0.625rem',
//             backgroundColor: '#1DB954',
//             color: '#000',
//             borderRadius: '9999px',
//             border: 'none',
//             cursor: 'pointer',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             transition: 'transform 0.2s',
//           }}
//           onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
//           onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
//         >
//           <span className="material-symbols-outlined">send</span>
//         </button>
//       </div>
//     </section>
//   )
// }

// ── Empty Card ────────────────────────────────────────────────────────────────
function EmptyCard({ title, icon, message }) {
  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '200px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#474554' }}>{icon}</span>
      <p style={{ color: '#474554', fontSize: '0.875rem', textAlign: 'center' }}>{message}</p>
    </div>
  )
}

// ── Loading Steps ─────────────────────────────────────────────────────────────
const LOADING_STEPS = [
  'Reading your Spotify artists...',
  'Finding upcoming concerts in Chicago...',
  'Getting directions to the venue...',
  'Finding restaurants nearby...',
  'Estimating costs...',
  'Writing your personalized plan...',
]

// ── Main Component ────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(0)

  const hasFetched = useRef(false);

  useEffect(() => {
    const token = sessionStorage.getItem('nop_access_token')
    const prefs = JSON.parse(sessionStorage.getItem('nop_preferences') || '{}')

    if (!token) {
      navigate('/')
      return
    }

    // Animate loading steps while API call runs
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1
        clearInterval(stepInterval)
        return prev
      })
    }, 900)

    const fetchPlan = async () => {


      try {
        const selectedConcert = JSON.parse(sessionStorage.getItem('nop_selected_concert') || 'null')

        const res = await apiClient.post(`/api/plan`, null, {
          params: {
            access_token: token,
            city: prefs.city || 'Chicago',
            origin: prefs.origin || 'Chicago Union Station, 225 S Canal St, Chicago, IL 60606',
            cuisine_preference: prefs.cuisines?.join(',') || 'Any',
            budget: prefs.budget || '$$',


            selected_venue_name: selectedConcert?.venue_name || '',
            selected_venue_address: selectedConcert?.venue_address || '',
            selected_venue_lat: selectedConcert?.venue_lat || '',
            selected_venue_lng: selectedConcert?.venue_lng || '',
          },
        })
        setPlan(res.data)
      } catch (err) {
        setError('Something went wrong fetching your plan. Please try again.')
        console.error(err)
      } finally {
        clearInterval(stepInterval)
        setLoading(false)
      }
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPlan();
    }

    return () => {
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [navigate]) // Added navigate for safety, though [] works too

  const handleRefine = (prompt) => {
    // Placeholder — wired up properly in Module 10
    console.log('Refine request:', prompt)
    alert(`Refinement coming in Module 10: "${prompt}"`)
  }

  if (loading) return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#E5E2E1', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <LoadingState steps={LOADING_STEPS} currentStep={currentStep} />
    </div>
  )

  if (error) return (
    <div style={{ backgroundColor: '#0e0d15', color: '#E5E2E1', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#ff767b', marginBottom: '1rem', display: 'block' }}>error</span>
        <p style={{ color: '#BCCBB9', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => navigate('/preferences')} style={{ backgroundColor: '#1DB954', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '9999px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    </div>
  )

  const selectedConcertData = JSON.parse(sessionStorage.getItem('nop_selected_concert') || '{}');

  const selectedVenue = selectedConcertData.venue_name;

  const topConcert = plan.concerts?.find(c =>
    c.venue_name.toLowerCase().includes(selectedVenue?.toLowerCase())
  ) || plan.concerts?.[0]

  // const topConcert = plan?.concerts?.[0]
  // const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    // Use 'UTC' to prevent the date from shifting back a day due to local timezone offsets
    const date = new Date(dateString + 'T00:00:00'); 
    
    return date.toLocaleDateString('en-US', {
      month: 'long', // "May" (use 'short' for "May.")
      day: 'numeric', // "25"
    });
  };
  
  return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#E5E2E1', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <main style={{ marginTop: '5rem', padding: '2rem 3rem', maxWidth: '80rem', margin: '5rem auto 0' }}>

        {/* Page header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
            Your Night Out Plan
          </h1>
          <p style={{ color: '#BCCBB9', fontSize: '1.25rem' }}>
          <span>Planned for Chicago • {formatDate(selectedConcertData.date)}</span>
          </p>
        </header>

        {/* Section 1 — AI Summary */}
        {plan?.summary && (
          <section style={{ marginBottom: '3rem' }}>
            <div
              style={{
                backgroundColor: '#141414',
                borderLeft: '4px solid #c8bfff',
                borderRadius: '0.75rem',
                padding: '2rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.07, pointerEvents: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '8rem' }}>auto_awesome</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#c8bfff' }}>auto_awesome</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c8bfff' }}>
                  Your personalized plan
                </span>
              </div>
              <div style={{ maxWidth: '56rem', color: '#E5E2E1', lineHeight: 1.7 }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>{children}</h2>
                    ),
                    p: ({ children }) => (
                      <p style={{ marginBottom: '1rem', color: '#BCCBB9', lineHeight: 1.7 }}>{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: '#E5E2E1', fontWeight: 600 }}>{children}</strong>
                    ),
                  }}
                >
                  {plan.summary}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* Section 2 — Three column grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          <ConcertCard concert={topConcert} />
          <DirectionsCard directions={plan?.directions} />
          <CostCard costEstimate={plan?.cost_estimate} />
        </section>

        {/* Section 3 — Restaurants */}
        <RestaurantSection restaurants={plan?.restaurants} />

        {/* Section 4 — Refinement */}
        {/* <RefinementBar onRefine={handleRefine} /> */}

        {/* Errors / warnings */}
        {plan?.errors?.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#201f27', borderRadius: '0.5rem', border: '1px solid rgba(255,118,123,0.2)' }}>
            <p style={{ fontSize: '0.75rem', color: '#BCCBB9', marginBottom: '0.5rem', fontWeight: 600 }}>Some data was unavailable:</p>
            {plan.errors.map((e, i) => (
              <p key={i} style={{ fontSize: '0.75rem', color: '#474554' }}>• {e}</p>
            ))}
          </div>
        )}
      </main>

    </div>
  )
}
// ── Shared style ──────────────────────────────────────────────────────────────
const cardStyle = {
  backgroundColor: '#141414',
  borderRadius: '0.75rem',
  padding: '1.5rem',
  border: '1px solid rgba(71,69,84,0.15)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}
