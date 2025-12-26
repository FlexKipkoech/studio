import type { User, Invoice, Reminder } from './types';

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

export const user = {
    id: "1",
    firstName: "Flex",
    lastName: "Kipkoech",
    email: "flexofficialmail@gmail.com",
    role: "Admin",
    isActive: true,
    photoURL: "/avatars/01.png",
}
