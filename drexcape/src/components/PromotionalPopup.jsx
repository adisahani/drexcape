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
  Chip,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalOffer as OfferIcon,
  Discount as DiscountIcon,
  Flight as FlightIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { setCookie, getCookie, hasUserFilledContactForm, markUserAsContacted, deleteCookie } from '../utils/cookies';

const PromotionalPopup = ({ onFormSubmitted, forceOpen = false }) => {
  console.log('🎭 === PromotionalPopup component MOUNTING ===');
  console.log('  - forceOpen prop:', forceOpen);
  console.log('  - onFormSubmitted prop:', onFormSubmitted);
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [userProfile, setUserProfile] = useState(null);

  // Check if user has already submitted the form and handle auto-open
  useEffect(() => {
    console.log('🎭 === PromotionalPopup useEffect called ===');
    console.log('  - forceOpen:', forceOpen);
    
    // Check if user has already submitted the form
    const existingUserData = getCookie('drexcape_user_data');
    if (existingUserData) {
      try {
        const userData = JSON.parse(existingUserData);
        setUserProfile(userData);
        console.log('👤 Found existing user profile:', userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Auto-open after 5 seconds if not forced open
    if (!forceOpen) {
      const timer = setTimeout(() => {
        console.log('⏰ Auto-opening promotional popup after 5 seconds');
        setOpen(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🚀 Setting open to true because forceOpen is true');
      setOpen(true);
    }
  }, [forceOpen]); // Run on mount and when forceOpen changes

  const handleClose = () => {
    console.log('❌ === handleClose called ===');
    console.log('  - Setting open to false');
    setOpen(false);
    // Set cookie to 'dismissed' but don't prevent future forced opens
    setCookie('drexcape_popup_interacted', 'dismissed', 365);
    console.log('🍪 Set dismissed cookie - current cookies:', document.cookie);
    
    // Call the callback to close the parent component's state
    if (onFormSubmitted) {
      console.log('📞 Calling onFormSubmitted callback from handleClose');
      onFormSubmitted();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Phone number validation
    if (name === 'phone') {
      // Remove all non-digit characters
      const cleaned = value.replace(/\D/g, '');
      
      // Limit to 15 digits
      if (cleaned.length <= 15) {
        setFormData(prev => ({
          ...prev,
          [name]: cleaned
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid phone number (at least 10 digits, max 15)
    if (cleaned.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    if (cleaned.length > 15) {
      return 'Phone number cannot exceed 15 digits';
    }
    
    // Check for common patterns (optional)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return 'Please enter a valid phone number';
    }
    
    return null; // No error
  };

  // Name validation function
  const validateName = (name) => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Name cannot exceed 50 characters';
    }
    
    // Check for valid name pattern (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name.trim())) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    return null; // No error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 === handleSubmit called ===');
    console.log('  - formData:', formData);
    
    // Clear previous errors
    setErrors({});
    
    // Validate phone number
    const phoneError = validatePhoneNumber(formData.phone);
    if (phoneError) {
      console.log('❌ Phone validation error:', phoneError);
      setErrors(prev => ({
        ...prev,
        phone: phoneError
      }));
      return;
    }

    // Validate name
    const nameError = validateName(formData.name);
    if (nameError) {
      console.log('❌ Name validation error:', nameError);
      setErrors(prev => ({
        ...prev,
        name: nameError
      }));
      return;
    }
    
    setLoading(true);

    try {
      // Submit to backend API
      const response = await fetch('/api/promotional-leads/submit', {
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

      console.log('✅ Form submitted successfully');
      // Save to cookies
      setCookie('drexcape_user_data', JSON.stringify(formData), 365);
      markUserAsContacted();
      
      // Test if cookie was set correctly
      const testCookie = getCookie('drexcape_user_data');
      console.log('🍪 Test - Cookie after setting:', testCookie);
      
      setSubmitted(true);
      setTimeout(() => {
        console.log('🎉 Closing popup and calling callback');
        setOpen(false);
        // Call the callback if provided
        if (onFormSubmitted) {
          console.log('📞 Calling onFormSubmitted callback');
          onFormSubmitted();
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      // Fallback to cookies only
      console.log('🔄 Fallback to cookies only');
      setCookie('drexcape_user_data', JSON.stringify(formData), 365);
      markUserAsContacted();
      
      // Test if cookie was set correctly (fallback)
      const testCookie = getCookie('drexcape_user_data');
      console.log('🍪 Test - Cookie after setting (fallback):', testCookie);
      setSubmitted(true);
      setTimeout(() => {
        console.log('🎉 Closing popup and calling callback (fallback)');
        setOpen(false);
        // Call the callback if provided
        if (onFormSubmitted) {
          console.log('📞 Calling onFormSubmitted callback (fallback)');
          onFormSubmitted();
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.phone.trim();

  console.log('🎭 === PromotionalPopup RENDERING ===');
  console.log('  - open state:', open);
  console.log('  - forceOpen prop:', forceOpen);
  console.log('  - submitted state:', submitted);
  console.log('  - userProfile:', userProfile);

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
            {userProfile ? '🎉 Welcome Back!' : '🎉 Exclusive Travel Offers!'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ color: '#ffffff' }}>
        {!submitted ? (
          <>
            {userProfile ? (
              // Show user profile if they've already submitted
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: '#ffe066',
                      color: '#1a0033',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {userProfile.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                
                <Typography variant="h6" sx={{ color: '#ffe066', mb: 2 }}>
                  Welcome back, {userProfile.name}! 👋
                </Typography>
                
                <Box sx={{ 
                  background: 'rgba(255, 224, 102, 0.1)', 
                  borderRadius: '12px', 
                  p: 2, 
                  mb: 3,
                  border: '1px solid rgba(255, 224, 102, 0.3)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ color: '#ffe066', fontSize: 20 }} />
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {userProfile.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ color: '#ffe066', fontSize: 20 }} />
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {userProfile.phone}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ color: '#ffffff', mb: 2 }}>
                  You're already part of our exclusive travel community! 
                  Check your phone for the latest offers.
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="Profile Verified" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #4caf50, #45a049)',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Chip 
                    icon={<FlightIcon />} 
                    label="VIP Member" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #ffe066, #ffd700)',
                      color: '#1a0033',
                      fontWeight: 'bold'
                    }} 
                  />
                </Box>
                
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '400'
                }}>
                  🔒 Your profile is secure and you'll receive exclusive offers!
                </Typography>
              </Box>
            ) : (
              // Show form for new users
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
                    error={!!errors.name}
                    helperText={errors.name}
                    placeholder="Enter your full name"
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: '500',
                        fontSize: '1.1rem',
                        '& fieldset': {
                          borderColor: errors.name ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                        },
                        '&:hover fieldset': {
                          borderColor: errors.name ? '#ff4444' : '#ffe066',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: errors.name ? '#ff4444' : '#ffe066',
                        },
                        '&.Mui-error fieldset': {
                          borderColor: '#ff4444',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: errors.name ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: '500',
                        '&.Mui-focused': {
                          color: errors.name ? '#ff4444' : '#ffe066',
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        color: '#ff4444',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '0.9rem',
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
                    error={!!errors.phone}
                    helperText={errors.phone}
                    placeholder="Enter your phone number"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: '500',
                        fontSize: '1.1rem',
                        '& fieldset': {
                          borderColor: errors.phone ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                        },
                        '&:hover fieldset': {
                          borderColor: errors.phone ? '#ff4444' : '#ffe066',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: errors.phone ? '#ff4444' : '#ffe066',
                        },
                        '&.Mui-error fieldset': {
                          borderColor: '#ff4444',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: errors.phone ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: '500',
                        '&.Mui-focused': {
                          color: errors.phone ? '#ff4444' : '#ffe066',
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        color: '#ff4444',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '0.9rem',
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
            )}
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

      {!submitted && !userProfile && (
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