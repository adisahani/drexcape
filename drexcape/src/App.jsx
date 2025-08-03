import './App.css'
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchResults from './components/SearchResults';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ItineraryDetailPage from './components/ItineraryDetailPage';
import BlogList from './components/BlogList';
import BlogDetail from './components/BlogDetail';
import AdminBlogManager from './components/AdminBlogManager';
import Layout from './components/Layout';
import HomePage from './components/HomePage';

function App() {
  // Admin state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);

  // User state
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showUserLogin, setShowUserLogin] = useState(false);

  // Check if admin is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (token && storedAdminData) {
      setIsAdminLoggedIn(true);
      setAdminData(JSON.parse(storedAdminData));
    }
  }, []);

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserData) {
      setIsUserLoggedIn(true);
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  const handleAdminLogin = (loginData) => {
    setIsAdminLoggedIn(true);
    setAdminData(loginData.admin);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminData(null);
  };

  const handleUserLogin = (userData) => {
    setIsUserLoggedIn(true);
    setUserData(userData);
    setShowUserLogin(false);
  };

  const handleUserLogout = () => {
    setIsUserLoggedIn(false);
    setUserData(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
  };

  const handleShowUserLogin = () => {
    setShowUserLogin(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={
          isAdminLoggedIn ? (
            <AdminDashboard onLogout={handleAdminLogout} />
          ) : (
            <AdminLogin onLoginSuccess={handleAdminLogin} />
          )
        } />
        <Route path="/" element={
          <Layout 
            isUserLoggedIn={isUserLoggedIn} 
            userData={userData} 
            onUserLogout={handleUserLogout}
            showUserLogin={showUserLogin}
            onCloseUserLogin={() => setShowUserLogin(false)}
            onUserLoginSuccess={handleUserLogin}
          >
            <HomePage 
              isUserLoggedIn={isUserLoggedIn} 
              onShowUserLogin={handleShowUserLogin} 
            />
          </Layout>
        } />
        <Route path="/search-results" element={
          <Layout 
            isUserLoggedIn={isUserLoggedIn} 
            userData={userData} 
            onUserLogout={handleUserLogout}
            showUserLogin={showUserLogin}
            onCloseUserLogin={() => setShowUserLogin(false)}
            onUserLoginSuccess={handleUserLogin}
          >
            <SearchResults />
          </Layout>
        } />
        <Route path="/itinerary/:slug" element={
          <Layout 
            isUserLoggedIn={isUserLoggedIn} 
            userData={userData} 
            onUserLogout={handleUserLogout}
            showUserLogin={showUserLogin}
            onCloseUserLogin={() => setShowUserLogin(false)}
            onUserLoginSuccess={handleUserLogin}
          >
            <ItineraryDetailPage />
          </Layout>
        } />
        <Route path="/blog" element={
          <Layout 
            isUserLoggedIn={isUserLoggedIn} 
            userData={userData} 
            onUserLogout={handleUserLogout}
            showUserLogin={showUserLogin}
            onCloseUserLogin={() => setShowUserLogin(false)}
            onUserLoginSuccess={handleUserLogin}
          >
            <BlogList />
          </Layout>
        } />
        <Route path="/blog/:slug" element={
          <Layout 
            isUserLoggedIn={isUserLoggedIn} 
            userData={userData} 
            onUserLogout={handleUserLogout}
            showUserLogin={showUserLogin}
            onCloseUserLogin={() => setShowUserLogin(false)}
            onUserLoginSuccess={handleUserLogin}
          >
            <BlogDetail />
          </Layout>
        } />
        <Route path="/admin/blogs" element={
          isAdminLoggedIn ? (
            <AdminBlogManager />
          ) : (
            <AdminLogin onLoginSuccess={handleAdminLogin} />
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
