import React from 'react';
import Header from './Header';
import UserLogin from './UserLogin';

const Layout = ({ children, isUserLoggedIn, userData, onUserLogout, showUserLogin, onShowUserLogin, onCloseUserLogin, onUserLoginSuccess }) => {
  return (
    <div className="app">
      {/* Header */}
      <Header 
        isUserLoggedIn={isUserLoggedIn} 
        userData={userData} 
        onUserLogout={onUserLogout} 
      />

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* User Login Popup */}
      {showUserLogin && (
        <>
          {console.log('🎭 === Layout Rendering UserLogin ===')}
          {console.log('📦 showUserLogin:', showUserLogin)}
          <UserLogin
            key={`login-${Date.now()}`} // Force remount each time
            onLoginSuccess={onUserLoginSuccess}
            onClose={onCloseUserLogin}
            forceOpen={true}
            isUserLoggedIn={isUserLoggedIn}
          />
        </>
      )}
    </div>
  );
};

export default Layout; 