import React from 'react';
import drexcapeLogo from '../assets/drexcape-logo.png';
import UserProfile from './UserProfile';

const Header = ({ isUserLoggedIn, userData, onUserLogout }) => {
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
        {/* User Profile Section */}
        {isUserLoggedIn && userData && (
          <UserProfile userData={userData} onLogout={onUserLogout} />
        )}
      </div>
    </header>
  );
};

export default Header; 