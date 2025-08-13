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
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  AttachMoney,
  CheckCircle,
  Error,
  ExpandMore,
  Visibility,
  Code
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const AIUsageSection = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [includeData, setIncludeData] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  useEffect(() => {
    fetchAIUsageStats();
  }, [period]);

  useEffect(() => {
    if (activeTab === 2) {
      fetchAIUsageLogs();
    }
  }, [activeTab, includeData]);

  const fetchAIUsageStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      console.log('🔍 Debug: Token exists:', !!token);
      console.log('🔍 Debug: Fetching from:', `http://localhost:3001/api/admin/dashboard/ai-usage?period=${period}`);
      
      const response = await fetch(
        buildApiUrl(`/api/admin/dashboard/ai-usage?period=${period}`),
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

  const fetchAIUsageLogs = async () => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        buildApiUrl(`/api/admin/dashboard/ai-usage/logs?includeData=${includeData}&limit=100`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        console.error('Failed to fetch AI usage logs');
      }
    } catch (err) {
      console.error('Error fetching AI usage logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogDetails = async (logId) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        buildApiUrl(`/api/admin/dashboard/ai-usage/logs/${logId}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedLog(data.log);
        setLogDialogOpen(true);
      }
    } catch (err) {
      console.error('Error fetching log details:', err);
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

  const formatJSON = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
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
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Requests
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(overallStats.totalRequests)}
                  </Typography>
                </Box>
                <TrendingUp color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Success Rate
                  </Typography>
                  <Typography variant="h4">
                    {overallStats.totalRequests > 0 
                      ? `${((overallStats.totalSuccess / overallStats.totalRequests) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </Typography>
                </Box>
                <CheckCircle color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4">
                    {formatTime(overallStats.avgResponseTime)}
                  </Typography>
                </Box>
                <Speed color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Cost
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(overallStats.totalCost)}
                  </Typography>
                </Box>
                <AttachMoney color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Endpoint Stats" />
          <Tab label="Recent Activity" />
          <Tab label="Detailed Logs" />
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

      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeData}
                  onChange={(e) => setIncludeData(e.target.checked)}
                />
              }
              label="Include Complete Input/Output Data"
            />
            <Button
              variant="outlined"
              onClick={fetchAIUsageLogs}
              disabled={logsLoading}
            >
              Refresh
            </Button>
          </Box>

          {logsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Response Time</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{log.endpoint}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.responseStatus} 
                          color={getStatusColor(log.responseStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatTime(log.responseTime)}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => fetchLogDetails(log._id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Log Details Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          AI Usage Log Details
          <Typography variant="body2" color="textSecondary">
            {selectedLog?.endpoint} - {new Date(selectedLog?.createdAt).toLocaleString()}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Request Data (Input)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    value={formatJSON(selectedLog.requestData)}
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: 'monospace', fontSize: '12px' }
                    }}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Response Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Status:</Typography>
                      <Chip 
                        label={selectedLog.responseStatus} 
                        color={getStatusColor(selectedLog.responseStatus)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Response Time:</Typography>
                      <Typography>{formatTime(selectedLog.responseTime)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Tokens Used:</Typography>
                      <Typography>{formatNumber(selectedLog.tokensUsed)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Cost:</Typography>
                      <Typography>{formatCurrency(selectedLog.cost)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">IP Address:</Typography>
                      <Typography>{selectedLog.ipAddress || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">User Agent:</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {selectedLog.userAgent || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {selectedLog.responseData && Object.keys(selectedLog.responseData).length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Response Data (Output)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      multiline
                      rows={15}
                      value={formatJSON(selectedLog.responseData)}
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                        style: { fontFamily: 'monospace', fontSize: '12px' }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIUsageSection;