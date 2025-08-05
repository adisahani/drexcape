require('dotenv').config();
const ImageService = require('./services/imageService');

// Test data
const testPackage = {
  packageName: "Test Goa Package",
  destinations: ["Goa"],
  placesToVisit: ["Butterfly Beach", "Old Goa Churches"],
  highlights: ["Sunset cruise", "Cultural heritage"]
};

async function testImageService() {
  console.log('🧪 Testing Enhanced Image Service...\n');
  
  // Test 1: Check environment variables
  console.log('1. Environment Variables Check:');
  console.log(`   Google Places API Key: ${process.env.GOOGLE_PLACES_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Pixabay API Key: ${process.env.PIXABAY_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');
  
  // Test 2: Test single image methods
  console.log('2. Testing Single Image Methods:');
  
  try {
    const headerImage = await ImageService.getHeaderImage('Goa', 'Goa');
    console.log(`   Header Image: ${headerImage ? '✅ Retrieved' : '❌ Failed'}`);
  } catch (error) {
    console.log(`   Header Image: ❌ Error - ${error.message}`);
  }
  
  try {
    const googleImage = await ImageService.getGooglePlacePhoto('Taj Mahal');
    console.log(`   Google Places: ${googleImage ? '✅ Retrieved' : '❌ Failed'}`);
  } catch (error) {
    console.log(`   Google Places: ❌ Error - ${error.message}`);
  }
  
  try {
    const pixabayImage = await ImageService.searchPixabay('goa beach');
    console.log(`   Pixabay: ${pixabayImage ? '✅ Retrieved' : '❌ Failed'}`);
  } catch (error) {
    console.log(`   Pixabay: ❌ Error - ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Test comprehensive package images
  console.log('3. Testing Package Image Generation:');
  
  try {
    const images = await ImageService.getImagesForPackage(testPackage);
    console.log('   Package Images:');
    console.log(`     Header: ${images.header ? '✅' : '❌'}`);
    console.log(`     Gallery: ${images.gallery.length > 0 ? `✅ (${images.gallery.length} images)` : '❌'}`);
    console.log(`     Accommodation: ${images.accommodation ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`   Package Images: ❌ Error - ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: Test caching
  console.log('4. Testing Caching:');
  console.log(`   Cache Size: ${ImageService.imageCache.size} entries`);
  
  // Test cache with same query
  try {
    const firstCall = await ImageService.searchPixabay('test query');
    const secondCall = await ImageService.searchPixabay('test query');
    console.log(`   Cache Hit: ${firstCall === secondCall ? '✅ Working' : '❌ Not working'}`);
  } catch (error) {
    console.log(`   Cache Test: ❌ Error - ${error.message}`);
  }
  
  console.log('');
  console.log('🎉 Image Service Test Complete!');
}

// Run the test
testImageService().catch(console.error); 