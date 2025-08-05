# Google Places API Integration Setup Guide

## 🚀 Overview
This guide will help you set up Google Places API to get high-quality, relevant destination photos for your travel app.

## 📋 Prerequisites
- Google Cloud Console account
- Valid payment method (for billing)
- Your app's domain/IP addresses

## 🔧 Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it: `drexcape-travel-app`
4. Click "Create"

### 2. Enable Google Places API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Places API"
3. Click on "Places API" → "Enable"

### 3. Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 4. Restrict API Key (Recommended)
1. Click on your API key
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain: `*.yourdomain.com/*`
   - For local development: `localhost:3001/*`
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Places API"
4. Click "Save"

### 5. Add API Key to Environment
Add this to your `.env` file:
```env
GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

## 💰 Cost Analysis

### Google Places API Pricing
- **Free Tier**: $200 credit/month (≈ 28,000 requests)
- **Paid**: $0.017 per request after free tier
- **Estimated Monthly Cost**: $5-15 for typical usage

### Request Types Used
1. **Text Search**: $0.017 per request
2. **Place Photos**: $0.007 per request
3. **Total per image**: ~$0.024

## 🧪 Testing the Integration

### Test Endpoint
Once configured, test with:
```
GET /api/test-google-places?place=Taj Mahal&destination=Agra
```

### Expected Response
```json
{
  "success": true,
  "imageUrl": "https://maps.googleapis.com/maps/api/place/photo?...",
  "source": "google_places",
  "place": "Taj Mahal",
  "destination": "Agra"
}
```

## 🔄 Fallback Strategy

The system uses a smart fallback approach:

1. **Google Places API** (Primary)
   - High-quality, relevant photos
   - Official destination images

2. **Pixabay API** (Fallback)
   - General travel photos
   - Free tier available

3. **Default Image** (Final fallback)
   - Unsplash default image
   - Always available

## 📊 Performance Optimizations

### Caching Strategy
- **Cache Duration**: 24 hours
- **Cache Key**: `place-destination-mobile`
- **Cache Sources**: All image sources cached

### Mobile Optimization
- **Mobile Images**: 400x300px
- **Desktop Images**: 800x600px
- **Reduced Bandwidth**: Smaller file sizes

## 🐛 Troubleshooting

### Common Issues

#### 1. "GOOGLE_PLACES_API_KEY not configured"
**Solution**: Add the API key to your `.env` file

#### 2. "Quota exceeded"
**Solution**: 
- Check your Google Cloud billing
- Monitor usage in Google Cloud Console
- Consider upgrading plan

#### 3. "No images found"
**Solution**:
- Check if the place exists in Google Places
- Try different search terms
- Verify API key restrictions

#### 4. "CORS errors"
**Solution**:
- Add your domain to API key restrictions
- Use server-side proxy (already implemented)

### Debug Logging
The system logs detailed information:
```
Trying Google Places API...
Found Google Places image: https://maps.googleapis.com/...
📸 Image source: google_places for Taj Mahal
```

## 📈 Monitoring Usage

### Google Cloud Console
1. Go to "APIs & Services" → "Dashboard"
2. Select "Places API"
3. View "Quotas" and "Usage"

### Application Logs
Monitor these log patterns:
- `Trying Google Places API...`
- `Found Google Places image:`
- `Google Places API error:`

## 🔒 Security Best Practices

1. **API Key Restrictions**
   - Restrict to specific domains
   - Enable only necessary APIs

2. **Rate Limiting**
   - Implement request throttling
   - Monitor usage patterns

3. **Error Handling**
   - Graceful fallbacks
   - No sensitive data in logs

## 🚀 Deployment Checklist

- [ ] Google Cloud project created
- [ ] Places API enabled
- [ ] API key generated and restricted
- [ ] Environment variable added
- [ ] Test endpoint working
- [ ] Fallback system tested
- [ ] Monitoring configured

## 📞 Support

If you encounter issues:
1. Check Google Cloud Console for API errors
2. Verify API key restrictions
3. Test with the `/api/test-google-places` endpoint
4. Review server logs for detailed error messages

---

**🎉 Congratulations!** Your app now has access to high-quality Google Maps photos for destinations worldwide. 