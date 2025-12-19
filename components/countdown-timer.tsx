"use client"

import { Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCountdown } from '@/hooks/useCountdown';
import { DAY_SECONDS } from '@/lib/storage-constants';

interface CountdownTimerProps {
  expirationTime: number;
  className?: string;
}

export function CountdownTimer({ expirationTime, className = '' }: CountdownTimerProps) {
  const { t } = useTranslation();
  const timeLeft = useCountdown(expirationTime);

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">{t('status.fileExpired')}</span>
      </div>
    );
  }

  const formatTimeUnit = (value: number, unit: string, forceShow = false) => {
    if (value === 0 && !forceShow) return null;
    return `${value} ${unit}`;
  };

  const timeUnits = [
    formatTimeUnit(timeLeft.days, t('time.day')),
    formatTimeUnit(timeLeft.hours, t('time.hour')),
    formatTimeUnit(timeLeft.minutes, t('time.min')),
    formatTimeUnit(timeLeft.seconds, t('time.sec'), true), // Всегда показываем секунды
  ].filter(Boolean);

  const displayTime = timeUnits.slice(0, 2).join(', ');

  const getTotalSeconds = () => {
    return timeLeft.days * DAY_SECONDS + 
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
        {displayTime || t('status.zeroSec')}
      </span>
    </div>
  );
}
