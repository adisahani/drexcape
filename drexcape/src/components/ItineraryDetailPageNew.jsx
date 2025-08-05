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
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar
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
  ContentCopy,
  ZoomIn,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import UserLogin from './UserLogin';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

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
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
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

  // Process images from itinerary data
  const processImages = (itineraryData) => {
    if (!itineraryData) return [];

    const images = [];
    
    // Add header image
    if (itineraryData.headerImage && itineraryData.headerImage !== '/default-travel.jpg') {
      images.push({
        url: itineraryData.headerImage,
        label: 'Destination Overview',
        type: 'header'
      });
    }
    
    // Add gallery images
    if (itineraryData.galleryImages && Array.isArray(itineraryData.galleryImages)) {
      itineraryData.galleryImages.forEach((img, idx) => {
        if (img && img !== '/default-travel.jpg') {
          images.push({
            url: img,
            label: `Attraction ${idx + 1}`,
            type: 'gallery'
          });
        }
      });
    }
    
    // Add accommodation image
    if (itineraryData.accommodationImage && itineraryData.accommodationImage !== '/default-travel.jpg') {
      images.push({
        url: itineraryData.accommodationImage,
        label: 'Accommodation',
        type: 'accommodation'
      });
    }
    
    return images;
  };

  useEffect(() => {
    console.log('ItineraryDetailPage mounted with slug:', slug);
    console.log('Location state:', location.state);
    fetchItinerary();
  }, [slug]);

  useEffect(() => {
    if (itinerary) {
      console.log('🔄 Itinerary data loaded, processing images...');
      const images = processImages(itinerary);
      setGalleryImages(images);
      console.log('🎨 Processed images:', images.length);
    }
  }, [itinerary]);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First check if we have data in the location state
      const searchState = location.state;
      
      if (searchState && searchState.itineraryData) {
        console.log('✅ Using data from search state');
        setItinerary(searchState.itineraryData);
        
        // Fetch detailed information
        if (searchState.itineraryId) {
          await fetchDetails(searchState.itineraryId);
        }
        return;
      }
      
      // If no search state, try to fetch from database
      console.log('⚠️ No search state, fetching from database');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ITINERARY_DETAILS(slug)));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Itinerary data from database:', data);
        setItinerary(data.itinerary);
        
        // Fetch detailed information
        if (data.itinerary._id) {
          await fetchDetails(data.itinerary._id);
        }
      } else {
        console.log('❌ Not found in database, showing error');
        setError('Itinerary not found. Please search again to generate a new itinerary.');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (itineraryId) => {
    try {
      console.log('Fetching details for itinerary:', itineraryId);
      setDetailsLoading(true);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ITINERARY_DETAILS_BY_ID(itineraryId)));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Details data:', data);
        setDetails(data.details);
      } else {
        console.log('No details found for itinerary');
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = itinerary?.title || 'Amazing Travel Itinerary';
    const text = `Check out this amazing ${itinerary?.days}-day itinerary from ${itinerary?.fromLocation} to ${itinerary?.toLocation}!`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleBackToSearch = () => {
    navigate('/search-results');
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setImageDialogOpen(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ color: '#a084e8', mb: 3 }} />
          <Typography variant="h5" sx={{ color: '#2a0140', mb: 2 }}>
            🗺️ Loading Your Itinerary
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Please wait while we fetch your travel details...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="error" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={handleBackToSearch}
            sx={{ 
              px: 4, 
              py: 2,
              background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
              }
            }}
          >
            ← Back to Search
          </Button>
        </Box>
      </Container>
    );
  }

  if (!itinerary) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ color: '#2a0140', mb: 2 }}>
            ❌ Itinerary Not Found
          </Typography>
          <Button
            variant="contained"
            onClick={handleBackToSearch}
            sx={{ 
              px: 4, 
              py: 2,
              background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
              }
            }}
          >
            ← Back to Search
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header with Back Button */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToSearch}
            sx={{ 
              borderColor: '#a084e8',
              color: '#a084e8',
              '&:hover': {
                borderColor: '#6d3bbd',
                backgroundColor: 'rgba(160, 132, 232, 0.1)'
              }
            }}
          >
            Back to Search
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={() => setShareDialogOpen(true)}
            sx={{ 
              borderColor: '#a084e8',
              color: '#a084e8',
              '&:hover': {
                borderColor: '#6d3bbd',
                backgroundColor: 'rgba(160, 132, 232, 0.1)'
              }
            }}
          >
            Share
          </Button>
        </Box>

        {/* Main Content */}
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
          {/* Itinerary Title and Basic Info */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{
                fontFamily: 'Rajdhani, Orbitron, sans-serif',
                fontWeight: 700,
                color: '#2a0140',
                mb: 2
              }}
            >
              {itinerary.title}
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ color: '#a084e8' }} />
                  <Typography variant="body1">
                    <strong>{itinerary.days} Days</strong>
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ color: '#a084e8' }} />
                  <Typography variant="body1">
                    <strong>{itinerary.fromLocation} → {itinerary.toLocation}</strong>
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People sx={{ color: '#a084e8' }} />
                  <Typography variant="body1">
                    <strong>{itinerary.travellers} Travelers</strong>
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Flight sx={{ color: '#a084e8' }} />
                  <Typography variant="body1">
                    <strong>{itinerary.travelClass}</strong>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Destination Gallery */}
          {galleryImages.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  color: '#2a0140',
                  mb: 3
                }}
              >
                🖼️ Destination Gallery
              </Typography>
              
              <ImageList 
                sx={{ 
                  width: '100%', 
                  height: 'auto',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr)) !important'
                }} 
                cols={3} 
                rowHeight={250}
              >
                {galleryImages.map((image, index) => (
                  <ImageListItem 
                    key={index}
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        '& .image-overlay': {
                          opacity: 0.8
                        }
                      }
                    }}
                    onClick={() => handleImageClick(index)}
                  >
                    <img
                      src={image.url}
                      alt={image.label}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.target.src = '/default-travel.jpg';
                      }}
                    />
                    <ImageListItemBar
                      title={image.label}
                      subtitle={image.type}
                      sx={{
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        borderBottomLeftRadius: '8px',
                        borderBottomRightRadius: '8px'
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Click on any image to view it in full size
                </Typography>
              </Box>
            </Box>
          )}

          {/* Itinerary Summary */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{
                fontFamily: 'Rajdhani, Orbitron, sans-serif',
                fontWeight: 700,
                color: '#2a0140',
                mb: 3
              }}
            >
              📋 Itinerary Summary
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', background: 'rgba(160, 132, 232, 0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#2a0140', mb: 2 }}>
                      🗺️ Destinations
                    </Typography>
                    {itinerary.destinations?.map((dest, idx) => (
                      <Chip 
                        key={idx} 
                        label={dest} 
                        sx={{ m: 0.5, background: '#a084e8', color: 'white' }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', background: 'rgba(160, 132, 232, 0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#2a0140', mb: 2 }}>
                      🏛️ Places to Visit
                    </Typography>
                    {itinerary.placesToVisit?.map((place, idx) => (
                      <Chip 
                        key={idx} 
                        label={place} 
                        sx={{ m: 0.5, background: '#6d3bbd', color: 'white' }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Highlights */}
          {itinerary.highlights && itinerary.highlights.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  color: '#2a0140',
                  mb: 3
                }}
              >
                ⭐ Highlights
              </Typography>
              
              <List>
                {itinerary.highlights.map((highlight, idx) => (
                  <ListItem key={idx} sx={{ py: 1 }}>
                    <ListItemIcon>
                      <Star sx={{ color: '#a084e8' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={highlight}
                      sx={{ color: '#2a0140' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
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
              <CircularProgress size={60} sx={{ color: '#a084e8', mb: 3 }} />
              
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
            </Box>
          </Paper>
        ) : details ? (
          // Detailed itinerary content
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
              sx={{
                fontFamily: 'Rajdhani, Orbitron, sans-serif',
                fontWeight: 700,
                color: '#2a0140',
                mb: 3
              }}
            >
              📅 Detailed Itinerary
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#2a0140',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap'
              }}
            >
              {details}
            </Typography>
          </Paper>
        ) : null}
      </Container>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {galleryImages[currentImageIndex] && (
            <>
              <img
                src={galleryImages[currentImageIndex].url}
                alt={galleryImages[currentImageIndex].label}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.src = '/default-travel.jpg';
                }}
              />
              
              <Box sx={{ 
                position: 'absolute', 
                bottom: 16, 
                left: 16, 
                right: 16,
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                p: 2,
                borderRadius: 1
              }}>
                <Typography variant="h6">
                  {galleryImages[currentImageIndex].label}
                </Typography>
                <Typography variant="body2">
                  {galleryImages[currentImageIndex].type}
                </Typography>
              </Box>
              
              {galleryImages.length > 1 && (
                <>
                  <IconButton
                    onClick={handlePrevImage}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { background: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <NavigateBefore />
                  </IconButton>
                  
                  <IconButton
                    onClick={handleNextImage}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { background: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <NavigateNext />
                  </IconButton>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#2a0140' }}>
          Share This Itinerary
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                onClick={() => handleShare('facebook')}
                sx={{ borderColor: '#1877f2', color: '#1877f2' }}
              >
                Facebook
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Twitter />}
                onClick={() => handleShare('twitter')}
                sx={{ borderColor: '#1da1f2', color: '#1da1f2' }}
              >
                Twitter
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WhatsApp />}
                onClick={() => handleShare('whatsapp')}
                sx={{ borderColor: '#25d366', color: '#25d366' }}
              >
                WhatsApp
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={handleCopyLink}
                sx={{ borderColor: '#a084e8', color: '#a084e8' }}
              >
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Form */}
      {showContactForm && (
        <UserLogin
          onLoginSuccess={(userData) => {
            setIsUserLoggedIn(true);
            setUserData(userData);
            setShowContactForm(false);
          }}
          onClose={() => setShowContactForm(false)}
          forceOpen={true}
          isUserLoggedIn={isUserLoggedIn}
        />
      )}
    </>
  );
};

export default ItineraryDetailPage; 