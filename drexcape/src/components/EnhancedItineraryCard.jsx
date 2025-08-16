import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

const EnhancedItineraryCard = ({ 
  itinerary, 
  index, 
  onViewDetails, 
  isUserLoggedIn, 
  isNavigating,
  travellers = 1 // Add travellers prop with default value
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Get all available images for this itinerary
  const getAllImages = () => {
    const images = [];
    
    // Add header image
    if (itinerary.headerImage) {
      images.push({ url: itinerary.headerImage, type: 'header' });
    }
    
    // Add gallery images
    if (itinerary.galleryImages && Array.isArray(itinerary.galleryImages)) {
      itinerary.galleryImages.forEach((img, idx) => {
        if (img && img !== '/default-travel.jpg') {
          images.push({ url: img, type: 'gallery', index: idx });
        }
      });
    }
    
    // Add accommodation image
    if (itinerary.accommodationImage && itinerary.accommodationImage !== '/default-travel.jpg') {
      images.push({ url: itinerary.accommodationImage, type: 'accommodation' });
    }
    
    return images;
  };

  const images = getAllImages();
  const hasMultipleImages = images.length > 1;

  const handleImageError = (e) => {
    console.log('Image failed to load, using default');
    e.target.src = '/default-travel.jpg';
    setImageError(true);
  };

  const handleImageClick = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const getCurrentImage = () => {
    if (images.length === 0) {
      return '/default-travel.jpg';
    }
    return images[currentImageIndex]?.url || '/default-travel.jpg';
  };

  const getImageTypeLabel = () => {
    if (images.length === 0) return '';
    const currentImage = images[currentImageIndex];
    switch (currentImage?.type) {
      case 'header': return 'Scenic View';
      case 'gallery': return `Gallery ${currentImage.index + 1}`;
      case 'accommodation': return 'Accommodation';
      default: return '';
    }
  };

  return (
    <div className="result-card enhanced-itinerary-card">
      {/* Enhanced Image Display */}
      <div className="result-card-image-container">
        <img 
          src={getCurrentImage()} 
          alt={itinerary.packageName}
          className={`result-card-image ${hasMultipleImages ? 'clickable' : ''}`}
          onClick={hasMultipleImages ? handleImageClick : undefined}
          onError={handleImageError}
        />
        
        {/* Image Navigation Indicators */}
        {hasMultipleImages && (
          <div className="image-indicators">
            {images.map((_, idx) => (
              <div 
                key={idx}
                className={`image-indicator ${idx === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(idx)}
              />
            ))}
          </div>
        )}
        
        {/* Image Type Label */}
        {getImageTypeLabel() && (
          <div className="image-type-label">
            {getImageTypeLabel()}
          </div>
        )}
        
        {/* Click to Browse Hint */}
        {hasMultipleImages && (
          <div className="image-browse-hint">
            Click to browse images
          </div>
        )}
      </div>

      <div className="result-card-content">
        <div className="result-card-header">
          <h3 className="result-card-title">{itinerary.packageName || itinerary.title}</h3>
          <span className="result-card-days">{itinerary.duration || `${itinerary.days} Days`}</span>
        </div>
        
        <div className="result-card-details">
          {/* Professional package structure */}
          {itinerary.pricePP ? (
            <>
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid rgba(255, 193, 7, 0.3)', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '12px' 
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#856404' }}>
                  <strong>💰 Pricing for {travellers} {travellers === 1 ? 'Traveler' : 'Travelers'}</strong>
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                  <strong>Per Person:</strong> ₹{itinerary.pricePP?.toLocaleString()}
                </p>
                <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: '700', color: '#005bea' }}>
                  <strong>Total Budget:</strong> ₹{(itinerary.pricePP * travellers)?.toLocaleString()}
                </p>
              </div>
              {itinerary.hotelExample?.name && (
                <p><strong>Hotel:</strong> {itinerary.hotelExample.name} ({itinerary.hotelExample.type})</p>
              )}
              {itinerary.topAttractions && itinerary.topAttractions.length > 0 && (
                <div>
                  <strong>Top Attractions:</strong>
                  <ul>
                    {itinerary.topAttractions.slice(0, 3).map((attraction, idx) => (
                      <li key={idx}>{attraction}</li>
                    ))}
                  </ul>
                </div>
              )}
              {itinerary.inclusions && itinerary.inclusions.length > 0 && (
                <div>
                  <strong>Included:</strong>
                  <ul>
                    {itinerary.inclusions.slice(0, 2).map((inclusion, idx) => (
                      <li key={idx}>{inclusion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Fallback to old structure */
            <>
              <p><strong>Destinations:</strong> {itinerary.destinations?.join(', ')}</p>
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid rgba(255, 193, 7, 0.3)', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '12px' 
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#856404' }}>
                  <strong>💰 Pricing for {travellers} {travellers === 1 ? 'Traveler' : 'Travelers'}</strong>
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                  <strong>Per Person:</strong> ₹{itinerary.price?.toLocaleString()}
                </p>
                <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: '700', color: '#005bea' }}>
                  <strong>Total Budget:</strong> ₹{(itinerary.price * travellers)?.toLocaleString()}
                </p>
              </div>
              <div>
                <strong>Highlights:</strong>
                <ul>
                  {itinerary.highlights?.slice(0, 3).map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
        
        <button 
          className={`w-full ${isUserLoggedIn ? 'btn-primary' : 'btn-locked'}`}
          onClick={() => onViewDetails(itinerary, index)}
          disabled={isNavigating}
        >
          {isUserLoggedIn ? (
            isNavigating ? (
              <>
                <CircularProgress size={16} style={{ marginRight: '0.5rem' }} />
                Loading...
              </>
            ) : (
              'View Details'
            )
          ) : (
            <>
              <LockIcon style={{ fontSize: '1rem', marginRight: '0.5rem' }} />
              Login to View
            </>
          )}
        </button>
        
        {!isUserLoggedIn && (
          <p className="unlock-hint">
            Login to unlock detailed itineraries
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedItineraryCard; 