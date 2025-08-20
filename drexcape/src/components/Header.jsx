import React, { useState, useEffect } from 'react';
import drexcapeLogo from '../assets/drexcape-logo.png';
import UserProfile from './UserProfile';
import UserLogin from './UserLogin';
import { Avatar, IconButton, Menu, MenuItem, Typography, Box, Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Person as PersonIcon, AccountCircle as AccountCircleIcon, Menu as MenuIcon, Close as CloseIcon, Home as HomeIcon, Article as BlogIcon, ContactSupport as ContactIcon, Inventory as PackageIcon } from '@mui/icons-material';

const Header = ({ isUserLoggedIn, userData, onUserLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile or tablet
  useEffect(() => {
    const checkMobile = () => {
      // Include tablets (up to 1024px) for side panel navigation
      setIsMobile(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileClick = (event) => {
    if (isUserLoggedIn) {
      setAnchorEl(event.currentTarget);
    } else {
      setShowLoginForm(true);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleCloseLogin = () => {
    setShowLoginForm(false);
  };

  const handleLoginSuccess = (userData) => {
    setShowLoginForm(false);
    // The auth context will handle the login
  };

  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Navigation items
  const navItems = [
    { text: 'Home', href: '/', icon: <HomeIcon /> },
    { text: 'Packages', href: '/packages', icon: <PackageIcon /> },
    { text: 'Blog', href: '/blog', icon: <BlogIcon /> },
    { text: 'Contact', href: '/contact', icon: <ContactIcon /> },
    { text: 'Debug', href: '/debug', icon: <ContactIcon /> },
  ];

  const handleNavClick = (href) => {
    setMobileOpen(false);
    if (href.startsWith('/#')) {
      // Smooth scroll to section
      const sectionId = href.substring(2);
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to page
      window.location.href = href;
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <img src={drexcapeLogo} alt="Drexcape" className="logo" />
        </div>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="nav">
            {navItems.map((item) => (
              <a key={item.text} href={item.href} className="nav-link">
                {item.text}
              </a>
            ))}
          </nav>
        )}
        
        {/* Mobile/Tablet Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
        
          {/* Mobile/Tablet Menu Button */}
          {isMobile && (
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: 48,
                height: 48,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Round Profile Button */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            position: 'relative',
            zIndex: 1000
          }}>
          <IconButton
            onClick={handleProfileClick}
            sx={{
              width: 48,
              height: 48,
              background: isUserLoggedIn 
                ? 'linear-gradient(135deg, #ffe066, #ffd700)' 
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: isUserLoggedIn ? '#1a0033' : '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                background: isUserLoggedIn 
                  ? 'linear-gradient(135deg, #ffd700, #ffe066)' 
                  : 'linear-gradient(135deg, #764ba2, #667eea)',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isUserLoggedIn ? (
              <Typography 
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem',
                  fontFamily: 'Rajdhani, sans-serif'
                }}
              >
                {getInitials(userData?.name)}
              </Typography>
            ) : (
              <PersonIcon sx={{ fontSize: '1.5rem' }} />
            )}
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
              border: '2px solid rgba(255, 224, 102, 0.3)',
              borderRadius: '12px',
              mt: 1,
              minWidth: 200
            }
          }}
        >
          <MenuItem sx={{ color: '#ffffff', fontFamily: 'Rajdhani, sans-serif' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountCircleIcon sx={{ color: '#ffe066' }} />
              <Typography variant="body2" sx={{ fontWeight: '600' }}>
                {userData?.name || 'User'}
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem sx={{ color: '#ffffff', fontFamily: 'Rajdhani, sans-serif' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {userData?.phone || 'User'}
            </Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => {
              onUserLogout();
              handleCloseMenu();
            }}
            sx={{ 
              color: '#ff4444', 
              fontFamily: 'Rajdhani, sans-serif',
              '&:hover': { background: 'rgba(255, 68, 68, 0.1)' }
            }}
          >
            Logout
          </MenuItem>
        </Menu>

        {/* Login Form */}
        {showLoginForm && (
          <UserLogin
            onLoginSuccess={handleLoginSuccess}
            onClose={handleCloseLogin}
            forceOpen={true}
            isUserLoggedIn={isUserLoggedIn}
          />
        )}
        </Box>
      </div>

      {/* Mobile/Tablet Side Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        PaperProps={{
          sx: {
            width: 280,
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            borderLeft: '2px solid rgba(255, 224, 102, 0.3)',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <img src={drexcapeLogo} alt="Drexcape" style={{ height: '40px' }} />
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Navigation Items */}
        <List sx={{ pt: 1 }}>
          {navItems.map((item) => (
            <ListItem
              key={item.text}
              button
              onClick={() => handleNavClick(item.href)}
              sx={{
                color: '#ffffff',
                '&:hover': {
                  background: 'rgba(255, 224, 102, 0.1)',
                  borderLeft: '3px solid #ffe066'
                },
                transition: 'all 0.2s ease',
                py: 1.5
              }}
            >
              <Box sx={{ mr: 2, color: '#ffe066' }}>
                {item.icon}
              </Box>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: '500',
                    fontSize: '1.1rem'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

        {/* User Profile Section */}
        <Box sx={{ p: 2 }}>
          {isUserLoggedIn ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2,
              background: 'rgba(255, 224, 102, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 224, 102, 0.3)'
            }}>
              <Avatar sx={{ 
                bgcolor: '#ffe066', 
                color: '#1a0033',
                fontWeight: 'bold'
              }}>
                {getInitials(userData?.name)}
              </Avatar>
              <Box>
                <Typography sx={{ 
                  color: '#ffffff', 
                  fontWeight: '600',
                  fontFamily: 'Rajdhani, sans-serif'
                }}>
                  {userData?.name || 'User'}
                </Typography>
                <Typography sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontFamily: 'Rajdhani, sans-serif'
                }}>
                  {userData?.phone || 'User'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              p: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Typography sx={{ 
                color: '#ffffff',
                textAlign: 'center',
                fontFamily: 'Rajdhani, sans-serif',
                mb: 1
              }}>
                Welcome Guest
              </Typography>
              <Typography sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                fontSize: '0.9rem',
                fontFamily: 'Rajdhani, sans-serif'
              }}>
                Sign in to access your account
              </Typography>
            </Box>
          )}
        </Box>

        {/* Login/Logout Button */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          {isUserLoggedIn ? (
            <IconButton
              onClick={() => {
                onUserLogout();
                handleDrawerToggle();
              }}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc3333)',
                color: '#ffffff',
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #cc3333, #ff4444)',
                  transform: 'scale(1.02)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Typography sx={{ 
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: '600'
              }}>
                Logout
              </Typography>
            </IconButton>
          ) : (
            <IconButton
              onClick={() => {
                setShowLoginForm(true);
                handleDrawerToggle();
              }}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #ffe066, #ffd700)',
                color: '#1a0033',
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #ffd700, #ffe066)',
                  transform: 'scale(1.02)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Typography sx={{ 
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: '600'
              }}>
                Sign In
              </Typography>
            </IconButton>
          )}
        </Box>
      </Drawer>
    </header>
  );
};

export default Header; 