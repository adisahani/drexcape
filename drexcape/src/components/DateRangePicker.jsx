import React from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const DateRangePicker = ({ range, setRange }) => {
  const handleSelect = (ranges) => {
    setRange([{
      startDate: ranges.selection.startDate,
      endDate: ranges.selection.endDate,
      key: 'selection',
    }]);
  };

  return (
    <div className="date-range-picker-popup">
      <DateRange
        editableDateInputs={true}
        onChange={handleSelect}
        moveRangeOnFirstSelection={false}
        ranges={range}
        minDate={new Date()}
        rangeColors={["#3fa9f5"]}
      />
    </div>
  );
};

export default DateRangePicker; 