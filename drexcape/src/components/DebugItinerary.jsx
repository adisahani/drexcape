import React from 'react';
import ItineraryCard from './ItineraryCard';

const DebugItinerary = ({ details }) => {
  console.log('🔍 DebugItinerary - Raw details:', details);
  
  if (!details) {
    return <div>No details provided</div>;
  }

  // Simple test data
  const testDays = [
    {
      icon: '✈️',
      dayTitle: 'Day 1: Delhi to Darjeeling',
      morning: 'Fly from Delhi to Bagdogra Airport (IXB).',
      afternoon: 'Transfer to Darjeeling (approx. 3-hour drive). Check in to hotel.',
      evening: 'Explore the local market.',
    },
    {
      icon: '🌄',
      dayTitle: 'Day 2: Tiger Hill & Darjeeling Sightseeing',
      morning: 'Early morning trip to Tiger Hill to witness the sunrise over Kanchenjunga.',
      afternoon: 'Visit Batasia Loop, War Memorial, and the Himalayan Mountaineering Institute.',
      evening: 'Stroll along Darjeeling Mall Road.',
    }
  ];

  return (
    <div>
      <h3>Debug: Test Itinerary Cards</h3>
      {testDays.map((day, index) => (
        <ItineraryCard
          key={index}
          icon={day.icon}
          dayTitle={day.dayTitle}
          morning={day.morning}
          afternoon={day.afternoon}
          evening={day.evening}
        />
      ))}
      
      <h3>Debug: Raw Details</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        {details}
      </pre>
    </div>
  );
};

export default DebugItinerary; 