import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import drexcapeLogo from '../assets/drexcape-logo.png';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="logo">
        <img 
          src={drexcapeLogo} 
          alt="DrexCape" 
          onClick={() => navigate('/')}
          style={{ 
            cursor: 'pointer',
            height: '50px',
            width: 'auto',
            maxWidth: '200px'
          }}
        />
      </div>
      <nav className="nav">
        <a 
          href="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, '/')}
        >
          Home
        </a>
        <a 
          href="/about" 
          className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, '/about')}
        >
          About
        </a>
        <a 
          href="/services" 
          className={`nav-link ${isActive('/services') ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, '/services')}
        >
          Services
        </a>
        <a 
          href="/contact" 
          className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, '/contact')}
        >
          Contact
        </a>
        <a 
          href="/blog" 
          className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, '/blog')}
        >
          Blog
        </a>
      </nav>
    </header>
  );
};

export default Header; 