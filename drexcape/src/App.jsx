import './App.css'
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
import ContactPage from './components/ContactPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAdminLoggedIn, isUserLoggedIn } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={
          isAdminLoggedIn ? (
            <AdminDashboard />
          ) : (
            <AdminLogin />
          )
        } />
        
        {/* Main App Routes with Unified Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search-results" element={<SearchResults />} />
          <Route path="itinerary/:slug" element={<ItineraryDetailPage />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="admin-blogs" element={
            isAdminLoggedIn ? (
              <AdminBlogManager />
            ) : (
              <AdminLogin />
            )
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
