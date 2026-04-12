import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Tailwind is loaded via CDN in index.html — see setup notes below
export default function LandingPage() {
  const navigate = useNavigate()

  const handleSpotifyLogin = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/login`)
      const data = await res.json()
      // Redirect to Spotify OAuth
      window.location.href = data.auth_url
    } catch (err) {
      console.error('Failed to get Spotify auth URL', err)
    }
  }
  const isMobile = window.innerWidth < 768;

  return (
    <div
      className="bg-background selection:bg-primary selection:text-on-primary"
      style={{ backgroundColor: '#131313', color: '#E5E2E1', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}
    >


      {/* ── Hero Section ── */}
      <header
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '5rem',
          backgroundColor: '#0a0a0a',
          //   backgroundImage: `
          //     radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          //     radial-gradient(circle at 0% 0%, rgba(29, 185, 84, 0.05) 0%, transparent 40%)`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Grain overlay */}
        {/* <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            opacity: 0.03,
            pointerEvents: 'none',
          }}
        /> */}

        {/* Headline block */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '64rem', padding: '0 1.5rem', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 200,
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              color: '#E5E2E1',
              marginBottom: '1.5rem',
            }}
          >
            Your perfect night out,
            <br />
            <span style={{ color: '#888D96' }}>planned by AI.</span>
          </h1>
          <p
            style={{
              maxWidth: '42rem',
              margin: '0 auto',
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: '#BCCBB9',
              lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Connect Spotify. Discover concerts. Get directions, dinner recommendations, and a cost estimate — instantly.
          </p>

          {/* CTA */}
          <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleSpotifyLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#1db954',
                color: '#003914',
                fontWeight: 700,
                padding: '1.25rem 2.5rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(29,185,84,0.2)',
                transition: 'box-shadow 0.7s ease',
                fontSize: '1rem',
                transform: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(29,185,84,0.6)'; // Intense glow
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 10px rgba(29,185,84,0.2)';
              }}
            >
              {/* Spotify SVG icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#003914" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 11-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257C14.1 12.26 10.539 11.88 7.2 12.863a.78.78 0 11-.453-1.492c3.773-1.146 7.768-.707 10.805 1.258a.78.78 0 01.257 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.794c3.527-1.07 9.393-.863 13.1 1.306a.937.937 0 01-.94 1.645z" />
              </svg>
              <span>Connect with Spotify</span>
            </button>
            <p
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: 'rgba(188,203,185,0.6)',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
              }}
            >
              We only read your followed artists. Nothing is stored.
            </p>
          </div>
        </div>

        {/* Floating preview cards */}

        <div
          style={{
            marginTop: isMobile ? '2rem' : '5rem',
            width: '100%',
            maxWidth: '72rem',
            padding: '0 1rem',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem',
            // transform: 'rotate(1deg) translateY(3rem)',
          }}
        >
          {[
            {
              badge: 'Dinner',
              badgeColor: '#00D1FF',
              icon: 'restaurant',
              iconColor: '#00D1FF',
              title: 'Dinner Recommendataions',
              desc: 'Get dinner recommendations for the post-concert high.',
            },
            {
              badge: 'Concert',
              badgeColor: '#A78BFA',
              icon: 'music_note',
              iconColor: '#A78BFA',
              title: 'Explore Upcoming Concerts',
              desc: 'Explore upcoming concerts based on your music taste.',
              offset: true,
            },
            {
              badge: 'Transport',
              badgeColor: '#F471B5',
              icon: 'directions_car',
              iconColor: '#F471B5',
              title: 'How do I get there?',
              desc: 'Find out how to beat the concert rush.',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                backgroundColor: '#2a2a2a',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
                transform: (card.offset && !isMobile) ? 'translateY(-1.5rem)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span
                  style={{
                    backgroundColor: `${card.badgeColor}22`,
                    color: card.badgeColor,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {card.badge}
                </span>
                <span className="material-symbols-outlined" style={{ color: card.iconColor }}>
                  {card.icon}
                </span>
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                {card.title}
              </h3>
              <p style={{ color: '#BCCBB9', fontSize: '0.875rem', lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </header>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        style={{ padding: '8rem 2rem', backgroundColor: '#0e0e0e', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '5rem',
              gap: '2rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '3rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '1rem' }}>
                The Blueprint.
              </h2>
              <p style={{ color: '#BCCBB9', maxWidth: '28rem', lineHeight: 1.6 }}>
                We handle the coordination, you handle the memories. Our algorithm bridges the gap between your music taste and the city's pulse.
              </p>
            </div>
            <div style={{ color: '#BCCBB9', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              01 — 04 Steps
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { icon: 'music_note', color: '#A78BFA', step: '01', title: 'Connect Spotify', desc: 'We sync with your library to understand the soundscapes you love.' },
              { icon: 'tune', color: '#E2E8F0', step: '02', title: 'Set Preferences', desc: 'Define your budget, vibe, and cuisine with a few simple choices.' },
              { icon: 'auto_awesome', color: '#F471B5', step: '03', title: 'AI Plans Your Night', desc: 'Our curator generates a full itinerary including venues and costs.' },
              { icon: 'confirmation_number', color: '#00D1FF', step: '04', title: 'Go Have Fun', desc: 'Everything is planned. Just follow the app and enjoy the night.' },
            ].map((step) => (
              <div
                key={step.step}
                style={{
                  backgroundColor: '#2a2a2a',
                  padding: '2rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '280px',
                  transition: 'background-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3939')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
              >
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: step.color }}>
                    {step.icon}
                  </span>
                </div>
                <div>
                  <p style={{ color: '#BCCBB9', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    {step.step}
                  </p>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.75rem', lineHeight: 1 }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#BCCBB9', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            right: '-5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.04,
            pointerEvents: 'none',
            fontSize: '38rem',
            fontWeight: 900,
            lineHeight: 1,
            userSelect: 'none',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          SONIC
        </div>
      </section>

      {/* ── Curator Advantage ── */}
      <section style={{ padding: '8rem 2rem', backgroundColor: '#131313' }}>
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              The Curator Advantage
            </span>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, lineHeight: 1.1 }}>
              Beyond just a search bar.
            </h2>
            <p style={{ color: '#BCCBB9', fontSize: '1.125rem', lineHeight: 1.7 }}>
              Standard apps give you lists. We give you stories. Each "Night Out" itinerary is weighted by travel logistics, venue quality, and real-time data.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { title: 'Artist-Driven Concerts', desc: 'We surface shows from artists you actually follow on Spotify — not generic charts.' },
                { title: 'Smart Budgeting', desc: 'Total cost estimates including ticket prices, transport, and dinner averages.' },
              ].map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ color: '#53E076', paddingTop: '2px' }}>
                    check_circle
                  </span>
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                      {item.title}
                    </h4>
                    <p style={{ color: '#BCCBB9', fontSize: '0.875rem' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image card */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                aspectRatio: '1',
                backgroundColor: '#2a2a2a',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '8rem', color: '#53E076', opacity: 0.3 }}>
                  music_note
                </span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '2rem',
                }}
              >
                <div>
                  <p style={{ color: '#53E076', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>BASED ON YOUR TASTE</p>
                  {/* <h3 style={{ fontSize: '1.5rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#fff' }}>
                    Chicago, Tonight
                  </h3> */}
                  <p style={{ color: '#BCCBB9', fontSize: '0.875rem' }}>Curated from your followed artists</p>
                </div>
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-1.5rem',
                right: '-1.5rem',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(83,224,118,0.08)',
                borderRadius: '1rem',
                zIndex: 0,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
