
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import { checkScheduledNotifications, getAllScheduledNotifications } from "@/services/notificationService";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string; // HH:mm format
  days?: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  taskId?: string; // Identifies which task to mark as complete
  turnKey?: 'turno1' | 'turno2' | 'turno3';
  taskKey?: string; // The key of the task in the tasks state
  completed?: boolean;
  hasCheckbox?: boolean;
  displayTime?: number; // Time in milliseconds to auto-dismiss
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string;
  removeNotification: (id: string) => void;
  markNotificationCompleted: (id: string, completed: boolean) => void;
  completeTask: (turnKey: 'turno1' | 'turno2' | 'turno3', taskKey: string, completed: boolean) => void;
  scheduleNotifications: (notifications: Omit<NotificationItem, 'id'>[]) => void;
  clearAllNotifications: () => void;
  testNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  scheduledNotifications: Omit<NotificationItem, 'id'>[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  onTaskComplete?: (turnKey: 'turno1' | 'turno2' | 'turno3', taskKey: string, completed: boolean) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children,
  onTaskComplete 
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<Omit<NotificationItem, 'id'>[]>([]);
  const { toast } = useToast();

  // Initialize scheduled notifications from the service
  useEffect(() => {
    setScheduledNotifications(getAllScheduledNotifications());
  }, []);

  // Check for scheduled notifications every minute
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      checkScheduledNotifications(now, (notification) => {
        addNotification(notification);
      });
    };

    // Check immediately on mount
    checkNotifications();
    
    // Then check every minute
    const intervalId = setInterval(checkNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Function to add a new notification
  const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Display the toast with custom content
    toast({
      title: notification.title,
      description: (
        <div className="flex flex-col gap-2">
          <p>{notification.message}</p>
          {notification.hasCheckbox && notification.turnKey && notification.taskKey && (
            <div className="flex items-center space-x-2 mt-1">
              <Checkbox 
                id={`notification-${id}`}
                onCheckedChange={(checked) => {
                  if (checked && notification.turnKey && notification.taskKey) {
                    completeTask(notification.turnKey, notification.taskKey, true);
                    markNotificationCompleted(id, true);
                  }
                }}
              />
              <label htmlFor={`notification-${id}`} className="text-sm">Marcar como concluído</label>
            </div>
          )}
        </div>
      ),
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => removeNotification(id)}
          className="px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      ),
      duration: notification.displayTime || 5000,
    });
    
    return id;
  };

  // Function to remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Function to mark a notification as completed
  const markNotificationCompleted = (id: string, completed: boolean) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, completed } 
          : notification
      )
    );
  };

  // Function to mark a task as completed
  const completeTask = (turnKey: 'turno1' | 'turno2' | 'turno3', taskKey: string, completed: boolean) => {
    if (onTaskComplete && taskKey) {
      onTaskComplete(turnKey, taskKey, completed);
    }
  };

  // Function to schedule notifications based on time
  const scheduleNotifications = (notificationsToSchedule: Omit<NotificationItem, 'id'>[]) => {
    setScheduledNotifications(prev => [...prev, ...notificationsToSchedule]);
  };

  // Function to clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Function to test a notification immediately
  const testNotification = (notification: Omit<NotificationItem, 'id'>) => {
    addNotification(notification);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markNotificationCompleted,
        completeTask,
        scheduleNotifications,
        clearAllNotifications,
        testNotification,
        scheduledNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
