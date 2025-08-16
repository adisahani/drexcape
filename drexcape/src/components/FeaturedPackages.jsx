import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const FeaturedPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedPackages();
  }, []);

  const fetchFeaturedPackages = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PACKAGES_FEATURED));
      const data = await response.json();

      if (response.ok) {
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching featured packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = (pkg) => {
    navigate(`/package/${pkg.slug}`, {
      state: { package: pkg }
    });
  };

  const getDiscountedPrice = (basePrice, discountPercentage) => {
    const price = parseFloat(basePrice);
    const discount = parseFloat(discountPercentage);
    return price * (1 - discount / 100);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ color: '#ffe066', fontSize: '1.2rem' }}>Loading featured packages...</div>
      </div>
    );
  }

  if (packages.length === 0) {
    return null; // Don't show section if no packages
  }

  return (
    <Swiper
      modules={[Navigation, Pagination, A11y, Autoplay]}
      loop={true}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      spaceBetween={20}
      slidesPerView={'auto'}
      centeredSlides={true}
      breakpoints={{
        320: { slidesPerView: 1, spaceBetween: 20, centeredSlides: true },
        480: { slidesPerView: 1, spaceBetween: 20, centeredSlides: true },
        768: { slidesPerView: 2, spaceBetween: 20, centeredSlides: true },
        1024: { slidesPerView: 3, spaceBetween: 20, centeredSlides: true },
        1200: { slidesPerView: 4, spaceBetween: 20, centeredSlides: true }
      }}
      style={{ 
        visibility: 'visible', 
        opacity: 1, 
        display: 'block', 
        minHeight: '400px',
        overflow: 'visible',
        padding: '20px 0',
        width: '100%',
        margin: '0 auto',
        maxWidth: '1400px'
      }}
    >
      {packages.slice(0, 8).map((pkg, index) => (
        <SwiperSlide key={pkg._id || index}>
          <div 
            className="destination-card glass gsap-fade-in"
            onClick={() => handlePackageClick(pkg)}
            style={{ 
              cursor: 'pointer',
              border: '2px solid rgba(255,255,255,0.2)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              minHeight: '350px',
              padding: '16px',
              visibility: 'visible',
              opacity: 1,
              display: 'block',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div 
              className="destination-img" 
              style={{
                backgroundImage: `url(${pkg.images && pkg.images.length > 0 ? pkg.images[0].url : '/default-travel.jpg'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '180px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '15px'
              }}
            />
            <div className="destination-info" style={{ padding: '10px 0' }}>
              <h3 style={{ marginBottom: '8px', fontSize: '1rem' }}>{pkg.title}</h3>
              <p style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
                {pkg.travelDetails.fromLocation} → {pkg.travelDetails.toLocation}
              </p>
              <span className="rating" style={{ fontSize: '0.85rem' }}>
                ⭐ {pkg.travelDetails.duration} days • ₹{pkg.pricing.basePrice?.toLocaleString() || 'Contact for price'}
                {pkg.pricing.discountPercentage > 0 && (
                  <span style={{ 
                    textDecoration: 'line-through', 
                    color: '#999', 
                    marginLeft: '8px'
                  }}>
                    ₹{getDiscountedPrice(pkg.pricing.basePrice, pkg.pricing.discountPercentage)?.toLocaleString()}
                  </span>
                )}
              </span>
              {pkg.pricing.discountPercentage > 0 && (
                <div style={{ 
                  background: '#f44336', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem',
                  marginTop: '5px',
                  display: 'inline-block'
                }}>
                  {pkg.pricing.discountPercentage}% OFF
                </div>
              )}
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default FeaturedPackages;
