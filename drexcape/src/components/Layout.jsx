import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import gsap from 'gsap';

// Unified Background Component
const UnifiedBackground = () => {
  return (
    <>
      {/* Main background gradient */}
      <div className="background-gradient"></div>
      
      {/* Floating blobs */}
      <div className="liquid-blob blob1"></div>
      <div className="liquid-blob blob2"></div>
      <div className="liquid-blob blob3"></div>
      <div className="liquid-blob blob4"></div>
      
      {/* Star canvas */}
      <canvas id="star-canvas" className="star-canvas"></canvas>
    </>
  );
};

// Gooey Cursor Component
const GooeyCursor = () => {
  const containerRef = React.useRef(null);
  const blobRefs = [React.useRef(null), React.useRef(null), React.useRef(null)];
  const [mouse, setMouse] = React.useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const positions = [React.useRef({ x: mouse.x, y: mouse.y }), React.useRef({ x: mouse.x, y: mouse.y }), React.useRef({ x: mouse.x, y: mouse.y })];
  const lags = [0.18, 0.12, 0.08];

  React.useEffect(() => {
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
    <div className="gooey-cursor-container" ref={containerRef}>
      <div className="gooey-blob blob-main" ref={blobRefs[0]}></div>
      <div className="gooey-blob blob-side1" ref={blobRefs[1]}></div>
      <div className="gooey-blob blob-side2" ref={blobRefs[2]}></div>
    </div>
  );
};

// Star Animation Component
const StarAnimation = () => {
  React.useEffect(() => {
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
        ctx.fillStyle = star.color.replace(')', `,${tw})`);
        ctx.fill();
        
        // Move stars slowly
        star.y += star.speed * 0.1;
        if (star.y > height) {
          star.y = -10;
          star.x = Math.random() * width;
        }
      }
      if (running) requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return null;
};

// Spotlight Effect Component
const SpotlightEffect = () => {
  const spotlightRef = React.useRef(null);
  const mouse = React.useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const spotlightPos = React.useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lastMove = React.useRef(Date.now());
  const lagRef = React.useRef(0.18);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      lastMove.current = Date.now();
      lagRef.current = 0.04 + Math.random() * 0.14;
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    const lerp = (a, b, n) => a + (b - a) * n;
    const animate = () => {
      spotlightPos.current.x = lerp(spotlightPos.current.x, mouse.current.x, lagRef.current);
      spotlightPos.current.y = lerp(spotlightPos.current.y, mouse.current.y, lagRef.current);
      const dx = Math.abs(spotlightPos.current.x - mouse.current.x);
      const dy = Math.abs(spotlightPos.current.y - mouse.current.y);
      const dist = Math.sqrt(dx*dx + dy*dy);
      let scaleX = 1 + Math.min(dist/180, 0.25);
      let scaleY = 1 - Math.min(dist/320, 0.18);
      if (spotlightRef.current) {
        spotlightRef.current.style.left = `${spotlightPos.current.x - 100}px`;
        spotlightRef.current.style.top = `${spotlightPos.current.y - 100}px`;
        gsap.to(spotlightRef.current, { scaleX, scaleY, duration: 0.18, overwrite: true });
      }
      if (spotlightRef.current) {
        if (Date.now() - lastMove.current > 1500) {
          gsap.to(spotlightRef.current, { opacity: 0, duration: 0.7, ease: 'power2.in' });
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <div ref={spotlightRef} className="spotlight"></div>;
};

const Layout = () => {
  return (
    <div className="app">
      {/* Unified Background System */}
      <UnifiedBackground />
      <StarAnimation />
      <GooeyCursor />
      <SpotlightEffect />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 