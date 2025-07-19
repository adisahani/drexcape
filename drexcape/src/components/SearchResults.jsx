import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import drexcapeLogo from '../assets/drexcape-logo.png';
import ReactMarkdown from 'react-markdown';

function GooeyCursor() {
  const containerRef = useRef(null);
  const blobRefs = [useRef(null), useRef(null), useRef(null)];
  const [mouse, setMouse] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const positions = [useRef({ x: mouse.x, y: mouse.y }), useRef({ x: mouse.x, y: mouse.y }), useRef({ x: mouse.x, y: mouse.y })];
  const lags = [0.18, 0.12, 0.08];

  useEffect(() => {
    const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    let running = true;
    function animate() {
      positions.forEach((pos, i) => {
        pos.current.x += (mouse.x - pos.current.x) * lags[i];
        pos.current.y += (mouse.y - pos.current.y) * lags[i];
        if (blobRefs[i].current) {
          blobRefs[i].current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`;
        }
      });
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
      window.removeEventListener('mousemove', handleMove);
    };
  }, [mouse.x, mouse.y]);

  return (
    <>
      <svg width="0" height="0">
        <filter id="gooey-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix in="blur" mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>
      <div
        ref={containerRef}
        className="gooey-cursor-container"
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99999, filter: 'url(#gooey-effect)' }}
      >
        <div ref={blobRefs[0]} className="gooey-blob blob-main" />
        <div ref={blobRefs[1]} className="gooey-blob blob-side1" />
        <div ref={blobRefs[2]} className="gooey-blob blob-side2" />
      </div>
    </>
  );
}

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const [from] = useState(state.from || '');
  const [to] = useState(state.to || '');
  const [travellers] = useState(state.travellers || 1);
  const [travelClass] = useState(state.travelClass || 'Economy');
  const [startDate] = useState(state.startDate || '');
  const [endDate] = useState(state.endDate || '');

  const [itinerary, setItinerary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiItineraries, setAiItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [imageUrls, setImageUrls] = useState({}); // { idx: url }
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsError, setDetailsError] = useState('');

  // Fetch image for a place (Pixabay proxy)
  const fetchImage = async (place, destination, idx) => {
    if (!place && !destination) return;
    try {
      const res = await fetch(`/api/place-image?place=${encodeURIComponent(place || '')}&destination=${encodeURIComponent(destination || '')}`);
      const data = await res.json();
      setImageUrls(prev => ({ ...prev, [idx]: data.imageUrl || '/default-travel.jpg' }));
    } catch {
      setImageUrls(prev => ({ ...prev, [idx]: '/default-travel.jpg' }));
    }
  };

  // When aiItineraries change, fetch images for each
  useEffect(() => {
    aiItineraries.forEach((item, idx) => {
      const place = item.placesToVisit?.[0] || '';
      const destination = item.destinations?.[0] || '';
      if (!imageUrls[idx]) fetchImage(place, destination, idx);
    });
    // eslint-disable-next-line
  }, [aiItineraries]);

  // Fetch full details for a package
  const handleViewDetails = async (idx) => {
    setSelectedItinerary(idx);
    setDetailsLoading(true);
    setDetailsError('');
    setDetailsData(null);
    const summary = aiItineraries[idx];
    try {
      const res = await fetch('/api/itinerary-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });
      const data = await res.json();
      if (data.details) {
        setDetailsData(data.details);
      } else {
        setDetailsError('No details found.');
      }
    } catch {
      setDetailsError('Failed to fetch details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (!from || !to) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError('');
    setItinerary('');
    setAiItineraries([]);
    fetch('http://localhost:3001/api/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        departureDate: startDate,
        returnDate: endDate,
        travellers,
        travelClass,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.itineraries && Array.isArray(data.itineraries)) {
          setAiItineraries(data.itineraries);
        } else {
          setItinerary('No itinerary generated.');
        }
      })
      .catch(() => setError('Failed to generate itinerary. Please try again.'))
      .finally(() => setLoading(false));
  }, [from, to, travellers, travelClass, startDate, endDate, navigate]);

  return (
    <div className="app">
      <GooeyCursor />
      <div className="spotlight"></div>
      <div className="background-gradient">
        <canvas id="star-canvas" className="star-canvas"></canvas>
        <svg className="liquid-blob blob1" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="180" ry="120" fill="#2a0140" fillOpacity="0.55"/></svg>
        <svg className="liquid-blob blob2" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="140" ry="100" fill="#6d3bbd" fillOpacity="0.32"/></svg>
        <svg className="liquid-blob blob3" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="120" ry="160" fill="#a084e8" fillOpacity="0.18"/></svg>
        <svg className="liquid-blob blob4" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="100" ry="80" fill="#3a006a" fillOpacity="0.22"/></svg>
      </div>
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <img src={drexcapeLogo} alt="Drexcape" className="logo" />
          </div>
          <nav className="nav">
            <a href="/" className="nav-link">Home</a>
            <a href="#destinations" className="nav-link">Destinations</a>
            <a href="#categories" className="nav-link">Categories</a>
            <a href="#offers" className="nav-link">Offers</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>
        </div>
      </header>
      <main style={{ paddingTop: 120 }}>
        <div style={{ maxWidth: 800, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 16, color: '#222', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)' }}>
          <h2>Search Results</h2>
          <div style={{ marginBottom: 24 }}>
            <strong>From:</strong> {from} <br />
            <strong>To:</strong> {to} <br />
            <strong>Travellers:</strong> {travellers} <br />
            <strong>Class:</strong> {travelClass} <br />
            <strong>Departure:</strong> {startDate} <br />
            <strong>Return:</strong> {endDate}
          </div>
          <h3>AI-Generated Itinerary</h3>
          {loading && <div>Generating itinerary...</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {/* Render itinerary cards if available */}
          {aiItineraries.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
              {aiItineraries.map((item, idx) => (
                <div key={idx} style={{
                  flex: '1 1 320px',
                  minWidth: 320,
                  maxWidth: 380,
                  background: '#fff',
                  borderRadius: 18,
                  boxShadow: '0 4px 24px 0 #a084e822',
                  padding: 0,
                  marginBottom: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  border: '1.5px solid #ece6fa',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* Card Image */}
                  <img
                    src={imageUrls[idx] || '/default-travel.jpg'}
                    alt={item.placesToVisit?.[0] || item.destinations?.[0] || 'Travel'}
                    style={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      borderBottom: '1.5px solid #ece6fa',
                    }}
                    onError={e => { e.target.onerror = null; e.target.src = '/default-travel.jpg'; }}
                  />
                  {/* Card Header */}
                  <div style={{
                    background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
                    color: '#fff',
                    padding: '18px 20px 10px 20px',
                    fontWeight: 800,
                    fontSize: '1.18rem',
                    letterSpacing: '0.5px',
                    borderBottom: '1.5px solid #ece6fa',
                    fontFamily: 'Orbitron, Rajdhani, sans-serif',
                  }}>{item.packageName}</div>
                  {/* Card Body */}
                  <div style={{ padding: '18px 20px 10px 20px', flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', marginBottom: 6, color: '#6d3bbd', fontWeight: 700 }}>
                      <span style={{ marginRight: 12 }}>Duration: <span style={{ color: '#222', fontWeight: 600 }}>{item.days} Days</span></span>
                      <span>Destinations: <span style={{ color: '#222', fontWeight: 600 }}>{item.destinations?.join(', ') || 'N/A'}</span></span>
                    </div>
                    {/* Places to Visit */}
                    {item.placesToVisit && item.placesToVisit.length > 0 && (
                      <div style={{ margin: '8px 0 8px 0' }}>
                        <div style={{ fontSize: '1.01rem', color: '#a084e8', fontWeight: 700, marginBottom: 2 }}>Places to Visit:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {item.placesToVisit.map((place, i) => (
                            <span key={i} style={{
                              background: 'linear-gradient(90deg, #f5e6ff 0%, #ece6fa 100%)',
                              color: '#6d3bbd',
                              borderRadius: 8,
                              padding: '3px 10px',
                              fontSize: '0.97rem',
                              fontWeight: 600,
                              marginBottom: 2,
                            }}>{place}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: '1.01rem', marginBottom: 8, color: '#a084e8', fontWeight: 700 }}>Tour Highlights:</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#222', fontSize: '0.98rem', fontWeight: 500 }}>
                      {item.highlights?.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  {/* Card Footer */}
                  <div style={{
                    padding: '12px 20px 18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1.5px solid #ece6fa',
                    background: '#fafafd',
                  }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#a084e8' }}>₹{item.price?.toLocaleString()}</div>
                    <button
                      style={{
                        background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 22px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        fontFamily: 'Rajdhani, Orbitron, sans-serif',
                        boxShadow: '0 2px 8px #a084e822',
                        transition: 'background 0.2s, transform 0.2s',
                      }}
                      onClick={() => handleViewDetails(idx)}
                      onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #6d3bbd 0%, #a084e8 100%)'}
                      onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)'}
                    >
                      View Tour Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            itinerary && <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, color: '#222' }}>{itinerary}</pre>
          )}
          {/* Modal for details */}
          {selectedItinerary !== null && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setSelectedItinerary(null); setDetailsData(null); }}>
              <div style={{ background: '#fff', color: '#222', borderRadius: 14, maxWidth: 700, width: '95vw', padding: 32, boxShadow: '0 8px 32px #a084e888', position: 'relative', minHeight: 320 }} onClick={e => e.stopPropagation()}>
                <button style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#a084e8' }} onClick={() => { setSelectedItinerary(null); setDetailsData(null); }}>&times;</button>
                {detailsLoading && <div style={{ fontSize: 18, color: '#a084e8', textAlign: 'center', marginTop: 40 }}>Loading details...</div>}
                {detailsError && <div style={{ color: 'red', marginTop: 24 }}>{detailsError}</div>}
                {detailsData && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 12, color: '#6d3bbd' }}>{detailsData.title}</div>
                    
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: '1.05rem' }}>
                      <div><b>📅 Dates:</b> {detailsData.dates || 'N/A'}</div>
                      <div><b>⏱️ Duration:</b> {detailsData.duration || 'N/A'}</div>
                      <div><b>🛫 From:</b> {detailsData.from || 'N/A'}</div>
                      <div><b>🛬 To:</b> {detailsData.to || 'N/A'}</div>
                      <div><b>💰 Price:</b> {detailsData.priceEstimate || 'N/A'}</div>
                      <div><b>✈️ Class:</b> {detailsData.transportClass || 'N/A'}</div>
                    </div>

                    {/* Highlights */}
                    {detailsData.highlights && Array.isArray(detailsData.highlights) && detailsData.highlights.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, color: '#a084e8', fontSize: '1.1rem', marginBottom: 8 }}>🌟 Tour Highlights:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {detailsData.highlights.map((highlight, i) => (
                            <span key={i} style={{
                              background: 'linear-gradient(90deg, #f5e6ff 0%, #ece6fa 100%)',
                              color: '#6d3bbd',
                              borderRadius: 8,
                              padding: '4px 12px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                            }}>{highlight}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Day-wise Plan */}
                    {detailsData.fullDayWisePlan && Array.isArray(detailsData.fullDayWisePlan) && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, color: '#a084e8', fontSize: '1.1rem', marginBottom: 12 }}>📋 Complete Day-wise Plan:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {detailsData.fullDayWisePlan.map((day, i) => (
                            <div key={i} style={{
                              background: '#fafafd',
                              borderRadius: 8,
                              padding: 12,
                              border: '1px solid #ece6fa'
                            }}>
                              <div style={{ fontWeight: 700, color: '#6d3bbd', marginBottom: 4 }}>
                                {day.emoji} {day.title}
                              </div>
                              <div style={{ color: '#222', fontSize: '0.95rem' }}>{day.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practical Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      {detailsData.accommodation && (
                        <div style={{ background: '#f5e6ff', padding: 12, borderRadius: 8, border: '1px solid #ece6fa' }}>
                          <div style={{ fontWeight: 700, color: '#6d3bbd', marginBottom: 4 }}>🏨 Accommodation</div>
                          <div style={{ fontSize: '0.95rem', color: '#222' }}>{detailsData.accommodation}</div>
                        </div>
                      )}
                      {detailsData.transportDetails && (
                        <div style={{ background: '#f5e6ff', padding: 12, borderRadius: 8, border: '1px solid #ece6fa' }}>
                          <div style={{ fontWeight: 700, color: '#6d3bbd', marginBottom: 4 }}>✈️ Transport</div>
                          <div style={{ fontSize: '0.95rem', color: '#222' }}>{detailsData.transportDetails}</div>
                        </div>
                      )}
                      {detailsData.activitiesIncluded && (
                        <div style={{ background: '#f5e6ff', padding: 12, borderRadius: 8, border: '1px solid #ece6fa' }}>
                          <div style={{ fontWeight: 700, color: '#6d3bbd', marginBottom: 4 }}>🎟️ Activities Included</div>
                          <div style={{ fontSize: '0.95rem', color: '#222' }}>{detailsData.activitiesIncluded}</div>
                        </div>
                      )}
                      {detailsData.meals && (
                        <div style={{ background: '#f5e6ff', padding: 12, borderRadius: 8, border: '1px solid #ece6fa' }}>
                          <div style={{ fontWeight: 700, color: '#6d3bbd', marginBottom: 4 }}>🍽️ Meals</div>
                          <div style={{ fontSize: '0.95rem', color: '#222' }}>{detailsData.meals}</div>
                        </div>
                      )}
                    </div>

                    {/* Terms */}
                    {detailsData.terms && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, color: '#a084e8', marginBottom: 4 }}>✅ Terms & Conditions</div>
                        <div style={{ fontSize: '0.95rem', color: '#222', background: '#fafafd', padding: 8, borderRadius: 6 }}>{detailsData.terms}</div>
                      </div>
                    )}

                    {/* Booking CTA */}
                    {detailsData.bookingLink && (
                      <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <a href={detailsData.bookingLink} target="_blank" rel="noopener noreferrer" style={{
                          color: '#fff',
                          background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
                          padding: '12px 24px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          display: 'inline-block',
                          boxShadow: '0 4px 12px #a084e844'
                        }}>📞 Contact Us to Book Now!</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults; 