import React from 'react';

const LocationInput = ({ label, value, onChange, placeholder }) => {
  return (
    <div className="location-input">
      <label className="location-label">{label}</label>
      <input
        className="location-textbox"
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
      {/* Dropdown suggestions will go here */}
    </div>
  );
};

export default LocationInput; 