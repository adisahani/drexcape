import React, { useState } from 'react';
import drexcapeLogo from '../assets/drexcape-logo.png';
import UserProfile from './UserProfile';
import UserLogin from './UserLogin';
import { Avatar, IconButton, Menu, MenuItem, Typography, Box } from '@mui/material';
import { Person as PersonIcon, AccountCircle as AccountCircleIcon } from '@mui/icons-material';

const Header = ({ isUserLoggedIn, userData, onUserLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);

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

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <img src={drexcapeLogo} alt="Drexcape" className="logo" />
        </div>
        <nav className="nav">
          <a href="/" className="nav-link">Home</a>
          <a href="/#destinations" className="nav-link">Destinations</a>
          <a href="/#categories" className="nav-link">Categories</a>
          <a href="/#offers" className="nav-link">Offers</a>
          <a href="/blog" className="nav-link">Blog</a>
          <a href="/#contact" className="nav-link">Contact</a>
        </nav>
        
        {/* Round Profile Button */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          ml: 2,
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
      </div>
    </header>
  );
};

export default Header; 