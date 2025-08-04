import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  People,
  Flight,
  AttachMoney,
  Speed,
  CheckCircle,
  Error,
  Notifications,
  Settings,
  Refresh
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        buildApiUrl('/api/admin/dashboard/ai-usage?period=7d'),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      setError('Network error while fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const overallStats = stats?.overallStats || {
    totalRequests: 0,
    totalSuccess: 0,
    totalErrors: 0,
    avgResponseTime: 0,
    totalTokens: 0,
    totalCost: 0
  };

  const successRate = overallStats.totalRequests > 0 
    ? ((overallStats.totalSuccess / overallStats.totalRequests) * 100).toFixed(1)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Overview
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDashboardStats}
        >
          Refresh
        </Button>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Requests (7d)
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(overallStats.totalRequests)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Success Rate
                  </Typography>
                  <Typography variant="h4">
                    {successRate}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Speed color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4">
                    {(overallStats.avgResponseTime / 1000).toFixed(2)}s
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoney color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Cost (7d)
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(overallStats.totalCost)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <List>
                <ListItem button>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText 
                    primary="View AI Usage Analytics" 
                    secondary="Detailed usage statistics and charts"
                  />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <People />
                  </ListItemIcon>
                  <ListItemText 
                    primary="User Management" 
                    secondary="Manage admin users and permissions"
                  />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText 
                    primary="System Settings" 
                    secondary="Configure API keys and system preferences"
                  />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Notifications" 
                    secondary="View system alerts and notifications"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Backend Server" 
                    secondary="Running on port 3001"
                  />
                  <Chip label="Online" color="success" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="MongoDB Database" 
                    secondary="Connected to Atlas cluster"
                  />
                  <Chip label="Connected" color="success" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="AI Services" 
                    secondary="Gemini API operational"
                  />
                  <Chip label="Active" color="success" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Image Services" 
                    secondary="Pixabay API operational"
                  />
                  <Chip label="Active" color="success" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity Summary
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last 7 days of AI usage activity
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {formatNumber(overallStats.totalSuccess)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful Requests
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="error">
                  {formatNumber(overallStats.totalErrors)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed Requests
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="info">
                  {formatNumber(overallStats.totalTokens)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tokens Used
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardOverview; 