'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  dateFormat?: string;
  isClearable?: boolean;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  timeFormat?: string;
  timeIntervals?: number;
  name?: string;
  id?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = "Select date",
  dateFormat = "yyyy-MM-dd",
  isClearable = true,
  className = "",
  disabled = false,
  minDate,
  maxDate,
  showTimeSelect = false,
  timeFormat = "HH:mm",
  timeIntervals = 15,
  name,
  id,
}) => {
  return (
    <div className="w-full relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        isClearable={isClearable}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
        name={name}
        id={id}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        wrapperClassName="w-full block"
        autoComplete="off"
      />
      <style jsx>{`
        .react-datepicker-wrapper {
          width: 100% !important;
          display: block !important;
        }
        
        .react-datepicker__input-container {
          width: 100% !important;
          display: block !important;
        }
        
        .react-datepicker__input-container input {
          width: 100% !important;
          box-sizing: border-box !important;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker;