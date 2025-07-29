import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const AdminDebug = () => {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Admin Route Working!
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        If you can see this, the admin route is working correctly.
      </Typography>
      <Button variant="contained" color="primary">
        Test Button
      </Button>
    </Box>
  );
};

export default AdminDebug; 