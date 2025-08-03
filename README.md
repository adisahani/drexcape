# Drexcape - Smart Travel Itinerary Generator

A full-stack web application for generating personalized travel itineraries using AI.

## 🚀 Features

- **Smart Itinerary Generation**: AI-powered travel planning
- **User Management**: Registration, login, and profile management
- **Blog System**: Travel blog with admin management
- **Admin Dashboard**: Comprehensive admin panel
- **Responsive Design**: Modern UI with Material-UI components
- **Real-time Updates**: Dynamic content updates

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Material-UI
- React Router DOM
- GSAP (Animations)
- Swiper (Carousel)

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Cloudinary (Image uploads)
- bcryptjs (Password hashing)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-new-repository-url>
   cd drexcape
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create `.env` files in both `server/` and `drexcape/` directories:
   
   **Server (.env)**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Local Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
Make sure to set up the following environment variables in your production environment:

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

## 📁 Project Structure

```
drexcape/
├── drexcape/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── assets/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── server/            # Node.js backend
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── package.json
└── package.json       # Root package.json
```

## 🔧 Available Scripts

- `npm run install-all`: Install all dependencies
- `npm run dev`: Start development servers
- `npm run build`: Build frontend for production
- `npm start`: Start production server
- `npm run deploy`: Build and start production

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

### Itineraries
- `GET /api/itineraries` - Get all itineraries
- `POST /api/itineraries` - Create new itinerary
- `GET /api/itineraries/:id` - Get specific itinerary

### Blogs
- `GET /api/blogs` - Get all blogs
- `POST /api/blogs` - Create new blog (admin only)
- `GET /api/blogs/:id` - Get specific blog

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `GET /api/admin/ai-usage` - AI usage statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Adi Sahani**
- GitHub: [@adisahani](https://github.com/adisahani)

---

Made with ❤️ for travelers worldwide
