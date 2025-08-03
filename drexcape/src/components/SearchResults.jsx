import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import ReactMarkdown from 'react-markdown';
import { Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import PromotionalPopup from './PromotionalPopup';
import { hasUserFilledContactForm, resetPopupDismissal, getCookie } from '../utils/cookies';

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
    
    // First try to get from location state
    if (state.from && state.to) {
      return {
        from: state.from || '',
        to: state.to || '',
        travellers: state.travellers || 1,
        travelClass: state.travelClass || 'Economy',
        startDate: getDateValue(state.startDate || state.departureDate),
        endDate: getDateValue(state.endDate || state.returnDate)
      };
    }
    
    // Fallback to localStorage if no state
    const storedParams = localStorage.getItem('drexcape_search_params');
    if (storedParams) {
      try {
        const parsed = JSON.parse(storedParams);
        return {
          from: parsed.from || '',
          to: parsed.to || '',
          travellers: parsed.travellers || 1,
          travelClass: parsed.travelClass || 'Economy',
          startDate: getDateValue(parsed.startDate || parsed.departureDate),
          endDate: getDateValue(parsed.endDate || parsed.returnDate)
        };
      } catch (error) {
        console.error('Error parsing stored search params:', error);
      }
    }
    
    // Default fallback
    return {
      from: '',
      to: '',
      travellers: 1,
      travelClass: 'Economy',
      startDate: '',
      endDate: ''
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
  const [itinerarySlug, setItinerarySlug] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(2000);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pendingItinerary, setPendingItinerary] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);

  // Clean up localStorage after getting parameters
  useEffect(() => {
    const storedParams = localStorage.getItem('drexcape_search_params');
    if (storedParams) {
      localStorage.removeItem('drexcape_search_params');
    }
  }, []);

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
    setItinerarySlug(null);
    
    const generateItinerary = async () => {
      try {
        const formatDateForAPI = (date) => {
          if (date instanceof Date) {
            return date.toISOString().split('T')[0];
          }
          if (typeof date === 'string') {
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }
          }
          return date;
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
        
        if (data.error && data.error.code === 503) {
          setError(`AI model is temporarily overloaded. Retrying in ${retryDelay/1000} seconds... (Attempt ${retryCount + 1}/3)`);
          
          if (retryCount < 2) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setRetryDelay(prev => prev * 2);
              generateItinerary();
            }, retryDelay);
            return;
          } else {
            setError('AI model is currently overloaded. Please try again in a few minutes.');
            setLoading(false);
            return;
          }
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
        }
        
        if (data.itineraries && Array.isArray(data.itineraries)) {
          setAiItineraries(data.itineraries);
          if (data.itineraries.length > 0 && data.itineraries[0].slug) {
            setItinerarySlug(data.itineraries[0].slug);
          }
          setError('');
          setRetryCount(0);
          setRetryDelay(2000);
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

  // Fetch image for a place
  const fetchImage = async (place, destination, idx) => {
    if (!place && !destination) return;
    try {
      const res = await fetch(`/api/place-image?place=${encodeURIComponent(place || '')}&destination=${encodeURIComponent(destination || '')}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
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
  }, [aiItineraries]);

  // Navigate to individual itinerary page
  const handleViewDetails = async (itinerary, index) => {
    console.log('🔍 === handleViewDetails called ===');
    
    try {
      const hasAccess = await hasUserFilledContactForm();
      console.log('📋 hasUserFilledContactForm():', hasAccess);
      
      if (!hasAccess) {
        console.log('🔒 User has NOT filled contact form - showing popup');
        resetPopupDismissal();
        setPendingItinerary({ itinerary, index });
        setShowContactForm(true);
        return;
      }

      console.log('✅ User has filled contact form - navigating to details');
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
          imageUrl: itinerary.headerImage || imageUrls[index] || '/default-travel.jpg'
        };
        console.log('Navigating to itinerary with state:', stateData);
        navigate(`/itinerary/${itinerary.slug}`, {
          state: stateData
        });
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      resetPopupDismissal();
      setPendingItinerary({ itinerary, index });
      setShowContactForm(true);
    }
  };

  const handleNewSearch = () => {
    setAiItineraries([]);
    setImageUrls({});
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
      const formatDateForAPI = (date) => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        if (typeof date === 'string') {
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
        return date;
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
      
      if (data.error && data.error.code === 503) {
        setError('AI model is temporarily overloaded. Please try again in a few minutes.');
        setIsLoadingMore(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }
      
      if (data.itineraries && Array.isArray(data.itineraries)) {
        setAiItineraries(prev => [...prev, ...data.itineraries]);
        setError('');
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

  // Handle contact form submission and proceed with itinerary
  const handleContactFormSubmitted = () => {
    console.log('🎉 === handleContactFormSubmitted called ===');
    console.log('📋 pendingItinerary:', pendingItinerary);
    
    if (pendingItinerary) {
      const { itinerary, index } = pendingItinerary;
      console.log('✅ Processing pending itinerary:', { itinerary, index });
      setPendingItinerary(null);
      setShowContactForm(false);
      
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
          imageUrl: itinerary.headerImage || imageUrls[index] || '/default-travel.jpg'
        };
        
        console.log('🚀 Navigating to itinerary with state:', stateData);
        navigate(`/itinerary/${itinerary.slug}`, {
          state: stateData
        });
      }
    } else {
      console.log('❌ No pending itinerary found');
    }
  };

  const handleShowContactForm = () => {
    console.log('🎭 === SearchResults handleShowContactForm called ===');
    const existingUserData = getCookie('drexcape_user_data');
    
    if (existingUserData) {
      try {
        const userData = JSON.parse(existingUserData);
        console.log('👤 User profile found, skipping contact form:', userData);
        return;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    setShowContactForm(true);
  };

  const handleUseCachedResults = () => {
    console.log('Using cached results');
  };

  return (
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
                      {hasUserFilledContactForm() ? (
                        'Details'
                      ) : (
                        <>
                          <LockIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                          Details
                        </>
                      )}
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
      </div>

      {/* Contact Form Popup */}
      {showContactForm && (
        <>
          {console.log('🎭 === Rendering PromotionalPopup ===')}
          {console.log('📦 showContactForm:', showContactForm)}
          {console.log('📦 pendingItinerary:', pendingItinerary)}
          <PromotionalPopup 
            key={`popup-${Date.now()}`}
            onFormSubmitted={handleContactFormSubmitted}
            forceOpen={true}
          />
        </>
      )}
    </main>
  );
};

export default SearchResults; 