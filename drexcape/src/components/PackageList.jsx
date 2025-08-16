import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Rating,
  InputAdornment,
  Container,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  Star as StarIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [duration, setDuration] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [currentPage, search, category, minPrice, maxPrice, duration]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PACKAGE_CATEGORIES));
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(search && { search }),
        ...(category && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(duration && { duration })
      });

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.PACKAGES_PUBLISHED}?${params}`));
      const data = await response.json();

      if (response.ok) {
        setPackages(data.packages);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        setError(data.error || 'Failed to fetch packages');
      }
    } catch (error) {
      setError('Failed to fetch packages');
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = (pkg) => {
    navigate(`/package/${pkg.slug}`, {
      state: { packageData: pkg }
    });
  };

  const getDiscountedPrice = (basePrice, discountPercentage) => {
    const price = parseFloat(basePrice);
    const discount = parseFloat(discountPercentage);
    return price * (1 - discount / 100);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setDuration('');
    setCurrentPage(1);
  };

  if (loading && packages.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
          📦 Travel Packages
        </Typography>
        <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 500 }}>
          Discover amazing travel experiences curated just for you
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SearchIcon sx={{ mr: 1, color: '#a084e8' }} />
            <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600 }}>
              Search Packages
            </Typography>
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search packages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: '#a084e8' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                placeholder="Min Price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                placeholder="Max Price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                sx={{ width: '100%' }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Count */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
          Showing {packages.length} of {total} packages
        </Typography>
        {packages.length > 0 && (
          <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
            Page {currentPage} of {totalPages}
          </Typography>
        )}
      </Box>

      {/* Packages Grid */}
      {packages.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Grid container spacing={3} sx={{ maxWidth: '1200px' }}>
              {packages.map((pkg) => (
                <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => handlePackageClick(pkg)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={pkg.images && pkg.images.length > 0 ? pkg.images[0].url : '/default-travel.jpg'}
                      alt={pkg.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2a0140' }}>
                        {pkg.title}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 2, color: '#2a0140', lineHeight: 1.4, fontWeight: 400 }}>
                        {pkg.shortDescription}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Chip 
                          label={pkg.category} 
                          size="small" 
                          sx={{ mr: 1, mb: 1, background: '#a084e8', color: 'white' }}
                        />
                        {pkg.pricing.discountPercentage > 0 && (
                          <Chip 
                            label={`${pkg.pricing.discountPercentage}% OFF`} 
                            size="small" 
                            color="error"
                          />
                        )}
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#2a0140', mb: 0.5, fontWeight: 500 }}>
                          <FlightIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {pkg.travelDetails.fromLocation} → {pkg.travelDetails.toLocation}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#2a0140', fontWeight: 500 }}>
                          <HotelIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {pkg.travelDetails.duration} Days • {pkg.travelDetails.travelClass}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ color: '#6d3bbd', fontWeight: 700 }}>
                          ₹{pkg.pricing.basePrice.toLocaleString()}
                          {pkg.pricing.discountPercentage > 0 && (
                            <span style={{ 
                              textDecoration: 'line-through', 
                              color: '#666', 
                              fontSize: '0.7em',
                              marginLeft: '8px'
                            }}>
                              ₹{getDiscountedPrice(pkg.pricing.basePrice, pkg.pricing.discountPercentage).toLocaleString()}
                            </span>
                          )}
                        </Typography>
                        {pkg.pricing.pricePerPerson && (
                          <Typography variant="body2" sx={{ color: '#2a0140', fontSize: '0.8rem', fontWeight: 500 }}>
                            per person
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={pkg.rating.average} 
                            readOnly 
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body2" sx={{ color: '#2a0140', fontWeight: 500 }}>
                            ({pkg.rating.count})
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#2a0140', fontWeight: 500 }}>
                          👁️ {pkg.views} views
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ color: '#2a0140', mb: 2, fontWeight: 600 }}>
            No packages found
          </Typography>
          <Typography variant="body1" sx={{ color: '#2a0140', fontWeight: 500 }}>
            Try adjusting your filters or search terms
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default PackageList;
