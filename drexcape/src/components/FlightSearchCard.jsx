import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FlightSearchCard.css';
import LocationInput from './LocationInput';
import TravellersClassSelector from './TravellersClassSelector';
import DateRangePicker from './DateRangePicker';

const FlightSearchCard = () => {
  const navigate = useNavigate();
  // Placeholder state for From/To
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [travellers, setTravellers] = React.useState(1);
  const [travelClass, setTravelClass] = React.useState('Economy');
  const [range, setRange] = React.useState([
    {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      key: 'selection',
    },
  ]);
  const [showCalendar, setShowCalendar] = React.useState(false);

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
    navigate('/search-results', {
      state: {
        from,
        to,
        travellers,
        travelClass,
        startDate: range[0].startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
        endDate: range[0].endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      },
    });
  };

  return (
    <div className="flight-search-card">
      {/* From/To Inputs with overlapping swap button */}
      <div className="location-section overlap-layout">
        <div className="location-input-wrap">
          <LocationInput
            label="From"
            value={from}
            onChange={e => setFrom(e.target.value)}
            placeholder="From"
            options={airportOptions}
            onSelect={opt => setFrom(`${opt.city} (${opt.code})`)}
          />
        </div>
        <button className="swap-btn overlap-swap-btn" aria-label="Swap From and To" onClick={() => { const temp = from; setFrom(to); setTo(temp); }}>
          ⇄
        </button>
        <div className="location-input-wrap">
          <LocationInput
            label="To"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="To"
            options={airportOptions}
            onSelect={opt => setTo(`${opt.city} (${opt.code})`)}
          />
        </div>
      </div>
      {/* Date Range Picker */}
      <div className="date-section" style={{ position: 'relative' }}>
        <div className="date-display-row" style={{ display: 'flex', gap: '16px' }}>
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
          <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 20 }}>
            <DateRangePicker range={range} setRange={setRange} />
            <button style={{ marginTop: 8, padding: '6px 18px', borderRadius: 8, border: 'none', background: '#3fa9f5', color: '#fff', cursor: 'pointer' }} onClick={() => setShowCalendar(false)}>Done</button>
          </div>
        )}
      </div>
      {/* Travellers & Class Selector */}
      <div className="travellers-section">
        <TravellersClassSelector
          travellers={travellers}
          setTravellers={setTravellers}
          travelClass={travelClass}
          setTravelClass={setTravelClass}
        />
      </div>
      {/* Search Button */}
      <div className="search-btn-section">
        <button className="search-btn" onClick={handleSearch}>Search</button>
      </div>
    </div>
  );
};

export default FlightSearchCard; 