import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  InputAdornment,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  Restaurant as RestaurantIcon,
  DirectionsCar as DirectionsCarIcon,
  Star as StarIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const AdminPackageManager = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    basePrice: '',
    currency: 'INR',
    pricePerPerson: true,
    discountPercentage: '0',
    validUntil: '',
    fromLocation: '',
    toLocation: '',
    duration: '',
    travelClass: 'Economy',
    minTravelers: '1',
    features: [''],
    inclusions: [''],
    exclusions: [''],
    itinerary: [{ day: 1, title: '', detail: '' }],
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft'
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const categories = [
    'Adventure', 'Beach', 'Cultural', 'Wildlife', 'Honeymoon', 
    'Family', 'Luxury', 'Budget', 'Weekend Getaway', 'International', 'Domestic'
  ];

  const currencies = ['INR', 'USD', 'EUR', 'GBP'];
  const travelClasses = ['Economy', 'Business', 'First Class', 'Premium Economy'];

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl('/api/packages/admin/all'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setPackages(data.packages);
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

  const handleOpenDialog = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        title: pkg.title,
        slug: pkg.slug,
        description: pkg.description,
        shortDescription: pkg.shortDescription,
        basePrice: pkg.pricing.basePrice.toString(),
        currency: pkg.pricing.currency,
        pricePerPerson: pkg.pricing.pricePerPerson,
        discountPercentage: pkg.pricing.discountPercentage.toString(),
        validUntil: pkg.pricing.validUntil ? new Date(pkg.pricing.validUntil).toISOString().split('T')[0] : '',
        fromLocation: pkg.travelDetails.fromLocation,
        toLocation: pkg.travelDetails.toLocation,
        duration: pkg.travelDetails.duration.toString(),
        travelClass: pkg.travelDetails.travelClass,
        maxTravelers: pkg.travelDetails.maxTravelers.toString(),
        minTravelers: pkg.travelDetails.minTravelers.toString(),
        features: pkg.features.length > 0 ? pkg.features : [''],
        inclusions: pkg.inclusions.length > 0 ? pkg.inclusions : [''],
        exclusions: pkg.exclusions.length > 0 ? pkg.exclusions : [''],
        itinerary: pkg.itinerary ? [{ day: 1, title: '', detail: pkg.itinerary }] : [{ day: 1, title: '', detail: '' }],
        category: pkg.category,
        tags: pkg.tags.join(', '),
        metaTitle: pkg.metaTitle || '',
        metaDescription: pkg.metaDescription || '',
        status: pkg.status,
        requiresAdvanceBooking: pkg.bookingInfo.requiresAdvanceBooking,
        advanceBookingDays: pkg.bookingInfo.advanceBookingDays.toString(),
        cancellationPolicy: pkg.bookingInfo.cancellationPolicy,
        refundPolicy: pkg.bookingInfo.refundPolicy,
        phone: pkg.contactInfo.phone || '',
        email: pkg.contactInfo.email || '',
        whatsapp: pkg.contactInfo.whatsapp || ''
      });
      setImagePreviews(pkg.images || []);
    } else {
      setEditingPackage(null);
      setFormData({
        title: '',
        slug: '',
        description: '',
        shortDescription: '',
        basePrice: '',
        currency: 'INR',
        pricePerPerson: true,
        discountPercentage: '0',
        validUntil: '',
        fromLocation: '',
        toLocation: '',
        duration: '',
        travelClass: 'Economy',
        maxTravelers: '10',
        minTravelers: '1',
        features: [''],
        inclusions: [''],
        exclusions: [''],
        itinerary: [{ day: 1, title: '', detail: '' }],
        category: '',
        tags: '',
        metaTitle: '',
        metaDescription: '',
        status: 'draft',
        requiresAdvanceBooking: true,
        advanceBookingDays: '7',
        cancellationPolicy: 'Standard cancellation policy applies',
        refundPolicy: 'Refund available as per terms and conditions',
        phone: '',
        email: '',
        whatsapp: ''
      });
      setImagePreviews([]);
    }
    setImages([]);
    setOpenDialog(true);
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setImages(files);
    
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      caption: '',
      isFeatured: imagePreviews.length === 0 && files.indexOf(file) === 0
    }));
    
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    // Client-side validation
    const errors = [];
    
    if (!formData.title.trim()) errors.push('Title is required');
    
    // Auto-generate slug if empty
    let finalSlug = formData.slug.trim();
    if (!finalSlug && formData.title.trim()) {
      finalSlug = generateSlug(formData.title);
      setFormData(prev => ({ ...prev, slug: finalSlug }));
    }
    
    if (!finalSlug) errors.push('Slug is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.shortDescription.trim()) errors.push('Short description is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.basePrice) errors.push('Base price is required');
    if (formData.shortDescription.length > 300) errors.push('Short description must be 300 characters or less');
    if (formData.metaTitle.length > 60) errors.push('Meta title must be 60 characters or less');
    if (formData.metaDescription.length > 160) errors.push('Meta description must be 160 characters or less');
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      setUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();

      // Process form data for submission
      const processedData = {
        ...formData,
        slug: finalSlug, // Use the validated slug
        features: formData.features.filter(f => f.trim() !== ''),
        inclusions: formData.inclusions.filter(i => i.trim() !== ''),
        exclusions: formData.exclusions.filter(e => e.trim() !== ''),
        itinerary: formData.itinerary.filter(day => day.detail.trim() !== '')
      };

      // Debug: Log processed data
      console.log('Processed form data:', processedData);
      console.log('Slug value:', processedData.slug);

      // Add all form fields
      Object.keys(processedData).forEach(key => {
        if (Array.isArray(processedData[key])) {
          formDataToSend.append(key, JSON.stringify(processedData[key]));
        } else {
          formDataToSend.append(key, processedData[key] || '');
        }
      });

      // Add images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
        formDataToSend.append(`imageCaption${index}`, imagePreviews[imagePreviews.length - images.length + index]?.caption || '');
      });

      const url = editingPackage 
        ? buildApiUrl(`/api/packages/admin/${editingPackage._id}`)
        : buildApiUrl('/api/packages/admin/create');

      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setOpenDialog(false);
        fetchPackages();
        setError('');
      } else {
        setError(data.error || 'Failed to save package');
      }
    } catch (error) {
      setError('Failed to save package');
      console.error('Error saving package:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(`/api/packages/admin/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPackages();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete package');
      }
    } catch (error) {
      setError('Failed to delete package');
      console.error('Error deleting package:', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(`/api/packages/admin/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchPackages();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (error) {
      setError('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const getDiscountedPrice = (basePrice, discountPercentage) => {
    const price = parseFloat(basePrice);
    const discount = parseFloat(discountPercentage);
    return price * (1 - discount / 100);
  };

  // Helper functions for dynamic fields
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const addInclusion = () => {
    setFormData(prev => ({
      ...prev,
      inclusions: [...prev.inclusions, '']
    }));
  };

  const addExclusion = () => {
    setFormData(prev => ({
      ...prev,
      exclusions: [...prev.exclusions, '']
    }));
  };

  const addDay = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { 
        day: prev.itinerary.length + 1, 
        title: '', 
        detail: '' 
      }]
    }));
  };

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const updateInclusion = (index, value) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.map((inc, i) => i === index ? value : inc)
    }));
  };

  const updateExclusion = (index, value) => {
    setFormData(prev => ({
      ...prev,
      exclusions: prev.exclusions.map((exc, i) => i === index ? value : exc)
    }));
  };

  const updateItineraryDay = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      )
    }));
  };

  // Handle paste events to convert formatted text to HTML
  const handlePaste = (e, field) => {
    e.preventDefault();
    
    // Get clipboard data
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text/html') || clipboardData.getData('text');
    
    if (pastedText) {
      // Convert common formatting to HTML
      let htmlText = pastedText;
      
      // Convert Word/Google Docs formatting
      htmlText = htmlText
        // Bold text
        .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '<strong>$1</strong>')
        .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, '<strong>$1</strong>')
        // Italic text
        .replace(/<i\b[^>]*>(.*?)<\/i>/gi, '<em>$1</em>')
        .replace(/<em\b[^>]*>(.*?)<\/em>/gi, '<em>$1</em>')
        // Headers
        .replace(/<h1\b[^>]*>(.*?)<\/h1>/gi, '<h2>$1</h2>')
        .replace(/<h2\b[^>]*>(.*?)<\/h2>/gi, '<h2>$1</h2>')
        .replace(/<h3\b[^>]*>(.*?)<\/h3>/gi, '<h3>$1</h3>')
        // Lists
        .replace(/<ul\b[^>]*>(.*?)<\/ul>/gis, '<ul>$1</ul>')
        .replace(/<ol\b[^>]*>(.*?)<\/ol>/gis, '<ol>$1</ol>')
        .replace(/<li\b[^>]*>(.*?)<\/li>/gi, '<li>$1</li>')
        // Paragraphs
        .replace(/<p\b[^>]*>(.*?)<\/p>/gi, '<p>$1</p>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim();
      
      // Update the appropriate field
      if (field === 'description') {
        setFormData(prev => ({ ...prev, description: htmlText }));
      } else if (field === 'shortDescription') {
        setFormData(prev => ({ ...prev, shortDescription: htmlText }));
      } else if (field.startsWith('itinerary-')) {
        const dayIndex = parseInt(field.split('-')[1]);
        const detailField = field.split('-')[2];
        updateItineraryDay(dayIndex, detailField, htmlText);
      }
    }
  };

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleTitleChange = (value) => {
    const newSlug = generateSlug(value);
    setFormData(prev => ({
      ...prev,
      title: value,
      // Auto-update slug if it's empty or matches the previous title's generated slug
      slug: (!prev.slug || prev.slug === generateSlug(prev.title)) ? newSlug : prev.slug
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2a0140', fontWeight: 700 }}>
          📦 Package Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
            }
          }}
        >
          Add New Package
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {packages.map((pkg) => (
          <Grid item xs={12} md={6} lg={4} key={pkg._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  {pkg.shortDescription}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={pkg.category} 
                    size="small" 
                    sx={{ mr: 1, mb: 1, background: '#a084e8', color: 'white' }}
                  />
                  <Chip 
                    label={pkg.status} 
                    size="small" 
                    color={pkg.status === 'published' ? 'success' : pkg.status === 'draft' ? 'warning' : 'default'}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <FlightIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    {pkg.travelDetails.fromLocation} → {pkg.travelDetails.toLocation}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <HotelIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    {pkg.travelDetails.duration} Days • {pkg.travelDetails.travelClass}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#6d3bbd', fontWeight: 600 }}>
                    {pkg.pricing.currency} {pkg.pricing.basePrice.toLocaleString()}
                    {pkg.pricing.discountPercentage > 0 && (
                      <span style={{ 
                        textDecoration: 'line-through', 
                        color: '#999', 
                        fontSize: '0.8em',
                        marginLeft: '8px'
                      }}>
                        {pkg.pricing.currency} {getDiscountedPrice(pkg.pricing.basePrice, pkg.pricing.discountPercentage).toLocaleString()}
                      </span>
                    )}
                  </Typography>
                  {pkg.pricing.discountPercentage > 0 && (
                    <Chip 
                      label={`${pkg.pricing.discountPercentage}% OFF`} 
                      size="small" 
                      color="error"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    👁️ {pkg.views} views
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    ⭐ 5.0 ({pkg.rating.count})
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Box>
                  <IconButton 
                    onClick={() => handleOpenDialog(pkg)}
                    sx={{ color: '#a084e8' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(pkg._id)}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                <FormControl size="small">
                  <Select
                    value={pkg.status}
                    onChange={(e) => handleStatusChange(pkg._id, e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Package Form Dialog */}
             <Dialog 
         open={openDialog} 
         onClose={() => setOpenDialog(false)}
         maxWidth="xl"
         fullWidth
         scroll="paper"
         PaperProps={{
           sx: {
             width: '95vw',
             maxWidth: '1400px',
             height: '90vh'
           }
         }}
       >
        <DialogTitle sx={{ color: '#2a0140', fontWeight: 700 }}>
          {editingPackage ? 'Edit Package' : 'Create New Package'}
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Basic Information */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Package Title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="URL Slug (SEO)"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      required
                      variant="outlined"
                      helperText="URL-friendly version of the title (auto-generated but editable)"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">/package/</InputAdornment>,
                      }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required
                      >
                        {categories.map(cat => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Short Description"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                      onPaste={(e) => handlePaste(e, 'shortDescription')}
                      required
                      multiline
                      rows={3}
                      error={formData.shortDescription.length > 300}
                      helperText={`${formData.shortDescription.length}/300 characters ${formData.shortDescription.length > 300 ? '(too long)' : ''}`}
                      inputProps={{ maxLength: 350 }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ 
                        color: '#333333', 
                        mb: 1,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}>
                        📝 Full Description *
                      </Typography>
                      <Box sx={{ 
                        bgcolor: '#f8f9fa', 
                        border: '1px solid #e9ecef', 
                        borderRadius: 1, 
                        p: 2, 
                        mb: 2 
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: '#666666',
                          fontSize: '0.9rem',
                          mb: 1
                        }}>
                          <strong>HTML Formatting Guide:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#666666',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace'
                        }}>
                          💡 <strong>Pro Tip:</strong> Copy formatted text from Word, Google Docs, or websites and paste it here!<br/>
                          • &lt;h2&gt;Heading&lt;/h2&gt; - Large heading<br/>
                          • &lt;h3&gt;Subheading&lt;/h3&gt; - Medium heading<br/>
                          • &lt;p&gt;Paragraph&lt;/p&gt; - Normal text<br/>
                          • &lt;strong&gt;Bold&lt;/strong&gt; - Bold text<br/>
                          • &lt;em&gt;Italic&lt;/em&gt; - Italic text<br/>
                          • &lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt; - Bullet list<br/>
                          • &lt;ol&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ol&gt; - Numbered list
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        label="Write detailed package description here..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        onPaste={(e) => handlePaste(e, 'description')}
                        required
                        multiline
                        rows={8}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#333333',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            '& fieldset': {
                              borderColor: 'rgba(160, 132, 232, 0.5)',
                              borderWidth: '2px',
                            },
                            '&:hover fieldset': {
                              borderColor: '#a084e8',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#a084e8',
                              borderWidth: '2px',
                            },
                            '& .MuiInputBase-input': {
                              padding: '16px',
                              lineHeight: 1.6,
                              fontSize: '1rem',
                            }
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Travel Details */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✈️ Travel Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="From Location"
                      value={formData.fromLocation}
                      onChange={(e) => setFormData({...formData, fromLocation: e.target.value})}
                      required
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="To Location"
                      value={formData.toLocation}
                      onChange={(e) => setFormData({...formData, toLocation: e.target.value})}
                      required
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="Duration (Days)"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      required
                      variant="outlined"
                    />
                    <FormControl fullWidth>
                      <InputLabel>Travel Class</InputLabel>
                      <Select
                        value={formData.travelClass}
                        onChange={(e) => setFormData({...formData, travelClass: e.target.value})}
                      >
                        {travelClasses.map(cls => (
                          <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Pricing Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Base Price"
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      >
                        {currencies.map(curr => (
                          <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Discount Percentage"
                      type="number"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                      variant="outlined"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Valid Until"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.pricePerPerson}
                          onChange={(e) => setFormData({...formData, pricePerPerson: e.target.checked})}
                        />
                      }
                      label="Price per person"
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Images */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🖼️ Images
                  </Typography>
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="image-upload"
                        multiple
                        type="file"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="image-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                          sx={{ mb: 2 }}
                        >
                          Upload Images
                        </Button>
                      </label>
                    </Box>
                    
                    <Grid container spacing={2}>
                      {imagePreviews.map((image, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card>
                            <CardMedia
                              component="img"
                              height="150"
                              image={image.url}
                              alt={`Image ${index + 1}`}
                              sx={{ objectFit: 'cover' }}
                            />
                            <CardContent>
                              <TextField
                                fullWidth
                                size="small"
                                label="Caption"
                                value={image.caption}
                                onChange={(e) => {
                                  const newPreviews = [...imagePreviews];
                                  newPreviews[index].caption = e.target.value;
                                  setImagePreviews(newPreviews);
                                }}
                                sx={{ mb: 1 }}
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={image.isFeatured}
                                    onChange={(e) => {
                                      const newPreviews = imagePreviews.map((img, i) => ({
                                        ...img,
                                        isFeatured: i === index ? e.target.checked : false
                                      }));
                                      setImagePreviews(newPreviews);
                                    }}
                                  />
                                }
                                label="Featured"
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>

              {/* Features & Inclusions */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    ⭐ Features & Inclusions
                  </Typography>
                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                       {/* Features */}
                       <Box>
                         <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                           Features
                         </Typography>
                         {formData.features.map((feature, index) => (
                           <TextField
                             key={index}
                             fullWidth
                             placeholder={`Feature ${index + 1}`}
                             value={feature}
                             onChange={(e) => updateFeature(index, e.target.value)}
                             sx={{ mb: 1 }}
                           />
                         ))}
                         <Button 
                           onClick={addFeature} 
                           variant="outlined" 
                           size="small"
                           sx={{ mt: 1 }}
                         >
                           + Add Feature
                         </Button>
                       </Box>

                       {/* Inclusions */}
                       <Box>
                         <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                           Inclusions
                         </Typography>
                         {formData.inclusions.map((inclusion, index) => (
                           <TextField
                             key={index}
                             fullWidth
                             placeholder={`Inclusion ${index + 1}`}
                             value={inclusion}
                             onChange={(e) => updateInclusion(index, e.target.value)}
                             sx={{ mb: 1 }}
                           />
                         ))}
                         <Button 
                           onClick={addInclusion} 
                           variant="outlined" 
                           size="small"
                           sx={{ mt: 1 }}
                         >
                           + Add Inclusion
                         </Button>
                       </Box>

                       {/* Exclusions */}
                       <Box>
                         <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                           Exclusions
                         </Typography>
                         {formData.exclusions.map((exclusion, index) => (
                           <TextField
                             key={index}
                             fullWidth
                             placeholder={`Exclusion ${index + 1}`}
                             value={exclusion}
                             onChange={(e) => updateExclusion(index, e.target.value)}
                             sx={{ mb: 1 }}
                           />
                         ))}
                         <Button 
                           onClick={addExclusion} 
                           variant="outlined" 
                           size="small"
                           sx={{ mt: 1 }}
                         >
                           + Add Exclusion
                         </Button>
                       </Box>
                     </Box>
                </CardContent>
              </Card>

              {/* Itinerary */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📅 Detailed Itinerary
                  </Typography>
                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                       {formData.itinerary.map((day, index) => (
                         <Card key={index} sx={{ border: '1px solid #e0e0e0', p: 2 }}>
                           <CardContent sx={{ p: 2 }}>
                             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2a0140' }}>
                               Day {day.day}
                             </Typography>
                             <TextField
                               fullWidth
                               placeholder="Title (optional)"
                               value={day.title}
                               onChange={(e) => updateItineraryDay(index, 'title', e.target.value)}
                               sx={{ mb: 2 }}
                             />
                             <Box>
                               <Typography variant="body2" sx={{ 
                                 color: '#666666',
                                 mb: 1,
                                 fontSize: '0.85rem'
                               }}>
                                 You can use HTML tags for formatting like &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;p&gt;, etc.
                               </Typography>
                               <TextField
                                 fullWidth
                                 placeholder="Detailed itinerary for this day..."
                                 value={day.detail}
                                 onChange={(e) => updateItineraryDay(index, 'detail', e.target.value)}
                                 onPaste={(e) => handlePaste(e, `itinerary-${index}-detail`)}
                                 multiline
                                 rows={6}
                                 required
                                 sx={{ 
                                   '& .MuiInputBase-root': {
                                     fontSize: '16px',
                                     lineHeight: '1.6',
                                     '& fieldset': {
                                       borderColor: 'rgba(160, 132, 232, 0.3)',
                                     },
                                     '&:hover fieldset': {
                                       borderColor: '#a084e8',
                                     },
                                     '&.Mui-focused fieldset': {
                                       borderColor: '#a084e8',
                                     }
                                   }
                                 }}
                               />
                             </Box>
                           </CardContent>
                         </Card>
                       ))}
                       <Button 
                         onClick={addDay} 
                         variant="outlined"
                         sx={{ alignSelf: 'flex-start' }}
                       >
                         + Add Day
                       </Button>
                     </Box>
                </CardContent>
              </Card>

              {/* SEO & Status */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2a0140', fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🔧 SEO & Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Meta Title"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                      variant="outlined"
                      error={formData.metaTitle.length > 60}
                      helperText={`${formData.metaTitle.length}/60 characters ${formData.metaTitle.length > 60 ? '(too long)' : ''}`}
                      inputProps={{ maxLength: 80 }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="published">Published</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Meta Description"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                      multiline
                      rows={3}
                      variant="outlined"
                      error={formData.metaDescription.length > 160}
                      helperText={`${formData.metaDescription.length}/160 characters ${formData.metaDescription.length > 160 ? '(too long)' : ''}`}
                      inputProps={{ maxLength: 200 }}
                    />
                    <TextField
                      fullWidth
                      label="Tags (comma-separated)"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      variant="outlined"
                      helperText="Add relevant tags separated by commas"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading}
              sx={{
                background: 'linear-gradient(45deg, #a084e8 30%, #6d3bbd 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #6d3bbd 30%, #a084e8 90%)',
                }
              }}
            >
              {uploading ? <CircularProgress size={20} /> : (editingPackage ? 'Update Package' : 'Create Package')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminPackageManager;
