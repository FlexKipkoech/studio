'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  Settings,
  CircleHelp,
  User,
  History,
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

const baseMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
];

const adminMenuItem = { href: '/dashboard/users', label: 'Users', icon: Users };

const remainingMenuItems = [
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/activity-logs', label: 'Activity Logs', icon: History },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];


const settingsItem = { href: '#', label: 'Settings', icon: Settings };
const helpItem = { href: '#', label: 'Help & Support', icon: CircleHelp };

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc(userRef);

  const menuItems = [
    ...baseMenuItems,
    ...(userProfile?.role === 'Admin' ? [adminMenuItem] : []),
    ...remainingMenuItems,
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-16 justify-center text-lg font-semibold text-sidebar-primary">
        InvMgt
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton tooltip={settingsItem.label}>
                  <settingsItem.icon />
                  <span>{settingsItem.label}</span>
                </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={helpItem.label}>
              <helpItem.icon />
              <span>{helpItem.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
