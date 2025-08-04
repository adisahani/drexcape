import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import ReactMarkdown from 'react-markdown';
import { Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import UserLogin from './UserLogin';
import PageWrapper from './PageWrapper';
import { hasUserFilledContactForm, resetPopupDismissal, getCookie } from '../utils/cookies';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

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
    
    // Check for restored state from back navigation
    if (state.fromSaved && state.searchParams) {
      return {
        from: state.searchParams.from || '',
        to: state.searchParams.to || '',
        travellers: state.searchParams.travellers || 1,
        travelClass: state.searchParams.travelClass || 'Economy',
        startDate: getDateValue(state.searchParams.startDate || state.searchParams.departureDate),
        endDate: getDateValue(state.searchParams.endDate || state.searchParams.returnDate)
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
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [userHasAccess, setUserHasAccess] = useState(false);
  
  // Get authentication state from context
  const { isUserLoggedIn, handleUserLogin } = useAuth();

  // Store search parameters for back navigation
  useEffect(() => {
    const searchParams = {
      from,
      to,
      travellers,
      travelClass,
      startDate,
      endDate
    };
    
    // Store current search parameters for back navigation
    localStorage.setItem('drexcape_search_params', JSON.stringify(searchParams));
    
    // Clean up old stored params only if they're different
    const storedParams = localStorage.getItem('drexcape_search_params_backup');
    if (storedParams) {
      try {
        const parsed = JSON.parse(storedParams);
        if (JSON.stringify(parsed) !== JSON.stringify(searchParams)) {
          localStorage.removeItem('drexcape_search_params_backup');
        }
      } catch (error) {
        localStorage.removeItem('drexcape_search_params_backup');
      }
    }
  }, [from, to, travellers, travelClass, startDate, endDate]);

  // Check user access status
  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const hasAccess = await hasUserFilledContactForm();
        setUserHasAccess(hasAccess);
      } catch (error) {
        console.error('Error checking user access:', error);
        setUserHasAccess(false);
      }
    };
    
    checkUserAccess();
  }, []);

  // Restore search results from localStorage or state if available
  useEffect(() => {
    // First check if we have restored results from state
    if (state.fromSaved && state.searchResults && !loading) {
      try {
        const results = state.searchResults;
        if (Array.isArray(results) && results.length > 0) {
          console.log('Restoring search results from state:', results.length, 'itineraries');
          setAiItineraries(results);
          setLoading(false);
          setError('');
          
          // Fetch images for restored results
          results.forEach((itinerary, idx) => {
            if (itinerary.placesToVisit && itinerary.placesToVisit.length > 0) {
              fetchImage(itinerary.placesToVisit[0], itinerary.destinations?.[0], idx);
            } else if (itinerary.destinations && itinerary.destinations.length > 0) {
              fetchImage(null, itinerary.destinations[0], idx);
            }
          });
          return; // Don't check localStorage if we have state data
        }
      } catch (error) {
        console.error('Error restoring search results from state:', error);
      }
    }
    
    // Fallback to localStorage if no state data
    const storedResults = localStorage.getItem('drexcape_search_results');
    if (storedResults && !loading) {
      try {
        const results = JSON.parse(storedResults);
        if (Array.isArray(results) && results.length > 0) {
          console.log('Restoring search results from localStorage:', results.length, 'itineraries');
          setAiItineraries(results);
          setLoading(false);
          setError('');
          
          // Fetch images for restored results
          results.forEach((itinerary, idx) => {
            if (itinerary.placesToVisit && itinerary.placesToVisit.length > 0) {
              fetchImage(itinerary.placesToVisit[0], itinerary.destinations?.[0], idx);
            } else if (itinerary.destinations && itinerary.destinations.length > 0) {
              fetchImage(null, itinerary.destinations[0], idx);
            }
          });
        }
      } catch (error) {
        console.error('Error restoring search results from localStorage:', error);
        localStorage.removeItem('drexcape_search_results');
      }
    }
  }, [loading, state.fromSaved, state.searchResults]);

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

        const response = await fetch(buildApiUrl(API_ENDPOINTS.GENERATE_ITINERARY), {
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
          setError('');
          
          // Store search results for back navigation
          localStorage.setItem('drexcape_search_results', JSON.stringify(data.itineraries));
        } else {
          setError('No itineraries generated. Please try again.');
        }
      } catch (err) {
        console.error('Generate itinerary error:', err);
        setError(`Failed to generate itineraries: ${err.message}. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    generateItinerary();
  }, [from, to, startDate, endDate, travellers, travelClass, retryCount, retryDelay, navigate]);

  // Fetch image for a place
  const fetchImage = async (place, destination, idx) => {
    if (!place && !destination) return;
    try {
      console.log('Fetching image for:', { place, destination, idx });
      
              const res = await fetch(buildApiUrl(`${API_ENDPOINTS.PLACE_IMAGE}?place=${encodeURIComponent(place || '')}&destination=${encodeURIComponent(destination || '')}`));
      
      if (!res.ok) {
        console.error('Place image API error:', res.status, res.statusText);
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Place image API response:', data);
      
      if (data.imageUrl) {
        const imageUrl = `/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}`;
        console.log('Setting image URL:', imageUrl);
        setImageUrls(prev => ({ ...prev, [idx]: imageUrl }));
      } else {
        console.log('No image URL returned, using default');
        setImageUrls(prev => ({ ...prev, [idx]: '/default-travel.jpg' }));
      }
    } catch (error) {
      console.error('Image fetch error:', error);
      setImageUrls(prev => ({ ...prev, [idx]: '/default-travel.jpg' }));
    }
  };

  // When aiItineraries change, fetch images for each
  useEffect(() => {
    aiItineraries.forEach((item, idx) => {
      if (item.placesToVisit && item.placesToVisit.length > 0) {
        fetchImage(item.placesToVisit[0], item.destinations?.[0], idx);
      } else if (item.destinations && item.destinations.length > 0) {
        fetchImage(null, item.destinations[0], idx);
      }
    });
  }, [aiItineraries]);

  const handleViewDetails = async (itinerary, index) => {
    try {
      // Check if user is logged in
      const userToken = getCookie('drexcape_user_token');
      
      if (!userToken) {
        console.log('🔒 User is NOT logged in - showing login form');
        setPendingItinerary({ itinerary, index });
        setShowLoginForm(true);
        return;
      }

      console.log('✅ User is logged in - navigating to details');
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
      console.error('Error checking user login status:', error);
      setPendingItinerary({ itinerary, index });
      setShowLoginForm(true);
    }
  };

  const handleNewSearch = () => {
    navigate('/');
  };

  const handleRetry = () => {
    setRetryCount(0);
    setRetryDelay(2000);
    setError('');
    setLoading(true);
    // This will trigger the useEffect to regenerate
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

              const response = await fetch(buildApiUrl(API_ENDPOINTS.GENERATE_ITINERARY), {
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

  // Handle login success and proceed with itinerary
  const handleLoginSuccess = (userData) => {
    console.log('🎉 === handleLoginSuccess called ===');
    console.log('📋 pendingItinerary:', pendingItinerary);
    
    // Update user login status using context
    handleUserLogin(userData);
    setUserHasAccess(true);
    
    // Close the login form
    setShowLoginForm(false);
    
    if (pendingItinerary) {
      const { itinerary, index } = pendingItinerary;
      console.log('✅ Processing pending itinerary after login:', { itinerary, index });
      setPendingItinerary(null);
      
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
    }
  };

  const handleShowContactForm = () => {
    setShowContactForm(true);
  };

  const handleUseCachedResults = () => {
    // This would load cached results if available
    console.log('Using cached results');
  };

  if (loading) {
    return (
      <PageWrapper className="fade-in">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <h2 className="section-title mt-4">Generating Your Perfect Itinerary</h2>
          <p className="text-center">Please wait while our AI creates amazing travel plans for you...</p>
        </div>
      </PageWrapper>
    );
  }

  if (error && !loading) {
    return (
      <PageWrapper className="fade-in">
        <div className="text-center">
          <h2 className="section-title">Oops! Something went wrong</h2>
          <p className="mb-4">{error}</p>
          <div className="d-flex justify-center gap-2">
            <button className="btn-primary" onClick={handleRetry}>
              Try Again
            </button>
            <button className="btn-secondary" onClick={handleNewSearch}>
              New Search
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="fade-in">
      {/* Search Summary */}
      <div className="search-summary-card">
        <div className="d-flex justify-between align-center">
          <div>
            <h2 className="section-title text-left">Search Results</h2>
            <p className="mb-2">
              <strong>From:</strong> {from} | <strong>To:</strong> {to} | 
              <strong> Travelers:</strong> {travellers} | <strong>Class:</strong> {travelClass}
            </p>
            <p>
              <strong>Dates:</strong> {startDate} to {endDate}
            </p>
          </div>
          <button className="btn-secondary" onClick={handleNewSearch}>
            New Search
          </button>
        </div>
      </div>

      {/* Itineraries Grid */}
      <div className="search-results-grid">
        {aiItineraries.map((itinerary, index) => (
          <div key={index} className="result-card">
            <img 
              src={imageUrls[index] || '/default-travel.jpg'} 
              alt={itinerary.packageName}
              className="result-card-image"
              onError={(e) => {
                console.log('Image failed to load:', e.target.src);
                e.target.src = '/default-travel.jpg';
              }}
            />
            <div className="result-card-content">
              <div className="result-card-header">
                <h3 className="result-card-title">{itinerary.packageName}</h3>
                <span className="result-card-days">{itinerary.days} Days</span>
              </div>
              
              <div className="result-card-details">
                <p><strong>Destinations:</strong> {itinerary.destinations?.join(', ')}</p>
                <p><strong>Price:</strong> ₹{itinerary.price?.toLocaleString()}</p>
                <div>
                  <strong>Highlights:</strong>
                  <ul>
                    {itinerary.highlights?.slice(0, 3).map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button 
                className={`w-full ${isUserLoggedIn ? 'btn-primary' : 'btn-locked'}`}
                onClick={() => handleViewDetails(itinerary, index)}
              >
                {isUserLoggedIn ? (
                  'View Details'
                ) : (
                  <>
                    <LockIcon style={{ fontSize: '1rem', marginRight: '0.5rem' }} />
                    Login to View
                  </>
                )}
              </button>
              {!isUserLoggedIn && (
                <p className="unlock-hint">
                  Login to unlock detailed itineraries
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {aiItineraries.length > 0 && (
        <div className="text-center mt-4">
          <button 
            className="btn-secondary"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load More Itineraries'}
          </button>
        </div>
      )}

      {/* Login Form Popup */}
      {showLoginForm && (
        <UserLogin
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowLoginForm(false)}
          forceOpen={true}
          isUserLoggedIn={isUserLoggedIn}
        />
      )}
    </PageWrapper>
  );
};

export default SearchResults; 