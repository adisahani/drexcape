import React, { useState } from 'react';

const LocationInput = ({ label, value, onChange, placeholder, options, onSelect }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);

  const handleInput = (e) => {
    onChange(e);
    const val = e.target.value.toLowerCase();
    if (val.length > 0) {
      setFiltered(
        options.filter(opt =>
          opt.city.toLowerCase().includes(val) ||
          opt.airport.toLowerCase().includes(val) ||
          opt.code.toLowerCase().includes(val)
        )
      );
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (opt) => {
    onSelect(opt);
    setShowDropdown(false);
  };

  return (
    <div className="location-input" style={{ position: 'relative' }}>
      <label className="location-label">{label}</label>
      <input
        className="location-textbox"
        type="text"
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={e => value && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map(opt => (
            <div
              key={opt.code}
              className="autocomplete-option"
              onMouseDown={() => handleSelect(opt)}
            >
              <div style={{ fontWeight: 700, color: '#f5f5f5' }}>{opt.city} <span style={{ color: '#ffe066', marginLeft: 8 }}>{opt.code}</span></div>
              <div style={{ fontSize: '0.95em', color: '#fff9c4' }}>{opt.airport}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput; 