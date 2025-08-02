import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalOffer as OfferIcon,
  Discount as DiscountIcon,
  Flight as FlightIcon
} from '@mui/icons-material';

const PromotionalPopup = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if user has already submitted or dismissed
    const hasInteracted = localStorage.getItem('drexcape_popup_interacted');
    if (!hasInteracted) {
      // Show popup after 5 seconds
      const timer = setTimeout(() => {
        setOpen(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('drexcape_popup_interacted', 'dismissed');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to backend API
      const response = await fetch('http://localhost:3001/api/promotional-leads/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      // Save to localStorage as backup
      localStorage.setItem('drexcape_user_data', JSON.stringify(formData));
      localStorage.setItem('drexcape_popup_interacted', 'submitted');
      
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Fallback to localStorage only
      localStorage.setItem('drexcape_user_data', JSON.stringify(formData));
      localStorage.setItem('drexcape_popup_interacted', 'submitted');
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.phone.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(255, 224, 102, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: '#ffe066', 
        textAlign: 'center',
        position: 'relative',
        pb: 1
      }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#ffe066'
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <DiscountIcon sx={{ fontSize: 28, color: '#ffe066' }} />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '0.5px',
              textShadow: '0 0 10px rgba(255, 224, 102, 0.3)'
            }}
          >
            🎉 Exclusive Travel Offers!
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ color: '#ffffff' }}>
        {!submitted ? (
          <>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#ffe066', 
                  mb: 2,
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '600',
                  letterSpacing: '0.3px'
                }}
              >
                Unlock Amazing Deals!
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2, 
                  opacity: 0.9,
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '400',
                  fontSize: '1.1rem'
                }}
              >
                Get exclusive discounts and personalized travel recommendations
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
                <Chip 
                  icon={<FlightIcon />} 
                  label="Up to 40% OFF" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #ffe066, #ffd700)',
                    color: '#1a0033',
                    fontWeight: 'bold'
                  }} 
                />
                <Chip 
                  icon={<OfferIcon />} 
                  label="Free Travel Guide" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #a084e8, #6d3bbd)',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }} 
                />
                <Chip 
                  icon={<DiscountIcon />} 
                  label="VIP Access" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #ff4ecd, #a084e8)',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }} 
                />
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                             <TextField
                 fullWidth
                 label="Your Name"
                 name="name"
                 value={formData.name}
                 onChange={handleInputChange}
                 sx={{
                   mb: 2,
                   '& .MuiOutlinedInput-root': {
                     color: '#ffffff',
                     fontFamily: 'Rajdhani, sans-serif',
                     fontWeight: '500',
                     fontSize: '1.1rem',
                     '& fieldset': {
                       borderColor: 'rgba(255, 224, 102, 0.5)',
                     },
                     '&:hover fieldset': {
                       borderColor: '#ffe066',
                     },
                     '&.Mui-focused fieldset': {
                       borderColor: '#ffe066',
                     },
                   },
                   '& .MuiInputLabel-root': {
                     color: 'rgba(255, 255, 255, 0.7)',
                     fontFamily: 'Rajdhani, sans-serif',
                     fontWeight: '500',
                     '&.Mui-focused': {
                       color: '#ffe066',
                     },
                   },
                 }}
                 required
               />
              
                             <TextField
                 fullWidth
                 label="Phone Number"
                 name="phone"
                 value={formData.phone}
                 onChange={handleInputChange}
                 sx={{
                   mb: 3,
                   '& .MuiOutlinedInput-root': {
                     color: '#ffffff',
                     fontFamily: 'Rajdhani, sans-serif',
                     fontWeight: '500',
                     fontSize: '1.1rem',
                     '& fieldset': {
                       borderColor: 'rgba(255, 224, 102, 0.5)',
                     },
                     '&:hover fieldset': {
                       borderColor: '#ffe066',
                     },
                     '&.Mui-focused fieldset': {
                       borderColor: '#ffe066',
                     },
                   },
                   '& .MuiInputLabel-root': {
                     color: 'rgba(255, 255, 255, 0.7)',
                     fontFamily: 'Rajdhani, sans-serif',
                     fontWeight: '500',
                     '&.Mui-focused': {
                       color: '#ffe066',
                     },
                   },
                 }}
                 required
               />

                             <Typography variant="body2" sx={{ 
                 color: 'rgba(255, 255, 255, 0.7)', 
                 fontSize: '0.9rem',
                 textAlign: 'center',
                 mb: 2,
                 fontFamily: 'Rajdhani, sans-serif',
                 fontWeight: '400'
               }}>
                 🔒 Your data is secure. We'll only send you amazing travel deals!
               </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" sx={{ color: '#ffe066', mb: 2 }}>
              🎉 Thank You!
            </Typography>
            <Typography variant="body1" sx={{ color: '#ffffff', mb: 2 }}>
              Welcome to the Drexcape family! You'll receive exclusive offers soon.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Chip 
                label="Check your phone for SMS" 
                sx={{ 
                  background: 'linear-gradient(135deg, #ffe066, #ffd700)',
                  color: '#1a0033',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      {!submitted && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleClose}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#ffffff'
              }
            }}
          >
            Maybe Later
          </Button>
                     <Button
             onClick={handleSubmit}
             disabled={!isFormValid || loading}
             sx={{
               background: 'linear-gradient(135deg, #ffe066, #ffd700)',
               color: '#1a0033',
               fontWeight: 'bold',
               px: 3,
               fontFamily: 'Rajdhani, sans-serif',
               fontSize: '1.1rem',
               letterSpacing: '0.5px',
               '&:hover': {
                 background: 'linear-gradient(135deg, #ffd700, #ffe066)',
                 transform: 'translateY(-2px)',
                 boxShadow: '0 8px 25px rgba(255, 224, 102, 0.4)'
               },
               '&:disabled': {
                 background: 'rgba(255, 255, 255, 0.1)',
                 color: 'rgba(255, 255, 255, 0.3)'
               }
             }}
           >
             {loading ? 'Sending...' : 'Get Exclusive Offers!'}
           </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PromotionalPopup; 