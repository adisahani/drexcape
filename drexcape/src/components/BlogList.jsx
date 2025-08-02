import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import Header from './Header';

const BlogList = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
    fetchBlogs();
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/blogs/categories/list');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 9
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/blogs/published?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBlogs(data.blogs);
        setTotalPages(data.totalPages);
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

  const handleBlogClick = (blog) => {
    navigate(`/blog/${blog.slug}`);
  };

  const handleShare = async (blogId, platform) => {
    try {
      const url = `${window.location.origin}/blog/${blogs.find(b => b._id === blogId)?.slug}`;
      const text = blogs.find(b => b._id === blogId)?.title;
      
      if (platform === 'copy') {
        // Copy link to clipboard
        try {
          await navigator.clipboard.writeText(url);
          // Show a temporary notification
          const notification = document.createElement('div');
          notification.textContent = 'Link copied to clipboard!';
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #a084e8;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(160, 132, 232, 0.3);
            animation: slideIn 0.3s ease;
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(notification), 300);
          }, 2000);
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          const notification = document.createElement('div');
          notification.textContent = 'Link copied to clipboard!';
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #a084e8;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(160, 132, 232, 0.3);
            animation: slideIn 0.3s ease;
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(notification), 300);
          }, 2000);
        }
        return;
      }

      await fetch(`/api/blogs/${blogId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform })
      });

      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
      };

      window.open(shareUrls[platform], '_blank');
    } catch (error) {
      console.error('Error sharing blog:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <Header />
      
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3, pt: 12 }}>
        {/* Back to Home Button */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ 
            mb: 3,
            color: '#a084e8',
            borderColor: '#a084e8',
            '&:hover': {
              borderColor: '#6d3bbd',
              backgroundColor: 'rgba(160, 132, 232, 0.1)'
            }
          }}
        >
          Back to Home
        </Button>

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
            ✈️ Travel Blog
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#333333',
            mb: 4,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 400
          }}>
            Discover amazing destinations, travel tips, and stories from around the world
          </Typography>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 3,
          border: '1px solid rgba(160, 132, 232, 0.3)'
        }}>
          <TextField
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              flexGrow: 1, 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                color: '#333333',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
              '& .MuiInputBase-input::placeholder': {
                color: '#999999',
                opacity: 1,
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: '#a084e8' }} />
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: '#666666' }}>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
              sx={{
                color: '#333333',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(160, 132, 232, 0.5)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#a084e8',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#a084e8',
                },
                '& .MuiSvgIcon-root': {
                  color: '#a084e8',
                }
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

                 {/* Blog Grid */}
         <Grid container spacing={3} sx={{ pt: 4 }}>
          {blogs.map((blog) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={blog._id}>
              <Card 
                sx={{ 
                  height: '450px',
                  width: '100%',
                  maxWidth: '350px',
                  minWidth: '280px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(160, 132, 232, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  margin: '0 auto',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(160, 132, 232, 0.3)',
                    borderColor: '#a084e8'
                  }
                }}
                onClick={() => handleBlogClick(blog)}
              >
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: '0.8rem', color: '#a084e8' }} />
                        <Typography variant="caption" sx={{ color: '#666666', fontSize: '0.75rem' }}>
                          {blog.readTime} min read
                        </Typography>
                      </Box>
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
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mt: 'auto',
                    minHeight: '30px'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VisibilityIcon sx={{ fontSize: '0.8rem', color: '#a084e8' }} />
                      <Typography variant="caption" sx={{ color: '#999999', fontSize: '0.75rem' }}>
                        {blog.views}
                      </Typography>
                    </Box>
                    
                                         <Box sx={{ display: 'flex', gap: 0.5 }}>
                       <IconButton 
                         size="small" 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleShare(blog._id, 'copy');
                         }}
                         sx={{ 
                           p: 0.5,
                           color: '#a084e8',
                           '&:hover': {
                             backgroundColor: 'rgba(160, 132, 232, 0.2)'
                           }
                         }}
                         title="Copy Link"
                       >
                         <CopyIcon sx={{ fontSize: '0.8rem' }} />
                       </IconButton>
                       <IconButton 
                         size="small" 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleShare(blog._id, 'facebook');
                         }}
                         sx={{ 
                           p: 0.5,
                           color: '#a084e8',
                           '&:hover': {
                             backgroundColor: 'rgba(160, 132, 232, 0.2)'
                           }
                         }}
                         title="Share"
                       >
                         <ShareIcon sx={{ fontSize: '0.8rem' }} />
                       </IconButton>
                     </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#333333',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&.Mui-selected': {
                    backgroundColor: '#a084e8',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#6d3bbd',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(160, 132, 232, 0.2)',
                  }
                }
              }}
              size="large"
            />
          </Box>
        )}

        {/* No blogs message */}
        {blogs.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#333333', mb: 2 }}>
              No blogs found
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666' }}>
              Try adjusting your search or filter criteria
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BlogList; 