const axios = require('axios');
const { PIXABAY_API_KEY, GOOGLE_PLACES_API_KEY } = process.env;

class ImageService {
  constructor() {
    this.defaultImages = {
      header: '/default-travel.jpg',
      gallery: [
        '/default-travel.jpg',
        '/default-travel.jpg',
        '/default-travel.jpg'
      ],
      accommodation: '/default-travel.jpg'
    };
    
    // Cache for successful image URLs to avoid repeated API calls
    this.imageCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Helper to generate a hash code for strings
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get cached image or return null
  getCachedImage(key) {
    const cached = this.imageCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.url;
    }
    return null;
  }

  // Cache an image URL
  cacheImage(key, url) {
    this.imageCache.set(key, {
      url,
      timestamp: Date.now()
    });
  }

  async getGooglePlacePhoto(placeQuery, maxWidth = 800) {
    try {
      if (!GOOGLE_PLACES_API_KEY) {
        console.log('⚠️ No Google Places API key configured');
        return null;
      }

      // Step 1: Search for places using Place Search API
      const searchQuery = `Top tourist attractions in ${placeQuery}`;
      const searchResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: searchQuery,
            type: 'tourist_attraction',
            key: GOOGLE_PLACES_API_KEY
          },
          timeout: 10000
        }
      );

      if (!searchResponse.data.results?.length) {
        console.log(`❌ No Google Places results for: ${placeQuery}`);
        return null;
      }

      // Step 2: Shuffle results to avoid duplicates
      const shuffled = searchResponse.data.results.sort(() => 0.5 - Math.random());
      const selectedPlaces = shuffled.slice(0, 3); // Get top 3 random places

      // Step 3: Get details for each place to find photos
      for (const place of selectedPlaces) {
        const detailsResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/place/details/json`,
          {
            params: {
              place_id: place.place_id,
              fields: 'name,photos,geometry,types',
              key: GOOGLE_PLACES_API_KEY
            },
            timeout: 10000
          }
        );

        if (detailsResponse.data.result?.photos?.length) {
          const photoRef = detailsResponse.data.result.photos[0].photo_reference;
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
          
          console.log(`✅ Google Places photo found for: ${placeQuery} (${place.name})`);
          return photoUrl;
        }
      }
      
      console.log(`❌ No photos found for Google Place: ${placeQuery}`);
      return null;
    } catch (error) {
      console.error('Google Places error:', error.message);
      return null;
    }
  }

  // COMMENTED OUT: Pixabay images are irrelevant and repetitive
  // async searchPixabay(query, type = 'photo', minWidth = 800, minHeight = 600) {
  //   try {
  //     if (!PIXABAY_API_KEY) {
  //       console.log('⚠️ No Pixabay API key configured');
  //       return null;
  //     }

  //     const cacheKey = `pixabay-${this.hashCode(query)}`;
  //     const cached = this.getCachedImage(cacheKey);
  //     if (cached) {
  //       console.log(`✅ Using cached Pixabay image for: ${query}`);
  //       return cached;
  //     }

  //     const response = await axios.get(
  //       `https://pixabay.com/api/`,
  //       {
  //         params: {
  //           key: PIXABAY_API_KEY,
  //           q: encodeURIComponent(query),
  //           image_type: type,
  //           min_width: minWidth,
  //           min_height: minHeight,
  //           safesearch: true,
  //           order: 'popular'
  //         },
  //         timeout: 10000
  //       }
  //     );

  //     if (response.data.hits?.length) {
  //       const imageUrl = response.data.hits[0].webformatURL;
  //       this.cacheImage(cacheKey, imageUrl);
  //       console.log(`✅ Pixabay image found for: ${query}`);
  //       return imageUrl;
  //     }
      
  //     console.log(`❌ No Pixabay results for: ${query}`);
  //     return null;
  //   } catch (error) {
  //     console.error('Pixabay error:', error.message);
  //     return null;
  //   }
  // }

  // Simplified Pixabay method that returns null to force fallback to defaults
  async searchPixabay(query, type = 'photo', minWidth = 800, minHeight = 600) {
    console.log(`⚠️ Pixabay disabled for: ${query} - using default images`);
    return null;
  }

  async getImagesForPackage(packageData) {
    const { packageName, destinations, placesToVisit, highlights } = packageData;
    
    // Generate image search queries - REDUCED TO 3 IMAGES MAXIMUM
    const headerImageQuery = `scenic wide-angle view of ${destinations?.[0] || 'travel destination'}`;
    const galleryImageQueries = [
      placesToVisit?.[0] || `${destinations?.[0]} landmark`,
      highlights?.[0] || `${destinations?.[0]} cultural activity`
    ].filter(query => query);
    
    // REMOVED: accommodationImageQuery to save costs

    console.log(`🖼️ Generating images for package: ${packageName} (MAX 3 IMAGES)`);
    console.log(`📸 Header query: ${headerImageQuery}`);
    console.log(`🖼️ Gallery queries:`, galleryImageQueries);

    // Try Google Places for header and gallery images (MAX 3 TOTAL)
    const headerImage = await this.getGooglePlacePhoto(headerImageQuery);
    const galleryImages = await Promise.all(
      galleryImageQueries.map(async (query) => {
        return await this.getGooglePlacePhoto(query);
      })
    );

    // Generate images with Google Places priority - MAX 3 IMAGES
    const images = {
      header: headerImage || this.defaultImages.header,
      gallery: galleryImages.map((img, i) => img || this.defaultImages.gallery[i]).slice(0, 2), // MAX 2 gallery images
      accommodation: this.defaultImages.accommodation // Use default to save costs
    };

    console.log(`✅ Image generation completed for: ${packageName} (${images.gallery.length + 1} images total)`);
    return images;
  }

  // Method to get a single header image (for backward compatibility)
  async getHeaderImage(place, destination, highlights = []) {
    const query = place || destination || 'travel destination';
    const searchQuery = `scenic view of ${query}`;
    
    // Try Google Places first
    const googleImage = await this.getGooglePlacePhoto(query);
    if (googleImage) {
      return googleImage;
    }
    
    // Fallback to Pixabay
    const pixabayImage = await this.searchPixabay(searchQuery);
    return pixabayImage || this.defaultImages.header;
  }
}

module.exports = new ImageService(); 