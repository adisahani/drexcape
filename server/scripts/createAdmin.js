require('dotenv').config();
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@drexcape.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      username: 'admin',
      email: 'admin@drexcape.com',
      password: 'admin123', // This will be hashed automatically
      role: 'super_admin',
      isActive: true
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@drexcape.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

