import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Security,
  Key,
  People,
  Settings,
  Save,
  Refresh,
  Visibility,
  VisibilityOff,
  Edit,
  Delete,
  Add,
  Notifications,
  Storage,
  Speed,
  Lock
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [adminData, setAdminData] = useState(null);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Form states
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    pixabay: ''
  });
  const [systemSettings, setSystemSettings] = useState({
    enableNotifications: true,
    enableUsageTracking: true,
    enableCostTracking: true,
    maxRequestsPerMinute: 100,
    tokenLimit: 10000
  });
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 24,
    requirePasswordChange: false,
    enableTwoFactor: false,
    ipWhitelist: []
  });

  useEffect(() => {
    fetchAdminData();
    fetchSettings();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN_PROFILE), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdminData(data.admin);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const fetchSettings = async () => {
    // In a real app, this would fetch from backend
    // For now, using mock data
    setApiKeys({
      gemini: 'your-gemini-api-key',
      pixabay: 'your-pixabay-api-key'
    });
  };

  // Password change functions
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswords = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    setPasswordLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN_CHANGE_PASSWORD), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setChangePasswordDialog(false);
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        });
        setPasswordErrors({});
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setChangePasswordDialog(false);
    // Reset form
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setPasswordErrors({});
    setError('');
    setSuccess('');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* API Keys Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Key color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">API Keys</Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Gemini API Key"
                type={showPassword ? 'text' : 'password'}
                value={apiKeys.gemini}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Pixabay API Key"
                type={showPassword ? 'text' : 'password'}
                value={apiKeys.pixabay}
                onChange={(e) => setApiKeys({ ...apiKeys, pixabay: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {/* Test API keys */}}
                sx={{ mr: 1 }}
              >
                Test Keys
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Settings color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">System Settings</Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.enableNotifications}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      enableNotifications: e.target.checked
                    })}
                  />
                }
                label="Enable Notifications"
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.enableUsageTracking}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      enableUsageTracking: e.target.checked
                    })}
                  />
                }
                label="Enable Usage Tracking"
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.enableCostTracking}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      enableCostTracking: e.target.checked
                    })}
                  />
                }
                label="Enable Cost Tracking"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Max Requests per Minute"
                type="number"
                value={systemSettings.maxRequestsPerMinute}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  maxRequestsPerMinute: parseInt(e.target.value)
                })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Token Limit"
                type="number"
                value={systemSettings.tokenLimit}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  tokenLimit: parseInt(e.target.value)
                })}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Security color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Security Settings</Typography>
              </Box>

              <TextField
                fullWidth
                label="Session Timeout (hours)"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: parseInt(e.target.value)
                })}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.requirePasswordChange}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      requirePasswordChange: e.target.checked
                    })}
                  />
                }
                label="Require Password Change"
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.enableTwoFactor}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      enableTwoFactor: e.target.checked
                    })}
                  />
                }
                label="Enable Two-Factor Authentication"
                sx={{ mb: 2 }}
              />

              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => setChangePasswordDialog(true)}
                fullWidth
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin Profile */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Admin Profile</Typography>
              </Box>

              {adminData && (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Username"
                      secondary={adminData.username}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={adminData.email}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Role"
                      secondary={
                        <Chip 
                          label={adminData.role} 
                          color={adminData.role === 'super_admin' ? 'error' : 'primary'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Login"
                      secondary={adminData.lastLogin ? new Date(adminData.lastLogin).toLocaleString() : 'Never'}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Storage color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Database</Typography>
                    <Typography variant="body2" color="text.secondary">
                      MongoDB Atlas
                    </Typography>
                    <Chip label="Connected" color="success" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Performance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Response Time: ~500ms
                    </Typography>
                    <Chip label="Good" color="success" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Notifications color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Notifications</Typography>
                    <Typography variant="body2" color="text.secondary">
                      0 Pending
                    </Typography>
                    <Chip label="Clear" color="success" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Security color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Security</Typography>
                    <Typography variant="body2" color="text.secondary">
                      JWT Active
                    </Typography>
                    <Chip label="Secure" color="success" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSaveSettings}
          disabled={loading}
          size="large"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            margin="normal"
            error={!!passwordErrors.currentPassword}
            helperText={passwordErrors.currentPassword}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => togglePasswordVisibility('current')}>
                  {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          
          <TextField
            fullWidth
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            margin="normal"
            error={!!passwordErrors.newPassword}
            helperText={passwordErrors.newPassword}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => togglePasswordVisibility('new')}>
                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          
          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            margin="normal"
            error={!!passwordErrors.confirmPassword}
            helperText={passwordErrors.confirmPassword}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => togglePasswordVisibility('confirm')}>
                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} disabled={passwordLoading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleChangePassword}
            disabled={passwordLoading}
            startIcon={passwordLoading ? <CircularProgress size={20} /> : null}
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSettings; 