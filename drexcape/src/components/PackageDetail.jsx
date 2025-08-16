import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Container,
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  DirectionsCar as DirectionsCarIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Fullscreen as FullscreenIcon,
  Facebook,
  Twitter,
  LinkedIn
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import BookingForm from './BookingForm';

const PackageDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [packageData, setPackageData] = useState(location.state?.packageData || null);
  const [loading, setLoading] = useState(!location.state?.packageData);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!packageData) {
      fetchPackageData();
    }
  }, [slug, packageData]);

  const fetchPackageData = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PACKAGE_DETAIL(slug)));
      const data = await response.json();

      if (response.ok) {
        setPackageData(data.package);
      } else {
        setError(data.error || 'Package not found');
      }
    } catch (error) {
      setError('Failed to fetch package details');
      console.error('Error fetching package:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleShare = () => {
    setShareDialogOpen(true);
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

  const handleSocialShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(packageData.title);
    const description = encodeURIComponent(packageData.shortDescription);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}&via=drexcape`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${title}%20${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setImageDialogOpen(true);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? packageData.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === packageData.images.length - 1 ? 0 : prev + 1
    );
  };

  const parseItinerary = (itineraryData) => {
    if (!itineraryData) return [];
    
    // Check if itinerary is already an array (structured format from AdminPackageManager)
    if (Array.isArray(itineraryData)) {
      return itineraryData.map((day, index) => ({
        day: day.day || index + 1,
        title: day.title || '',
        content: day.detail || day.content || ''
      }));
    }
    
    // If it's a string, try to parse it
    if (typeof itineraryData === 'string') {
      // Split by day patterns like "Day 1", "Day 2", etc.
      const dayPattern = /Day\s+(\d+)(?:\s*[-–:]\s*(.+?))?:\s*(.+?)(?=Day\s+\d+|$)/gs;
      const days = [];
      let match;
      
      while ((match = dayPattern.exec(itineraryData)) !== null) {
        const dayNumber = parseInt(match[1]);
        const dayTitle = match[2] ? match[2].trim() : '';
        const dayContent = match[3] ? match[3].trim() : '';
        
        days.push({
          day: dayNumber,
          title: dayTitle,
          content: dayContent
        });
      }
      
      // If no day pattern found, treat the entire content as a single day
      if (days.length === 0) {
        days.push({
          day: 1,
          title: 'Package Details',
          content: itineraryData
        });
      }
      
      return days;
    }
    
    return [];
  };

  const renderDayContent = (content) => {
    // Parse HTML content and render it safely
    return (
      <Typography 
        variant="body1" 
        sx={{ 
          lineHeight: 1.6,
          whiteSpace: 'pre-line', // Preserve line breaks
          '& p': { mb: 1 },
          '& strong': { fontWeight: 600 },
          '& em': { fontStyle: 'italic' },
          '& ul, & ol': { pl: 2, mb: 1 },
          '& li': { mb: 0.5 }
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} />
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
          <Button variant="contained" onClick={() => navigate('/packages')}>
            Back to Packages
          </Button>
        </Box>
      </Container>
    );
  }

  if (!packageData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="info" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
            Package not found
          </Alert>
          <Button variant="contained" onClick={() => navigate('/packages')}>
            Back to Packages
          </Button>
        </Box>
      </Container>
    );
  }

  const discountedPrice = packageData.pricing.discountPercentage > 0 
    ? packageData.pricing.basePrice * (1 - packageData.pricing.discountPercentage / 100)
    : packageData.pricing.basePrice;

  const itineraryDays = parseItinerary(packageData.itinerary);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      {/* Header Section */}
      <Paper elevation={2} sx={{ 
        background: 'white',
        borderRadius: 4,
        p: 4,
        mb: 4,
        border: '1px solid rgba(160, 132, 232, 0.2)'
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h3" sx={{ 
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            color: '#2a0140',
            mb: 2 
          }}>
            {packageData.title}
          </Typography>
          
          <Typography variant="h6" sx={{ 
            color: '#2a0140', 
            mb: 3,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 500
          }}>
            {packageData.shortDescription}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Chip 
              label={packageData.category} 
              sx={{ 
                background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                color: 'white',
                fontWeight: 600
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={packageData.rating.average} readOnly size="small" />
              <Typography variant="body2" sx={{ color: '#2a0140', fontWeight: 500 }}>
                ({packageData.rating.count} reviews)
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#2a0140', fontWeight: 500 }}>
              👁️ {packageData.views} views
            </Typography>
          </Box>
        </Box>

        {/* Quick Info */}
        <Grid container spacing={3} sx={{ textAlign: 'center' }}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, border: '1px solid rgba(160, 132, 232, 0.3)' }}>
              <FlightIcon sx={{ fontSize: 32, color: '#6d3bbd', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2a0140' }}>
                {packageData.travelDetails.fromLocation} → {packageData.travelDetails.toLocation}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, border: '1px solid rgba(160, 132, 232, 0.3)' }}>
              <EventIcon sx={{ fontSize: 32, color: '#6d3bbd', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2a0140' }}>
                {packageData.travelDetails.duration} Days
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, border: '1px solid rgba(160, 132, 232, 0.3)' }}>
              <PersonIcon sx={{ fontSize: 32, color: '#6d3bbd', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2a0140' }}>
                Max {packageData.travelDetails.maxTravelers} Travelers
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, border: '1px solid rgba(160, 132, 232, 0.3)' }}>
              <DirectionsCarIcon sx={{ fontSize: 32, color: '#6d3bbd', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2a0140' }}>
                {packageData.travelDetails.travelClass} Class
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Image Gallery */}
          {packageData.images && packageData.images.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ 
                color: '#2a0140', 
                fontWeight: 600, 
                mb: 3,
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                📸 Photo Gallery
              </Typography>
              
              <ImageList 
                cols={packageData.images.length === 1 ? 1 : packageData.images.length === 2 ? 2 : 3}
                gap={12}
                sx={{ 
                  width: '100%',
                  height: packageData.images.length === 1 ? 400 : 300,
                  overflow: 'hidden'
                }}
              >
                {packageData.images.map((image, index) => (
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
                      alt={image.caption || `Package image ${index + 1}`}
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
                      title={image.caption || `Image ${index + 1}`}
                      subtitle={image.isFeatured ? 'Featured' : 'Gallery'}
                      sx={{
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        borderBottomLeftRadius: '8px',
                        borderBottomRightRadius: '8px'
                      }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'white',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.7)',
                        }
                      }}
                    >
                      <FullscreenIcon />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Click on any image to view it in full size
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Description */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ 
              color: '#2a0140', 
              fontWeight: 600, 
              mb: 3,
              fontFamily: 'Rajdhani, sans-serif'
            }}>
              📖 About This Package
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 1.8,
                color: '#333',
                whiteSpace: 'pre-line', // Preserve line breaks
                '& p': { mb: 2 },
                '& h2': { 
                  fontSize: '1.4rem', 
                  fontWeight: 'bold', 
                  mt: 3, 
                  mb: 2,
                  color: '#2a0140',
                },
                '& h3': { 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  mt: 2, 
                  mb: 1,
                  color: '#2a0140',
                },
                '& ul, & ol': { pl: 3, mb: 2 },
                '& li': { mb: 0.5 },
                '& strong': { fontWeight: 600 },
                '& em': { fontStyle: 'italic' }
              }}
              dangerouslySetInnerHTML={{ __html: packageData.description }}
            />
          </Paper>

          {/* Features */}
          {packageData.features && packageData.features.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ 
                color: '#2a0140', 
                fontWeight: 600, 
                mb: 3,
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                ✨ Package Features
              </Typography>
              <Grid container spacing={2}>
                {packageData.features.map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2,
                      bgcolor: 'rgba(160, 132, 232, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(160, 132, 232, 0.2)'
                    }}>
                      <CheckIcon sx={{ color: '#4caf50', fontSize: 24, mr: 2 }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {feature}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Inclusions & Exclusions */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {packageData.inclusions && packageData.inclusions.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ 
                    color: '#4caf50', 
                    fontWeight: 600, 
                    mb: 2,
                    fontFamily: 'Rajdhani, sans-serif'
                  }}>
                    ✅ What's Included
                  </Typography>
                  <List dense>
                    {packageData.inclusions.map((inclusion, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={inclusion}
                          primaryTypographyProps={{ fontSize: '0.95rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
            
            {packageData.exclusions && packageData.exclusions.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ 
                    color: '#f44336', 
                    fontWeight: 600, 
                    mb: 2,
                    fontFamily: 'Rajdhani, sans-serif'
                  }}>
                    ❌ What's Not Included
                  </Typography>
                  <List dense>
                    {packageData.exclusions.map((exclusion, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CloseIcon sx={{ color: '#f44336', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={exclusion}
                          primaryTypographyProps={{ fontSize: '0.95rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Day-wise Itinerary */}
          {itineraryDays.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ 
                color: '#2a0140', 
                fontWeight: 600, 
                mb: 3,
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                📅 Day-wise Itinerary
              </Typography>
              
              {itineraryDays.map((day, index) => (
                <Accordion 
                  key={index}
                  defaultExpanded={index === 0}
                  sx={{ 
                    mb: 2,
                    border: '1px solid rgba(160, 132, 232, 0.2)',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.1) 0%, rgba(109, 59, 189, 0.1) 100%)',
                      borderRadius: '12px',
                      '&.Mui-expanded': {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      color: '#2a0140'
                    }}>
                      🗓️ Day {day.day}{day.title ? `: ${day.title}` : ''}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    {renderDayContent(day.content)}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Pricing Card */}
          <Paper elevation={3} sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            position: 'sticky', 
            top: 20,
            background: 'white',
            border: '1px solid rgba(160, 132, 232, 0.2)'
          }}>
            <Typography variant="h4" sx={{ 
              color: '#6d3bbd', 
              fontWeight: 700, 
              mb: 1,
              fontFamily: 'Rajdhani, sans-serif'
            }}>
              {packageData.pricing.currency} {discountedPrice.toLocaleString()}
              {packageData.pricing.pricePerPerson && (
                <Typography component="span" variant="h6" sx={{ color: '#666' }}>
                  /person
                </Typography>
              )}
            </Typography>
            
            {packageData.pricing.discountPercentage > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#999' }}>
                  Original: {packageData.pricing.currency} {packageData.pricing.basePrice.toLocaleString()}
                </Typography>
                <Chip 
                  label={`${packageData.pricing.discountPercentage}% OFF`} 
                  size="small" 
                  color="error"
                  sx={{ mt: 1 }}
                />
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              onClick={() => setOpenBookingDialog(true)}
              sx={{ 
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                }
              }}
            >
              Book Now
            </Button>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <IconButton sx={{ color: '#666' }}>
                <PrintIcon />
              </IconButton>
              <IconButton sx={{ color: '#666' }} onClick={handleShare}>
                <ShareIcon />
              </IconButton>
              <IconButton sx={{ color: '#666' }}>
                <BookmarkIcon />
              </IconButton>
            </Box>
          </Paper>

          {/* Contact Card */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ 
              color: '#2a0140', 
              fontWeight: 600, 
              mb: 2,
              fontFamily: 'Rajdhani, sans-serif'
            }}>
              📞 Contact Us
            </Typography>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PhoneIcon />}
              href="tel:+918334032265"
              sx={{ mb: 1 }}
            >
              +91 83340 32265
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EmailIcon />}
              href="mailto:riken@drexcape.com"
              sx={{ mb: 1 }}
            >
              riken@drexcape.com
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<WhatsAppIcon />}
              href="https://wa.me/918334032265"
              target="_blank"
              sx={{ color: '#25d366', borderColor: '#25d366' }}
            >
              WhatsApp
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Form Component */}
      <BookingForm
        open={openBookingDialog}
        onClose={() => setOpenBookingDialog(false)}
        itemData={packageData}
        itemType="package"
      />

      {/* Image Dialog */}
      <Dialog 
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {packageData.images && packageData.images[currentImageIndex] && (
            <>
              <img
                src={packageData.images[currentImageIndex].url}
                alt={packageData.images[currentImageIndex].caption || `Package image ${currentImageIndex + 1}`}
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
                  {packageData.images[currentImageIndex].caption || `Image ${currentImageIndex + 1}`}
                </Typography>
                <Typography variant="body2">
                  {packageData.images[currentImageIndex].isFeatured ? 'Featured Image' : 'Gallery Image'}
                </Typography>
              </Box>
              
              {packageData.images.length > 1 && (
                <>
                  <IconButton 
                    onClick={handlePrevImage}
                    sx={{ 
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      }
                    }}
                  >
                    <ArrowBackIosIcon />
                  </IconButton>
                  <IconButton 
                    onClick={handleNextImage}
                    sx={{ 
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      }
                    }}
                  >
                    <ArrowForwardIosIcon />
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
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
          color: 'white',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600
        }}>
          Share This Package
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: '#333' }}>
            Share this amazing package with your friends and family!
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                onClick={() => handleSocialShare('facebook')}
                sx={{ 
                  color: '#1877f2', 
                  borderColor: '#1877f2',
                  '&:hover': { borderColor: '#1877f2', backgroundColor: 'rgba(24, 119, 242, 0.1)' }
                }}
              >
                Facebook
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Twitter />}
                onClick={() => handleSocialShare('twitter')}
                sx={{ 
                  color: '#1da1f2', 
                  borderColor: '#1da1f2',
                  '&:hover': { borderColor: '#1da1f2', backgroundColor: 'rgba(29, 161, 242, 0.1)' }
                }}
              >
                Twitter
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                onClick={() => handleSocialShare('whatsapp')}
                sx={{ 
                  color: '#25d366', 
                  borderColor: '#25d366',
                  '&:hover': { borderColor: '#25d366', backgroundColor: 'rgba(37, 211, 102, 0.1)' }
                }}
              >
                WhatsApp
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LinkedIn />}
                onClick={() => handleSocialShare('linkedin')}
                sx={{ 
                  color: '#0077b5', 
                  borderColor: '#0077b5',
                  '&:hover': { borderColor: '#0077b5', backgroundColor: 'rgba(0, 119, 181, 0.1)' }
                }}
              >
                LinkedIn
              </Button>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              value={window.location.href}
              variant="outlined"
              size="small"
              InputProps={{ readOnly: true }}
            />
            <Button
              variant="contained"
              onClick={handleCopyLink}
              sx={{
                background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                }
              }}
            >
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShareDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PackageDetail;