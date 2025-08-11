
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  FileUp,
  CreditCard,
  Wrench,
  LogOut,
  Loader2,
  History,
  BarChartHorizontal,
  UserCog,
  Star,
  FileSignature,
  Wand2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const Logo = () => (
    <div className="flex flex-col items-center justify-center p-2 text-sidebar-foreground">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-xs tracking-widest">CAR RENTAL</span>
    </div>
);

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/reservations', label: 'Reservations', icon: Calendar, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/contracts', label: 'Contracts', icon: FileSignature, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/smart-reply', label: 'Smart Reply', icon: Wand2, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/vehicles', label: 'Vehicles', icon: Car, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/documents', label: 'Documents', icon: FileUp, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/invoices', label: 'Invoices', icon: CreditCard, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/expenses', label: 'Expenses', icon: Wrench, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/reviews', label: 'Reviews', icon: Star, roles: ['Admin', 'Supervisor'] },
  { href: '/calendar', label: 'Booking Calendar', icon: Calendar, roles: ['Admin', 'Supervisor', 'Secretary'] },
  { href: '/reports', label: 'Reports', icon: BarChartHorizontal, roles: ['Admin', 'Supervisor'] },
  { href: '/logs', label: 'Activity Log', icon: History, roles: ['Admin', 'Supervisor'] },
  { href: '/users', label: 'Employees', icon: UserCog, roles: ['Admin'] },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, role, loading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return; // Wait until loading is false

    if (!user) {
      router.replace('/login');
      return;
    }

    // This is the primary role-based guard for the admin section.
    // If the authenticated user is a 'Client', redirect them away.
    if (role === 'Client') {
        router.replace('/client-dashboard');
    }
  }, [user, loading, role, router]);


  // Show a loading screen while authentication status is being determined.
  // Also covers the brief moment a client might be here before redirecting.
  if (loading || !user || !role || role === 'Client') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  const filteredMenuItems = menuItems.filter(item => role && item.roles.includes(role as UserRole));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-center gap-2">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {filteredMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto w-full items-center justify-start gap-2 p-2"
              >
                <Avatar className="h-8 w-8">
                  {userProfile?.photoURL && <AvatarImage src={userProfile.photoURL} />}
                  <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    {userProfile?.name || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70">
                    {userProfile?.email}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full">
                {/* Potentially add breadcrumbs or page title here */}
            </div>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
