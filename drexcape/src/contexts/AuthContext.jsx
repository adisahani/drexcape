import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    // Check user authentication
    const userToken = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (userToken && storedUserData) {
      try {
        setIsUserLoggedIn(true);
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      }
    }

    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (adminToken && storedAdminData) {
      try {
        setIsAdminLoggedIn(true);
        setAdminData(JSON.parse(storedAdminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
    }
  }, []);

  const handleUserLogin = (userData) => {
    setIsUserLoggedIn(true);
    setUserData(userData);
    localStorage.setItem('userToken', 'logged-in');
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleUserLogout = () => {
    setIsUserLoggedIn(false);
    setUserData(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
  };

  const handleAdminLogin = (adminData, token) => {
    setIsAdminLoggedIn(true);
    setAdminData(adminData);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(adminData));
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminData(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  };

  const value = {
    isUserLoggedIn,
    userData,
    isAdminLoggedIn,
    adminData,
    handleUserLogin,
    handleUserLogout,
    handleAdminLogin,
    handleAdminLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 