import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Person, Phone, Email, Save } from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const UserDataForm = ({ open, onClose, onUserDataSubmit, searchData }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    marketingConsent: false,
    newsletterSubscription: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          searchData // Include the current search data
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('userData', JSON.stringify(data.user));
        onUserDataSubmit(data.user);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save user data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Person sx={{ mr: 1 }} />
          <Typography variant="h6">
            Complete Your Profile
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please provide your details to view personalized travel itineraries. 
            Your information helps us create better travel recommendations.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          <TextField
            fullWidth
            label="Email Address (Optional)"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
              />
            }
            label="I agree to receive personalized travel offers and updates"
            sx={{ mb: 1 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="newsletterSubscription"
                checked={formData.newsletterSubscription}
                onChange={handleChange}
              />
            }
            label="Subscribe to our newsletter for travel tips and deals"
            sx={{ mb: 2 }}
          />

          {searchData && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Your Search Details:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchData.from} → {searchData.to} • {searchData.travellers} travelers • {searchData.travelClass}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue to Itineraries'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserDataForm; 