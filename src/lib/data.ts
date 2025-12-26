import type { User, Invoice, Reminder, ActivityLog } from './types';

export const users: User[] = [
  {
    id: '1',
    name: 'Flex Kipkoech',
    email: 'flexofficialmail@gmail.com',
    role: 'Admin',
  }
];

export const invoices: Invoice[] = [];

export const reminders: Reminder[] = [];

export const activityLogs: ActivityLog[] = [
    {
        id: '1',
        user: 'Flex Kipkoech',
        action: 'User Login',
        timestamp: '2024-07-29 10:00:00',
        details: 'User Flex Kipkoech logged in successfully.'
    },
    {
        id: '2',
        user: 'Jane Doe',
        action: 'Invoice Created',
        timestamp: '2024-07-29 10:05:00',
        details: 'Invoice #2024001 for client "ABC Corp" was created.'
    },
    {
        id: '3',
        user: 'Flex Kipkoech',
        action: 'User Role Changed',
        timestamp: '2024-07-29 10:15:00',
        details: 'Role for user "john.doe@example.com" changed to "Finance Team".'
    },
    {
        id: '4',
        user: 'System',
        action: 'Reminder Sent',
        timestamp: '2024-07-29 11:00:00',
        details: 'Automated reminder sent for invoice #2023050.'
    }
];

export const user = {
    id: "1",
    firstName: "Flex",
    lastName: "Kipkoech",
    email: "flexofficialmail@gmail.com",
    role: "Admin",
    isActive: true,
    photoURL: "/avatars/01.png",
}
