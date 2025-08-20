import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Paper } from '@mui/material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const ConnectionDebug = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    // Test 1: Health check
    try {
      console.log('Testing health check...');
      const healthResponse = await fetch(buildApiUrl('/api/health'));
      const healthData = await healthResponse.json();
      results.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthData
      };
      console.log('Health check result:', results.health);
    } catch (error) {
      results.health = {
        status: 'error',
        ok: false,
        error: error.message
      };
      console.error('Health check error:', error);
    }

    // Test 2: Test endpoint
    try {
      console.log('Testing test endpoint...');
      const testResponse = await fetch(buildApiUrl('/api/test'));
      const testData = await testResponse.json();
      results.test = {
        status: testResponse.status,
        ok: testResponse.ok,
        data: testData
      };
      console.log('Test endpoint result:', results.test);
    } catch (error) {
      results.test = {
        status: 'error',
        ok: false,
        error: error.message
      };
      console.error('Test endpoint error:', error);
    }

    // Test 3: Blog categories
    try {
      console.log('Testing blog categories...');
      const blogResponse = await fetch(buildApiUrl(API_ENDPOINTS.BLOG_CATEGORIES));
      const blogData = await blogResponse.json();
      results.blogs = {
        status: blogResponse.status,
        ok: blogResponse.ok,
        data: blogData
      };
      console.log('Blog categories result:', results.blogs);
    } catch (error) {
      results.blogs = {
        status: 'error',
        ok: false,
        error: error.message
      };
      console.error('Blog categories error:', error);
    }

    // Test 4: Package categories
    try {
      console.log('Testing package categories...');
      const packageResponse = await fetch(buildApiUrl(API_ENDPOINTS.PACKAGE_CATEGORIES));
      const packageData = await packageResponse.json();
      results.packages = {
        status: packageResponse.status,
        ok: packageResponse.ok,
        data: packageData
      };
      console.log('Package categories result:', results.packages);
    } catch (error) {
      results.packages = {
        status: 'error',
        ok: false,
        error: error.message
      };
      console.error('Package categories error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusColor = (ok) => {
    return ok ? 'success' : 'error';
  };

  const getStatusText = (ok) => {
    return ok ? '✅ Working' : '❌ Failed';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'white' }}>
        🔧 API Connection Debug
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          Current Configuration
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace' }}>
          Hostname: {window.location.hostname}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace' }}>
          API Base URL: {buildApiUrl('')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace' }}>
          User Agent: {navigator.userAgent}
        </Typography>
      </Paper>

      <Button 
        variant="contained" 
        onClick={runTests} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={20} /> : '🔄 Run Tests'}
      </Button>

      {Object.entries(testResults).map(([testName, result]) => (
        <Paper key={testName} sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            {testName.charAt(0).toUpperCase() + testName.slice(1)} Test
          </Typography>
          
          <Alert severity={getStatusColor(result.ok)} sx={{ mb: 1 }}>
            {getStatusText(result.ok)} - Status: {result.status}
          </Alert>
          
          {result.error && (
            <Typography variant="body2" sx={{ color: '#ff6b6b', fontFamily: 'monospace' }}>
              Error: {result.error}
            </Typography>
          )}
          
          {result.data && (
            <Typography variant="body2" sx={{ color: 'white', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Response: {JSON.stringify(result.data, null, 2)}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default ConnectionDebug;
