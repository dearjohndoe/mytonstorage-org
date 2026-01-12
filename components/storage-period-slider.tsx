"use client"

import React from "react";
import Slider from "react-slider";
import { useTranslation } from "react-i18next";

interface StoragePeriodSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const STORAGE_PERIODS = [
  7,     
  14,    
  28,    
  56,    
  84,    
  168,   
  365,   
  730,   
];

const PERIOD_KEYS: Record<number, string> = {
  7: "1week",
  14: "2weeks", 
  28: "1month",
  56: "2months",
  84: "3months", 
  168: "6months",
  365: "1year",
  730: "2years",
};

export const StoragePeriodSlider: React.FC<StoragePeriodSliderProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();

  const currentIndex = STORAGE_PERIODS.findIndex(period => period === value);
  const sliderIndex = currentIndex >= 0 ? currentIndex : 0;

  const handleSliderChange = (index: number) => {
    const selectedPeriod = STORAGE_PERIODS[index];
    onChange(selectedPeriod);
  };

  const getDisplayValue = () => {
    const periodKey = PERIOD_KEYS[value];
    return periodKey ? t(`storage.periods.${periodKey}`) : `${value} ${t('time.day')}`;
  };

  return (
    <div className="w-full">
      <div className="mb-3">
        <label className="block text-gray-700 mb-3">
          {t('storage.setPeriodLabel')}: <span className="text-gray-700">{getDisplayValue()}</span>
        </label>
        <div className="px-3 relative">
          {/* Vertical markers */}
          <div className="absolute top-0 left-3 right-3 h-4 flex justify-between items-center pointer-events-none">
            {STORAGE_PERIODS.map((_, index) => (
              <div
                key={index}
                className={`w-0.5 h-3 bg-gray-300 rounded-full ${index === 0 || index === STORAGE_PERIODS.length - 1 ? 'opacity-0' : ''}`}
                style={{
                  transform: 'translateY(-25%)'
                }}
              />
            ))}
          </div>
          
          <Slider
            className="h-4"
            min={0}
            max={STORAGE_PERIODS.length - 1}
            value={sliderIndex}
            disabled={disabled}
            onChange={handleSliderChange}
            renderThumb={(props: any) => {
              const { key, ...restProps } = props;
              return (
                <div 
                  key={key} 
                  {...restProps} 
                  className={`bg-blue-500 rounded-full w-4 h-4 translate-y-[-25%] cursor-pointer border-2 border-white shadow-md z-10
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`} 
                />
              );
            }}
            renderTrack={(props: any, state: any) => {
              const { key, ...restProps } = props;
              return (
                <div 
                  key={key} 
                  {...restProps} 
                  className={`h-2 rounded-full ${
                    state.index === 0 
                      ? disabled ? 'bg-blue-300' : 'bg-blue-500'
                      : 'bg-gray-300'
                  }`} 
                />
              );
            }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-2 px-3">
          <span>{t(`storage.periods.${PERIOD_KEYS[STORAGE_PERIODS[0]]}`)}</span>
          <span>{t(`storage.periods.${PERIOD_KEYS[STORAGE_PERIODS[Math.floor(STORAGE_PERIODS.length / 2)]]}`)}</span>
          <span>{t(`storage.periods.${PERIOD_KEYS[STORAGE_PERIODS[STORAGE_PERIODS.length - 1]]}`)}</span>
        </div>
      </div>
    </div>
  );
};