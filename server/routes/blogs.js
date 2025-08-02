const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Admin = require('../models/Admin');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { auth } = require('../middleware/auth');

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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all published blogs (public)
router.get('/published', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Get single blog by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const blog = await Blog.findOne({ slug, status: 'published' })
      .populate('author', 'name email');
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment views
    blog.views += 1;
    await blog.save();
    
    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// Get all blogs (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Create new blog (admin only)
router.post('/create', auth, upload.single('featuredImage'), async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      metaTitle,
      metaDescription,
      status = 'draft'
    } = req.body;
    
    // Upload image to Cloudinary
    let featuredImage = '';
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'drexcape-blogs',
              transformation: [
                { width: 1200, height: 630, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          
          uploadStream.end(req.file.buffer);
        });
        
        featuredImage = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      featuredImage: featuredImage || 'https://via.placeholder.com/1200x630/cccccc/666666?text=No+Image',
      author: req.admin.id,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      metaTitle,
      metaDescription,
      status
    });
    
    await blog.save();
    
    res.status(201).json(blog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// Update blog (admin only)
router.put('/:id', auth, upload.single('featuredImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      metaTitle,
      metaDescription,
      status
    } = req.body;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Upload new image if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'drexcape-blogs',
              transformation: [
                { width: 1200, height: 630, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          
          uploadStream.end(req.file.buffer);
        });
        
        blog.featuredImage = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }
    
    // Update fields
    if (title) {
      blog.title = title;
      // Regenerate slug if title changed
      blog.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (content) blog.content = content;
    if (excerpt) blog.excerpt = excerpt;
    if (category) blog.category = category;
    if (tags) blog.tags = tags.split(',').map(tag => tag.trim());
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;
    if (status) blog.status = status;
    
    await blog.save();
    
    res.json(blog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Delete blog (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// Increment social share count
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.socialShares[platform] !== undefined) {
      blog.socialShares[platform] += 1;
      await blog.save();
    }
    
    res.json({ message: 'Share count updated' });
  } catch (error) {
    console.error('Error updating share count:', error);
    res.status(500).json({ error: 'Failed to update share count' });
  }
});

// Get blog categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Blog.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get popular blogs
router.get('/popular/list', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .sort({ views: -1, likes: -1 })
      .limit(5)
      .populate('author', 'name');
    
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching popular blogs:', error);
    res.status(500).json({ error: 'Failed to fetch popular blogs' });
  }
});

module.exports = router; 