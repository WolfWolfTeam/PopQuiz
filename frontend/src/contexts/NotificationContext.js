import { createContext } from 'react';

const NotificationContext = createContext({
  notifications: [],
  markAsRead: () => {},
  clearAll: () => {}
});

export default NotificationContext; 