import type { Invoice, User, Reminder } from './types';

export const users: User[] = [
  { id: 'usr_1', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Admin', avatarUrl: 'https://picsum.photos/seed/user1/100/100' },
  { id: 'usr_2', name: 'Bob Williams', email: 'bob.w@example.com', role: 'Finance Team', avatarUrl: 'https://picsum.photos/seed/user2/100/100' },
  { id: 'usr_3', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Finance Team', avatarUrl: 'https://picsum.photos/seed/user3/100/100' },
  { id: 'usr_4', name: 'Diana Miller', email: 'diana.m@example.com', role: 'Finance Team', avatarUrl: 'https://picsum.photos/seed/user4/100/100' },
];

export const invoices: Invoice[] = [
  { id: 'inv_1', invoiceNumber: 'INV-001', clientName: 'Innovate Inc.', clientEmail: 'contact@innovate.com', amount: 2500, issueDate: '2023-10-15', dueDate: '2023-11-14', status: 'Paid' },
  { id: 'inv_2', invoiceNumber: 'INV-002', clientName: 'Solutions Co.', clientEmail: 'accounts@solutions.co', amount: 1800, issueDate: '2023-10-20', dueDate: '2023-11-19', status: 'Due' },
  { id: 'inv_3', invoiceNumber: 'INV-003', clientName: 'Tech Group', clientEmail: 'finance@techgroup.net', amount: 3200, issueDate: '2023-09-05', dueDate: '2023-10-05', status: 'Overdue' },
  { id: 'inv_4', invoiceNumber: 'INV-004', clientName: 'Innovate Inc.', clientEmail: 'contact@innovate.com', amount: 450, issueDate: '2023-10-25', dueDate: '2023-11-24', status: 'Due' },
  { id: 'inv_5', invoiceNumber: 'INV-005', clientName: 'Gateway LLC', clientEmail: 'billing@gateway.llc', amount: 6000, issueDate: '2023-10-01', dueDate: '2023-10-31', status: 'Paid' },
  { id: 'inv_6', invoiceNumber: 'INV-006', clientName: 'Solutions Co.', clientEmail: 'accounts@solutions.co', amount: 750, issueDate: '2023-08-15', dueDate: '2023-09-14', status: 'Overdue' },
  { id: 'inv_7', invoiceNumber: 'INV-007', clientName: 'Quantum Systems', clientEmail: 'pay@quantumsys.com', amount: 1200, issueDate: '2023-10-28', dueDate: '2023-11-27', status: 'Due' },
  { id: 'inv_8', invoiceNumber: 'INV-008', clientName: 'Tech Group', clientEmail: 'finance@techgroup.net', amount: 890, issueDate: '2023-11-01', dueDate: '2023-12-01', status: 'Due' },
];

export const reminders: Reminder[] = [
    { id: 'rem_1', invoiceNumber: 'INV-003', clientName: 'Tech Group', sentDate: '2023-10-06', method: 'Email', status: 'Sent' },
    { id: 'rem_2', invoiceNumber: 'INV-006', clientName: 'Solutions Co.', sentDate: '2023-09-15', method: 'Email', status: 'Sent' },
    { id: 'rem_3', invoiceNumber: 'INV-003', clientName: 'Tech Group', sentDate: '2023-10-13', method: 'WhatsApp', status: 'Sent' },
    { id: 'rem_4', invoiceNumber: 'INV-006', clientName: 'Solutions Co.', sentDate: '2023-09-22', method: 'Email', status: 'Failed' },
];
