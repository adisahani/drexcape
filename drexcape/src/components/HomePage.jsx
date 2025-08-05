import React, { useEffect, useRef, useState } from 'react';
import drexcapeLogo from '../assets/drexcape-logo.png';
import cardImage1 from '../assets/images/400x300.jpg';
import cardImage2 from '../assets/images/300x400.jpg';
// Hero slider images
import beachSunset from '../assets/images/heroslider/beach-sunset.jpg';
import mountainPeak from '../assets/images/heroslider/mountain-peak.jpg';
import cityNight from '../assets/images/heroslider/city-night.jpg';
import forestTrail from '../assets/images/heroslider/forest-trail.jpg';
// Cloud images for parallax
import cloud1 from '../assets/images/elements/cloud-1.png';
import cloud2 from '../assets/images/elements/cloud-2.png';
import cloud3 from '../assets/images/elements/cloud-3.png';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// Material UI icons
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FlightSearchCard from './FlightSearchCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import PromotionalPopup from './PromotionalPopup';

gsap.registerPlugin(ScrollTrigger);

function HeroBackground() {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [beachSunset, mountainPeak, cityNight, forestTrail];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000); // 6 seconds per image for full-screen impact
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-background">
      <div className="background-slider">
        {images.map((img, index) => (
          <div
            key={index}
            className={`background-slide ${index === currentImage ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>
    </div>
  );
}

function ParallaxClouds() {
  const cloudsRef = useRef(null);

  // GSAP Cloud Animations
  useEffect(() => {
    if (!cloudsRef.current) return;

    // Check if device is mobile/touch
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isTouchDevice = isMobile && hasTouch;

    // Disable cloud animations on mobile for better performance
    if (isTouchDevice) {
      console.log('Mobile device detected - disabling cloud animations for performance');
      return;
    }

    // Random delay function - much shorter delays
    const getRandomDelay = () => Math.random() * 8; // Random delay between 0-8 seconds (was 30)
    const getRandomDuration = (base, variance) => base + (Math.random() * variance - variance/2);

    // 1️⃣ Faster Cloud Flow with shorter timing
    gsap.to(".cloud-1", { 
      x: '100vw', 
      duration: getRandomDuration(20, 10), // 15-25 seconds (was 35-55)
      repeat: -1, 
      ease: "power1.inOut", // Smoother easing
      delay: getRandomDelay()
    });
    
    gsap.to(".cloud-2", { 
      x: '-100vw', 
      duration: getRandomDuration(25, 12), // 19-31 seconds (was 42-67)
      repeat: -1, 
      ease: "power1.inOut", // Smoother easing
      delay: getRandomDelay()
    });
    
    gsap.to(".cloud-3", { 
      x: '100vw', 
      duration: getRandomDuration(22, 10), // 17-27 seconds (was 40-60)
      repeat: -1, 
      ease: "power1.inOut", // Smoother easing
      delay: getRandomDelay()
    });

    // Add animations for new clouds
    gsap.to(".cloud-4", { 
      x: '100vw', 
      duration: getRandomDuration(18, 8), // 14-22 seconds
      repeat: -1, 
      ease: "power1.inOut",
      delay: getRandomDelay()
    });
    
    gsap.to(".cloud-5", { 
      x: '-100vw', 
      duration: getRandomDuration(20, 10), // 15-25 seconds
      repeat: -1, 
      ease: "power1.inOut",
      delay: getRandomDelay()
    });

    // 2️⃣ Smoother Vertical Drift - Gentle floating
    gsap.to(".cloud", {
      y: "+=25", // Reduced movement for smoother effect
      repeat: -1,
      yoyo: true,
      duration: 12, // Slower for smoother movement
      ease: "sine.inOut",
      stagger: 4 // More spread out
    });

    // 3️⃣ Smoother Opacity Fading - Gentle breathing effect
    gsap.to(".cloud", {
      opacity: 0.3, // Higher minimum for better visibility
      duration: 15, // Slower for smoother fade
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 5 // More spread out
    });

    // 4️⃣ Scroll-based parallax effect
    const cloudElements = cloudsRef.current.querySelectorAll('.cloud');
    cloudElements.forEach((cloud, index) => {
      gsap.to(cloud, {
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 1
        },
        y: -(50 + index * 15),
        ease: "none"
      });
    });

  }, []);

  return (
    <div className="parallax-clouds" ref={cloudsRef}>
      <div className="cloud cloud-1">
        <img src={cloud1} alt="Cloud 1" />
      </div>
      <div className="cloud cloud-2">
        <img src={cloud2} alt="Cloud 2" />
      </div>
      <div className="cloud cloud-3">
        <img src={cloud3} alt="Cloud 3" />
      </div>
      <div className="cloud cloud-4">
        <img src={cloud1} alt="Cloud 4" />
      </div>
      <div className="cloud cloud-5">
        <img src={cloud2} alt="Cloud 5" />
      </div>
    </div>
  );
}

function PopularDestinationsSlider() {
  const destinations = [
    { id: 1, title: "Forest Wild Life", location: "NRT, Indonesia", rating: "4.7", image: cardImage1 },
    { id: 2, title: "Beach Paradise", location: "Bali, Indonesia", rating: "4.9", image: cardImage2 },
    { id: 3, title: "Mountain Retreat", location: "Swiss Alps", rating: "4.8", image: cardImage1 },
    { id: 4, title: "City Adventure", location: "Tokyo, Japan", rating: "4.6", image: cardImage2 },
    { id: 5, title: "Desert Safari", location: "Dubai, UAE", rating: "4.5", image: cardImage1 },
    { id: 6, title: "Island Escape", location: "Maldives", rating: "4.9", image: cardImage2 },
    { id: 7, title: "Cultural Heritage", location: "Kyoto, Japan", rating: "4.7", image: cardImage1 },
    { id: 8, title: "Adventure Trail", location: "Nepal", rating: "4.8", image: cardImage2 }
  ];

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
        overflow: 'hidden',
        padding: '20px 0',
        width: '100%',
        margin: '0 auto',
        maxWidth: '1400px'
      }}
    >
      {destinations.map(dest => (
        <SwiperSlide key={dest.id}>
          <div className="destination-card glass gsap-fade-in">
            <div className="destination-img" style={{backgroundImage: `url(${dest.image})`}} />
            <div className="destination-info">
              <h3>{dest.title}</h3>
              <p>{dest.location}</p>
              <span className="rating">⭐ {dest.rating}</span>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function PopularSearchesSlider() {
  const [popularItineraries, setPopularItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(API_ENDPOINTS.POPULAR_SEARCHES));
        const data = await response.json();
        
        console.log('🎯 Popular searches API response:', data);
        console.log('📊 Number of itineraries returned:', data.popularItineraries?.length || 0);
        
        if (response.ok) {
          // Log details of each itinerary
          if (data.popularItineraries) {
            data.popularItineraries.forEach((itinerary, index) => {
              console.log(`📋 Itinerary ${index + 1}:`, {
                title: itinerary.title,
                slug: itinerary.slug,
                fromLocation: itinerary.fromLocation,
                toLocation: itinerary.toLocation,
                hasHeaderImage: !!itinerary.headerImage
              });
            });
          }
          setPopularItineraries(data.popularItineraries || []);
        }
      } catch (err) {
        console.error('❌ Error fetching popular searches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularSearches();
  }, []);

  const handleItineraryClick = (itinerary) => {
    console.log('🎯 Popular search clicked:', itinerary);
    
    // Check if itinerary has valid slug
    if (itinerary.slug) {
      console.log('📎 Navigating to slug URL with state data:', `/itinerary/${itinerary.slug}`);
      // Navigate to the itinerary detail page with full itinerary data in state
      // This avoids the need to fetch from database and bypasses access control
      navigate(`/itinerary/${itinerary.slug}`, {
        state: {
          itineraryData: itinerary,
          from: itinerary.fromLocation,
          to: itinerary.toLocation,
          departureDate: itinerary.departureDate,
          returnDate: itinerary.returnDate,
          travellers: 1,
          travelClass: 'Economy',
          itineraryId: itinerary._id,
          imageUrl: itinerary.headerImage || '/default-travel.jpg'
        }
      });
    } else {
      console.log('⚠️ No valid slug, falling back to search results');
      // Fallback to search results if no slug
      navigate('/search-results', {
        state: {
          from: itinerary.fromLocation,
          to: itinerary.toLocation,
          departureDate: itinerary.departureDate,
          returnDate: itinerary.returnDate,
          travellers: 1,
          travelClass: 'Economy'
        }
      });
    }
  };

  // Fallback data when no itineraries in database
  const fallbackSearches = [
    { id: 1, title: "Mumbai to Goa", location: "Mumbai → Goa", rating: "4.8", image: cardImage1 },
    { id: 2, title: "Delhi to Manali", location: "Delhi → Manali", rating: "4.9", image: cardImage2 },
    { id: 3, title: "Bangalore to Jaipur", location: "Bangalore → Jaipur", rating: "4.7", image: cardImage1 },
    { id: 4, title: "Chennai to Kerala", location: "Chennai → Kerala", rating: "4.6", image: cardImage2 },
    { id: 5, title: "Hyderabad to Udaipur", location: "Hyderabad → Udaipur", rating: "4.5", image: cardImage1 },
    { id: 6, title: "Pune to Shimla", location: "Pune → Shimla", rating: "4.9", image: cardImage2 },
    { id: 7, title: "Kolkata to Darjeeling", location: "Kolkata → Darjeeling", rating: "4.7", image: cardImage1 },
    { id: 8, title: "Ahmedabad to Rishikesh", location: "Ahmedabad → Rishikesh", rating: "4.8", image: cardImage2 }
  ];

  // Use real data if available, otherwise use fallback
  const displayData = popularItineraries.length > 0 ? popularItineraries : fallbackSearches;

  console.log('🎯 Display data:', displayData);
  console.log('📊 Rendering Popular Searches with', displayData.length, 'items');
  console.log('🔍 Using real data:', popularItineraries.length > 0 ? 'Yes' : 'No (fallback)');

  // Show loading or no data message
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ color: '#ffe066', fontSize: '1.2rem' }}>Loading popular searches...</div>
      </div>
    );
  }

  // Show message if no valid itineraries found
  if (!loading && popularItineraries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ color: '#ffe066', fontSize: '1.2rem', marginBottom: '10px' }}>No completed itineraries found</div>
        <div style={{ color: '#ffffff', fontSize: '1rem', opacity: 0.8 }}>Complete some searches to see them here!</div>
      </div>
    );
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
      {displayData.map((item, index) => {
        console.log('Rendering item:', item);
        return (
          <SwiperSlide key={item._id || item.id || index}>
            <div 
              className="destination-card glass gsap-fade-in"
              onClick={() => {
                console.log('🎯 Card clicked:', item);
                if (item.slug) {
                  // Real itinerary with valid slug - navigate directly to detail page
                  console.log('📎 Navigating to slug URL:', `/itinerary/${item.slug}`);
                  navigate(`/itinerary/${item.slug}`);
                } else if (item.fromLocation) {
                  // Real itinerary without slug - use search results
                  handleItineraryClick(item);
                } else {
                  // Fallback data
                  const [from, to] = item.location.split(' → ');
                  navigate('/search-results', {
                    state: {
                      from: from,
                      to: to,
                      travellers: 1,
                      travelClass: 'Economy'
                    }
                  });
                }
              }}
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
                  backgroundImage: `url(${item.headerImage || item.image || '/default-travel.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '180px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: '15px'
                }}
              />
              <div className="destination-info" style={{ padding: '10px 0' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1rem' }}>{item.title}</h3>
                <p style={{ marginBottom: '10px', fontSize: '0.9rem' }}>{item.fromLocation ? `${item.fromLocation} → ${item.toLocation}` : item.location}</p>
                <span className="rating" style={{ fontSize: '0.85rem' }}>
                  ⭐ {item.days ? `${item.days} days • ₹${item.price?.toLocaleString() || 'Contact for price'}` : item.rating}
                </span>
              </div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

const HomePage = () => {
  const { isUserLoggedIn } = useAuth();
  const [showPromotionalPopup, setShowPromotionalPopup] = useState(false);
  
  // Refs for sections
  const heroRef = useRef(null)
  const destinationsRef = useRef(null)
  const categoriesRef = useRef(null)
  const stepsRef = useRef(null)
  const offersRef = useRef(null)



  // Function to handle search with user data
  const handleSearchWithUserData = (searchParams) => {
    console.log('🔍 === handleSearchWithUserData called ===');
    console.log('📦 Search params:', searchParams);
    
    // Search should always go directly to search results
    console.log('🚀 Proceeding directly to search results');
    // Store search params for the search results page
    localStorage.setItem('drexcape_search_params', JSON.stringify(searchParams));
    // Use window.location for navigation since we're outside Router context
    window.location.href = '/search-results';
  };

  useEffect(() => {
    try {
      // Check if device is mobile/touch
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isTouchDevice = isMobile && hasTouch;

      // Mobile-optimized GSAP animations
      if (isTouchDevice) {
        // Simplified animations for mobile devices
        gsap.utils.toArray('.gsap-fade-in').forEach((element, index) => {
          gsap.fromTo(element, 
            { opacity: 0, y: 20 }, // Reduced movement for mobile
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.6, // Faster duration for mobile
              delay: index * 0.1, // Shorter delays
              ease: 'power2.out'
            }
          );
        });

        // Disable parallax on mobile for better performance
        console.log('Mobile device detected - using simplified animations');
      } else {
        // Full animations for desktop
        gsap.utils.toArray('.gsap-fade-in').forEach((element, index) => {
          gsap.fromTo(element, 
            { opacity: 0, y: 50 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.8, 
              delay: index * 0.2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        });

        // Parallax effect for hero title (desktop only)
        gsap.to('.hero-title', {
          yPercent: -20,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      // Cleanup function
      return () => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    } catch (error) {
      console.error('GSAP animation error:', error);
    }
  }, [isUserLoggedIn]);

  // GSAP Animations
  useEffect(() => {
    try {
      // Check if device is mobile/touch
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isTouchDevice = isMobile && hasTouch;

      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.querySelectorAll('.gsap-fade-in'),
          { opacity: 0, y: isTouchDevice ? 20 : 40 }, // Reduced movement for mobile
          { 
            opacity: 1, 
            y: 0, 
            stagger: isTouchDevice ? 0.1 : 0.15, // Faster stagger for mobile
            duration: isTouchDevice ? 0.6 : 1, // Faster duration for mobile
            ease: 'power3.out', 
            delay: isTouchDevice ? 0.1 : 0.2 
          }
        )
      }
      
      const sections = [destinationsRef, categoriesRef, stepsRef, offersRef]
      sections.forEach(ref => {
        if (ref.current) {
          gsap.fromTo(
            ref.current.querySelectorAll('.gsap-fade-in'),
            { opacity: 0, y: isTouchDevice ? 20 : 40 },
            {
              opacity: 1, 
              y: 0, 
              stagger: isTouchDevice ? 0.1 : 0.15, 
              duration: isTouchDevice ? 0.6 : 1, 
              ease: 'power3.out',
              scrollTrigger: isTouchDevice ? undefined : {
                trigger: ref.current,
                start: "top 80%",
                toggleActions: "play none none none",
              }
            }
          )
        }
      })
      
      // Only add hover effects on non-touch devices
      if (!isTouchDevice) {
        const cardSelectors = [
          '.destination-card',
          '.category-card',
          '.step-card',
        ]
        cardSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(card => {
            card.addEventListener('mouseenter', () => {
              gsap.to(card, { scale: 1.03, boxShadow: '0 0 32px #a084e888', duration: 0.35, ease: 'power2.out' })
            })
            card.addEventListener('mouseleave', () => {
              gsap.to(card, { scale: 1, boxShadow: '0 8px 32px 0 #a084e822', duration: 0.35, ease: 'power2.inOut' })
            })
          })
        })
      }
    } catch (error) {
      console.error('GSAP animation error:', error);
    }
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="home" ref={heroRef}>
        <HeroBackground />
        <ParallaxClouds />
        <div className="hero-content hero-content-minimal">
          <h1 className="hero-title gsap-fade-in hero-title-modern">
            <span className="title-main">Hey Dreamer, <span className="magic-glow">Where Are We Flying Today?</span></span>
          </h1>
          <div className="magic-blur-glow"></div>
          <p className="hero-description gsap-fade-in hero-desc-modern">
            AI-powered journeys, personalized for you.
          </p>
          {!isUserLoggedIn && (
            <button className="hero-cta-btn gsap-fade-in" onClick={() => setShowPromotionalPopup(true)}>
              Plan My Escape <ArrowForwardIosIcon style={{fontSize: '1.1em', marginLeft: '0.5em'}} />
            </button>
          )}
          {/* Replace glassy trip search form with new FlightSearchCard */}
          <FlightSearchCard onSearchWithUserData={handleSearchWithUserData} />
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="popular-destinations full-width-section" id="destinations" ref={destinationsRef}>
        <h2 className="section-title gsap-fade-in">Popular Destinations</h2>
        <PopularDestinationsSlider />
      </section>

      {/* Popular Searches */}
      <section className="categories-section full-width-section" id="categories" ref={categoriesRef} style={{ visibility: 'visible', opacity: 1, display: 'block' }}>
        <h2 className="section-title gsap-fade-in">Popular Searches</h2>
        <PopularSearchesSlider />
      </section>

      {/* Journey Steps */}
      <section className="journey-steps" ref={stepsRef}>
        <h2 className="section-title gsap-fade-in">How Drexcape Works</h2>
        <div className="steps-list">
          <div className="step-card glass gsap-fade-in">
            <span className="step-icon">🔍</span>
            <h4>Find Your Destination</h4>
            <p>Discover new places and experiences tailored for you.</p>
          </div>
          <div className="step-card glass gsap-fade-in">
            <span className="step-icon">🧳</span>
            <h4>Book & Plan</h4>
            <p>Get AI-generated itineraries and book with ease.</p>
          </div>
          <div className="step-card glass gsap-fade-in">
            <span className="step-icon">✈️</span>
            <h4>Enjoy Your Journey</h4>
            <p>Travel smarter with packing tips and real-time updates.</p>
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section className="special-offers" id="offers" ref={offersRef}>
        <div className="offer-banner glass gsap-fade-in">
          <div className="offer-img" />
          <div className="offer-info">
            <h3>20% OFF</h3>
            <p>On all bookings till 28 September, 2023</p>
            {!isUserLoggedIn && (
              <button className="cta-primary" onClick={() => setShowPromotionalPopup(true)}>Book Now</button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="powered-by">
        <p>Powered by <span className="company-name">Dream Place Tour & Travels</span></p>
      </footer>

      {/* Promotional Popup */}
      <PromotionalPopup 
        forceOpen={showPromotionalPopup}
        onFormSubmitted={() => setShowPromotionalPopup(false)}
      />
    </>
  );
};

export default HomePage; 