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
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api';
import ItineraryCard from './ItineraryCard';
import { parseItineraryDetails } from '../utils/itineraryParser';
import BookingForm from './BookingForm';
import { useAuth } from '../contexts/AuthContext';

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
  const [showContactForm, setShowContactForm] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [hasFetchedGallery, setHasFetchedGallery] = useState(false);
  const [travellers, setTravellers] = useState(1);
  
  // Booking state
  const [openBookingDialog, setOpenBookingDialog] = useState(false);

  // Get authentication state from context
  const { isUserLoggedIn, userData } = useAuth();

  // Process images from itinerary data
  const processImages = (itineraryData) => {
    if (!itineraryData) return [];

    const images = [];
    
    // Add header image (destination overview)
    if (itineraryData.headerImage && itineraryData.headerImage !== '/default-travel.jpg') {
      images.push({
        url: itineraryData.headerImage,
        label: 'Destination Overview',
        type: 'header'
      });
    }
    
    // Add gallery images (attractions) - exclude accommodation images
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
    
    // Ensure we have at least 2 images (removed accommodation requirement)
    while (images.length < 2) {
      images.push({
        url: '/default-travel.jpg',
        label: `Image ${images.length + 1}`,
        type: 'default'
      });
    }
    
    return images;
  };

  // Format detailed itinerary with proper decoration
  const formatDetailedItinerary = (details) => {
    if (!details) return null;

    try {
      // Check if details is an object (new structured format)
      if (typeof details === 'object' && details !== null) {
        // New structured format - details is the itinerary object itself
        const { 
          title, priceEstimate, transportDetails, accommodation, fullDayWisePlan, 
          meals, activitiesIncluded, terms, structuredDetails,
          dates, duration, transportClass, bookingLink
        } = details;
        
        // Use the correct price from the main itinerary object instead of priceEstimate
        const correctPrice = itinerary?.pricePP || itinerary?.price || priceEstimate;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Trip Title */}
            {title && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.15) 0%, rgba(109, 59, 189, 0.15) 100%)',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid rgba(160, 132, 232, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                textAlign: 'center'
              }}>
                <Typography variant="h3" sx={{
                        fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                        color: '#2a0140',
                  mb: 1
                }}>
                  {title}
                </Typography>
                {correctPrice && (
                  <Typography variant="h6" sx={{ color: '#6d3bbd', fontWeight: 600 }}>
                    ₹{correctPrice?.toLocaleString()} per person
                  </Typography>
                )}
                {dates && (
                  <Typography variant="body1" sx={{ color: '#8e44ad', fontWeight: 500, mt: 1 }}>
                    {dates} • {duration}
                  </Typography>
                )}
                    </div>
            )}
                  
            {/* Day Plans */}
            {fullDayWisePlan && fullDayWisePlan.length > 0 && (
                  <div style={{
                background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.15) 0%, rgba(109, 59, 189, 0.15) 100%)',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid rgba(160, 132, 232, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}>
                <Typography variant="h4" sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                          fontWeight: 700,
                        color: '#2a0140',
                  mb: 2,
                  textAlign: 'center'
                }}>
                  📅 Day-by-Day Itinerary
                </Typography>
                
                {fullDayWisePlan.map((day, index) => (
                  <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                        marginBottom: '1rem',
                    border: '1px solid rgba(160, 132, 232, 0.2)'
                  }}>
                    <Typography variant="h5" sx={{
                      fontFamily: 'Rajdhani, Orbitron, sans-serif',
                      fontWeight: 600,
                          color: '#6d3bbd',
                      mb: 1
                    }}>
                      {day.emoji} {day.title}
                    </Typography>
                    
                    {/* Use structured day plan data */}
                    {(() => {
                      // Check if we have structured data (new format)
                      if (day.morning || day.afternoon || day.evening) {
                        return (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2a0140', mb: 1 }}>
                                🌅 Morning
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {day.morning || 'Start your day with a refreshing breakfast and prepare for the day\'s adventures.'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2a0140', mb: 1 }}>
                                ☀️ Afternoon
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {day.afternoon || 'Explore the local attractions and enjoy the afternoon activities.'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2a0140', mb: 1 }}>
                                🌙 Evening
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {day.evening || 'Wind down with dinner and enjoy the evening atmosphere.'}
                              </Typography>
                            </Grid>
                          </Grid>
                        );
                      }
                      
                      // Fallback to parsing description (old format)
                      const description = day.description;
                      const sections = {
                        morning: '',
                        afternoon: '',
                        evening: ''
                      };
                      
                      // Enhanced parsing logic for better day planning
                      const sentences = description.split(/[.!?]+/).filter(s => s.trim());
                      
                      // If no sentences found, split by common separators
                      if (sentences.length === 0) {
                        const parts = description.split(/[,;]/).filter(s => s.trim());
                        parts.forEach((part, index) => {
                          const trimmedPart = part.trim();
                          if (!trimmedPart) return;
                          
                          if (index === 0) sections.morning = trimmedPart;
                          else if (index === 1) sections.afternoon = trimmedPart;
                          else sections.evening = trimmedPart;
                        });
                      } else {
                        sentences.forEach(sentence => {
                          const trimmedSentence = sentence.trim();
                          if (!trimmedSentence) return;
                          
                          const lowerSentence = trimmedSentence.toLowerCase();
                          
                          // Morning indicators
                          if (lowerSentence.includes('morning') || 
                              lowerSentence.includes('breakfast') || 
                              lowerSentence.includes('arrive') || 
                              lowerSentence.includes('check-in') ||
                              lowerSentence.includes('early') ||
                              lowerSentence.includes('departure') ||
                              lowerSentence.includes('flight')) {
                            sections.morning += (sections.morning ? '. ' : '') + trimmedSentence + '.';
                          }
                          // Afternoon indicators
                          else if (lowerSentence.includes('afternoon') || 
                                   lowerSentence.includes('lunch') || 
                                   lowerSentence.includes('explore') || 
                                   lowerSentence.includes('visit') ||
                                   lowerSentence.includes('tour') ||
                                   lowerSentence.includes('sightseeing') ||
                                   lowerSentence.includes('activity')) {
                            sections.afternoon += (sections.afternoon ? '. ' : '') + trimmedSentence + '.';
                          }
                          // Evening indicators
                          else if (lowerSentence.includes('evening') || 
                                   lowerSentence.includes('dinner') || 
                                   lowerSentence.includes('night') || 
                                   lowerSentence.includes('return') ||
                                   lowerSentence.includes('sunset') ||
                                   lowerSentence.includes('cruise') ||
                                   lowerSentence.includes('show')) {
                            sections.evening += (sections.evening ? '. ' : '') + trimmedSentence + '.';
                          }
                          // Default distribution based on sentence position
                          else {
                            const sentenceIndex = sentences.indexOf(sentence);
                            const totalSentences = sentences.length;
                            
                            if (sentenceIndex < totalSentences / 3) {
                              sections.morning += (sections.morning ? '. ' : '') + trimmedSentence + '.';
                            } else if (sentenceIndex < (totalSentences * 2) / 3) {
                              sections.afternoon += (sections.afternoon ? '. ' : '') + trimmedSentence + '.';
                            } else {
                              sections.evening += (sections.evening ? '. ' : '') + trimmedSentence + '.';
                            }
                          }
                        });
                      }
                      
                      // Smart content distribution to ensure all sections have content
                      const allContent = description.trim();
                      const hasMorning = sections.morning.length > 0;
                      const hasAfternoon = sections.afternoon.length > 0;
                      const hasEvening = sections.evening.length > 0;
                      
                      // If no sections have content, distribute the entire description
                      if (!hasMorning && !hasAfternoon && !hasEvening) {
                        const words = allContent.split(' ');
                        const wordCount = words.length;
                        
                        if (wordCount <= 10) {
                          // Short description - put in afternoon
                          sections.afternoon = allContent;
                        } else if (wordCount <= 20) {
                          // Medium description - split between morning and afternoon
                          const midPoint = Math.ceil(wordCount / 2);
                          sections.morning = words.slice(0, midPoint).join(' ');
                          sections.afternoon = words.slice(midPoint).join(' ');
                        } else {
                          // Long description - distribute across all three
                          const third = Math.ceil(wordCount / 3);
                          sections.morning = words.slice(0, third).join(' ');
                          sections.afternoon = words.slice(third, third * 2).join(' ');
                          sections.evening = words.slice(third * 2).join(' ');
                        }
                      } else {
                        // Some sections have content, fill empty ones intelligently
                        if (!hasMorning && (hasAfternoon || hasEvening)) {
                          // Extract first part for morning
                          const remainingContent = allContent.replace(sections.afternoon, '').replace(sections.evening, '').trim();
                          if (remainingContent) {
                            sections.morning = remainingContent.split('.')[0] + '.';
                          }
                        }
                        
                        if (!hasAfternoon && (hasMorning || hasEvening)) {
                          // Extract middle part for afternoon
                          const remainingContent = allContent.replace(sections.morning, '').replace(sections.evening, '').trim();
                          if (remainingContent) {
                            sections.afternoon = remainingContent.split('.')[0] + '.';
                          }
                        }
                        
                        if (!hasEvening && (hasMorning || hasAfternoon)) {
                          // Extract last part for evening
                          const remainingContent = allContent.replace(sections.morning, '').replace(sections.afternoon, '').trim();
                          if (remainingContent) {
                            sections.evening = remainingContent.split('.')[0] + '.';
                          }
                        }
                      }
                      
                      // Final fallback: if any section is still empty, distribute content
                      if (!sections.morning && !sections.afternoon && !sections.evening) {
                        sections.afternoon = allContent;
                      }
                      
                                              return (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2a0140', mb: 1 }}>
                                🌅 Morning
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {sections.morning || 'Start your day with a refreshing breakfast and prepare for the day\'s adventures.'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2a0140', mb: 1 }}>
                                ☀️ Afternoon
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {sections.afternoon || 'Explore the local attractions and enjoy the afternoon activities.'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2a0140', mb: 1 }}>
                                🌙 Evening
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {sections.evening || 'Wind down with dinner and enjoy the evening atmosphere.'}
                              </Typography>
                            </Grid>
                          </Grid>
                        );
                    })()}
                    
                    {day.meals && (
                      <Typography variant="body2" sx={{ 
                        color: '#6d3bbd', 
                                fontWeight: 600,
                        mt: 1,
                        fontStyle: 'italic'
                              }}>
                        🍽️ {day.meals}
                      </Typography>
                    )}
                              </div>
                            ))}
                          </div>
            )}

            {/* Hotel Information */}
            {(accommodation || structuredDetails?.accommodationDetails) && (
                  <div style={{
                background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.15) 0%, rgba(109, 59, 189, 0.15) 100%)',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid rgba(160, 132, 232, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}>
                <Typography variant="h4" sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                        fontWeight: 700,
                      color: '#2a0140',
                  mb: 2,
                  textAlign: 'center'
                }}>
                  🏨 Hotel Information
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Hotel Details */}
                  <Grid item xs={12} md={6}>
            <div style={{
                      background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(160, 132, 232, 0.2)',
                      height: '100%'
                    }}>
                      <Typography variant="h5" sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                        fontWeight: 600,
                  color: '#2a0140',
                        mb: 2
                      }}>
                        {structuredDetails?.accommodationDetails?.hotelName || accommodation?.name || 'Hotel Details'}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {(structuredDetails?.accommodationDetails?.hotelType || accommodation?.type) && (
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6d3bbd' }}>
                              Hotel Type
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {structuredDetails?.accommodationDetails?.hotelType || accommodation?.type}
                            </Typography>
                          </Grid>
                        )}
                        {(structuredDetails?.accommodationDetails?.location || accommodation?.location) && (
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6d3bbd' }}>
                              Location
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {structuredDetails?.accommodationDetails?.location || accommodation?.location}
                            </Typography>
                          </Grid>
                        )}
                        {(structuredDetails?.accommodationDetails?.roomType || accommodation?.roomType) && (
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6d3bbd' }}>
                              Room Type
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {structuredDetails?.accommodationDetails?.roomType || accommodation?.roomType}
                            </Typography>
                          </Grid>
                        )}
                        {(structuredDetails?.accommodationDetails?.nights || accommodation?.nights) && (
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6d3bbd' }}>
                              Nights
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {structuredDetails?.accommodationDetails?.nights || accommodation?.nights} nights
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      
                      {(structuredDetails?.accommodationDetails?.amenities || accommodation?.amenities) && 
                       (structuredDetails?.accommodationDetails?.amenities?.length > 0 || accommodation?.amenities?.length > 0) && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6d3bbd', mb: 1 }}>
                            Amenities
                          </Typography>
                    <div style={{
                      display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            {(structuredDetails?.accommodationDetails?.amenities || accommodation?.amenities || []).map((amenity, index) => (
                              <Chip
                                key={index}
                                label={amenity}
                                size="small"
                                sx={{
                                  background: 'rgba(160, 132, 232, 0.1)',
                        color: '#6d3bbd',
                                  fontWeight: 500
                                }}
                              />
                            ))}
                        </div>
                        </Box>
                      )}
                    </div>
                  </Grid>
                  
                  {/* Hotel Image and Map */}
                  <Grid item xs={12} md={6}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid rgba(160, 132, 232, 0.2)',
                      height: '100%'
                    }}>
                      {/* Hotel Image - Only show if valid image URL exists */}
                      {(structuredDetails?.accommodationDetails?.imageUrl || accommodation?.imageUrl) && 
                       !(structuredDetails?.accommodationDetails?.imageUrl || accommodation?.imageUrl)?.includes('default-travel') && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6d3bbd', mb: 1 }}>
                            Hotel Image
                          </Typography>
                          <img
                            src={structuredDetails?.accommodationDetails?.imageUrl || accommodation?.imageUrl}
                            alt={structuredDetails?.accommodationDetails?.hotelName || accommodation?.name || 'Hotel'}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid rgba(160, 132, 232, 0.2)'
                            }}
                            onError={(e) => {
                              // Hide the image if it fails to load
                              e.target.style.display = 'none';
                              e.target.parentNode.style.display = 'none';
                            }}
                          />
                        </Box>
                      )}
                      
                      {/* Google Maps - Only show if valid location exists */}
                      {(structuredDetails?.accommodationDetails?.location || accommodation?.location) && 
                       (structuredDetails?.accommodationDetails?.location || accommodation?.location)?.trim() !== '' && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6d3bbd', mb: 1 }}>
                            Location on Map
                          </Typography>
                          
                          {/* Direct Google Maps Link */}
                          <Box sx={{ mb: 2 }}>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(structuredDetails?.accommodationDetails?.location || accommodation?.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 600
                              }}
                            >
                              🗺️ View on Google Maps
                            </a>
                          </Box>
                          
                  <div style={{
                            width: '100%',
                            height: '200px',
                    borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid rgba(160, 132, 232, 0.2)'
                          }}>
                            <iframe
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDb6Ku22lExkz44SZ8eYqnm45AN1bOUC3g&q=${encodeURIComponent(structuredDetails?.accommodationDetails?.location || accommodation?.location)}`}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              onError={(e) => {
                                // Hide the map if it fails to load
                                e.target.style.display = 'none';
                                e.target.parentNode.style.display = 'none';
                              }}
                            />
                    </div>
                        </Box>
                                            )}
                    </div>
                  </Grid>
                </Grid>
                
                {/* Fallback: Show basic accommodation info if no structured details */}
                {!structuredDetails?.accommodationDetails && accommodation && (
                  <Box sx={{ mt: 3, p: 2, background: 'rgba(255, 255, 255, 0.8)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#2a0140', mb: 1 }}>
                      🏨 Accommodation Details
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666' }}>
                      {accommodation}
                    </Typography>
                  </Box>
                )}
                  </div>
                )}
                
            {/* Transport Information */}
            {transportDetails && (
                  <div style={{
                background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.15) 0%, rgba(109, 59, 189, 0.15) 100%)',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid rgba(160, 132, 232, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}>
                <Typography variant="h4" sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                        fontWeight: 700,
                      color: '#2a0140',
                  mb: 2,
                  textAlign: 'center'
                }}>
                  🚗 Transport Information
                </Typography>
                
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                  {transportDetails}
                </Typography>
                
                {transportClass && (
                  <Typography variant="body2" sx={{ 
                    color: '#6d3bbd', 
                    fontWeight: 600, 
                    mt: 2,
                    fontStyle: 'italic'
                  }}>
                    🎫 Class: {transportClass}
                  </Typography>
                )}
                  </div>
                )}

            {/* What's Included/Not Included */}
            {(activitiesIncluded || terms) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.15) 0%, rgba(109, 59, 189, 0.15) 100%)',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid rgba(160, 132, 232, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}>
                <Grid container spacing={3}>
                  {activitiesIncluded && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="h5" sx={{
                    fontFamily: 'Rajdhani, Orbitron, sans-serif',
                        fontWeight: 600,
                    color: '#2a0140',
                        mb: 2
                      }}>
                        ✅ Activities Included
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                        {activitiesIncluded}
                      </Typography>
                    </Grid>
                  )}
                  
                  {terms && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="h5" sx={{
                        fontFamily: 'Rajdhani, Orbitron, sans-serif',
                        fontWeight: 600,
                        color: '#2a0140',
                        mb: 2
                      }}>
                        📋 Terms & Conditions
                      </Typography>
                      {correctPrice && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600, 
                            color: '#6d3bbd', 
                            mb: 1,
                            fontSize: '1.1rem'
                          }}>
                            💰 Expected Price: ₹{correctPrice?.toLocaleString()} per person
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: '#005bea', 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            💳 Total Budget for {travellers} {travellers === 1 ? 'Traveler' : 'Travelers'}: ₹{(correctPrice * travellers)?.toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                        {terms}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                    </div>
                  )}
                  
            {/* Additional Information */}
            {meals && (
                    <div style={{
                background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.15) 0%, rgba(109, 59, 189, 0.15) 100%)',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid rgba(160, 132, 232, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}>
                <Typography variant="h4" sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                        fontWeight: 700,
                  color: '#2a0140',
                  mb: 2,
                  textAlign: 'center'
                }}>
                  ℹ️ Additional Information
                </Typography>
                
                <Grid container spacing={2}>
                  {meals && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#6d3bbd', mb: 1 }}>
                        🍽️ Meals
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {meals}
                      </Typography>
                    </Grid>
                  )}

                </Grid>
              </div>
            )}
          </div>
        );
      }
      
      // Fallback to old parsing method if no structured details
      const parsedData = parseItineraryDetails(details);
      const { days, accommodation, meals, transport } = parsedData;
    
    // Get package information if available
    const packageInfo = (typeof window !== 'undefined' && window.packageInfo) ? window.packageInfo : '';
    
    if (days.length === 0) {
      
      // Try to manually parse the details if the parser failed
      const manualDays = [];
      const lines = details.split('\n');
      let currentDay = null;
      let currentSection = '';
      let currentContent = [];
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        // Check for day headers
        const dayMatch = trimmedLine.match(/^Day (\d+):\s*(.+)/i);
        if (dayMatch) {
          // Save previous day if exists
          if (currentDay) {
            manualDays.push(currentDay);
          }
          
          // Start new day
          currentDay = {
            icon: getDayIcon(`Day ${dayMatch[1]}`),
            dayTitle: `Day ${dayMatch[1]}: ${dayMatch[2]}`,
            morning: '',
            afternoon: '',
            evening: ''
          };
          currentSection = '';
          currentContent = [];
        } else if (trimmedLine.match(/^(Morning|Afternoon|Evening|Night):/i)) {
          // Save previous section
          if (currentSection && currentContent.length > 0) {
            const content = currentContent.join('\n');
            switch (currentSection.toLowerCase()) {
              case 'morning':
                currentDay.morning = content;
                break;
              case 'afternoon':
                currentDay.afternoon = content;
                break;
              case 'evening':
                currentDay.evening = content;
                break;
            }
          }
          
          // Start new section
          currentSection = trimmedLine.match(/^([^:]+):/i)?.[1] || '';
          currentContent = [];
        } else if (currentDay && currentSection) {
          // Add to current section
          currentContent.push(trimmedLine);
        }
      });
      
      // Save last section
      if (currentDay && currentSection && currentContent.length > 0) {
        const content = currentContent.join('\n');
        switch (currentSection.toLowerCase()) {
          case 'morning':
            currentDay.morning = content;
            break;
          case 'afternoon':
            currentDay.afternoon = content;
            break;
          case 'evening':
            currentDay.evening = content;
            break;
        }
      }
      
      // Save last day
      if (currentDay) {
        manualDays.push(currentDay);
      }
      
      if (manualDays.length > 0) {
        return (
          <div>
            {manualDays.map((day, index) => (
              <ItineraryCard
                key={index}
                icon={day.icon}
                dayTitle={day.dayTitle}
                morning={day.morning}
                afternoon={day.afternoon}
                evening={day.evening}
              />
            ))}
          </div>
        );
      }
    }
    
    // If we have parsed days, render them
    if (days && days.length > 0) {
    return (
                <div>
        {days.map((day, index) => (
          <ItineraryCard
            key={index}
            icon={day.icon}
            dayTitle={day.dayTitle}
            morning={day.morning}
            afternoon={day.afternoon}
            evening={day.evening}
          />
        ))}
        </div>
      );
    }
    
    // Fallback: display as plain text
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
        border: '1px solid rgba(160, 132, 232, 0.2)'
      }}>
        <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
          📋 Itinerary Details
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', whiteSpace: 'pre-line' }}>
          {typeof details === 'string' ? details : 'No detailed itinerary available.'}
        </Typography>
        </div>
      );
    } catch (error) {
      console.error('❌ Error parsing itinerary details:', error);
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          border: '1px solid rgba(160, 132, 232, 0.2)'
        }}>
          <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
            📋 Itinerary Details
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', whiteSpace: 'pre-line' }}>
            {typeof details === 'string' ? details : 'No detailed itinerary available.'}
          </Typography>
        </div>
      );
    }
  };

  // Get icon for time sections
  const getTimeIcon = (time) => {
    switch (time?.toLowerCase()) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌆';
      case 'night': return '🌃';
      default: return '⏰';
    }
  };

  // Get icon for day sections
  const getDayIcon = (dayText) => {
    const dayNumber = dayText?.match(/Day (\d+)/i)?.[1];
    if (!dayNumber) return '📅';
    
    switch (parseInt(dayNumber)) {
      case 1: return '✈️'; // Arrival/Travel day
      case 2: return '🌄'; // Sightseeing day
      case 3: return '🚂'; // Activities day
      case 4: return '👋'; // Departure day
      case 5: return '🏖️'; // Beach/Relaxation day
      case 6: return '🎭'; // Cultural day
      case 7: return '🏔️'; // Adventure day
      default: return '📅';
    }
  };

  // Get icon for section titles
  const getSectionIcon = (title) => {
    switch (title?.toLowerCase()) {
      case 'accommodation': return '🏨';
      case 'transport': return '🚗';
      case 'activities': return '🎯';
      case 'meals': return '🍽️';
      default: return '📋';
    }
  };

  useEffect(() => {
    console.log('ItineraryDetailPage mounted with slug:', slug);
    console.log('Location state:', location.state);
    fetchItinerary();
  }, [slug]);

  useEffect(() => {
    if (itinerary) {
      console.log('🔄 Itinerary loaded:', itinerary);
      console.log('🔄 needsDetailedGeneration:', itinerary.needsDetailedGeneration);
      console.log('🔄 Current details state:', details);
      console.log('🔄 detailsLoading:', detailsLoading);
      console.log('🔄 hasAttemptedGeneration:', hasAttemptedGeneration);
      console.log('🔄 isUserLoggedIn:', isUserLoggedIn);
      
      const images = processImages(itinerary);
      setGalleryImages(images);
      
      // Set details from itinerary if not already set
      if (!details && itinerary.details) {
        console.log('🔄 Setting details from itinerary:', itinerary.details);
        setDetails(itinerary.details);
      }

        // Auto-fetch detailed itinerary if available (no button, for all users)
  if (!detailsLoading && (!details || Object.keys(details || {}).length === 0) && !hasAttemptedGeneration) {
    if (!itinerary.needsDetailedGeneration) {
      console.log('🔄 Auto-fetching existing detailed information');
      setHasAttemptedGeneration(true);
      // Add a small delay to prevent immediate re-triggering
      setTimeout(() => {
        generateDetailedItinerary();
      }, 1000);
    } else if (isUserLoggedIn && itinerary.needsDetailedGeneration) {
      console.log('🔄 Auto-generating detailed itinerary for logged-in user');
      setHasAttemptedGeneration(true);
      // Add a small delay to prevent immediate re-triggering
      setTimeout(() => {
        generateDetailedItinerary();
      }, 1000);
    }
  }

      // Fetch destination gallery images if missing or default
      const needsGallery = !itinerary.galleryImages || itinerary.galleryImages.length < 3 || itinerary.galleryImages.every((u) => !u || u.includes('default-travel'));
      const hasSearchTerms = (itinerary.destinations && itinerary.destinations.length) || (itinerary.placesToVisit && itinerary.placesToVisit.length);
      if (needsGallery) {
        if (hasSearchTerms && !hasFetchedGallery) {
          (async () => {
            try {
              const params = new URLSearchParams({
                destinations: JSON.stringify(itinerary.destinations || [itinerary.toLocation].filter(Boolean)),
                placesToVisit: JSON.stringify(itinerary.placesToVisit || []),
                highlights: JSON.stringify(itinerary.highlights || []),
                aiSearchTerms: JSON.stringify([itinerary.coverImageQuery].filter(Boolean))
              });
              const res = await fetch(buildApiUrl(`${API_ENDPOINTS.DESTINATION_GALLERY}?${params.toString()}`));
              const data = await res.json();
              if (data?.success && Array.isArray(data.images) && data.images.length) {
                const urls = data.images.map((img) => img.url).filter(Boolean);
                if (urls.length) {
                  setItinerary((prev) => ({ ...prev, galleryImages: urls }));
                }
              }
            } catch (e) {
              console.error('Gallery fetch failed:', e);
            }
          })();
          setHasFetchedGallery(true);
        }
      }
    }
  }, [itinerary, details, detailsLoading, hasAttemptedGeneration, hasFetchedGallery]);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First check if we have data in the location state
      const searchState = location.state;
      
      if (searchState && searchState.itineraryData) {
        setItinerary(searchState.itineraryData);
        setDetails(searchState.itineraryData.details);
        
        // Extract travelers count from state
        if (searchState.travellers) {
          setTravellers(searchState.travellers);
        }
        
        // No need to fetch details separately - they're in the main itinerary data
        return;
      }
      
      // If no search state, try to fetch from database
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ITINERARY_DETAILS(slug)), {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setItinerary(data.itinerary);
        setDetails(data.details); // Fix: use data.details instead of data.itinerary.details
      } else {
        setError('Itinerary not found. Please search again to generate a new itinerary.');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  // Generate detailed itinerary automatically
  const generateDetailedItinerary = async (retryCount = 0) => {
    const maxRetries = 2;
    
    if (retryCount >= maxRetries) {
      console.error('❌ Max retries reached for detailed generation');
      setError('Failed to generate detailed itinerary after multiple attempts. Please try again later.');
      setDetailsLoading(false);
      setHasAttemptedGeneration(false); // Reset to allow manual retry
      return;
    }
    console.log('🔄 Current itinerary data:', itinerary);
    
    // Check for different possible ID fields
    const itineraryId = itinerary?._id || itinerary?.id;
    
    if (!itinerary || !itineraryId) {
      console.error('No itinerary ID available for detailed generation');
      console.error('Itinerary:', itinerary);
      setError('No itinerary ID found. Please try refreshing the page.');
      return;
    }

    try {
      setDetailsLoading(true);
      setError('');
      
      // First, try to fetch existing detailed information
      console.log('🔄 Checking for existing detailed information for:', itineraryId);
      console.log('🔄 API URL:', buildApiUrl(API_ENDPOINTS.ITINERARY_DETAILS_BY_ID(itineraryId)));
      
      const existingResponse = await fetch(buildApiUrl(API_ENDPOINTS.ITINERARY_DETAILS_BY_ID(itineraryId)), {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      console.log('🔄 Existing response status:', existingResponse.status);
      console.log('🔄 Existing response ok:', existingResponse.ok);

      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        console.log('✅ Found existing detailed information:', existingData);
        setDetails(existingData.details);
        setDetailsLoading(false);
        return;
      } else {
        console.log('❌ No existing details found, status:', existingResponse.status);
      }

      // If no existing details, generate new ones
      console.log('🔄 No existing details found, generating new detailed itinerary for:', itineraryId);
      console.log('🔄 API URL:', buildApiUrl(API_ENDPOINTS.GENERATE_DETAILED_ITINERARY(itineraryId)));
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.GENERATE_DETAILED_ITINERARY(itineraryId)), {
        method: 'POST',
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });

      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Detailed itinerary auto-generated:', data);
        
        // Set the detailed information - handle both response formats
        if (data.details) {
          console.log('📋 Received details:', data.details);
          // Handle the structured details format from server
          if (data.details.structuredDetails) {
            const structured = data.details.structuredDetails;
            setDetails({
              dayPlans: data.details.fullDayWisePlan || [],
              accommodation: structured.accommodationDetails || {},
              transport: structured.transportDetails || {},
              meals: structured.mealsDetails || {},
              activities: structured.activitiesDetails || {},
              terms: structured.termsAndConditions || {},
              tripTitle: data.details.title,
              priceSummary: data.details.priceEstimate,
              mealCostEstimates: data.details.mealCostEstimates,
              whatsIncluded: structured.activitiesDetails?.included || [],
              whatsNotIncluded: structured.activitiesDetails?.optional || [],
              cancellationPolicy: structured.termsAndConditions?.cancellation,
              accessibility: data.details.accessibility,
              languages: data.details.languages,
              meetingPoint: data.details.meetingPoint,
              startTime: data.details.startTime,
              endTime: data.details.endTime
            });
          } else {
            // Handle legacy format
            setDetails(data.details);
          }
        } else if (data.itinerary) {
          // If server returns itinerary object, extract the details
          const itineraryData = data.itinerary;
          setDetails({
            dayPlans: itineraryData.dayPlans || JSON.parse(itineraryData.details || '[]'),
            accommodation: itineraryData.accommodation || itineraryData.accommodationDetails,
            transport: itineraryData.transport || itineraryData.transportDetails,
            meals: itineraryData.mealsDetails,
            activities: itineraryData.activitiesDetails,
            terms: itineraryData.termsAndConditions
          });
        }
        
        // Show success message
        setError('');
      } else {
        const errorData = await response.json();
        console.error('❌ Auto-generation failed:', errorData);
        
        // Retry on server errors (5xx)
        if (response.status >= 500 && retryCount < maxRetries) {
          console.log(`🔄 Retrying detailed generation (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => generateDetailedItinerary(retryCount + 1), 2000); // Wait 2 seconds before retry
          return;
        }
        
        setError(`Failed to generate detailed itinerary: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Auto-generation error:', err);
      
      // Retry on network errors
      if (retryCount < maxRetries && (err.name === 'AbortError' || err.message.includes('fetch'))) {
        console.log(`🔄 Retrying detailed generation due to network error (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => generateDetailedItinerary(retryCount + 1), 2000); // Wait 2 seconds before retry
        return;
      }
      
      setError('Failed to generate detailed itinerary. Please try again.');
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

  const handlePrintDetails = () => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintContent = () => {
    const printStyles = `
      <style>
        @media print {
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6d3bbd; padding-bottom: 20px; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-title { color: #2a0140; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #a084e8; padding-bottom: 5px; }
          .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .detail-item { background: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 3px solid #6d3bbd; }
          .detail-label { font-weight: bold; color: #6d3bbd; margin-bottom: 5px; }
          .day-card { background: #f8f9fa; padding: 15px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e0e0e0; }
          .day-header { font-weight: bold; color: #2a0140; margin-bottom: 10px; font-size: 16px; }
          .time-section { margin-bottom: 10px; }
          .time-label { font-weight: bold; color: #6d3bbd; margin-bottom: 5px; }
          .amenities-grid { display: flex; flex-wrap: wrap; gap: 8px; }
          .amenity-tag { background: #e8f4fd; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .package-info { background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .terms-section { background: #fff8f0; padding: 15px; border-radius: 8px; }
          @page { margin: 1in; }
        }
      </style>
    `;

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${itinerary?.title || 'Travel Itinerary'}</title>
        ${printStyles}
      </head>
      <body>
        <div class="header">
          <h1>${itinerary?.title || 'Travel Itinerary'}</h1>
          <p><strong>From:</strong> ${itinerary?.fromLocation} | <strong>To:</strong> ${itinerary?.toLocation}</p>
          <p><strong>Duration:</strong> ${itinerary?.days} Days | <strong>Travelers:</strong> ${itinerary?.travelers} | <strong>Class:</strong> ${itinerary?.travelClass}</p>
          <p><strong>Price:</strong> ₹${itinerary?.price?.toLocaleString() || 'N/A'}</p>
          <p><strong>Total Budget for ${travellers} ${travellers === 1 ? 'Traveler' : 'Travelers'}:</strong> ₹${((itinerary?.price || itinerary?.pricePP) * travellers)?.toLocaleString() || 'N/A'}</p>
        </div>
    `;

    // Add accommodation details
    if (details?.structuredDetails?.accommodationDetails) {
      const acc = details.structuredDetails.accommodationDetails;
      content += `
        <div class="section">
          <div class="section-title">🏨 Accommodation Details</div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Hotel Name</div>
              <div>${acc.hotelName || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Hotel Type</div>
              <div>${acc.hotelType || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Duration</div>
              <div>${acc.nights || 'N/A'} ${acc.nights === 1 ? 'Night' : 'Nights'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Room Type</div>
              <div>${acc.roomType || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Location</div>
              <div>${acc.location || 'N/A'}</div>
            </div>
          </div>
          ${acc.amenities && acc.amenities.length > 0 ? `
            <div class="detail-item">
              <div class="detail-label">Amenities</div>
              <div class="amenities-grid">
                ${acc.amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Add transport details
    if (details?.structuredDetails?.transportDetails) {
      const trans = details.structuredDetails.transportDetails;
      content += `
        <div class="section">
          <div class="section-title">🚗 Transport Details</div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Arrival</div>
              <div>${trans.arrival || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Departure</div>
              <div>${trans.departure || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Local Transport</div>
              <div>${trans.local || 'N/A'}</div>
            </div>
          </div>
          ${trans.included && trans.included.length > 0 ? `
            <div class="detail-item">
              <div class="detail-label">Included Services</div>
              <ul>${trans.included.map(item => `<li>${item}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Add meals details
    if (details?.structuredDetails?.mealsDetails) {
      const meals = details.structuredDetails.mealsDetails;
      content += `
        <div class="section">
          <div class="section-title">🍽️ Meals Information</div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Breakfast</div>
              <div>${meals.breakfast || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Lunch</div>
              <div>${meals.lunch || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Dinner</div>
              <div>${meals.dinner || 'N/A'}</div>
            </div>
          </div>
          ${meals.included && meals.included.length > 0 ? `
            <div class="detail-item">
              <div class="detail-label">Included Meals</div>
              <ul>${meals.included.map(meal => `<li>${meal}</li>`).join('')}</ul>
            </div>
          ` : ''}
          ${meals.recommendations && meals.recommendations.length > 0 ? `
            <div class="detail-item">
              <div class="detail-label">Restaurant Recommendations</div>
              <ul>${meals.recommendations.map(restaurant => `<li>${restaurant}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Add activities details
    if (details?.structuredDetails?.activitiesDetails) {
      const activities = details.structuredDetails.activitiesDetails;
      content += `
        <div class="section">
          <div class="section-title">🎯 Activities & Experiences</div>
          ${activities.included && activities.included.length > 0 ? `
            <div class="detail-item">
              <div class="detail-label">Included Activities</div>
              <ul>${activities.included.map(activity => `<li>${activity}</li>`).join('')}</ul>
            </div>
          ` : ''}
          ${activities.optional && activities.optional.length > 0 ? `
            <div class="detail-item">
              <div class="detail-label">Optional Activities</div>
              <ul>${activities.optional.map(activity => `<li>${activity}</li>`).join('')}</ul>
            </div>
          ` : ''}
          ${activities.guides ? `
            <div class="detail-item">
              <div class="detail-label">Guide Services</div>
              <div>${activities.guides}</div>
            </div>
          ` : ''}
          ${activities.tickets ? `
            <div class="detail-item">
              <div class="detail-label">Tickets & Entry</div>
              <div>${activities.tickets}</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Add daily itinerary
    if (details?.fullDayWisePlan && details.fullDayWisePlan.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">📅 Daily Itinerary</div>
      `;
      
      details.fullDayWisePlan.forEach((day, index) => {
        content += `
          <div class="day-card">
            <div class="day-header">${day.emoji || '📅'} ${day.title}</div>
            <div class="time-section">
              <div class="time-label">Activities:</div>
              <div>${day.description || 'No activities planned'}</div>
            </div>
          </div>
        `;
      });
      
      content += `</div>`;
    }

    // Add terms and conditions
    if (details?.structuredDetails?.termsAndConditions) {
      const terms = details.structuredDetails.termsAndConditions;
      content += `
        <div class="section">
          <div class="section-title">📋 Terms & Conditions</div>
          <div class="terms-section">
            ${(itinerary?.pricePP || itinerary?.price || details.priceEstimate) ? `
              <div class="detail-item">
                <div class="detail-label">💰 Expected Price</div>
                <div style="font-weight: 600; color: #6d3bbd; font-size: 1.1rem;">₹${(itinerary?.pricePP || itinerary?.price || details.priceEstimate)?.toLocaleString()} per person</div>
              </div>
            ` : ''}
            ${terms.priceInclusions && terms.priceInclusions.length > 0 ? `
              <div class="detail-item">
                <div class="detail-label">Price Inclusions</div>
                <ul>${terms.priceInclusions.map(item => `<li>${item}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${terms.priceExclusions && terms.priceExclusions.length > 0 ? `
              <div class="detail-item">
                <div class="detail-label">Price Exclusions</div>
                <ul>${terms.priceExclusions.map(item => `<li>${item}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${terms.cancellation ? `
              <div class="detail-item">
                <div class="detail-label">Cancellation Policy</div>
                <div>${terms.cancellation}</div>
              </div>
            ` : ''}
            ${terms.validity ? `
              <div class="detail-item">
                <div class="detail-label">Offer Validity</div>
                <div>${terms.validity}</div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Add raw details if available
    if (details?.details) {
      content += `
        <div class="section">
          <div class="section-title">📄 Complete Itinerary Details</div>
          <div class="package-info">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; margin: 0;">${details.details}</pre>
          </div>
        </div>
      `;
    }

    content += `
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 12px;">
          <p>Generated by Drexcape - Smart Travel Itinerary Generator</p>
          <p>Powered by Dream Place Tour & Travels</p>
        </div>
      </body>
      </html>
    `;

    return content;
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
    const isDetailedGenerationError = error.includes('Failed to generate detailed itinerary');
    
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="error" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
            {error}
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isDetailedGenerationError && (
              <Button
                variant="contained"
                onClick={() => {
                  setError('');
                  setHasAttemptedGeneration(false);
                  setDetailsLoading(false);
                  generateDetailedItinerary();
                }}
                disabled={detailsLoading}
                sx={{ 
                  px: 4, 
                  py: 2,
                  background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {detailsLoading ? '🔄 Generating...' : '🔄 Retry Generation'}
              </Button>
            )}
            
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
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
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
                    <strong>{travellers} Travelers</strong>
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
            
            {/* Price Information */}
            {(itinerary.price || itinerary.pricePP) && (
              <Box sx={{ 
                mt: 3, 
                p: 3, 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid rgba(255, 193, 7, 0.3)', 
                borderRadius: '12px' 
              }}>
                <Typography variant="h6" sx={{ color: '#856404', mb: 2, fontWeight: 600 }}>
                  💰 Pricing for {travellers} {travellers === 1 ? 'Traveler' : 'Travelers'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney sx={{ color: '#6d3bbd' }} />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        <strong>Per Person:</strong> ₹{(itinerary.pricePP || itinerary.price)?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney sx={{ color: '#005bea' }} />
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#005bea' }}>
                        <strong>Total Budget:</strong> ₹{((itinerary.pricePP || itinerary.price) * travellers)?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Book Now Button */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setOpenBookingDialog(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 100%)',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #a084e8 0%, #6d3bbd 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(109, 59, 189, 0.3)'
                      }
                    }}
                  >
                    🎯 Book Now
                  </Button>
                </Box>
              </Box>
            )}
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
        {console.log('🔍 Conditional Debug:', {
          isUserLoggedIn,
          details: !!details,
          detailsKeys: details ? Object.keys(details) : [],
          detailsLength: details ? Object.keys(details).length : 0,
          detailsLoading,
          detailsObject: details,
          condition1: !isUserLoggedIn,
          condition2: isUserLoggedIn && detailsLoading,
          condition3: isUserLoggedIn && details && Object.keys(details).length > 0 && !detailsLoading
        })}
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
        ) : (isUserLoggedIn && detailsLoading) ? (
          // Loading state for detailed generation
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
              <CircularProgress 
                size={60} 
                sx={{ 
                  color: '#a084e8',
                  mb: 3
                }} 
              />
              <Typography 
                variant="h4" 
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  color: '#2a0140',
                  mb: 2
                }}
              >
                🔄 Generating Detailed Itinerary
              </Typography>
              <Typography 
                variant="body1" 
                sx={{
                  color: '#666',
                  maxWidth: '500px',
                  margin: '0 auto',
                  fontSize: '1.1rem'
                }}
              >
                Please wait while we create your personalized day-wise travel plan with accommodation details and booking information...
              </Typography>
            </Box>
          </Paper>
                ) : (isUserLoggedIn && details && Object.keys(details).length > 0 && !detailsLoading) ? (
          // Detailed itinerary content for logged-in users - Beautiful Design
          <>
            {console.log('🎯 RENDERING DETAILED CONTENT - details:', details)}
            <Paper 
              elevation={8} 
              sx={{ 
                p: 4, 
                mb: 4,
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
            {/* Beautiful header with gradient */}
            <Box sx={{ 
              mb: 4, 
              pb: 3, 
              borderBottom: '2px solid rgba(160, 132, 232, 0.2)',
              position: 'relative'
            }}>
              <Typography 
                variant="h3" 
                sx={{
                  fontFamily: 'Rajdhani, Orbitron, sans-serif',
                  fontWeight: 700,
                  fontSize: '2.5rem',
                  textAlign: 'center',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}
              >
                <span style={{ fontSize: '2.5rem' }}>📅</span>
                <span style={{
                  background: 'linear-gradient(135deg, #2a0140 0%, #6d3bbd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Day-wise Plan
                </span>
              </Typography>
              <Typography 
                variant="body1" 
                sx={{
                  color: '#666',
                textAlign: 'center',
                  fontSize: '1.1rem',
                  fontStyle: 'italic'
              }}
            >
                Your complete travel itinerary with detailed daily activities
            </Typography>
            </Box>
            
                         {/* Beautiful day sections */}
             <Box sx={{ 
               color: '#2a0140',
               lineHeight: 1.6,
               '& .day-section': {
                 mb: 2,
                 p: 2,
                 borderRadius: 3,
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                 border: '1px solid rgba(160, 132, 232, 0.2)',
                 boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                 position: 'relative',
                 overflow: 'hidden'
               },
              '& .day-section::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #a084e8 0%, #6d3bbd 100%)'
              },
                             '& .day-title': {
                    fontWeight: 700,
                 fontSize: '1.3rem',
                 mb: 2,
                              display: 'flex', 
                              alignItems: 'center',
                 gap: 0.75,
                 color: '#2a0140',
                 paddingBottom: '0.75rem',
                 borderBottom: '1px solid rgba(160, 132, 232, 0.2)'
               },
               '& .day-separator': {
                 color: '#a084e8',
                 fontWeight: 'bold',
                 fontSize: '1rem',
                 marginBottom: '1rem',
                 textAlign: 'center'
                              },
                              '& .time-section': {
                 mb: 2,
                 pl: 1.5
               },
                             '& .time-title': {
                                fontWeight: 600,
                 color: '#6d3bbd',
                 mb: 1,
                 fontSize: '1rem',
                      display: 'flex', 
                      alignItems: 'center', 
                 gap: 0.5
               },
               '& .activity-list': {
                 pl: 2
               },
               '& .activity-item': {
                 mb: 1,
                 display: 'flex',
                 alignItems: 'flex-start',
                 gap: 0.75,
                 fontSize: '0.95rem',
                 lineHeight: 1.5
               },
              '& .bullet': {
                color: '#a084e8',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                lineHeight: 1
              },
              '& .section-title': {
                      fontWeight: 700,
                fontSize: '1.2rem',
                color: '#2a0140',
                mb: 2,
                mt: 4,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                paddingTop: '1rem',
                borderTop: '2px solid rgba(160, 132, 232, 0.2)'
              },
              '& .section-content': {
                pl: 3,
                mb: 2
              }
            }}>
              {details ? (
              <>
                {console.log('🎯 About to call formatDetailedItinerary with:', details)}
                {(() => {
                  const result = formatDetailedItinerary(details);
                  console.log('🎯 formatDetailedItinerary result:', result);
                  return result;
                })()}
              </>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                    📋 Itinerary Details
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    {itinerary?.details || 'No detailed itinerary available.'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          </>
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

      {/* Booking Form Component */}
      <BookingForm
        open={openBookingDialog}
        onClose={() => setOpenBookingDialog(false)}
        itemData={itinerary}
        itemType="itinerary"
      />

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