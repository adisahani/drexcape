import React, { useEffect, useRef, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  IconButton,
  Chip,
  Button
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  Send as SendIcon
} from '@mui/icons-material';
import gsap from 'gsap';
import PromotionalPopup from './PromotionalPopup';

const ContactPage = () => {
  const pageRef = useRef(null);
  const [showPromotionalPopup, setShowPromotionalPopup] = useState(false);

  useEffect(() => {
    // GSAP animations for the contact page
    if (pageRef.current) {
      gsap.fromTo(
        pageRef.current.querySelectorAll('.gsap-fade-in'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: 'power3.out'
        }
      );
    }
  }, []);

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 12, 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        borderRadius: '20px',
        margin: '20px auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(20px)'
      }}
      ref={pageRef}
    >
             {/* Hero Section */}
       <Box sx={{ textAlign: 'center', mb: 8 }}>
         <Typography 
           variant="h1" 
           className="gsap-fade-in"
           sx={{
             fontFamily: 'Rajdhani, Orbitron, sans-serif',
             fontWeight: 800,
             color: '#1a0033',
             mb: 3,
             fontSize: { xs: '2.5rem', md: '3.5rem' },
             textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
             letterSpacing: '0.05em'
           }}
         >
           Get In Touch
         </Typography>
         <Typography 
           variant="h4" 
           className="gsap-fade-in"
           sx={{
             color: '#4a148c',
             fontFamily: 'Rajdhani, sans-serif',
             fontWeight: 600,
             mb: 4,
             fontSize: { xs: '1.2rem', md: '1.5rem' },
             lineHeight: 1.4
           }}
         >
                       We'd love to hear from you and help plan your next adventure
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowPromotionalPopup(true)}
            className="gsap-fade-in"
            sx={{
              background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 100%)',
              color: 'white',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '1.2rem',
              py: 2,
              px: 4,
              borderRadius: '50px',
              boxShadow: '0 8px 25px rgba(109, 59, 189, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #a084e8 0%, #6d3bbd 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(109, 59, 189, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
            startIcon={<SendIcon />}
          >
            Get in Touch
          </Button>
        </Box>

              {/* Drexcape Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Paper 
            elevation={12}
            className="gsap-fade-in"
            sx={{
              background: 'linear-gradient(135deg, rgba(109, 59, 189, 0.15) 0%, rgba(160, 132, 232, 0.15) 100%)',
              border: '3px solid rgba(109, 59, 189, 0.4)',
              borderRadius: '24px',
              p: 6,
              backdropFilter: 'blur(15px)',
              boxShadow: '0 25px 50px rgba(109, 59, 189, 0.2)'
            }}
          >
            <Typography 
              variant="h1" 
              sx={{
                fontFamily: 'Rajdhani, Orbitron, sans-serif',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 50%, #c4b5fd 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(109, 59, 189, 0.3)',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                letterSpacing: '0.02em'
              }}
            >
              Drexcape
            </Typography>
            <Typography 
              variant="h4" 
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                color: '#4a148c',
                mb: 3,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                lineHeight: 1.4
              }}
            >
              Your AI-Powered Travel Companion
            </Typography>
            <Chip 
              label="Smart Travel Planning Made Simple"
              sx={{
                background: 'linear-gradient(135deg, #6d3bbd, #a084e8)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                py: 1.5,
                px: 3,
                boxShadow: '0 4px 12px rgba(109, 59, 189, 0.3)'
              }}
            />
          </Paper>
        </Box>

              {/* Powered By Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
         <Paper 
           elevation={12}
           className="gsap-fade-in"
           sx={{
             background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.15) 0%, rgba(109, 59, 189, 0.15) 100%)',
             border: '3px solid rgba(160, 132, 232, 0.4)',
             borderRadius: '24px',
             p: 6,
             backdropFilter: 'blur(15px)',
             boxShadow: '0 25px 50px rgba(160, 132, 232, 0.2)'
           }}
         >
           <Typography 
             variant="h2" 
             sx={{
               fontFamily: 'Rajdhani, Orbitron, sans-serif',
               fontWeight: 700,
               color: '#1a0033',
               mb: 3,
               fontSize: { xs: '1.8rem', md: '2.2rem' }
             }}
           >
             Powered by
           </Typography>
           <Typography 
             variant="h1" 
             sx={{
               fontFamily: 'Rajdhani, Orbitron, sans-serif',
               fontWeight: 900,
               background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffd700 100%)',
               backgroundClip: 'text',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               textShadow: '0 0 30px rgba(255, 152, 0, 0.3)',
               mb: 2,
               fontSize: { xs: '2.2rem', md: '3rem' },
               letterSpacing: '0.02em'
             }}
           >
             Dream Place Tour & Travels
           </Typography>
           <Chip 
             label="Your Trusted Travel Partner"
             sx={{
               background: 'linear-gradient(135deg, #a084e8, #6d3bbd)',
               color: 'white',
               fontWeight: 700,
               fontSize: '1.1rem',
               py: 1.5,
               px: 3,
               boxShadow: '0 4px 12px rgba(160, 132, 232, 0.3)'
             }}
           />
         </Paper>
       </Box>

             {/* Contact Information Grid */}
       <Grid container spacing={4} sx={{ mb: 8 }}>
        {/* Office Location */}
        <Grid item xs={12} md={6}>
                     <Card 
             className="gsap-fade-in"
             sx={{
               height: '100%',
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
               border: '3px solid rgba(160, 132, 232, 0.4)',
               borderRadius: '20px',
               backdropFilter: 'blur(15px)',
               transition: 'all 0.3s ease',
               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
               '&:hover': {
                 transform: 'translateY(-8px)',
                 boxShadow: '0 25px 60px rgba(160, 132, 232, 0.3)',
                 borderColor: 'rgba(160, 132, 232, 0.6)'
               }
             }}
           >
             <CardContent sx={{ p: 5 }}>
               <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                 <LocationIcon sx={{ fontSize: 50, color: '#6d3bbd', mr: 3 }} />
                 <Typography 
                   variant="h4" 
                   sx={{
                     fontFamily: 'Rajdhani, sans-serif',
                     fontWeight: 700,
                     color: '#1a0033',
                     fontSize: { xs: '1.5rem', md: '1.8rem' }
                   }}
                 >
                   Office Location
                 </Typography>
               </Box>
               <Typography 
                 variant="h5" 
                 sx={{
                   color: '#4a148c',
                   fontFamily: 'Rajdhani, sans-serif',
                   fontWeight: 600,
                   mb: 3,
                   fontSize: { xs: '1.3rem', md: '1.5rem' }
                 }}
               >
                 Konnagar, Hooghly
               </Typography>
               <Typography 
                 variant="body1" 
                 sx={{
                   color: '#374151',
                   fontFamily: 'Rajdhani, sans-serif',
                   lineHeight: 1.7,
                   fontSize: '1.1rem',
                   fontWeight: 500
                 }}
               >
                 Visit our office to discuss your travel plans in person and get personalized recommendations from our travel experts.
               </Typography>
             </CardContent>
           </Card>
        </Grid>

                 {/* Phone Number */}
         <Grid item xs={12} md={6}>
           <Card 
             className="gsap-fade-in"
             sx={{
               height: '100%',
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
               border: '3px solid rgba(160, 132, 232, 0.4)',
               borderRadius: '20px',
               backdropFilter: 'blur(15px)',
               transition: 'all 0.3s ease',
               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
               '&:hover': {
                 transform: 'translateY(-8px)',
                 boxShadow: '0 25px 60px rgba(160, 132, 232, 0.3)',
                 borderColor: 'rgba(160, 132, 232, 0.6)'
               }
             }}
           >
             <CardContent sx={{ p: 5 }}>
               <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                 <PhoneIcon sx={{ fontSize: 50, color: '#6d3bbd', mr: 3 }} />
                 <Typography 
                   variant="h4" 
                   sx={{
                     fontFamily: 'Rajdhani, sans-serif',
                     fontWeight: 700,
                     color: '#1a0033',
                     fontSize: { xs: '1.5rem', md: '1.8rem' }
                   }}
                 >
                   Phone Number
                 </Typography>
               </Box>
               <Typography 
                 variant="h3" 
                 sx={{
                   color: '#4a148c',
                   fontFamily: 'Rajdhani, sans-serif',
                   fontWeight: 700,
                   mb: 3,
                   textDecoration: 'none',
                   fontSize: { xs: '1.5rem', md: '2rem' },
                   '&:hover': {
                     color: '#6d3bbd',
                     textShadow: '0 0 10px rgba(109, 59, 189, 0.3)'
                   }
                 }}
                 component="a"
                 href="tel:+918334032265"
               >
                 +91 83340 32265
               </Typography>
               <Typography 
                 variant="body1" 
                 sx={{
                   color: '#374151',
                   fontFamily: 'Rajdhani, sans-serif',
                   lineHeight: 1.7,
                   fontSize: '1.1rem',
                   fontWeight: 500
                 }}
               >
                 Call us anytime to discuss your travel plans, get quotes, or ask any questions about our services.
               </Typography>
             </CardContent>
           </Card>
         </Grid>
      </Grid>

             {/* Google Maps Integration */}
       <Box sx={{ mb: 8 }}>
         <Typography 
           variant="h3" 
           className="gsap-fade-in"
           sx={{
             fontFamily: 'Rajdhani, Orbitron, sans-serif',
             fontWeight: 700,
             color: '#1a0033',
             mb: 4,
             textAlign: 'center',
             fontSize: { xs: '1.8rem', md: '2.2rem' }
           }}
         >
           📍 Find Us on Google Maps
         </Typography>
                 <Paper 
           elevation={12}
           className="gsap-fade-in"
           sx={{
             borderRadius: '20px',
             overflow: 'hidden',
             border: '3px solid rgba(160, 132, 232, 0.4)',
             background: 'rgba(255, 255, 255, 0.95)',
             backdropFilter: 'blur(15px)',
             boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
           }}
         >
                     <Box sx={{ position: 'relative', height: '450px' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3681.1234567890123!2d88.34567890123456!3d22.67890123456789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDQwJzQyLjAiTiA4OMKwMjAnNDQuMCJF!5e0!3m2!1sen!2sin!4v1234567890123"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Dream Place Tour & Travels - Konnagar, Hooghly"
              onError={(e) => {
                console.log('Google Maps iframe failed to load');
                e.target.style.display = 'none';
              }}
            />
            {/* Fallback if iframe fails */}
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.1) 0%, rgba(109, 59, 189, 0.1) 100%)',
                flexDirection: 'column',
                p: 3
              }}
            >
              <LocationIcon sx={{ fontSize: 60, color: '#6d3bbd', mb: 2 }} />
              <Typography 
                variant="h5" 
                sx={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  color: '#2a0140',
                  mb: 1
                }}
              >
                Konnagar, Hooghly
              </Typography>
              <Typography 
                variant="body1" 
                sx={{
                  color: '#666',
                  fontFamily: 'Rajdhani, sans-serif',
                  textAlign: 'center'
                }}
              >
                Dream Place Tour & Travels Office
              </Typography>
              <IconButton
                href="https://maps.google.com/?q=Konnagar,Hooghly"
                target="_blank"
                sx={{
                  mt: 2,
                  background: 'linear-gradient(135deg, #a084e8, #6d3bbd)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6d3bbd, #a084e8)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <LocationIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Box>

                           {/* Additional Information */}
        <Box sx={{ mb: 8 }}>
          <Typography 
            variant="h3" 
            className="gsap-fade-in"
            sx={{
              fontFamily: 'Rajdhani, Orbitron, sans-serif',
              fontWeight: 700,
              color: '#1a0033',
              mb: 4,
              textAlign: 'center',
              fontSize: { xs: '1.8rem', md: '2.2rem' }
            }}
          >
            Why Choose Drexcape?
          </Typography>
          <Typography 
            variant="h5" 
            className="gsap-fade-in"
            sx={{
              color: '#4a148c',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              mb: 6,
              textAlign: 'center',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              lineHeight: 1.4
            }}
          >
            Experience the perfect blend of AI-powered travel planning and human expertise
          </Typography>
          <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={4}>
                     <Card 
             className="gsap-fade-in"
             sx={{
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
               border: '3px solid rgba(160, 132, 232, 0.4)',
               borderRadius: '20px',
               backdropFilter: 'blur(15px)',
               transition: 'all 0.3s ease',
               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
               '&:hover': {
                 transform: 'translateY(-5px)',
                 boxShadow: '0 20px 50px rgba(160, 132, 232, 0.3)',
                 borderColor: 'rgba(160, 132, 232, 0.6)'
               }
             }}
           >
             <CardContent sx={{ p: 4, textAlign: 'center' }}>
               <BusinessIcon sx={{ fontSize: 50, color: '#6d3bbd', mb: 3 }} />
                               <Typography 
                  variant="h5" 
                  sx={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    color: '#1a0033',
                    mb: 2,
                    fontSize: { xs: '1.3rem', md: '1.5rem' }
                  }}
                >
                  AI-Powered Planning
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    color: '#374151',
                    fontFamily: 'Rajdhani, sans-serif',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  Drexcape uses advanced AI technology to create personalized travel itineraries tailored to your preferences and budget.
                </Typography>
             </CardContent>
           </Card>
        </Grid>

                 <Grid item xs={12} md={4}>
           <Card 
             className="gsap-fade-in"
             sx={{
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
               border: '3px solid rgba(160, 132, 232, 0.4)',
               borderRadius: '20px',
               backdropFilter: 'blur(15px)',
               transition: 'all 0.3s ease',
               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
               '&:hover': {
                 transform: 'translateY(-5px)',
                 boxShadow: '0 20px 50px rgba(160, 132, 232, 0.3)',
                 borderColor: 'rgba(160, 132, 232, 0.6)'
               }
             }}
           >
             <CardContent sx={{ p: 4, textAlign: 'center' }}>
               <TimeIcon sx={{ fontSize: 50, color: '#6d3bbd', mb: 3 }} />
                               <Typography 
                  variant="h5" 
                  sx={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    color: '#1a0033',
                    mb: 2,
                    fontSize: { xs: '1.3rem', md: '1.5rem' }
                  }}
                >
                  Smart Travel Platform
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    color: '#374151',
                    fontFamily: 'Rajdhani, sans-serif',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  Access your travel plans anytime, anywhere with our intelligent platform that learns from your preferences.
                </Typography>
             </CardContent>
           </Card>
         </Grid>

                 <Grid item xs={12} md={4}>
           <Card 
             className="gsap-fade-in"
             sx={{
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
               border: '3px solid rgba(160, 132, 232, 0.4)',
               borderRadius: '20px',
               backdropFilter: 'blur(15px)',
               transition: 'all 0.3s ease',
               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
               '&:hover': {
                 transform: 'translateY(-5px)',
                 boxShadow: '0 20px 50px rgba(160, 132, 232, 0.3)',
                 borderColor: 'rgba(160, 132, 232, 0.6)'
               }
             }}
           >
             <CardContent sx={{ p: 4, textAlign: 'center' }}>
               <EmailIcon sx={{ fontSize: 50, color: '#6d3bbd', mb: 3 }} />
                               <Typography 
                  variant="h5" 
                  sx={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    color: '#1a0033',
                    mb: 2,
                    fontSize: { xs: '1.3rem', md: '1.5rem' }
                  }}
                >
                  Human Expertise
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    color: '#374151',
                    fontFamily: 'Rajdhani, sans-serif',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  Combined with Dream Place Tour & Travels' expert guidance for the perfect travel experience.
                </Typography>
             </CardContent>
           </Card>
                   </Grid>
        </Grid>
        </Box>

             {/* Call to Action */}
       <Box sx={{ textAlign: 'center', mt: 8 }}>
         <Paper 
           elevation={16}
           className="gsap-fade-in"
           sx={{
             background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
             border: '3px solid rgba(255, 152, 0, 0.4)',
             borderRadius: '24px',
             p: 6,
             backdropFilter: 'blur(15px)',
             boxShadow: '0 30px 80px rgba(255, 152, 0, 0.2)'
           }}
         >
           <Typography 
             variant="h3" 
             sx={{
               fontFamily: 'Rajdhani, Orbitron, sans-serif',
               fontWeight: 700,
               color: '#1a0033',
               mb: 3,
               fontSize: { xs: '1.8rem', md: '2.2rem' }
             }}
           >
             Ready to Start Your Journey?
           </Typography>
           <Typography 
             variant="h5" 
             sx={{
               color: '#4a148c',
               fontFamily: 'Rajdhani, sans-serif',
               fontWeight: 600,
               mb: 4,
               fontSize: { xs: '1.2rem', md: '1.4rem' },
               lineHeight: 1.4
             }}
           >
             Call us now at +91 83340 32265 or visit our office in Konnagar, Hooghly
           </Typography>
           <Chip 
             label="Dream Place Tour & Travels - Your Trusted Travel Partner"
             sx={{
               background: 'linear-gradient(135deg, #ff9800, #ffc107)',
               color: '#1a0033',
               fontWeight: 800,
               fontSize: '1.2rem',
               py: 2,
               px: 4,
               boxShadow: '0 8px 20px rgba(255, 152, 0, 0.3)'
             }}
           />
         </Paper>
               </Box>

        {/* Promotional Popup */}
        <PromotionalPopup 
          forceOpen={showPromotionalPopup}
          onFormSubmitted={() => setShowPromotionalPopup(false)}
        />
     </Container>
   );
 };

export default ContactPage;
