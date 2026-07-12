import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({ unreadCount: 0, refetch: () => {} });

export function NotificationProvider({ children }) {
    const { user } = useAuth();

    const { data, refetch } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => (await api.get('/notifications/unread-count')).data.data,
        refetchInterval: 30000,
        enabled: !!user,
    });

    return (
        <NotificationContext.Provider value={{ unreadCount: data?.count || 0, refetch }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationContext);
