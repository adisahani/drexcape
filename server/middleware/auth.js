const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔍 Auth Debug: Token provided:', !!token);
    console.log('🔍 Auth Debug: JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'drexcape-super-secret-jwt-key-2024');
    console.log('🔍 Auth Debug: Token decoded successfully:', !!decoded);
    
    const admin = await Admin.findById(decoded.id).select('-password');
    console.log('🔍 Auth Debug: Admin found:', !!admin);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid token or inactive admin.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.log('🔍 Auth Debug: JWT verification error:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Access denied.' });
    }
    
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    
    next();
  };
};

module.exports = { auth, requireRole }; 