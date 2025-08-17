import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Box
} from '@mui/material';
import {
  CheckCircle
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api';

const BookingForm = ({ 
  open, 
  onClose, 
  itemData, 
  itemType = 'package' // 'package' or 'itinerary'
}) => {
  const [bookingData, setBookingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    travelers: 1,
    preferredDate: '',
    specialRequests: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    
    const requestData = {
      packageId: itemData._id,
      packageSlug: itemData.slug,
      packageTitle: itemData.title,
      packagePrice: itemData.pricePP || itemData.price,
      itemType: itemType, // Add item type for backend tracking
      ...bookingData
    };
    
    console.log('📦 Sending booking request:', requestData);
    console.log('🔗 API URL:', buildApiUrl(API_ENDPOINTS.PACKAGE_BOOK));
    console.log('🔑 Headers:', getAuthHeaders());
    
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PACKAGE_BOOK), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (response.ok) {
        console.log('✅ Booking successful');
        setBookingSuccess(true);
        setTimeout(() => {
          onClose();
          setBookingSuccess(false);
          setBookingData({
            fullName: '',
            email: '',
            phone: '',
            travelers: 1,
            preferredDate: '',
            specialRequests: ''
          });
        }, 2000);
      } else {
        console.log('❌ Booking failed:', data.error);
        setBookingError(data.error || 'Failed to submit booking request');
      }
    } catch (error) {
      console.error('❌ Error submitting booking:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setBookingError('Failed to submit booking request. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getItemSummary = () => {
    if (itemType === 'itinerary') {
      return {
        title: itemData?.title,
        duration: itemData?.duration,
        fromLocation: itemData?.fromLocation,
        toLocation: itemData?.toLocation,
        price: itemData?.pricePP || itemData?.price,
        icon: '🗺️',
        label: 'Itinerary Summary'
      };
    } else {
      return {
        title: itemData?.title,
        duration: itemData?.travelDetails?.duration,
        fromLocation: itemData?.travelDetails?.fromLocation,
        toLocation: itemData?.travelDetails?.toLocation,
        price: itemData?.pricing?.basePrice || itemData?.price,
        icon: '📦',
        label: 'Package Summary'
      };
    }
  };

  const summary = getItemSummary();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 100%)',
        color: 'white',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        fontSize: '1.5rem',
        textAlign: 'center',
        py: 3
      }}>
        🎯 Book Your Dream {itemType === 'itinerary' ? 'Itinerary' : 'Package'}
      </DialogTitle>
      
      {bookingSuccess ? (
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            py: 4
          }}>
            <CheckCircle sx={{ 
              fontSize: 80, 
              color: '#4caf50', 
              mb: 3,
              animation: 'pulse 2s infinite'
            }} />
            <Typography variant="h5" sx={{ 
              color: '#2a0140', 
              fontWeight: 600, 
              mb: 2,
              fontFamily: 'Rajdhani, sans-serif'
            }}>
              Booking Request Submitted!
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#666', 
              mb: 3,
              fontFamily: 'Rajdhani, sans-serif'
            }}>
              Thank you for choosing Drexcape! We'll contact you within 24 hours to confirm your booking.
            </Typography>
            <Chip 
              label="Booking ID will be sent to your email"
              sx={{ 
                background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
        </DialogContent>
      ) : (
        <form onSubmit={handleBooking}>
          <DialogContent sx={{ p: 4 }}>
            {/* Item Summary */}
            <Paper elevation={2} sx={{ 
              p: 3, 
              mb: 4, 
              background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.1) 0%, rgba(109, 59, 189, 0.1) 100%)',
              border: '1px solid rgba(160, 132, 232, 0.2)',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ 
                color: '#2a0140', 
                fontWeight: 600, 
                mb: 2,
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                {summary.icon} {summary.label}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#666', 
                mb: 1,
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                <strong>{summary.title}</strong>
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#666',
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                {summary.duration} Days • {summary.fromLocation} → {summary.toLocation}
              </Typography>
              <Typography variant="h6" sx={{ 
                color: '#6d3bbd', 
                fontWeight: 600, 
                mt: 1,
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                ₹{summary.price?.toLocaleString()}
                {summary.price && ' per person'}
              </Typography>
            </Paper>

            {bookingError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {bookingError}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  value={bookingData.fullName}
                  onChange={(e) => setBookingData({...bookingData, fullName: e.target.value})}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(160, 132, 232, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#a084e8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#a084e8',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(160, 132, 232, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#a084e8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#a084e8',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(160, 132, 232, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#a084e8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#a084e8',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Travelers *"
                  type="number"
                  value={bookingData.travelers}
                  onChange={(e) => setBookingData({...bookingData, travelers: e.target.value})}
                  required
                  inputProps={{ min: 1, max: 20 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(160, 132, 232, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#a084e8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#a084e8',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred Travel Date *"
                  type="date"
                  value={bookingData.preferredDate}
                  onChange={(e) => setBookingData({...bookingData, preferredDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(160, 132, 232, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#a084e8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#a084e8',
                      },
                    },
                  }}
                />
              </Grid>
                             <Grid item xs={12}>
                 <TextField
                   fullWidth
                   label="Special Requests or Preferences"
                   multiline
                   rows={6}
                   value={bookingData.specialRequests}
                   onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                   placeholder="Tell us about any special requirements, dietary preferences, or specific activities you'd like to include..."
                   sx={{
                     '& .MuiOutlinedInput-root': {
                       '& fieldset': {
                         borderColor: 'rgba(160, 132, 232, 0.3)',
                       },
                       '&:hover fieldset': {
                         borderColor: '#a084e8',
                       },
                       '&.Mui-focused fieldset': {
                         borderColor: '#a084e8',
                       },
                     },
                     '& .MuiInputBase-input': {
                       minHeight: '120px !important',
                       maxHeight: '200px'
                     }
                   }}
                 />
               </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(160, 132, 232, 0.05)', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ 
                color: '#666', 
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.9rem'
              }}>
                💡 <strong>What happens next?</strong> After submitting your booking request, our travel experts will contact you within 24 hours to discuss your preferences and confirm the final details.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 0 }}>
            <Button 
              onClick={onClose}
              sx={{ 
                color: '#666',
                '&:hover': { color: '#333' }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={bookingLoading}
              startIcon={bookingLoading ? <CircularProgress size={20} color="inherit" /> : null}
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
                },
                '&:disabled': {
                  background: '#ccc'
                }
              }}
            >
              {bookingLoading ? 'Submitting...' : 'Submit Booking Request'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

export default BookingForm;
