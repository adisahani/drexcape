const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { activityTracker } = require('../middleware/activityTracker');

// Apply activity tracker middleware
router.use(activityTracker);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ==================== PUBLIC ROUTES ====================

// Get all published packages (public)
router.get('/published', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MongoDB not available, returning empty packages');
      return res.json({
        packages: [],
        totalPages: 0,
        currentPage: 1,
        total: 0
      });
    }

    const { page = 1, limit = 12, category, search, minPrice, maxPrice, duration } = req.query;
    
    const query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { 'travelDetails.fromLocation': { $regex: search, $options: 'i' } },
        { 'travelDetails.toLocation': { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    if (duration) {
      query['travelDetails.duration'] = { $lte: parseInt(duration) };
    }
    
    const packages = await Package.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Package.countDocuments(query);
    
    res.json({
      packages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.json({
      packages: [],
      totalPages: 0,
      currentPage: 1,
      total: 0
    });
  }
});

// Get package categories (public)
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Package.distinct('category');
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.json({ categories: [] });
  }
});

// Get single package by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const { slug } = req.params;
    
    const package = await Package.findOne({ slug, status: 'published' })
      .populate('author', 'name email');

    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Increment views
    package.views += 1;
    await package.save();

    res.json({ package });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// Get featured packages (public)
router.get('/featured/list', async (req, res) => {
  try {
    const packages = await Package.find({ 
      status: 'published',
      'images.isFeatured': true 
    })
    .populate('author', 'name')
    .sort({ views: -1, createdAt: -1 })
    .limit(6)
    .exec();

    res.json({ packages });
  } catch (error) {
    console.error('Error fetching featured packages:', error);
    res.json({ packages: [] });
  }
});

// Book package (public)
router.post('/book', async (req, res) => {
  try {
    console.log('📦 Booking request received:', req.body);
    
    const {
      packageId,
      packageSlug,
      fullName,
      email,
      phone,
      travelers,
      preferredDate,
      specialRequests,
      packageTitle,
      packagePrice,
      itemType
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !travelers || !preferredDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate packageId if provided
    if (packageId && !require('mongoose').Types.ObjectId.isValid(packageId)) {
      console.log('⚠️ Invalid packageId format:', packageId);
      return res.status(400).json({ error: 'Invalid package ID format' });
    }

    // Create booking record with proper validation
    const booking = {
      packageId: packageId || null, // Allow null for non-package bookings
      packageSlug: packageSlug || 'unknown',
      packageTitle: packageTitle || 'Unknown Package',
      packagePrice: packagePrice ? parseFloat(packagePrice) : 0,
      customerInfo: {
        fullName: fullName.trim(),
        email: email ? email.trim().toLowerCase() : '',
        phone: phone.trim(),
        travelers: parseInt(travelers) || 1,
        preferredDate: new Date(preferredDate),
        specialRequests: specialRequests ? specialRequests.trim() : ''
      },
      status: 'pending',
      createdAt: new Date()
    };

    console.log('📦 Creating booking with data:', booking);

    // Create booking record in database
    let newBooking;
    if (!process.env.MONGODB_URI) {
      console.log('⚠️ MongoDB not available, simulating booking creation');
      // Simulate successful booking for demo purposes
      newBooking = { _id: `mock-${Date.now()}` };
      console.log('✅ Mock booking created:', newBooking._id);
    } else {
      newBooking = new Booking(booking);
      await newBooking.save();
      console.log('✅ Booking saved successfully:', newBooking._id);
    }

    // Increment package bookings count only if packageId is valid and MongoDB is available
    if (packageId && require('mongoose').Types.ObjectId.isValid(packageId) && process.env.MONGODB_URI) {
      try {
        await Package.findByIdAndUpdate(packageId, {
          $inc: { 'bookings': 1 }
        });
        console.log('✅ Package booking count incremented');
      } catch (packageError) {
        console.log('⚠️ Could not increment package booking count:', packageError.message);
      }
    }

    // Track the booking activity
    if (req.trackFormSubmission && process.env.MONGODB_URI) {
      req.trackFormSubmission('booking', {
        packageId,
        packageTitle,
        fullName,
        phone,
        travelers,
        preferredDate
      }, 'booking_form');
    }

    res.status(201).json({ 
      message: 'Booking request submitted successfully! We will contact you soon.',
      bookingId: newBooking._id
    });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid data format provided' 
      });
    }
    
    res.status(500).json({ error: 'Failed to submit booking request' });
  }
});

// ==================== BOOKING MANAGEMENT ROUTES ====================

// Get all bookings (admin)
router.get('/admin/bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { packageTitle: { $regex: search, $options: 'i' } },
        { 'customerInfo.fullName': { $regex: search, $options: 'i' } },
        { 'customerInfo.phone': { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const bookings = await Booking.find(query)
      .populate('packageId', 'title slug images')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking statistics (admin)
router.get('/admin/bookings/stats', auth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const contactedBookings = await Booking.countDocuments({ status: 'contacted' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    // Recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Popular packages
    const popularPackages = await Booking.aggregate([
      {
        $group: {
          _id: '$packageId',
          count: { $sum: 1 },
          packageTitle: { $first: '$packageTitle' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      totalBookings,
      pendingBookings,
      contactedBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      recentBookings,
      popularPackages
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ error: 'Failed to fetch booking statistics' });
  }
});

// Update booking status (admin)
router.patch('/admin/bookings/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    booking.updatedAt = new Date();
    
    await booking.save();
    
    res.json({ message: 'Booking status updated successfully', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Add contact attempt (admin)
router.post('/admin/bookings/:id/contact', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { method, notes, successful } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.contactAttempts.push({
      method,
      notes,
      successful,
      date: new Date()
    });
    
    await booking.save();
    
    res.json({ message: 'Contact attempt recorded successfully', booking });
  } catch (error) {
    console.error('Error recording contact attempt:', error);
    res.status(500).json({ error: 'Failed to record contact attempt' });
  }
});

// Get single booking details (admin)
router.get('/admin/bookings/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate('packageId', 'title slug images description travelDetails pricing');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all packages (admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    const packages = await Package.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Package.countDocuments(query);
    
    res.json({
      packages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Create new package (admin)
router.post('/admin/create', auth, upload.array('images', 10), async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      shortDescription,
      basePrice,
      currency,
      pricePerPerson,
      discountPercentage,
      validUntil,
      fromLocation,
      toLocation,
      duration,
      travelClass,
      maxTravelers,
      minTravelers,
      features,
      inclusions,
      exclusions,
      itinerary,
      category,
      tags,
      metaTitle,
      metaDescription,
      status,
      requiresAdvanceBooking,
      advanceBookingDays,
      cancellationPolicy,
      refundPolicy,
      phone,
      email,
      whatsapp
    } = req.body;

    // Debug: Log received data
    console.log('📝 Creating package with data:', {
      title,
      slug,
      description: description?.substring(0, 50) + '...',
      shortDescription: shortDescription?.substring(0, 50) + '...',
      category,
      status
    });

    // Upload images to Cloudinary
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'drexcape/packages',
            transformation: [
              { width: 1200, height: 800, crop: 'fill' },
              { quality: 'auto' }
            ]
          }
        );
        
        uploadedImages.push({
          url: result.secure_url,
          caption: req.body[`imageCaption${i}`] || '',
          isFeatured: i === 0 // First image is featured
        });
      }
    }

    const packageData = {
      title,
      slug,
      description,
      shortDescription,
      images: uploadedImages,
      pricing: {
        basePrice: parseFloat(basePrice),
        currency,
        pricePerPerson: pricePerPerson === 'true',
        discountPercentage: parseFloat(discountPercentage) || 0,
        validUntil: validUntil ? new Date(validUntil) : null
      },
      travelDetails: {
        fromLocation,
        toLocation,
        duration: parseInt(duration),
        travelClass,
        maxTravelers: parseInt(maxTravelers),
        minTravelers: parseInt(minTravelers)
      },
      features: Array.isArray(features) ? features : (features ? JSON.parse(features) : []),
      inclusions: Array.isArray(inclusions) ? inclusions : (inclusions ? JSON.parse(inclusions) : []),
      exclusions: Array.isArray(exclusions) ? exclusions : (exclusions ? JSON.parse(exclusions) : []),
      itinerary: Array.isArray(itinerary) ? itinerary : (itinerary ? JSON.parse(itinerary) : ''),
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      metaTitle,
      metaDescription,
      status,
      bookingInfo: {
        requiresAdvanceBooking: requiresAdvanceBooking === 'true',
        advanceBookingDays: parseInt(advanceBookingDays),
        cancellationPolicy,
        refundPolicy
      },
      contactInfo: {
        phone,
        email,
        whatsapp
      },
      author: req.admin._id
    };

    const newPackage = new Package(packageData);
    await newPackage.save();

    res.status(201).json({ 
      message: 'Package created successfully', 
      package: newPackage 
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Update package (admin)
router.put('/admin/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Handle image uploads
    let uploadedImages = [...package.images]; // Keep existing images
    
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'drexcape/packages',
            transformation: [
              { width: 1200, height: 800, crop: 'fill' },
              { quality: 'auto' }
            ]
          }
        );
        
        uploadedImages.push({
          url: result.secure_url,
          caption: req.body[`imageCaption${i}`] || '',
          isFeatured: uploadedImages.length === 0 // Featured if no existing images
        });
      }
    }

    // Update package data
    const updateData = {
      ...req.body,
      images: uploadedImages,
      pricing: {
        basePrice: parseFloat(req.body.basePrice),
        currency: req.body.currency,
        pricePerPerson: req.body.pricePerPerson === 'true',
        discountPercentage: parseFloat(req.body.discountPercentage) || 0,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null
      },
      travelDetails: {
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        duration: parseInt(req.body.duration),
        travelClass: req.body.travelClass,
        maxTravelers: parseInt(req.body.maxTravelers),
        minTravelers: parseInt(req.body.minTravelers)
      },
      features: Array.isArray(req.body.features) ? req.body.features : (req.body.features ? JSON.parse(req.body.features) : []),
      inclusions: Array.isArray(req.body.inclusions) ? req.body.inclusions : (req.body.inclusions ? JSON.parse(req.body.inclusions) : []),
      exclusions: Array.isArray(req.body.exclusions) ? req.body.exclusions : (req.body.exclusions ? JSON.parse(req.body.exclusions) : []),
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
      bookingInfo: {
        requiresAdvanceBooking: req.body.requiresAdvanceBooking === 'true',
        advanceBookingDays: parseInt(req.body.advanceBookingDays),
        cancellationPolicy: req.body.cancellationPolicy,
        refundPolicy: req.body.refundPolicy
      },
      contactInfo: {
        phone: req.body.phone,
        email: req.body.email,
        whatsapp: req.body.whatsapp
      }
    };

    const updatedPackage = await Package.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('author', 'name');

    res.json({ 
      message: 'Package updated successfully', 
      package: updatedPackage 
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// Delete package (admin)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Delete images from Cloudinary
    if (package.images && package.images.length > 0) {
      for (const image of package.images) {
        try {
          const publicId = image.url.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`drexcape/packages/${publicId}`);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    await Package.findByIdAndDelete(id);
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// Delete image from package (admin)
router.delete('/admin/:id/images/:imageIndex', auth, async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const imageIndexNum = parseInt(imageIndex);
    if (imageIndexNum < 0 || imageIndexNum >= package.images.length) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    const imageToDelete = package.images[imageIndexNum];

    // Delete from Cloudinary
    try {
      const publicId = imageToDelete.url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`drexcape/packages/${publicId}`);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }

    // Remove from package
    package.images.splice(imageIndexNum, 1);
    await package.save();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Update package status (admin)
router.patch('/admin/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const package = await Package.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('author', 'name');

    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ 
      message: 'Package status updated successfully', 
      package 
    });
  } catch (error) {
    console.error('Error updating package status:', error);
    res.status(500).json({ error: 'Failed to update package status' });
  }
});

// Get package statistics (admin)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    const totalPackages = await Package.countDocuments();
    const publishedPackages = await Package.countDocuments({ status: 'published' });
    const draftPackages = await Package.countDocuments({ status: 'draft' });
    const archivedPackages = await Package.countDocuments({ status: 'archived' });

    const totalViews = await Package.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    const totalBookings = await Package.aggregate([
      { $group: { _id: null, total: { $sum: '$bookings' } } }
    ]);

    const categoryStats = await Package.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalPackages,
      publishedPackages,
      draftPackages,
      archivedPackages,
      totalViews: totalViews[0]?.total || 0,
      totalBookings: totalBookings[0]?.total || 0,
      categoryStats
    });
  } catch (error) {
    console.error('Error fetching package stats:', error);
    res.status(500).json({ error: 'Failed to fetch package statistics' });
  }
});

module.exports = router;
