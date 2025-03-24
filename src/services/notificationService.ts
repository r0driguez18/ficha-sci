
import { NotificationItem } from '@/contexts/NotificationContext';

type WorkdayTimedNotification = {
  title: string;
  message: string;
  time: string;
  days?: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  turnKey: 'turno1' | 'turno2' | 'turno3';
  taskKey: string;
  hasCheckbox: boolean;
  displayTime?: number;
};

// Default notifications that run on workdays (Monday to Friday)
const defaultWorkdayNotifications: WorkdayTimedNotification[] = [
  // Turno 1
  { 
    title: 'ETR', 
    message: 'É hora de enviar o ETR', 
    time: '08:00', 
    days: [1, 2, 3, 4, 5], // Monday to Friday
    turnKey: 'turno1', 
    taskKey: 'etr', 
    hasCheckbox: true,
    displayTime: 300000 // 5 minutes = 300000 ms
  },
  { 
    title: 'Processamento TEF', 
    message: 'É hora de processar os ficheiros TEF', 
    time: '09:00', 
    days: [1, 2, 3, 4, 5],
    turnKey: 'turno1', 
    taskKey: 'processarTef', 
    hasCheckbox: true,
    displayTime: 300000
  },
  { 
    title: 'Processamento Telecomp', 
    message: 'É hora de processar ficheiros Telecompensação', 
    time: '09:05', 
    days: [1, 2, 3, 4, 5],
    turnKey: 'turno1', 
    taskKey: 'processarTelecomp', 
    hasCheckbox: true,
    displayTime: 300000
  },
  
  // Turno 2
  { 
    title: 'Processar INPS', 
    message: 'É hora de processar os ficheiros INPS', 
    time: '14:00', 
    days: [1, 2, 3, 4, 5],
    turnKey: 'turno2', 
    taskKey: 'inpsProcessar', 
    hasCheckbox: true,
    displayTime: 300000
  },
  { 
    title: 'Enviar ENV', 
    message: 'É hora de enviar ENV', 
    time: '14:30', 
    days: [1, 2, 3, 4, 5],
    turnKey: 'turno2', 
    taskKey: '', 
    hasCheckbox: false,
    displayTime: 300000
  }
];

// Function to check if a notification should be triggered based on current time
export const checkScheduledNotifications = (
  currentTime: Date, 
  onNotificationTrigger: (notification: Omit<NotificationItem, 'id'>) => void
) => {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentDay = currentTime.getDay();
  
  defaultWorkdayNotifications.forEach(notification => {
    const [hours, minutes] = notification.time.split(':').map(Number);
    
    if (currentHour === hours && currentMinute === minutes) {
      if (!notification.days || notification.days.includes(currentDay)) {
        onNotificationTrigger(notification);
      }
    }
  });
};

// Function to add a custom notification to the schedule
export const addCustomNotification = (notification: WorkdayTimedNotification) => {
  defaultWorkdayNotifications.push(notification);
};

// Function to get all scheduled notifications
export const getAllScheduledNotifications = (): WorkdayTimedNotification[] => {
  return [...defaultWorkdayNotifications];
};
