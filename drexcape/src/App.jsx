import './App.css'
import drexcapeLogo from './assets/drexcape-logo.png'
import cardImage1 from './assets/images/400x300.jpg'
import cardImage2 from './assets/images/300x400.jpg'
// Hero slider images
import beachSunset from './assets/images/heroslider/beach-sunset.jpg'
import mountainPeak from './assets/images/heroslider/mountain-peak.jpg'
import cityNight from './assets/images/heroslider/city-night.jpg'
import forestTrail from './assets/images/heroslider/forest-trail.jpg'
// Cloud images for parallax
import cloud1 from './assets/images/elements/cloud-1.png'
import cloud2 from './assets/images/elements/cloud-2.png'
import cloud3 from './assets/images/elements/cloud-3.png'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// Material UI icons
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FlightSearchCard from './components/FlightSearchCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import SearchResults from './components/SearchResults';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ItineraryDetailPage from './components/ItineraryDetailPage';
import PromotionalPopup from './components/PromotionalPopup';

gsap.registerPlugin(ScrollTrigger)

function GooeyCursor() {
  const containerRef = useRef(null);
  const blobRefs = [useRef(null), useRef(null), useRef(null)];
  const [mouse, setMouse] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  // Each blob has its own trailing position
  const positions = [useRef({ x: mouse.x, y: mouse.y }), useRef({ x: mouse.x, y: mouse.y }), useRef({ x: mouse.x, y: mouse.y })];
  const lags = [0.18, 0.12, 0.08];

  useEffect(() => {
    // Detect touch device - only mobile/tablet, not desktop with touch
    const checkTouchDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      return isMobile && hasTouch;
    };
    
    const isTouch = checkTouchDevice();
    setIsTouchDevice(isTouch);
    
    // Only add mouse event listener if not a touch device
    if (!isTouch) {
      const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
      window.addEventListener('mousemove', handleMove);
      let running = true;
      function animate() {
        positions.forEach((pos, i) => {
          pos.current.x += (mouse.x - pos.current.x) * lags[i];
          pos.current.y += (mouse.y - pos.current.y) * lags[i];
          if (blobRefs[i].current) {
            blobRefs[i].current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`;
          }
        });
        if (running) requestAnimationFrame(animate);
      }
      animate();
      return () => {
        running = false;
        window.removeEventListener('mousemove', handleMove);
      };
    }
  }, [mouse.x, mouse.y]);

  // Don't render anything on touch devices
  if (isTouchDevice) {
    return null;
  }

  return (
    <>
      {/* SVG Gooey Filter */}
      <svg width="0" height="0">
        <filter id="gooey-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix in="blur" mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>
      <div
        ref={containerRef}
        className="gooey-cursor-container"
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99999, filter: 'url(#gooey-effect)' }}
      >
        <div ref={blobRefs[0]} className="gooey-blob blob-main" />
        <div ref={blobRefs[1]} className="gooey-blob blob-side1" />
        <div ref={blobRefs[2]} className="gooey-blob blob-side2" />
      </div>
    </>
  );
}

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
      slidesPerView={5}
      spaceBetween={40}
      slidesPerGroup={2}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      breakpoints={{
        900: { slidesPerView: 5, slidesPerGroup: 2, spaceBetween: 40 },
        700: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 16 },
        0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 8 },
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
        const response = await fetch('/api/itineraries/popular/searches');
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
      console.log('📎 Navigating to slug URL:', `/itinerary/${itinerary.slug}`);
      // Navigate directly to the itinerary detail page using slug
      navigate(`/itinerary/${itinerary.slug}`);
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
      <div style={{ 
        visibility: 'visible', 
        opacity: 1, 
        display: 'block', 
        minHeight: '400px', 
        padding: '20px 0', 
        overflow: 'visible'
      }}>
        <style>
          {`
            .swiper-slide {
              height: auto !important;
              overflow: visible !important;
            }
            .swiper-wrapper {
              height: auto !important;
              overflow: visible !important;
            }
            .swiper-container {
              height: auto !important;
              overflow: visible !important;
            }
          `}
        </style>
    <Swiper
      modules={[Navigation, Pagination, A11y, Autoplay]}
      loop={true}
      slidesPerView={5}
      spaceBetween={40}
      slidesPerGroup={2}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      breakpoints={{
        900: { slidesPerView: 5, slidesPerGroup: 2, spaceBetween: 40 },
        700: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 16 },
        0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 8 },
      }}
      style={{ 
        visibility: 'visible', 
        opacity: 1, 
        display: 'block', 
        minHeight: '350px',
        overflow: 'visible',
        padding: '20px 0'
      }}
    >
      {displayData.map((item, index) => {
        console.log('Rendering item:', item);
        return (
          <SwiperSlide key={item._id || item.id || index} style={{ height: 'auto', overflow: 'visible' }}>
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
              minHeight: '320px',
              padding: '15px',
              visibility: 'visible',
              opacity: 1,
              display: 'block',
              position: 'relative',
              zIndex: 10
            }}
          >
                          <div 
              className="destination-img" 
              style={{
                backgroundImage: `url(${item.headerImage || item.image || '/default-travel.jpg'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '150px',
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
    </div>
  );
}

function App() {
  // Admin state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);

  // Check if admin is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (token && storedAdminData) {
      setIsAdminLoggedIn(true);
      setAdminData(JSON.parse(storedAdminData));
    }
  }, []);

  const handleAdminLogin = (loginData) => {
    setIsAdminLoggedIn(true);
    setAdminData(loginData.admin);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminData(null);
  };

  // Spotlight effect
  const spotlightRef = useRef(null)
  const heroRef = useRef(null)
  const destinationsRef = useRef(null)
  const categoriesRef = useRef(null)
  const stepsRef = useRef(null)
  const offersRef = useRef(null)

  // For smooth spotlight trailing
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const spotlightPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const lastMove = useRef(Date.now())
  const lagRef = useRef(0.18)

  // New state for trip search form
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  
  // State for promotional form
  const [showContactForm, setShowContactForm] = useState(false);

  function handleTripSearch(e) {
    e.preventDefault();
    // Placeholder: send data to backend/ChatGPT Nano
    console.log({ fromLocation, toLocation, startDate, endDate, budget });
    // TODO: Call backend or ChatGPT Nano here
  }

  const handleContactFormSubmitted = () => {
    setShowContactForm(false);
    // You can add any additional logic here after form submission
  };

  const handleShowContactForm = () => {
    console.log('🎭 === App.jsx handleShowContactForm called ===');
    setShowContactForm(true);
  };

  useEffect(() => {
    // Liquid, laggy spotlight
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      lastMove.current = Date.now()
      lagRef.current = 0.04 + Math.random() * 0.14
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    let animationFrameId
    const lerp = (a, b, n) => a + (b - a) * n
    const animate = () => {
      spotlightPos.current.x = lerp(spotlightPos.current.x, mouse.current.x, lagRef.current)
      spotlightPos.current.y = lerp(spotlightPos.current.y, mouse.current.y, lagRef.current)
      const dx = Math.abs(spotlightPos.current.x - mouse.current.x)
      const dy = Math.abs(spotlightPos.current.y - mouse.current.y)
      const dist = Math.sqrt(dx*dx + dy*dy)
      let scaleX = 1 + Math.min(dist/180, 0.25)
      let scaleY = 1 - Math.min(dist/320, 0.18)
      if (spotlightRef.current) {
        spotlightRef.current.style.left = `${spotlightPos.current.x - 100}px`
        spotlightRef.current.style.top = `${spotlightPos.current.y - 100}px`
        gsap.to(spotlightRef.current, { scaleX, scaleY, duration: 0.18, overwrite: true })
      }
      if (spotlightRef.current) {
        if (Date.now() - lastMove.current > 1500) {
          gsap.to(spotlightRef.current, { opacity: 0, duration: 0.7, ease: 'power2.in' })
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Floating particles/stars effect
  useEffect(() => {
    const canvas = document.getElementById('star-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const STAR_COUNT = Math.floor(60 + Math.random() * 40);
    const stars = Array.from({length: STAR_COUNT}).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.7 + Math.random() * 1.7,
      speed: 0.1 + Math.random() * 0.25,
      twinkle: Math.random() * Math.PI * 2,
      color: `rgba(255,255,255,${0.5 + Math.random() * 0.5})`
    }));

    let running = true;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let star of stars) {
        // Twinkle
        const tw = 0.5 + 0.5 * Math.sin(star.twinkle + Date.now() * 0.001 * star.speed * 2);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * tw, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8 * tw;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Float
        star.y -= star.speed * (0.3 + 0.7 * tw);
        if (star.y < -2) star.y = height + 2;
        star.x += Math.sin(Date.now() * 0.0002 + star.y * 0.01) * 0.08;
      }
      if (running) requestAnimationFrame(animate);
    }
    animate();
    // Responsive
    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('.gsap-fade-in'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 1, ease: 'power3.out', delay: 0.2 }
      )
    }
    const sections = [destinationsRef, categoriesRef, stepsRef, offersRef]
    sections.forEach(ref => {
      if (ref.current) {
        gsap.fromTo(
          ref.current.querySelectorAll('.gsap-fade-in'),
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, stagger: 0.15, duration: 1, ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            }
          }
        )
      }
    })
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
    if (spotlightRef.current) {
      gsap.to(spotlightRef.current, {
        scale: 1.13,
        repeat: -1,
        yoyo: true,
        duration: 0.7,
        ease: 'sine.inOut',
      })
    }
  }, [])

  // Add popular places and budget options to App function
  const popularPlaces = [
    "Mumbai", "Delhi", "Goa", "Bangalore", "Jaipur", "Kolkata", "Chennai", "Hyderabad", "Pune", "Manali", "Shimla", "Udaipur"
  ];
  const budgetOptions = [
    { label: "20K – 30K", value: "20000-30000" },
    { label: "30K – 50K", value: "30000-50000" },
    { label: "50K – 1L", value: "50000-100000" },
    { label: "1L+", value: "100000+" }
  ];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={
          isAdminLoggedIn ? (
            <AdminDashboard onLogout={handleAdminLogout} />
          ) : (
            <AdminLogin onLoginSuccess={handleAdminLogin} />
          )
        } />
        <Route path="/" element={
    <div className="app">
      <GooeyCursor />
      {/* Glow spotlight under cursor */}
      <div ref={spotlightRef} className="spotlight"></div>
      <div className="background-gradient">
        {/* Floating particles/stars */}
        <canvas id="star-canvas" className="star-canvas"></canvas>
        {/* Existing liquid blobs for extra depth */}
        <svg className="liquid-blob blob1" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="180" ry="120" fill="#2a0140" fillOpacity="0.55"/></svg>
        <svg className="liquid-blob blob2" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="140" ry="100" fill="#6d3bbd" fillOpacity="0.32"/></svg>
        <svg className="liquid-blob blob3" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="120" ry="160" fill="#a084e8" fillOpacity="0.18"/></svg>
        <svg className="liquid-blob blob4" viewBox="0 0 400 400" width="400" height="400"><ellipse cx="200" cy="200" rx="100" ry="80" fill="#3a006a" fillOpacity="0.22"/></svg>
      </div>
      {/* Global parallax clouds */}
      <ParallaxClouds />
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <img src={drexcapeLogo} alt="Drexcape" className="logo" />
          </div>
          <nav className="nav">
            <a href="#home" className="nav-link">Home</a>
            <a href="#destinations" className="nav-link">Destinations</a>
            <a href="#categories" className="nav-link">Categories</a>
            <a href="#offers" className="nav-link">Offers</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="home" ref={heroRef}>
        <HeroBackground />
        <div className="hero-content hero-content-minimal">
          <h1 className="hero-title gsap-fade-in hero-title-modern">
            <span className="title-main">Hey Dreamer, <span className="magic-glow">Where Are We Flying Today?</span></span>
          </h1>
          <div className="magic-blur-glow"></div>
          <p className="hero-description gsap-fade-in hero-desc-modern">
            AI-powered journeys, personalized for you.
          </p>
          <button className="hero-cta-btn gsap-fade-in" onClick={handleShowContactForm}>
            Plan My Escape <ArrowForwardIosIcon style={{fontSize: '1.1em', marginLeft: '0.5em'}} />
          </button>
          {/* Replace glassy trip search form with new FlightSearchCard */}
          <FlightSearchCard />
        </div>
        <div className="hero-visual">
          {/* Placeholder for hero image or animation */}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="popular-destinations" id="destinations" ref={destinationsRef}>
        <h2 className="section-title gsap-fade-in">Popular Destinations</h2>
        <PopularDestinationsSlider />
      </section>

      {/* Popular Searches */}
      <section className="categories-section" id="categories" ref={categoriesRef} style={{ visibility: 'visible', opacity: 1, display: 'block' }}>
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
            <button className="cta-primary" onClick={handleShowContactForm}>Book Now</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="powered-by">
        <p>Powered by <span className="company-name">Dream Place Tour & Travels</span></p>
      </footer>
      
      {/* Promotional Popup */}
      {showContactForm && (
        <>
          {console.log('🎭 === App.jsx Rendering PromotionalPopup ===')}
          {console.log('📦 showContactForm:', showContactForm)}
          <PromotionalPopup
            key={`popup-${Date.now()}`} // Force remount each time
            onFormSubmitted={handleContactFormSubmitted}
            forceOpen={true}
          />
        </>
      )}
    </div>
        } />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/itinerary/:slug" element={<ItineraryDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
