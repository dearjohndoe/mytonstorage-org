"use client"

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  expirationTime: number;
  className?: string;
}

export function CountdownTimer({ expirationTime, className = '' }: CountdownTimerProps) {
  const timeLeft = useCountdown(expirationTime);

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">File expired</span>
      </div>
    );
  }

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null;
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
  };

  const timeUnits = [
    formatTimeUnit(timeLeft.days, 'day'),
    formatTimeUnit(timeLeft.hours, 'hour'),
    formatTimeUnit(timeLeft.minutes, 'min'),
    formatTimeUnit(timeLeft.seconds, 'sec'),
  ].filter(Boolean);

  const displayTime = timeUnits.slice(0, 2).join(', ');

  const getTotalSeconds = () => {
    return timeLeft.days * 24 * 60 * 60 + 
           timeLeft.hours * 60 * 60 + 
           timeLeft.minutes * 60 + 
           timeLeft.seconds;
  };

  const totalSecondsLeft = getTotalSeconds();
  const isCritical = totalSecondsLeft < 60 * 5;

  const textColor = isCritical
    ? 'text-red-500'
    : 'text-gray-700';

  return (
    <div className={`flex items-center gap-2 ${textColor} ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">
        {displayTime || '0 sec'}
      </span>
    </div>
  );
}
