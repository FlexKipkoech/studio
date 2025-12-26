import type { Invoice, User, Reminder } from './types';

export const users: User[] = [
  {
    id: '1',
    name: 'Flex Kipkoech',
    email: 'flexofficialmail@gmail.com',
    role: 'Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwZXJzb24lMjBmYWNlfGVufDB8fHx8MTc2NjY4ODUyN3ww&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

export const invoices: Invoice[] = [];

export const reminders: Reminder[] = [];
