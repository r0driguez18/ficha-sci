import { addDays, isWeekend, format } from 'date-fns';

/**
 * Check if a given date is a business day (Monday-Friday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * Get the next business day from a given date
 */
export function getNextBusinessDay(date: Date): Date {
  let nextDay = addDays(date, 1);
  
  while (!isBusinessDay(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
}

/**
 * Get current time in HH:mm format
 */
export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}

/**
 * Check if current time has passed the alert time
 */
export function hasTimePassedAlert(alertTime: string): boolean {
  const currentTime = getCurrentTime();
  return currentTime >= alertTime;
}

/**
 * Calculate business days between two dates
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return count;
}