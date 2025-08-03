import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Badge
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Favorite as FavoriteIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';

const UserProfile = ({ userData, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* User Avatar with Badge */}
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #4CAF50, #45a049)',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        }
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #ffe066, #ffd700)',
            color: '#1a0033',
            fontWeight: 'bold',
            fontSize: '1rem',
            fontFamily: 'Rajdhani, sans-serif',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'transform 0.2s ease'
            }
          }}
          onClick={handleClick}
        >
          {getInitials(userData?.name)}
        </Avatar>
      </Badge>

      {/* User Info */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography
          variant="body2"
          sx={{
            color: '#ffffff',
            fontWeight: '600',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.9rem',
            lineHeight: 1.2
          }}
        >
          {userData?.name || 'User'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.75rem'
          }}
        >
          {userData?.phone || 'User'}
        </Typography>
      </Box>

      {/* Dropdown Arrow */}
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          padding: '4px',
          '&:hover': {
            color: '#ffe066'
          }
        }}
      >
        <ArrowDownIcon sx={{ fontSize: '1rem' }} />
      </IconButton>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 224, 102, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            minWidth: 200,
            mt: 1
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <MenuItem sx={{ 
          background: 'rgba(255, 224, 102, 0.1)',
          borderBottom: '1px solid rgba(255, 224, 102, 0.2)',
          pointerEvents: 'none'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #ffe066, #ffd700)',
                color: '#1a0033',
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              {getInitials(userData?.name)}
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontFamily: 'Rajdhani, sans-serif'
                }}
              >
                {userData?.name || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Rajdhani, sans-serif'
                }}
              >
                {userData?.phone || 'User'}
              </Typography>
            </Box>
          </Box>
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255, 224, 102, 0.2)' }} />

        {/* Menu Items */}
        <MenuItem
          onClick={handleClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.9rem',
            '&:hover': {
              background: 'rgba(255, 224, 102, 0.1)',
              color: '#ffe066'
            }
          }}
        >
          <PersonIcon sx={{ mr: 2, fontSize: '1.1rem' }} />
          Profile
        </MenuItem>

        <MenuItem
          onClick={handleClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.9rem',
            '&:hover': {
              background: 'rgba(255, 224, 102, 0.1)',
              color: '#ffe066'
            }
          }}
        >
          <HistoryIcon sx={{ mr: 2, fontSize: '1.1rem' }} />
          Search History
        </MenuItem>

        <MenuItem
          onClick={handleClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.9rem',
            '&:hover': {
              background: 'rgba(255, 224, 102, 0.1)',
              color: '#ffe066'
            }
          }}
        >
          <FavoriteIcon sx={{ mr: 2, fontSize: '1.1rem' }} />
          Saved Itineraries
        </MenuItem>

        <MenuItem
          onClick={handleClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.9rem',
            '&:hover': {
              background: 'rgba(255, 224, 102, 0.1)',
              color: '#ffe066'
            }
          }}
        >
          <SettingsIcon sx={{ mr: 2, fontSize: '1.1rem' }} />
          Settings
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255, 224, 102, 0.2)' }} />

        {/* Logout Button */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            color: '#ff6b6b',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.9rem',
            fontWeight: '600',
            '&:hover': {
              background: 'rgba(255, 107, 107, 0.1)',
              color: '#ff5252'
            }
          }}
        >
          <LogoutIcon sx={{ mr: 2, fontSize: '1.1rem' }} />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserProfile; 