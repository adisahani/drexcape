import React from 'react';

const LocationInput = ({ label, value, onChange, placeholder, options, onSelect }) => {
  const handleInput = (e) => {
    onChange(e);
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
      />
    </div>
  );
};

export default LocationInput; 