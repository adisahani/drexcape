import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  AttachMoney,
  CheckCircle,
  Error
} from '@mui/icons-material';

const AIUsageSection = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchAIUsageStats();
  }, [period]);

  const fetchAIUsageStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      console.log('🔍 Debug: Token exists:', !!token);
      console.log('🔍 Debug: Fetching from:', `http://localhost:3001/api/admin/dashboard/ai-usage?period=${period}`);
      
      const response = await fetch(
        `http://localhost:3001/api/admin/dashboard/ai-usage?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('🔍 Debug: Response status:', response.status);
      console.log('🔍 Debug: Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Debug: Data received:', data);
        setStats(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('🔍 Debug: Error response:', errorData);
        setError(`Failed to fetch AI usage statistics: ${errorData.error || response.statusText}`);
      }
    } catch (err) {
      console.log('🔍 Debug: Network error:', err);
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

  const formatTime = (ms) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'success' : 'error';
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

  if (!stats) {
    return (
      <Alert severity="info">
        No data available for the selected period.
      </Alert>
    );
  }

  const { overallStats, endpointStats, recentActivity } = stats;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Usage Analytics
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Overall Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Requests
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
                    {overallStats.totalRequests > 0 
                      ? `${((overallStats.totalSuccess / overallStats.totalRequests) * 100).toFixed(1)}%`
                      : '0%'
                    }
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
                    {formatTime(overallStats.avgResponseTime)}
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
                    Total Cost
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

      {/* Tabs for different views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Endpoint Breakdown" />
          <Tab label="Recent Activity" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {endpointStats.map((endpoint) => (
            <Grid item xs={12} md={6} lg={4} key={endpoint._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {endpoint._id.replace('-', ' ').toUpperCase()}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Requests: {formatNumber(endpoint.count)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Success Rate: {endpoint.count > 0 
                        ? `${((endpoint.successCount / endpoint.count) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Response: {formatTime(endpoint.avgResponseTime)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cost: {formatCurrency(endpoint.totalCost)}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip 
                      icon={<CheckCircle />} 
                      label={`${endpoint.successCount} Success`} 
                      color="success" 
                      size="small" 
                    />
                    <Chip 
                      icon={<Error />} 
                      label={`${endpoint.errorCount} Errors`} 
                      color="error" 
                      size="small" 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Endpoint</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Tokens Used</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentActivity.map((activity) => (
                <TableRow key={activity._id}>
                  <TableCell>{activity.endpoint}</TableCell>
                  <TableCell>
                    <Chip 
                      label={activity.responseStatus} 
                      color={getStatusColor(activity.responseStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatTime(activity.responseTime)}</TableCell>
                  <TableCell>{formatNumber(activity.tokensUsed)}</TableCell>
                  <TableCell>{formatCurrency(activity.cost)}</TableCell>
                  <TableCell>
                    {new Date(activity.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AIUsageSection;