# Drexcape - AI-Powered Travel Platform

A modern travel platform with AI-powered itinerary generation and admin dashboard for usage analytics.

## Features

### User Features
- AI-powered travel itinerary generation
- Interactive flight search with date range picker
- Beautiful hero slider with parallax effects
- Popular destinations and search categories
- Responsive design with modern UI/UX

### Admin Features
- Secure admin authentication with MongoDB Atlas
- AI Usage Analytics Dashboard
- Real-time usage tracking and statistics
- Role-based access control
- JWT token-based authentication

## Tech Stack

### Frontend
- React 19 with Vite
- Material-UI (MUI) for components
- GSAP for animations
- Swiper for carousels
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB Atlas for database
- JWT for authentication
- bcryptjs for password hashing
- Mongoose for ODM

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd drexcape
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the server directory:
```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drexcape?retryWrites=true&w=majority

# JWT Secret for Admin Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Existing API Keys
GEMINI_25_FLASH_LITE_API_KEY=your-gemini-api-key
PIXABAY_API_KEY=your-pixabay-api-key
```

Create the initial admin user:
```bash
npm run create-admin
```

Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

Navigate to the drexcape directory:
```bash
cd ../drexcape
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access the Application

- **Main Application**: `http://localhost:5173`
- **Admin Dashboard**: `http://localhost:5173/admin`

### 5. Default Admin Credentials

After running `npm run create-admin`:
- **Email**: admin@drexcape.com
- **Password**: admin123

**Important**: Change the password after first login for security.

## API Endpoints

### Public Endpoints
- `POST /api/generate-itinerary` - Generate travel itineraries
- `POST /api/itinerary-details` - Get detailed itinerary information
- `GET /api/place-image` - Get place images from Pixabay

### Admin Endpoints
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/profile` - Get admin profile
- `PUT /api/admin/auth/change-password` - Change admin password
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/dashboard/ai-usage` - Get AI usage statistics
- `GET /api/admin/dashboard/ai-usage/logs` - Get detailed usage logs

## AI Usage Tracking

The system automatically tracks:
- API request counts
- Response times
- Success/error rates
- Token usage (estimated)
- Cost calculations
- User IP addresses and user agents

## Database Schema

### Admin Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (admin/super_admin),
  isActive: Boolean,
  lastLogin: Date,
  timestamps
}
```

### AIUsage Collection
```javascript
{
  endpoint: String,
  userId: String,
  requestData: Object,
  responseStatus: String (success/error),
  responseTime: Number,
  tokensUsed: Number,
  cost: Number,
  ipAddress: String,
  userAgent: String,
  timestamps
}
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Development

### Adding New Admin Features
1. Create new routes in `server/routes/`
2. Add authentication middleware where needed
3. Create corresponding frontend components
4. Update the admin dashboard navigation

### Adding New API Tracking
1. Import the tracking middleware
2. Add `trackAIUsage('endpoint-name')` to your route
3. The system will automatically track usage

## Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Ensure MongoDB Atlas connection is configured
3. Deploy to your preferred Node.js hosting (Vercel, Heroku, etc.)

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Configure environment variables for API endpoints

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify your MongoDB Atlas connection string
   - Ensure your IP is whitelisted in Atlas

2. **JWT Token Issues**
   - Check that JWT_SECRET is set in environment variables
   - Verify token expiration settings

3. **CORS Errors**
   - Ensure backend CORS is configured for your frontend domain
   - Check that API endpoints are accessible

4. **Admin Login Issues**
   - Run `npm run create-admin` to create initial admin user
   - Verify admin credentials in the database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.