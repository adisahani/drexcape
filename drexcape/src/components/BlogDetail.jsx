import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  WhatsApp as WhatsAppIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';


const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blogs/${slug}`);
      const data = await response.json();

      if (response.ok) {
        setBlog(data);
      } else {
        setError(data.error || 'Blog not found');
      }
    } catch (error) {
      setError('Failed to fetch blog');
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform) => {
    try {
      const url = `${window.location.origin}/blog/${blog.slug}`;
      const text = blog.title;
      
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

      await fetch(`/api/blogs/${blog._id}/share`, {
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

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'rgba(58, 0, 106, 0.05)',
        backdropFilter: 'blur(10px)'
      }}>

        
        <Box sx={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          padding: 3,
          pt: 12
        }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/blog')}
            sx={{ 
              color: '#a084e8',
              borderColor: '#a084e8',
              '&:hover': {
                borderColor: '#6d3bbd',
                backgroundColor: 'rgba(160, 132, 232, 0.1)'
              }
            }}
          >
            Back to Blogs
          </Button>
        </Box>
      </Box>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'rgba(58, 0, 106, 0.05)',
      backdropFilter: 'blur(10px)'
    }}>

      
      <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3, pt: 12 }}>
        {/* Back Button */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/blog')}
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
          Back to Blogs
        </Button>

        {/* Blog Header */}
        <Paper elevation={0} sx={{ 
          mb: 4, 
          overflow: 'hidden', 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(160, 132, 232, 0.3)'
        }}>
          <Box
            sx={{
              height: 400,
              backgroundImage: `url(${blog.featuredImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
              }
            }}
          />
          
          <Box sx={{ p: 3, pt: 2 }}>
            {/* Category and Meta */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={blog.category} 
                sx={{ 
                  background: 'linear-gradient(45deg, #a084e8, #6d3bbd)',
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: '0.8rem', color: '#a084e8' }} />
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  {blog.readTime} min read
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon sx={{ fontSize: '0.8rem', color: '#a084e8' }} />
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  {blog.views} views
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: '0.8rem', color: '#a084e8' }} />
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  {formatDate(blog.createdAt)}
                </Typography>
              </Box>
            </Box>

            {/* Title */}
            <Typography variant="h3" component="h1" sx={{ 
              fontWeight: 'bold',
              mb: 2,
              lineHeight: 1.2,
              color: '#333333',
              fontFamily: 'Orbitron, monospace',
              fontSize: { xs: '1.8rem', md: '2.5rem' }
            }}>
              {blog.title}
            </Typography>

            {/* Excerpt */}
            <Typography variant="h6" sx={{ 
              color: '#666666',
              mb: 3,
              fontStyle: 'italic',
              fontFamily: 'Rajdhani, sans-serif'
            }}>
              {blog.excerpt}
            </Typography>

            {/* Author */}
            {blog.author && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#a084e8' }}>
                  {blog.author.name?.charAt(0) || 'A'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333333' }}>
                    {blog.author.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    Travel Writer
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Content */}
        <Box sx={{ 
          mb: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 3,
          border: '1px solid rgba(160, 132, 232, 0.3)'
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: '1.1rem',
              color: '#333333',
              fontFamily: 'Rajdhani, sans-serif',
              '& p': { mb: 2 },
              '& h2': { 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                mt: 4, 
                mb: 2,
                color: '#333333',
                fontFamily: 'Orbitron, monospace'
              },
              '& h3': { 
                fontSize: '1.3rem', 
                fontWeight: 'bold', 
                mt: 3, 
                mb: 2,
                color: '#333333',
                fontFamily: 'Orbitron, monospace'
              },
              '& ul, & ol': { pl: 3, mb: 2 },
              '& li': { mb: 1 },
              '& blockquote': {
                borderLeft: '4px solid #a084e8',
                pl: 2,
                ml: 0,
                fontStyle: 'italic',
                color: '#666666'
              }
            }}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </Box>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <Box sx={{ 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            p: 3,
            border: '1px solid rgba(160, 132, 232, 0.3)'
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333333' }}>
              Tags:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {blog.tags.map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  variant="outlined"
                  size="small"
                  sx={{
                    color: '#a084e8',
                    borderColor: '#a084e8',
                    '&:hover': {
                      backgroundColor: 'rgba(160, 132, 232, 0.2)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 4, borderColor: 'rgba(160, 132, 232, 0.3)' }} />

        {/* Social Sharing */}
        <Box sx={{ 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 3,
          border: '1px solid rgba(160, 132, 232, 0.3)'
        }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333333' }}>
            Share this post
          </Typography>
                     <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
             <IconButton
               onClick={() => handleShare('copy')}
               sx={{ 
                 bgcolor: '#a084e8',
                 color: 'white',
                 '&:hover': { bgcolor: '#6d3bbd' }
               }}
               title="Copy Link"
             >
               <CopyIcon />
             </IconButton>
             <IconButton
               onClick={() => handleShare('facebook')}
               sx={{ 
                 bgcolor: '#1877f2',
                 color: 'white',
                 '&:hover': { bgcolor: '#166fe5' }
               }}
             >
               <FacebookIcon />
             </IconButton>
             <IconButton
               onClick={() => handleShare('twitter')}
               sx={{ 
                 bgcolor: '#1da1f2',
                 color: 'white',
                 '&:hover': { bgcolor: '#1a91da' }
               }}
             >
               <TwitterIcon />
             </IconButton>
             <IconButton
               onClick={() => handleShare('linkedin')}
               sx={{ 
                 bgcolor: '#0077b5',
                 color: 'white',
                 '&:hover': { bgcolor: '#006097' }
               }}
             >
               <LinkedInIcon />
             </IconButton>
             <IconButton
               onClick={() => handleShare('whatsapp')}
               sx={{ 
                 bgcolor: '#25d366',
                 color: 'white',
                 '&:hover': { bgcolor: '#128c7e' }
               }}
             >
               <WhatsAppIcon />
             </IconButton>
           </Box>
        </Box>

        {/* Share Stats */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#666666' }}>
            This post has been shared {Object.values(blog.socialShares).reduce((a, b) => a + b, 0)} times
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default BlogDetail; 