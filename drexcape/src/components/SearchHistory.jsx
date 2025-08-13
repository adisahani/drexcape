import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete,
  History,
  LocationOn,
  CalendarToday,
  People,
  AttachMoney,
  Refresh
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const SearchHistory = ({ onSearchSelect, userId }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchSearchHistory = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SEARCH_HISTORY(userId)));
      
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.searchHistory || []);
      } else {
        setError('Failed to load search history');
      }
    } catch (err) {
      console.error('Error fetching search history:', err);
      setError('Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchHistory();
  }, [userId]);

  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.DELETE_SEARCH_HISTORY(itemId)), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSearchHistory(prev => prev.filter(item => item._id !== itemId));
        setDeleteDialogOpen(false);
        setSelectedItem(null);
      } else {
        setError('Failed to delete search history item');
      }
    } catch (err) {
      console.error('Error deleting search history:', err);
      setError('Failed to delete search history item');
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLEAR_SEARCH_HISTORY(userId)), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSearchHistory([]);
        setDeleteDialogOpen(false);
        setSelectedItem(null);
      } else {
        setError('Failed to clear search history');
      }
    } catch (err) {
      console.error('Error clearing search history:', err);
      setError('Failed to clear search history');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  const formatPriceRange = (priceRange) => {
    if (!priceRange) return 'All prices';
    return `₹${priceRange.min?.toLocaleString()} - ₹${priceRange.max?.toLocaleString()}`;
  };

  const handleSearchSelect = (searchData) => {
    // Convert the stored search data back to the format expected by the search form
    const formattedSearchData = {
      from: searchData.from,
      to: searchData.to,
      travellers: searchData.travellers,
      departureDate: new Date(searchData.departureDate),
      returnDate: new Date(searchData.returnDate),
      startDate: searchData.startDate,
      endDate: searchData.endDate,
      priceRange: [searchData.priceRange?.min || 0, searchData.priceRange?.max || 50000]
    };
    
    onSearchSelect(formattedSearchData);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
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

  if (searchHistory.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <History sx={{ fontSize: 48, color: '#a084e8', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
          No Search History
        </Typography>
        <Typography variant="body2" sx={{ color: '#999' }}>
          Your search history will appear here after you make some searches.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ 
          fontFamily: 'Rajdhani, Orbitron, sans-serif',
          fontWeight: 600,
          color: '#2a0140',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <History sx={{ color: '#a084e8' }} />
          Recent Searches
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={fetchSearchHistory}
            sx={{ color: '#a084e8' }}
          >
            <Refresh />
          </IconButton>
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedItem({ type: 'all' });
              setDeleteDialogOpen(true);
            }}
            sx={{ 
              borderColor: '#a084e8',
              color: '#a084e8',
              '&:hover': {
                borderColor: '#6d3bbd',
                backgroundColor: 'rgba(160, 132, 232, 0.1)'
              }
            }}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        {searchHistory.map((item) => (
          <ListItem
            key={item._id}
            sx={{
              border: '1px solid rgba(160, 132, 232, 0.2)',
              borderRadius: 1,
              mb: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(160, 132, 232, 0.05)',
                borderColor: '#a084e8'
              }
            }}
            onClick={() => handleSearchSelect(item.searchData)}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationOn sx={{ fontSize: 16, color: '#a084e8' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2a0140' }}>
                    {item.searchData.from} → {item.searchData.to}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  <Chip
                    icon={<People sx={{ fontSize: 16 }} />}
                    label={`${item.searchData.travellers} Traveler${item.searchData.travellers > 1 ? 's' : ''}`}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(160, 132, 232, 0.1)',
                      color: '#6d3bbd'
                    }}
                  />
                  
                  <Chip
                    icon={<CalendarToday sx={{ fontSize: 16 }} />}
                    label={`${item.searchData.startDate} - ${item.searchData.endDate}`}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(160, 132, 232, 0.1)',
                      color: '#6d3bbd'
                    }}
                  />
                  
                  <Chip
                    icon={<AttachMoney sx={{ fontSize: 16 }} />}
                    label={formatPriceRange(item.searchData.priceRange)}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(160, 132, 232, 0.1)',
                      color: '#6d3bbd'
                    }}
                  />
                  
                  <Typography variant="caption" sx={{ color: '#999', ml: 'auto' }}>
                    {formatDate(item.createdAt)}
                  </Typography>
                </Box>
              }
            />
            
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                  setDeleteDialogOpen(true);
                }}
                sx={{ color: '#a084e8' }}
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedItem?.type === 'all' 
              ? 'Are you sure you want to clear all search history?'
              : 'Are you sure you want to delete this search from your history?'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (selectedItem?.type === 'all') {
                handleClearAll();
              } else {
                handleDeleteItem(selectedItem._id);
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchHistory;
