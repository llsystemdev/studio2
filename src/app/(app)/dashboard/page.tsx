

import * as React from 'react';
import DashboardClient from './dashboard-client';
import { getDashboardData } from '@/lib/server-actions/dashboard-actions';

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient initialData={data} />;
}
