import React, { useState, useRef, useEffect } from 'react';

const classes = ['Economy', 'Premium Economy', 'Business', 'First'];

const TravellersClassSelector = ({ travellers, setTravellers, travelClass, setTravelClass }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="travellers-class-selector" ref={dropdownRef}>
      <div className="travellers-class-display" onClick={() => setOpen(!open)}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{travellers} Traveller{travellers > 1 ? 's' : ''}</span>
        <span style={{ fontSize: '0.95rem', color: '#888', marginLeft: 8 }}>{travelClass}</span>
        <span style={{ marginLeft: 8, fontSize: '1.1rem' }}>▼</span>
      </div>
      {open && (
        <div className="travellers-class-dropdown">
          <div className="travellers-row">
            <span>Travellers</span>
            <button onMouseDown={e => { e.preventDefault(); setTravellers(Math.max(1, travellers - 1)); }}>-</button>
            <span>{travellers}</span>
            <button onMouseDown={e => { e.preventDefault(); setTravellers(travellers + 1); }}>+</button>
          </div>
          <div className="class-row">
            <span>Class</span>
            <select
              value={travelClass}
              onChange={e => setTravelClass(e.target.value)}
            >
              {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravellersClassSelector; 