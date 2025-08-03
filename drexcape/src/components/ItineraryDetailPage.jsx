import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Share,
  LocationOn,
  CalendarToday,
  People,
  Flight,
  AttachMoney,
  Star,
  Hotel,
  Restaurant,
  DirectionsCar,
  Event,
  Facebook,
  Twitter,
  WhatsApp,
  ContentCopy
} from '@mui/icons-material';
import drexcapeLogo from '../assets/drexcape-logo.png';
import PromotionalPopup from './PromotionalPopup';
import UserLogin from './UserLogin';
import { getCookie, hasUserFilledContactForm } from '../utils/cookies';

// GooeyCursor component (same as main app)
function GooeyCursor() {
  const containerRef = React.useRef(null);
  const blobRefs = [React.useRef(null), React.useRef(null), React.useRef(null)];
  const [mouse, setMouse] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const positions = [React.useRef({ x: mouse.x, y: mouse.y }), React.useRef({ x: mouse.x, y: mouse.y }), React.useRef({ x: mouse.x, y: mouse.y })];
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
  console.log('ItineraryDetailPage GooeyCursor - isTouchDevice:', isTouchDevice);
  if (isTouchDevice) {
    console.log('ItineraryDetailPage GooeyCursor - Touch device detected, not rendering');
    return null;
  }
  console.log('ItineraryDetailPage GooeyCursor - Mouse device detected, rendering cursor');

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

const ItineraryDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [itinerary, setItinerary] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [headerImage, setHeaderImage] = useState('/default-travel.jpg');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserData) {
      setIsUserLoggedIn(true);
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // Get header image from location state or fetch from Pixabay
  const getHeaderImage = () => {
    // First check if we have image from location state
    if (location.state && location.state.imageUrl) {
      setHeaderImage(location.state.imageUrl);
      return location.state.imageUrl;
    }
    
    // If no image in state, use the saved header image from database
    if (itinerary && itinerary.headerImage) {
      setHeaderImage(itinerary.headerImage);
      return itinerary.headerImage;
    }
    
    // If no saved image, try to fetch from Pixabay
    if (itinerary) {
      const place = itinerary.placesToVisit?.[0] || '';
      const destination = itinerary.destinations?.[0] || '';
      
      if (place || destination) {
        fetch(`/api/place-image?place=${encodeURIComponent(place)}&destination=${encodeURIComponent(destination)}`)
          .then(res => res.json())
          .then(data => {
            if (data.imageUrl) {
              setHeaderImage(data.imageUrl);
            }
          })
          .catch(() => {
            setHeaderImage('/default-travel.jpg');
          });
      }
    }
    
    return headerImage;
  };

  useEffect(() => {
    console.log('ItineraryDetailPage mounted with slug:', slug);
    console.log('Location state:', location.state);
    fetchItinerary();
  }, [slug]);

  useEffect(() => {
    if (itinerary) {
      getHeaderImage();
    }
  }, [itinerary]);

  const fetchItinerary = async () => {
    try {
      // First check if we have data in the location state
      const searchState = location.state;
      console.log('Search state available:', !!searchState);
      
      if (searchState && searchState.itineraryData) {
        console.log('Using data from search state');
        setItinerary(searchState.itineraryData);
        setLoading(false);
        
        // Set header image from state if available
        if (searchState.imageUrl) {
          setHeaderImage(searchState.imageUrl);
        }
        
        // Fetch detailed information
        await fetchDetails(searchState.itineraryId);
        return;
      }
      
      // If no search state, try to fetch from database
      console.log('No search state, fetching from database');
      const response = await fetch(`http://localhost:3001/api/itineraries/${slug}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Itinerary data from database:', data);
        setItinerary(data.itinerary);
        
        // Fetch detailed information
        await fetchDetails(data.itinerary._id);
      } else {
        console.log('Not found in database, showing error');
        setError('Itinerary not found. Please search again to generate a new itinerary.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (itineraryId) => {
    try {
      console.log('Fetching details for itinerary:', itineraryId);
      setDetailsLoading(true);
      const response = await fetch(`http://localhost:3001/api/itinerary-details/${itineraryId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Details data:', data);
        setDetails(data.details);
      } else {
        console.log('Failed to fetch details');
      }
    } catch (err) {
      console.error('Details fetch error:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = `Check out this amazing ${itinerary?.fromLocation} to ${itinerary?.toLocation} itinerary!`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const handleBackToSearch = () => {
    // Check if we have saved search results
    const savedResults = localStorage.getItem('drexcape_search_results');
    const savedParams = localStorage.getItem('drexcape_search_params');
    
    console.log('Back to Search - Saved results:', savedResults ? 'Found' : 'Not found');
    console.log('Back to Search - Saved params:', savedParams ? 'Found' : 'Not found');
    
    if (savedResults && savedParams) {
      try {
        const parsedResults = JSON.parse(savedResults);
        const parsedParams = JSON.parse(savedParams);
        console.log('Back to Search - Parsed results:', parsedResults.itineraries?.length || 0, 'itineraries');
        console.log('Back to Search - Parsed params:', parsedParams);
        
        // Navigate to search results with saved state
        navigate('/search-results', {
          state: {
            fromSaved: true,
            searchParams: parsedParams,
            searchResults: parsedResults
          }
        });
      } catch (error) {
        console.error('Error parsing saved data:', error);
        navigate('/');
      }
    } else {
      // Fallback to homepage if no saved data
      console.log('Back to Search - No saved data, going to homepage');
      navigate('/');
    }
  };

  const handleContactFormSubmitted = () => {
    setShowContactForm(false);
    // You can add any additional logic here after form submission
  };

  const handleShowContactForm = async () => {
    console.log('🎭 === ItineraryDetailPage handleShowContactForm called ===');
    
    try {
      // Check if user has already submitted the promotional form
      const hasAccess = await hasUserFilledContactForm();
      
      if (hasAccess) {
        console.log('👤 User has access, skipping contact form');
        // User has already submitted form, don't show it again
        return;
      }
      
      // Only show form if user hasn't submitted it yet
      setShowContactForm(true);
    } catch (error) {
      console.error('Error checking user access:', error);
      // Fallback: show contact form
      setShowContactForm(true);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" sx={{ mt: 8 }}>
        <CircularProgress sx={{ color: '#a084e8' }} />
      </Box>
    );
  }

  if (error || !itinerary) {
    return (
      <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Itinerary not found'}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ 
            mt: 2,
            background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(90deg, #6d3bbd 0%, #a084e8 100%)',
            }
          }}
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <>
      {/* Hero Header with Cloudinary Image */}
      <Box
        sx={{
          position: 'relative',
          height: '400px',
          background: `linear-gradient(rgba(42, 1, 64, 0.7), rgba(109, 59, 189, 0.8)), url(${headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 8,
          overflow: 'hidden'
        }}
      >
        {/* Floating elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '60px',
            height: '60px',
            background: 'rgba(160, 132, 232, 0.3)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            width: '40px',
            height: '40px',
            background: 'rgba(109, 59, 189, 0.4)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        
        {/* Content overlay */}
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', color: '#fff' }}>
            <Typography 
              variant="h2" 
              component="h1"
              sx={{
                fontFamily: 'Rajdhani, Orbitron, sans-serif',
                fontWeight: 700,
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {itinerary.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<People />}
                label={`${itinerary.travelers} Traveler${itinerary.travelers > 1 ? 's' : ''}`}
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Chip
                icon={<Flight />}
                label={itinerary.travelClass}
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Chip
                icon={<CalendarToday />}
                label={`${itinerary.days} Days`}
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)'
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {itinerary.views || 0} views • {itinerary.shares || 0} shares
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<Share />}
                onClick={() => setShareDialogOpen(true)}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                Share Itinerary
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToSearch}
            sx={{ 
              mb: 2,
              background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(90deg, #6d3bbd 0%, #a084e8 100%)',
              }
            }}
          >
            Back to Search Results
          </Button>
        </Box>

        {/* Basic Information */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontFamily: 'Rajdhani, Orbitron, sans-serif',
              fontWeight: 700,
              color: '#2a0140',
              textAlign: 'center',
              mb: 3
            }}
          >
            Trip Overview
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">From</Typography>
                  <Typography variant="h6" sx={{ color: '#6d3bbd', fontWeight: 600 }}>{itinerary.fromLocation}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">To</Typography>
                  <Typography variant="h6" sx={{ color: '#6d3bbd', fontWeight: 600 }}>{itinerary.toLocation}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                  <Typography variant="h6" sx={{ color: '#6d3bbd', fontWeight: 600 }}>{itinerary.days} Days</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography variant="h6" sx={{ color: '#a084e8', fontWeight: 700 }}>₹{itinerary.price?.toLocaleString()}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {itinerary.destinations?.map((dest, idx) => (
                  <Chip 
                    key={idx} 
                    label={dest} 
                    icon={<LocationOn />}
                    sx={{
                      background: 'linear-gradient(90deg, #f0e6ff 0%, #ece6fa 100%)',
                      color: '#6d3bbd',
                      fontWeight: 600
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Detailed Information */}
        {!isUserLoggedIn ? (
          // Login prompt for non-logged-in users
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              mb: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3
            }}
          >
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography 
                variant="h4" 
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  color: '#2a0140',
                  mb: 3
                }}
              >
                🔒 Login Required
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{
                  color: '#666',
                  maxWidth: '500px',
                  margin: '0 auto 30px',
                  fontSize: '1.1rem'
                }}
              >
                Please login to view the complete detailed itinerary with day-wise plans, accommodation details, and booking information.
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowContactForm(true)}
                sx={{ 
                  px: 4, 
                  py: 2, 
                  fontSize: '1.1rem',
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
                  }
                }}
              >
                📝 Login to Continue
              </Button>
            </Box>
          </Paper>
        ) : detailsLoading ? (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              mb: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3
            }}
          >
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #a084e8',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              
              <Typography 
                variant="h6" 
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  color: '#2a0140',
                  mb: 2
                }}
              >
                🗺️ Generating Detailed Itinerary
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{
                  color: '#666',
                  maxWidth: '400px',
                  margin: '0 auto'
                }}
              >
                Creating your personalized day-by-day travel plan with accommodation, transport, and activities...
              </Typography>
              
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </Box>
          </Paper>
        ) : details && (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              mb: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3
            }}
          >
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                fontFamily: 'Rajdhani, Orbitron, sans-serif',
                fontWeight: 700,
                color: '#2a0140',
                textAlign: 'center',
                mb: 3
              }}
            >
              Detailed Itinerary
            </Typography>
            
            {/* Day-wise Plan */}
            {details.fullDayWisePlan && details.fullDayWisePlan.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontFamily: 'Rajdhani, Orbitron, sans-serif',
                    fontWeight: 700,
                    color: '#6d3bbd'
                  }}
                >
                  <Event color="primary" /> Day-wise Plan
                </Typography>
                <Grid container spacing={2}>
                  {details.fullDayWisePlan.map((day, idx) => (
                    <Grid item xs={12} key={idx} sx={{ width: '100%' }}>
                      <Card sx={{ 
                        background: 'linear-gradient(135deg, #f8f4ff 0%, #f0e6ff 100%)',
                        border: '1px solid #e0d6ff',
                        borderRadius: 2,
                        width: '100%', // Make card full width
                        maxWidth: '100%', // Ensure no max-width constraints
                        '& .MuiCardContent-root': {
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '16px',
                          width: '100%'
                        }
                      }}>
                        <CardContent sx={{ 
                          flex: 1, // Make content take full available height
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          '&:last-child': {
                            paddingBottom: '16px'
                          }
                        }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              fontFamily: 'Rajdhani, Orbitron, sans-serif',
                              fontWeight: 700,
                              color: '#2a0140'
                            }}
                          >
                            <span style={{ marginRight: 8, fontSize: '1.2em' }}>{day.emoji}</span>
                            {day.title}
                          </Typography>
                          <Box 
                            component="div" 
                            sx={{ 
                              color: 'text.secondary',
                              whiteSpace: 'pre-line',
                              flex: 1, // Take remaining space
                              '& strong': {
                                fontWeight: 700,
                                color: '#6d3bbd'
                              },
                              '& .time-section': {
                                marginTop: '8px',
                                marginBottom: '4px',
                                fontWeight: 600,
                                color: '#6d3bbd'
                              }
                            }}
                            dangerouslySetInnerHTML={{
                              __html: day.description
                                .replace(/\*\*(.*?)\*\*/g, '<span class="time-section">$1</span>')
                                .replace(/\n\n/g, '<br><br>')
                                .replace(/\n/g, '<br>')
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Additional Details */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontFamily: 'Rajdhani, Orbitron, sans-serif',
                      fontWeight: 700,
                      color: '#6d3bbd'
                    }}
                  >
                    <Hotel color="primary" /> Accommodation
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>{details.accommodation}</Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontFamily: 'Rajdhani, Orbitron, sans-serif',
                      fontWeight: 700,
                      color: '#6d3bbd'
                    }}
                  >
                    <DirectionsCar color="primary" /> Transport Details
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>{details.transportDetails}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontFamily: 'Rajdhani, Orbitron, sans-serif',
                      fontWeight: 700,
                      color: '#6d3bbd'
                    }}
                  >
                    <Star color="primary" /> Activities Included
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>{details.activitiesIncluded}</Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontFamily: 'Rajdhani, Orbitron, sans-serif',
                      fontWeight: 700,
                      color: '#6d3bbd'
                    }}
                  >
                    <Restaurant color="primary" /> Meals
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>{details.meals}</Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Terms and Booking */}
            <Box sx={{ 
              mt: 4, 
              p: 3, 
              background: 'linear-gradient(135deg, #f8f4ff 0%, #f0e6ff 100%)', 
              borderRadius: 2,
              border: '1px solid #e0d6ff'
            }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  color: '#2a0140'
                }}
              >
                Terms & Conditions
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>{details.terms}</Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={handleShowContactForm}
                sx={{ 
                  px: 4, 
                  py: 2, 
                  fontSize: '1.1rem',
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
                  }
                }}
              >
                📞 Contact Us to Book Now!
              </Button>
            </Box>
          </Paper>
        )}

        {/* Share Dialog */}
        <Dialog 
          open={shareDialogOpen} 
          onClose={() => setShareDialogOpen(false)}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3
            }
          }}
        >
          <DialogTitle sx={{ fontFamily: 'Rajdhani, Orbitron, sans-serif', fontWeight: 700, color: '#2a0140' }}>
            Share Itinerary
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <IconButton 
                onClick={() => handleShare('facebook')} 
                sx={{ 
                  color: '#1877f2',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton 
                onClick={() => handleShare('twitter')} 
                sx={{ 
                  color: '#1da1f2',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              >
                <Twitter />
              </IconButton>
              <IconButton 
                onClick={() => handleShare('whatsapp')} 
                sx={{ 
                  color: '#25d366',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              >
                <WhatsApp />
              </IconButton>
              <IconButton 
                onClick={() => handleShare('copy')} 
                sx={{ 
                  color: '#a084e8',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              >
                <ContentCopy />
              </IconButton>
            </Box>
            {copySuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Link copied to clipboard!
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShareDialogOpen(false)}
              sx={{
                color: '#a084e8',
                fontWeight: 600
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>

      {/* User Login Popup */}
      {showContactForm && (
        <>
          {console.log('🎭 === ItineraryDetailPage Rendering UserLogin ===')}
          {console.log('📦 showContactForm:', showContactForm)}
          <UserLogin
            key={`login-${Date.now()}`} // Force remount each time
            onLoginSuccess={(userData) => {
              console.log('✅ User logged in:', userData);
              setShowContactForm(false);
              setIsUserLoggedIn(true);
              setUserData(userData);
            }}
            onClose={() => setShowContactForm(false)}
            forceOpen={true}
            isUserLoggedIn={isUserLoggedIn}
          />
        </>
      )}
    </>
  );
};

export default ItineraryDetailPage; 