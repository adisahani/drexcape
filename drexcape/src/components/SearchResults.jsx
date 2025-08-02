import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import drexcapeLogo from '../assets/drexcape-logo.png';
import ReactMarkdown from 'react-markdown';
import { Typography, Button } from '@mui/material'; // Added Typography and Button imports

function GooeyCursor() {
  const containerRef = useRef(null);
  const blobRefs = [useRef(null), useRef(null), useRef(null)];
  const [mouse, setMouse] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const positions = [useRef({ x: mouse.x, y: mouse.y }), useRef({ x: mouse.x, y: mouse.y }), useRef({ x: mouse.x, y: mouse.y })];
  const lags = [0.18, 0.12, 0.08];

  useEffect(() => {
    // Detect touch device - only mobile/tablet, not desktop with touch
    const checkTouchDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      return isMobile && hasTouch;
    };
    
    const isTouch = checkTouchDevice();
    setIsTouchDevice(isTouch);
    
    // Only add mouse event listener if not a touch device
    if (!isTouch) {
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
    }
  }, [mouse.x, mouse.y]);

  // Don't render anything on touch devices

  if (isTouchDevice) {
  
    return null;
  }


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
  
  // Get search parameters from state or localStorage
  const getSearchParams = () => {
    // Handle both Date objects and formatted strings
    const getDateValue = (date) => {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      return date || '';
    };
    
    return {
      from: state.from || '',
      to: state.to || '',
      travellers: state.travellers || 1,
      travelClass: state.travelClass || 'Economy',
      startDate: getDateValue(state.startDate || state.departureDate),
      endDate: getDateValue(state.endDate || state.returnDate)
    };
  };

  const [from] = useState(getSearchParams().from);
  const [to] = useState(getSearchParams().to);
  const [travellers] = useState(getSearchParams().travellers);
  const [travelClass] = useState(getSearchParams().travelClass);
  const [startDate] = useState(getSearchParams().startDate);
  const [endDate] = useState(getSearchParams().endDate);

  const [itinerary, setItinerary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiItineraries, setAiItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [imageUrls, setImageUrls] = useState({}); // { idx: url }
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const [itinerarySlug, setItinerarySlug] = useState(null); // New state for itinerary slug
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(2000); // Start with 2 seconds
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // No localStorage saving - always use fresh parameters

  // Generate itineraries when parameters change
  useEffect(() => {
    if (!from || !to) {
      navigate('/');
      return;
    }
    
    setLoading(true);
    setError('');
    setItinerary('');
    setAiItineraries([]);
    setItinerarySlug(null); // Reset slug on new search
    
    const generateItinerary = async () => {
      try {
        // Convert dates to proper format for the API
        const formatDateForAPI = (date) => {
          if (date instanceof Date) {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
          if (typeof date === 'string') {
            // If it's already a formatted string, try to parse it
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }
          }
          return date; // Fallback
        };

        const response = await fetch('/api/generate-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to,
            departureDate: formatDateForAPI(startDate),
            returnDate: formatDateForAPI(endDate),
            travellers,
            travelClass,
          }),
        });
        
        const data = await response.json();
        
        // Check for 503 model overload error
        if (data.error && data.error.code === 503) {
          setError(`AI model is temporarily overloaded. Retrying in ${retryDelay/1000} seconds... (Attempt ${retryCount + 1}/3)`);
          
          if (retryCount < 2) { // Max 3 attempts
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setRetryDelay(prev => prev * 2); // Exponential backoff
              generateItinerary(); // Retry
            }, retryDelay);
            return;
          } else {
            setError('AI model is currently overloaded. Please try again in a few minutes.');
            setLoading(false);
            return;
          }
        }
        
        // Handle other errors
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
        }
        
        if (data.itineraries && Array.isArray(data.itineraries)) {
          setAiItineraries(data.itineraries);
          // Store the first itinerary slug if available
          if (data.itineraries.length > 0 && data.itineraries[0].slug) {
            setItinerarySlug(data.itineraries[0].slug);
          }
          setError(''); // Clear any previous errors
          setRetryCount(0); // Reset retry count on success
          setRetryDelay(2000); // Reset delay
        } else {
          setItinerary('No itinerary generated.');
        }
      } catch (err) {
        console.error('Generation error:', err);
        setError(`Failed to generate itinerary: ${err.message}. Please try again.`);
      } finally {
        setLoading(false);
      }
    };
    
    generateItinerary();
  }, [from, to, travellers, travelClass, startDate, endDate, navigate, retryCount, retryDelay]);

  // Handle saved state when coming back from itinerary details
  useEffect(() => {
    if (location.state?.fromSaved && location.state?.searchResults) {
      try {
        const { itineraries, imageUrls: savedImageUrls } = location.state.searchResults;
        if (itineraries && itineraries.length > 0) {
          setAiItineraries(itineraries || []);
          setImageUrls(savedImageUrls || {});
          setResultsFromCache(true);
          setHasCachedResults(true);
        }
      } catch (error) {
        // Silent error handling
      }
    }
  }, [location.state]);

  // No localStorage saving - always generate fresh results

  // Fetch image for a place (Pixabay proxy)
  const fetchImage = async (place, destination, idx) => {
    if (!place && !destination) return;
    try {
      const res = await fetch(`/api/place-image?place=${encodeURIComponent(place || '')}&destination=${encodeURIComponent(destination || '')}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      // Use proxy for external images to avoid CORS issues
      const imageUrl = data.imageUrl ? `/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}` : '/default-travel.jpg';
      setImageUrls(prev => ({ ...prev, [idx]: imageUrl }));
    } catch (error) {
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



  // Navigate to individual itinerary page
  const handleViewDetails = (itinerary, index) => {
    if (itinerary.slug) {
      const stateData = {
        from,
        to,
        travellers,
        travelClass,
        startDate,
        endDate,
        itineraryId: itinerary.id,
        itineraryData: itinerary,
        imageUrl: itinerary.headerImage || imageUrls[index] || '/default-travel.jpg' // Use saved header image or Pixabay image
      };
      console.log('Navigating to itinerary with state:', stateData);
      console.log('Itinerary ID:', itinerary.id);
      console.log('Image URL:', itinerary.headerImage || imageUrls[index]);
      // Navigate to the individual itinerary page
      navigate(`/itinerary/${itinerary.slug}`, {
        state: stateData
      });
    }
  };

  const handleNewSearch = () => {
    setAiItineraries([]);
    setImageUrls({});
    // Navigate to homepage for new search
    navigate('/');
  };

  const handleRetry = () => {
    setRetryCount(0);
    setRetryDelay(2000);
    setError('');
    setLoading(true);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setError('');
    
    try {
      // Convert dates to proper format for the API
      const formatDateForAPI = (date) => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
        if (typeof date === 'string') {
          // If it's already a formatted string, try to parse it
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
        return date; // Fallback
      };

      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          departureDate: formatDateForAPI(startDate),
          returnDate: formatDateForAPI(endDate),
          travellers,
          travelClass,
        }),
      });
      
      const data = await response.json();
      
      // Check for 503 model overload error
      if (data.error && data.error.code === 503) {
        setError('AI model is temporarily overloaded. Please try again in a few minutes.');
        setIsLoadingMore(false);
        return;
      }
      
      // Handle other errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }
      
      if (data.itineraries && Array.isArray(data.itineraries)) {
        // Add new itineraries to existing ones
        setAiItineraries(prev => [...prev, ...data.itineraries]);
        setError(''); // Clear any previous errors
      } else {
        setError('No additional itineraries generated.');
      }
    } catch (err) {
      console.error('Load more error:', err);
      setError(`Failed to load more itineraries: ${err.message}. Please try again.`);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2>Search Results</h2>
            <Button
              onClick={handleNewSearch}
              sx={{
                background: 'linear-gradient(90deg, #6d3bbd 0%, #a084e8 100%)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
                }
              }}
            >
              🔍 New Search
            </Button>
          </div>
          <div style={{ marginBottom: 24 }}>
            <strong>From:</strong> {from} <br />
            <strong>To:</strong> {to} <br />
            <strong>Travellers:</strong> {travellers} <br />
            <strong>Class:</strong> {travelClass} <br />
            <strong>Departure:</strong> {startDate} <br />
            <strong>Return:</strong> {endDate}

          </div>
          <h3>AI-Generated Itinerary</h3>
          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              margin: '20px 0'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #a084e8',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '20px'
              }}></div>
              
              <Typography 
                variant="h5" 
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  color: '#2a0140',
                  mb: 2
                }}
              >
                ✈️ Crafting Your Perfect Journey
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{
                  color: '#666',
                  mb: 3,
                  maxWidth: '500px'
                }}
              >
                Our AI is analyzing {from} to {to} and creating {travellers} personalized {travelClass} travel packages just for you...
              </Typography>
              
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#a084e8',
                  animation: 'pulse 1.4s ease-in-out infinite both'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#6d3bbd',
                  animation: 'pulse 1.4s ease-in-out infinite both 0.2s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#a084e8',
                  animation: 'pulse 1.4s ease-in-out infinite both 0.4s'
                }}></div>
              </div>
              
              <Typography 
                variant="body2" 
                sx={{
                  color: '#888',
                  fontStyle: 'italic'
                }}
              >
                This usually takes 10-15 seconds...
              </Typography>
              
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                  40% { transform: scale(1); opacity: 1; }
                }
              `}</style>
            </div>
          )}
          
          {error && (
            <div style={{
              padding: '20px',
              background: 'rgba(255, 235, 235, 0.95)',
              borderRadius: 8,
              border: '1px solid #ffcdd2',
              color: '#d32f2f',
              textAlign: 'center',
              margin: '20px 0'
            }}>
              <Typography variant="h6" sx={{ mb: 1 }}>❌ Generation Failed</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{error}</Typography>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  onClick={handleRetry}
                  sx={{
                    background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #6d3bbd 0%, #a084e8 100%)',
                    }
                  }}
                >
                  🔄 Retry
                </Button>
                
                {error.includes('overloaded') && (
                  <Button
                    onClick={handleUseCachedResults}
                    sx={{
                      background: 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)',
                      color: '#fff',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #45a049 0%, #4caf50 100%)',
                      }
                    }}
                  >
                    📋 Use Cached Results
                  </Button>
                )}
              </div>
            </div>
          )}
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
                    src={item.headerImage || imageUrls[idx] || '/default-travel.jpg'}
                    alt={item.placesToVisit?.[0] || item.destinations?.[0] || 'Travel'}
                    style={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      borderBottom: '1.5px solid #ece6fa',
                    }}
                    onError={(e) => {
                      e.target.src = '/default-travel.jpg';
                    }}
                  />
                  {/* Card Content */}
                  <div style={{ padding: 24, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700, 
                        color: '#2a0140', 
                        margin: '0 0 8px 0',
                        fontFamily: 'Rajdhani, Orbitron, sans-serif'
                      }}>
                        {item.packageName}
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        marginBottom: 12,
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        <span>📅 {item.days} Days</span>
                        <span>📍 {item.destinations?.length || 0} Destinations</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 6, 
                        marginBottom: 16 
                      }}>
                        {item.highlights?.slice(0, 3).map((highlight, idx) => (
                          <span key={idx} style={{
                            background: '#f0e6ff',
                            color: '#6d3bbd',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: 'auto', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: '#fafafd',
                    }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#a084e8' }}>₹{item.price?.toLocaleString()}</div>
                      <button
                        style={{
                          background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          fontFamily: 'Rajdhani, Orbitron, sans-serif',
                          boxShadow: '0 2px 8px #a084e822',
                          transition: 'background 0.2s, transform 0.2s',
                        }}
                        onClick={() => handleViewDetails(item, idx)}
                        onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #6d3bbd 0%, #a084e8 100%)'}
                        onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)'}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            itinerary && <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, color: '#222' }}>{itinerary}</pre>
          )}
          
          {/* Load More Button */}
          {aiItineraries.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: 32,
              marginBottom: 24
            }}>
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                sx={{
                  background: 'linear-gradient(90deg, #6d3bbd 0%, #a084e8 100%)',
                  color: '#fff',
                  padding: '12px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: 12,
                  textTransform: 'none',
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  boxShadow: '0 4px 16px #a084e844',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px #a084e866',
                  },
                  '&:disabled': {
                    background: '#ccc',
                    transform: 'none',
                    boxShadow: 'none',
                  }
                }}
              >
                {isLoadingMore ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #fff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    Loading More...
                  </>
                ) : (
                  '🔄 Load More Variations'
                )}
              </Button>
            </div>
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