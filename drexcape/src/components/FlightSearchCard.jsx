import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FlightSearchCard.css';
import LocationInput from './LocationInput';
import TravellersClassSelector from './TravellersClassSelector';
import DateRangePicker from './DateRangePicker';

const FlightSearchCard = ({ onSearchWithUserData }) => {
  const navigate = useNavigate();
  // Placeholder state for From/To
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [travellers, setTravellers] = React.useState(1);
  const [range, setRange] = React.useState([
    {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      key: 'selection',
    },
  ]);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [validationError, setValidationError] = React.useState('');
  const [priceRange, setPriceRange] = React.useState([0, 50000]);
  const [showPriceFilter, setShowPriceFilter] = React.useState(false);

  // Sample airport list
  const airportOptions = [
    { city: 'Delhi', airport: 'Indira Gandhi International Airport', code: 'DEL' },
    { city: 'Mumbai', airport: 'Chhatrapati Shivaji Maharaj International Airport', code: 'BOM' },
    { city: 'Bengaluru', airport: 'Kempegowda International Airport', code: 'BLR' },
    { city: 'Chennai', airport: 'Chennai International Airport', code: 'MAA' },
    { city: 'Kolkata', airport: 'Netaji Subhas Chandra Bose International Airport', code: 'CCU' },
    { city: 'Hyderabad', airport: 'Rajiv Gandhi International Airport', code: 'HYD' },
    { city: 'Goa', airport: 'Goa International Airport', code: 'GOI' },
    { city: 'Pune', airport: 'Pune Airport', code: 'PNQ' },
    { city: 'Ahmedabad', airport: 'Sardar Vallabhbhai Patel International Airport', code: 'AMD' },
    { city: 'Jaipur', airport: 'Jaipur International Airport', code: 'JAI' },
  ];

  const formatDate = (date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  const formatDay = (date) => date.toLocaleDateString('en-GB', { weekday: 'long' });

  const handleSearch = () => {
    // Clear previous validation errors
    setValidationError('');

    // Validate that both from and to locations are set
    if (!from.trim()) {
      setValidationError('Please select a departure location');
      return;
    }

    if (!to.trim()) {
      setValidationError('Please select a destination location');
      return;
    }

    // Check if from and to are the same
    if (from.trim() === to.trim()) {
      setValidationError('Departure and destination cannot be the same');
      return;
    }

    const searchParams = {
      from,
      to,
      travellers,
      departureDate: range[0].startDate,
      returnDate: range[0].endDate,
      startDate: range[0].startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      endDate: range[0].endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      priceRange,
    };

    if (onSearchWithUserData) {
      onSearchWithUserData(searchParams);
    } else {
      // Fallback to direct navigation
      navigate('/search-results', { state: searchParams });
    }
  };

  // Clear validation error when user starts typing
  const handleFromChange = (e) => {
    setFrom(e.target.value);
    if (validationError) setValidationError('');
  };

  const handleToChange = (e) => {
    setTo(e.target.value);
    if (validationError) setValidationError('');
  };

  return (
    <div className="flight-search-card">
      {/* From/To Inputs with overlapping swap button */}
      <div className="location-section overlap-layout">
        <div className="location-input-wrap">
          <LocationInput
            label="From"
            value={from}
            onChange={handleFromChange}
            placeholder="From"
            options={airportOptions}
          />
        </div>
        <button className="swap-btn overlap-swap-btn" aria-label="Swap From and To" onClick={() => { const temp = from; setFrom(to); setTo(temp); }}>
          ⇄
        </button>
        <div className="location-input-wrap">
          <LocationInput
            label="To"
            value={to}
            onChange={handleToChange}
            placeholder="To"
            options={airportOptions}
          />
        </div>
      </div>
      {/* Date Range Picker */}
      <div className="date-section" style={{ position: 'relative', zIndex: 99999 }}>
        <div className="date-display-row" style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 99999 }}>
          <div className="date-display" onClick={() => setShowCalendar(true)} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '0.95rem', color: '#888' }}>Departure</div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem' }}>{formatDate(range[0].startDate)}</div>
            <div style={{ fontSize: '0.95rem', color: '#888' }}>{formatDay(range[0].startDate)}</div>
          </div>
          <div className="date-display" onClick={() => setShowCalendar(true)} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '0.95rem', color: '#888' }}>Return</div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem' }}>{formatDate(range[0].endDate)}</div>
            <div style={{ fontSize: '0.95rem', color: '#888' }}>{formatDay(range[0].endDate)}</div>
          </div>
        </div>
        {showCalendar && (
          <DateRangePicker 
            range={range} 
            setRange={setRange} 
            onClose={() => setShowCalendar(false)}
          />
        )}
      </div>
      {/* Travellers & Class Selector */}
      <div className="travellers-section">
        <TravellersClassSelector
          travellers={travellers}
          setTravellers={setTravellers}
        />
      </div>

      {/* Price Range Filter */}
      <div className="price-filter-section">
        <div style={{
          background: 'rgba(255,255,255,0.22)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '12px',
          padding: '12px 16px',
          backdropFilter: 'blur(10px)',
          minHeight: '52px'
        }}>
          {/* Header */}
          <div style={{ 
            color: '#ffe066', 
            fontSize: '0.9rem', 
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            Price Range
          </div>
          
          {/* Quick Preset Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '12px',
            flexWrap: 'wrap'
          }}>
            {[
              { label: 'Budget', range: [0, 25000] },
              { label: 'Mid', range: [25000, 50000] },
              { label: 'Premium', range: [50000, 100000] },
              { label: 'Luxury', range: [100000, 200000] }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setPriceRange(preset.range)}
                style={{
                  background: priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1]
                    ? 'rgba(255, 230, 102, 0.9)'
                    : 'rgba(255, 255, 255, 0.2)',
                  color: priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1]
                    ? '#2a0140'
                    : '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!(priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1])) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1])) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Horizontal Slider */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            {/* Track */}
            <div style={{
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              position: 'relative'
            }}>
              {/* Progress */}
              <div style={{
                position: 'absolute',
                left: `${(priceRange[0] / 200000) * 100}%`,
                width: `${((priceRange[1] - priceRange[0]) / 200000) * 100}%`,
                height: '4px',
                background: 'linear-gradient(90deg, #ffe066 0%, #ffd700 100%)',
                borderRadius: '2px'
              }} />
            </div>
            
            {/* Dual Range Inputs */}
            <input
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={priceRange[0]}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value < priceRange[1]) {
                  setPriceRange([value, priceRange[1]]);
                }
              }}
              style={{
                position: 'absolute',
                top: '-6px',
                width: '100%',
                height: '16px',
                background: 'transparent',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
            
            <input
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={priceRange[1]}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value > priceRange[0]) {
                  setPriceRange([priceRange[0], value]);
                }
              }}
              style={{
                position: 'absolute',
                top: '-6px',
                width: '100%',
                height: '16px',
                background: 'transparent',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Dynamic Price Display */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: '#ffe066',
            fontWeight: 600
          }}>
            ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="search-btn-section">
        <button 
          className="search-btn" 
          onClick={handleSearch}
          disabled={!from.trim() || !to.trim()}
          style={{
            opacity: (!from.trim() || !to.trim()) ? 0.6 : 1,
            cursor: (!from.trim() || !to.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          Search
        </button>
      </div>
      {validationError && (
        <div className="validation-error" style={{ 
          color: '#ff4444', 
          marginTop: '10px', 
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: '500',
          padding: '8px',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(255, 68, 68, 0.3)'
        }}>
          ⚠️ {validationError}
        </div>
      )}
    </div>
  );
};

export default FlightSearchCard; 