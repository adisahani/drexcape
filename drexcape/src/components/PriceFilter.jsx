import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';

const PriceFilter = ({ onPriceChange, initialPriceRange = [0, 50000] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const dropdownRef = useRef(null);

  const priceCategories = [
    { label: 'All Prices', value: 'all', range: [0, 50000] },
    { label: 'Ultra Budget (₹0 - ₹8,000)', value: 'ultra-budget', range: [0, 8000] },
    { label: 'Budget (₹8,000 - ₹15,000)', value: 'budget', range: [8000, 15000] },
    { label: 'Economy (₹15,000 - ₹25,000)', value: 'economy', range: [15000, 25000] },
    { label: 'Mid-Range (₹25,000 - ₹40,000)', value: 'mid-range', range: [25000, 40000] },
    { label: 'Premium (₹40,000 - ₹60,000)', value: 'premium', range: [40000, 60000] },
    { label: 'Luxury (₹60,000+)', value: 'luxury', range: [60000, 100000] }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.value);
    onPriceChange(category.range);
    setIsOpen(false);
  };

  const getSelectedLabel = () => {
    const selected = priceCategories.find(cat => cat.value === selectedCategory);
    return selected ? selected.label : 'All Prices';
  };

  return (
    <Box ref={dropdownRef} sx={{ position: 'relative' }}>
      {/* Trigger Button */}
      <Box
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          background: 'rgba(255,255,255,0.22)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '200px',
          '&:hover': {
            background: 'rgba(255,255,255,0.3)',
          }
        }}
      >
        <span>Price Range</span>
        <span style={{ fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
      </Box>

      {/* Dropdown Menu */}
      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(160, 132, 232, 0.2)',
            borderRadius: '12px',
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          <List sx={{ p: 0 }}>
            {priceCategories.map((category) => (
              <ListItem
                key={category.value}
                onClick={() => handleCategorySelect(category)}
                sx={{
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(160, 132, 232, 0.1)',
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(160, 132, 232, 0.1)'
                  },
                  backgroundColor: selectedCategory === category.value ? 'rgba(160, 132, 232, 0.15)' : 'transparent'
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: selectedCategory === category.value ? 600 : 500,
                        color: selectedCategory === category.value ? '#6d3bbd' : '#2a0140',
                        fontSize: '0.9rem'
                      }}
                    >
                      {category.label}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default PriceFilter;
