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
  Avatar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { setCookie, getCookie, hasUserFilledContactForm, markUserAsContacted, deleteCookie } from '../utils/cookies';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const UserLogin = ({ onLoginSuccess, onClose, forceOpen = false, isUserLoggedIn = false }) => {
  const { handleUserLogin } = useAuth();
  const [open, setOpen] = useState(forceOpen && !isUserLoggedIn);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    phone: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle forceOpen and isUserLoggedIn changes
  useEffect(() => {
    if (forceOpen && !isUserLoggedIn) {
      setOpen(true);
    } else if (isUserLoggedIn) {
      setOpen(false);
    }
  }, [forceOpen, isUserLoggedIn]);

  const handleClose = () => {
    setOpen(false);
    setError('');
    setSuccess('');
    if (onClose) onClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
    setLoginErrors({});
    setRegisterErrors({});
  };

  // Password visibility toggle handlers
  const handleToggleLoginPassword = () => setShowLoginPassword(!showLoginPassword);
  const handleToggleRegisterPassword = () => setShowRegisterPassword(!showRegisterPassword);
  const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const validatePhone = (phone) => {
    console.log('📱 Validating phone:', phone);
    const cleaned = phone.replace(/\D/g, '');
    console.log('📱 Cleaned phone:', cleaned);
    
    if (cleaned.length < 10) {
      console.log('❌ Phone too short:', cleaned.length);
      return 'Phone number must be at least 10 digits';
    }
    if (cleaned.length > 15) {
      console.log('❌ Phone too long:', cleaned.length);
      return 'Phone number cannot exceed 15 digits';
    }
    console.log('✅ Phone validation passed');
    return null;
  };

  const validatePassword = (password) => {
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  };

  const validateEmail = (email) => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    
    if (loginErrors[name]) {
      setLoginErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    
    if (registerErrors[name]) {
      setRegisterErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Login attempt with:', { phone: loginData.phone, passwordLength: loginData.password.length });

    // Validate login form
    const errors = {};
    const phoneError = validatePhone(loginData.phone);
    if (phoneError) {
      console.log('❌ Phone validation error:', phoneError);
      errors.phone = phoneError;
    }
    if (!loginData.password) {
      console.log('❌ Password validation error: Password is required');
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      console.log('❌ Validation errors:', errors);
      setLoginErrors(errors);
      setLoading(false);
      return;
    }

    console.log('✅ Validation passed, making API call...');

    try {
      // Normalize phone number (remove all non-digits)
      const normalizedPhone = loginData.phone.replace(/\D/g, '');
      
              const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          password: loginData.password
        })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        console.log('❌ Login failed:', data.error);
        throw new Error(data.error || 'Login failed');
      }

      console.log('✅ Login successful, updating auth context...');
      // Update authentication context
      handleUserLogin(data.user);
      
      setSuccess('Login successful!');
      setTimeout(() => {
        handleClose();
        if (onLoginSuccess) onLoginSuccess(data.user);
      }, 1500);
    } catch (error) {
      console.log('❌ Login error:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('📝 Registration attempt with:', { 
      name: registerData.name, 
      phone: registerData.phone, 
      email: registerData.email,
      passwordLength: registerData.password.length 
    });

    // Validate register form
    const errors = {};
    const nameError = validateName(registerData.name);
    if (nameError) errors.name = nameError;
    
    const phoneError = validatePhone(registerData.phone);
    if (phoneError) errors.phone = phoneError;
    
    const emailError = validateEmail(registerData.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(registerData.password);
    if (passwordError) errors.password = passwordError;
    
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      console.log('❌ Registration validation errors:', errors);
      setRegisterErrors(errors);
      setLoading(false);
      return;
    }

    console.log('✅ Registration validation passed, making API call...');

    try {
      // Normalize phone number (remove all non-digits)
      const normalizedPhone = registerData.phone.replace(/\D/g, '');
      
              const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerData.name,
          phone: normalizedPhone,
          email: registerData.email,
          password: registerData.password
        })
      });

      console.log('📡 Registration response status:', response.status);
      const data = await response.json();
      console.log('📡 Registration response data:', data);

      if (!response.ok) {
        console.log('❌ Registration failed:', data.error);
        throw new Error(data.error || 'Registration failed');
      }

      console.log('✅ Registration successful, updating auth context...');
      // Update authentication context
      handleUserLogin(data.user);
      
      setSuccess('Registration successful!');
      setTimeout(() => {
        handleClose();
        if (onLoginSuccess) onLoginSuccess(data.user);
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
          <PersonIcon sx={{ fontSize: 28, color: '#ffe066' }} />
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
            Welcome to Drexcape
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ color: '#ffffff' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: '600',
              '&.Mui-selected': {
                color: '#ffe066'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ffe066'
            }
          }}
        >
          <Tab 
            icon={<LoginIcon />} 
            label="Login" 
            iconPosition="start"
          />
          <Tab 
            icon={<RegisterIcon />} 
            label="Register" 
            iconPosition="start"
          />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {activeTab === 0 ? (
          // Login Form
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={loginData.phone}
              onChange={handleLoginInputChange}
              error={!!loginErrors.phone}
              helperText={loginErrors.phone}
              placeholder="Enter your phone number"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: loginErrors.phone ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: loginErrors.phone ? '#ff4444' : '#ffe066',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: loginErrors.phone ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: loginErrors.phone ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: loginErrors.phone ? '#ff4444' : '#ffe066',
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
              label="Password"
              name="password"
              type={showLoginPassword ? "text" : "password"}
              value={loginData.password}
              onChange={handleLoginInputChange}
              error={!!loginErrors.password}
              helperText={loginErrors.password}
              placeholder="Enter your password"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleToggleLoginPassword}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showLoginPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: loginErrors.password ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: loginErrors.password ? '#ff4444' : '#ffe066',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: loginErrors.password ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: loginErrors.password ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: loginErrors.password ? '#ff4444' : '#ffe066',
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
              🔒 Your data is secure and encrypted
            </Typography>
          </Box>
        ) : (
          // Register Form
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={registerData.name}
              onChange={handleRegisterInputChange}
              error={!!registerErrors.name}
              helperText={registerErrors.name}
              placeholder="Enter your full name"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: registerErrors.name ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: registerErrors.name ? '#ff4444' : '#ffe066',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: registerErrors.name ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: registerErrors.name ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: registerErrors.name ? '#ff4444' : '#ffe066',
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
              value={registerData.phone}
              onChange={handleRegisterInputChange}
              error={!!registerErrors.phone}
              helperText={registerErrors.phone}
              placeholder="Enter your phone number"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: registerErrors.phone ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: registerErrors.phone ? '#ff4444' : '#ffe066',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: registerErrors.phone ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: registerErrors.phone ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: registerErrors.phone ? '#ff4444' : '#ffe066',
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
              label="Email (Optional)"
              name="email"
              type="email"
              value={registerData.email}
              onChange={handleRegisterInputChange}
              error={!!registerErrors.email}
              helperText={registerErrors.email}
              placeholder="Enter your email address"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: registerErrors.email ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: registerErrors.email ? '#ff4444' : '#ffe066',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: registerErrors.email ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: registerErrors.email ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: registerErrors.email ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#ff4444',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '0.9rem',
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showRegisterPassword ? "text" : "password"}
              value={registerData.password}
              onChange={handleRegisterInputChange}
              error={!!registerErrors.password}
              helperText={registerErrors.password}
              placeholder="Enter your password"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleToggleRegisterPassword}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showRegisterPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: registerErrors.password ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: registerErrors.password ? '#ff4444' : '#ffe066',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: registerErrors.password ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: registerErrors.password ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: registerErrors.password ? '#ff4444' : '#ffe066',
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
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={registerData.confirmPassword}
              onChange={handleRegisterInputChange}
              error={!!registerErrors.confirmPassword}
              helperText={registerErrors.confirmPassword}
              placeholder="Confirm your password"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleToggleConfirmPassword}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: registerErrors.confirmPassword ? '#ff4444' : 'rgba(255, 224, 102, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: registerErrors.confirmPassword ? '#ff4444' : '#ffe066',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: registerErrors.confirmPassword ? '#ff4444' : '#ffe066',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: registerErrors.confirmPassword ? '#ff4444' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: registerErrors.confirmPassword ? '#ff4444' : '#ffe066',
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
              🔒 Your data is secure and encrypted
            </Typography>
          </Box>
        )}
      </DialogContent>

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
          Cancel
        </Button>
        <Button
          onClick={activeTab === 0 ? handleLogin : handleRegister}
          disabled={loading}
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
          {loading ? 'Processing...' : (activeTab === 0 ? 'Login' : 'Register')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserLogin; 