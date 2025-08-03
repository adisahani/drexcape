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
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

const AdminBlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft'
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/blogs/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setBlogs(data.blogs);
      } else {
        setError(data.error || 'Failed to fetch blogs');
      }
    } catch (error) {
      setError('Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (blog = null) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        category: blog.category,
        tags: blog.tags.join(', '),
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        status: blog.status
      });
      setImagePreview(blog.featuredImage);
    } else {
      setEditingBlog(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        metaTitle: '',
        metaDescription: '',
        status: 'draft'
      });
      setImagePreview('');
    }
    setFeaturedImage(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBlog(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: '',
      metaTitle: '',
      metaDescription: '',
      status: 'draft'
    });
    setFeaturedImage(null);
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    
    if (featuredImage) {
      formDataToSend.append('featuredImage', featuredImage);
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingBlog 
        ? `/api/blogs/${editingBlog._id}`
        : '/api/blogs/create';
      
      const method = editingBlog ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        handleCloseDialog();
        fetchBlogs();
      } else {
        setError(data.error || 'Failed to save blog');
      }
    } catch (error) {
      setError('Failed to save blog');
      console.error('Error saving blog:', error);
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchBlogs();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete blog');
      }
    } catch (error) {
      setError('Failed to delete blog');
      console.error('Error deleting blog:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        background: 'rgba(58, 0, 106, 0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <CircularProgress sx={{ color: '#a084e8' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'rgba(58, 0, 106, 0.05)',
      backdropFilter: 'blur(10px)',
      p: 3
    }}>
      {/* Main Container with Max Width */}
      <Box sx={{
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ 
            fontWeight: 'bold',
            fontFamily: 'Orbitron, monospace',
            background: 'linear-gradient(45deg, #a084e8, #6d3bbd)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            📝 Blog Management
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#333333',
            mb: 4,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 400
          }}>
            Create, edit, and manage your travel blog posts
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Add Blog Button */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #a084e8, #6d3bbd)',
              color: 'white',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(45deg, #6d3bbd, #a084e8)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(160, 132, 232, 0.4)'
              }
            }}
          >
            Create New Blog
          </Button>
        </Box>

        {/* Blog Grid with Perfect Sizing */}
        <Grid container spacing={3} sx={{ maxWidth: '100%' }}>
          {blogs.map((blog) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={blog._id}>
              <Card sx={{ 
                height: '450px',
                width: '100%',
                maxWidth: '350px',
                minWidth: '280px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(160, 132, 232, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
                margin: '0 auto',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(160, 132, 232, 0.3)',
                  borderColor: '#a084e8'
                }
              }}>
                <CardMedia
                  component="img"
                  height="180"
                  width="100%"
                  image={blog.featuredImage}
                  alt={blog.title}
                  sx={{ 
                    objectFit: 'cover',
                    flexShrink: 0,
                    width: '100%',
                    minHeight: '180px',
                    maxHeight: '180px'
                  }}
                />
                <CardContent sx={{ 
                  p: 2, 
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px'
                }}>
                  <Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1, 
                      flexWrap: 'wrap', 
                      gap: 0.5 
                    }}>
                      <Chip 
                        label={blog.status} 
                        size="small" 
                        sx={{ 
                          background: blog.status === 'published' 
                            ? 'linear-gradient(45deg, #4caf50, #2e7d32)'
                            : 'linear-gradient(45deg, #ff9800, #f57c00)',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Chip 
                        label={blog.category} 
                        size="small" 
                        sx={{ 
                          background: 'linear-gradient(45deg, #a084e8, #6d3bbd)',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="h6" component="h2" sx={{ 
                      fontWeight: 'bold',
                      mb: 1,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: '#333333',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '1rem',
                      minHeight: '2.6rem',
                      maxHeight: '2.6rem'
                    }}>
                      {blog.title}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ 
                      color: '#666666',
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontFamily: 'Rajdhani, sans-serif',
                      lineHeight: 1.4,
                      minHeight: '4.2rem',
                      maxHeight: '4.2rem',
                      fontSize: '0.875rem'
                    }}>
                      {blog.excerpt}
                    </Typography>
                    
                    <Typography variant="caption" sx={{ 
                      color: '#999999',
                      display: 'block',
                      mt: 'auto',
                      fontSize: '0.75rem'
                    }}>
                      {formatDate(blog.createdAt)}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ 
                  p: 2, 
                  pt: 0,
                  mt: 'auto',
                  justifyContent: 'space-between',
                  minHeight: '50px'
                }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(blog)}
                    sx={{
                      color: '#a084e8',
                      borderColor: '#a084e8',
                      flex: 1,
                      mr: 1,
                      fontSize: '0.75rem',
                      py: 0.5,
                      '&:hover': {
                        borderColor: '#6d3bbd',
                        backgroundColor: 'rgba(160, 132, 232, 0.1)'
                      }
                    }}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(blog._id)}
                    sx={{
                      color: '#f44336',
                      borderColor: '#f44336',
                      flex: 1,
                      fontSize: '0.75rem',
                      py: 0.5,
                      '&:hover': {
                        borderColor: '#d32f2f',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)'
                      }
                    }}
                    variant="outlined"
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* No blogs message */}
        {blogs.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#333333', mb: 2 }}>
              No blogs found
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666' }}>
              Create your first blog post to get started
            </Typography>
          </Box>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(160, 132, 232, 0.3)',
            color: '#333333',
            maxHeight: '90vh',
            minHeight: '80vh',
            maxWidth: '1200px',
            width: '95vw'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Orbitron, monospace',
          background: 'linear-gradient(45deg, #a084e8, #6d3bbd)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          fontSize: '1.5rem',
          pb: 1
        }}>
          {editingBlog ? 'Edit Blog' : 'Create New Blog'}
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3} sx={{ pt: 4 }}>
              {/* Title Section */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Blog Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  size="large"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#333333',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1.1rem',
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
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666666',
                      fontSize: '1rem',
                    }
                  }}
                />
              </Grid>
              
              {/* Excerpt Section */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Blog Excerpt *"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  required
                  multiline
                  rows={3}
                  helperText="Write a compelling summary of your blog post (this will appear in previews)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#333333',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
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
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666666',
                      fontSize: '1rem',
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#999999',
                      fontSize: '0.9rem',
                    }
                  }}
                />
              </Grid>
              
              {/* Category and Tags Row */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#666666', fontSize: '1rem' }}>Category *</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category *"
                    required
                    size="large"
                    sx={{
                      color: '#333333',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(160, 132, 232, 0.5)',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#a084e8',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#a084e8',
                        borderWidth: '2px',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#a084e8',
                      }
                    }}
                  >
                    <MenuItem value="Travel Tips">Travel Tips</MenuItem>
                    <MenuItem value="Destination Guides">Destination Guides</MenuItem>
                    <MenuItem value="Travel Stories">Travel Stories</MenuItem>
                    <MenuItem value="Travel News">Travel News</MenuItem>
                    <MenuItem value="Travel Deals">Travel Deals</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  helperText="e.g., adventure, budget, luxury, family"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#333333',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
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
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666666',
                      fontSize: '1rem',
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#999999',
                      fontSize: '0.9rem',
                    }
                  }}
                />
              </Grid>
              
              {/* Main Content Section - Much Larger */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ 
                    color: '#333333', 
                    mb: 1,
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 'bold'
                  }}>
                    📝 Blog Content *
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666666',
                    mb: 2,
                    fontFamily: 'Rajdhani, sans-serif'
                  }}>
                    Write your blog content here. You can use HTML tags for formatting like &lt;strong&gt;, &lt;em&gt;, &lt;h2&gt;, &lt;p&gt;, etc.
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  label="Write your blog content here..."
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  multiline
                  rows={25}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#333333',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '1rem',
                      fontFamily: 'Rajdhani, sans-serif',
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
                        padding: '20px',
                        lineHeight: 1.6,
                        fontSize: '1rem',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666666',
                      fontSize: '1rem',
                    }
                  }}
                />
              </Grid>
              
              {/* SEO Section */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(160, 132, 232, 0.05)', 
                  borderRadius: 2,
                  border: '1px solid rgba(160, 132, 232, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#333333', 
                    mb: 2,
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 'bold'
                  }}>
                    🔍 SEO Settings (Optional)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Meta Title"
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleInputChange}
                        helperText="For search engine optimization"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#333333',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            '& fieldset': {
                              borderColor: 'rgba(160, 132, 232, 0.5)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#a084e8',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#a084e8',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#666666',
                          },
                          '& .MuiFormHelperText-root': {
                            color: '#999999',
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Meta Description"
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleInputChange}
                        helperText="Brief description for search results"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#333333',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            '& fieldset': {
                              borderColor: 'rgba(160, 132, 232, 0.5)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#a084e8',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#a084e8',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#666666',
                          },
                          '& .MuiFormHelperText-root': {
                            color: '#999999',
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* Featured Image Section */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(160, 132, 232, 0.05)', 
                  borderRadius: 2,
                  border: '1px solid rgba(160, 132, 232, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#333333', 
                    mb: 2,
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 'bold'
                  }}>
                    🖼️ Featured Image
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      color: '#a084e8',
                      borderColor: '#a084e8',
                      borderWidth: '2px',
                      fontSize: '1rem',
                      py: 1,
                      px: 3,
                      '&:hover': {
                        borderColor: '#6d3bbd',
                        backgroundColor: 'rgba(160, 132, 232, 0.1)',
                        borderWidth: '2px',
                      }
                    }}
                  >
                    UPLOAD FEATURED IMAGE
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  
                  {imagePreview && (
                    <Box sx={{ mt: 2 }}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '300px', 
                          maxHeight: '200px', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid rgba(160, 132, 232, 0.3)'
                        }} 
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
              
              {/* Publish Settings */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(160, 132, 232, 0.05)', 
                  borderRadius: 2,
                  border: '1px solid rgba(160, 132, 232, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#333333', 
                    mb: 2,
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 'bold'
                  }}>
                    📤 Publish Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.status === 'published'}
                        onChange={(e) => setFormData({
                          ...formData,
                          status: e.target.checked ? 'published' : 'draft'
                        })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#a084e8',
                            '&:hover': {
                              backgroundColor: 'rgba(160, 132, 232, 0.08)',
                            },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#a084e8',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ 
                        color: '#333333',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '1rem'
                      }}>
                        Publish immediately (uncheck to save as draft)
                      </Typography>
                    }
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: '#666666',
              fontSize: '1rem',
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: 'rgba(160, 132, 232, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            sx={{
              background: 'linear-gradient(45deg, #a084e8, #6d3bbd)',
              color: 'white',
              fontSize: '1rem',
              px: 4,
              py: 1,
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(45deg, #6d3bbd, #a084e8)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 15px rgba(160, 132, 232, 0.4)'
              }
            }}
          >
            {editingBlog ? 'Update Blog' : 'Create Blog'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminBlogManager; 