import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import ReactMarkdown from 'react-markdown';
import { Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import PromotionalPopup from './PromotionalPopup';
import PageWrapper from './PageWrapper';
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
          setError('');
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
      if (item.placesToVisit && item.placesToVisit.length > 0) {
        fetchImage(item.placesToVisit[0], item.destinations?.[0], idx);
      } else if (item.destinations && item.destinations.length > 0) {
        fetchImage(null, item.destinations[0], idx);
      }
    });
  }, [aiItineraries]);

  const handleViewDetails = async (itinerary, index) => {
    try {
      // Check if user has filled contact form
      const hasAccess = await hasUserFilledContactForm();
      
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
      <div className="card mb-4">
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
      <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {aiItineraries.map((itinerary, index) => (
          <div key={index} className="card glass-hover">
            <div className="d-flex align-center mb-3">
              <img 
                src={imageUrls[index] || '/default-travel.jpg'} 
                alt={itinerary.packageName}
                className="rounded-lg"
                style={{ width: '80px', height: '60px', objectFit: 'cover' }}
              />
              <div className="ml-3">
                <h3 className="mb-1">{itinerary.packageName}</h3>
                <p className="text-sm opacity-75">{itinerary.days} Days</p>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="mb-2"><strong>Destinations:</strong> {itinerary.destinations?.join(', ')}</p>
              <p className="mb-2"><strong>Price:</strong> ₹{itinerary.price?.toLocaleString()}</p>
              <div className="mb-2">
                <strong>Highlights:</strong>
                <ul className="mt-1">
                  {itinerary.highlights?.slice(0, 3).map((highlight, idx) => (
                    <li key={idx} className="text-sm opacity-75">• {highlight}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <button 
              className="btn-primary w-full"
              onClick={() => handleViewDetails(itinerary, index)}
            >
              View Details
            </button>
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

      {/* Contact Form Popup */}
      {showContactForm && (
        <PromotionalPopup
          onClose={() => setShowContactForm(false)}
          onSubmit={handleContactFormSubmitted}
          isOpen={showContactForm}
        />
      )}
    </PageWrapper>
  );
};

export default SearchResults; 