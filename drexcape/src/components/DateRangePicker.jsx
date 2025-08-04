import React from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const DateRangePicker = ({ range, setRange, onClose }) => {
  const handleSelect = (ranges) => {
    setRange([{
      startDate: ranges.selection.startDate,
      endDate: ranges.selection.endDate,
      key: 'selection',
    }]);
  };

  return (
    <div 
      className="date-range-picker-popup"
      style={{
        position: 'absolute',
        zIndex: 99999,
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        padding: '8px',
        top:'-150%',
        left: '0',
        minWidth: 'max-content',
        isolation: 'isolate'
      }}
    >
      <div style={{ position: 'relative', zIndex: 99999 }}>
        <DateRange
          editableDateInputs={true}
          onChange={handleSelect}
          moveRangeOnFirstSelection={false}
          ranges={range}
          minDate={new Date()}
          rangeColors={["#3fa9f5"]}
        />
      </div>
      <div 
        className="date-picker-actions"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '8px',
          borderTop: '1px solid #eee',
          marginTop: '8px',
          position: 'relative',
          zIndex: 99999
        }}
      >
        <button 
          className="date-picker-done-btn"
          onClick={onClose}
          style={{
            background: '#3fa9f5',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 24px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker; 