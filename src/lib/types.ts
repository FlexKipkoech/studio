export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Finance Team';
  avatarUrl: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Due' | 'Overdue';
};

export type Reminder = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  sentDate: string;
  method: 'Email' | 'WhatsApp';
  status: 'Sent' | 'Failed';
};
