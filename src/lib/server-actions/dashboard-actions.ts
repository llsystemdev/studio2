
'use server';

import { subMonths, format, startOfMonth } from 'date-fns';
import { getDb } from '@/lib/firebase/server/admin';
import type { Reservation, Vehicle, Invoice, Contract } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

// This function will run on the server to fetch all required data in parallel
export async function getDashboardData() {
  try {
    const db = getDb();
    const reservationsQuery = db.collection('reservations').orderBy('pickupDate', 'desc').limit(5).get();
    const vehiclesQuery = db.collection('vehicles').get();
    const invoicesQuery = db.collection('invoices').orderBy('date', 'desc').get();
    const contractsQuery = db.collection('contracts').orderBy('createdAt', 'desc').limit(5).get();

    const [reservationsSnapshot, vehiclesSnapshot, invoicesSnapshot, contractsSnapshot] = await Promise.all([
      reservationsQuery,
      vehiclesQuery,
      invoicesQuery,
      contractsQuery,
    ]);

    const recentReservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    const allInvoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    
    // Serialize Firestore Timestamps to ISO strings for Client Components
    const recentContracts = contractsSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Contract, 'id'>;
        const createdAt = data.createdAt; // Can be Timestamp or string

        // Robust check for Timestamp before converting
        const createdAtString = (createdAt && typeof (createdAt as Timestamp).toDate === 'function')
            ? (createdAt as Timestamp).toDate().toISOString()
            : createdAt as string;
            
        return { 
            ...data, 
            id: doc.id,
            createdAt: createdAtString
        } as Contract;
    });
    
    // --- STATS AGGREGATION ---
    const paidInvoices = allInvoices.filter(inv => inv.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + parseFloat(inv.amount || '0'), 0);
    const activeRentals = vehicles.filter(v => v.status === 'Rented').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'Maintenance').length;
    
    // --- CHART DATA AGGREGATION ---
    const monthlyRevenue: { [key: string]: number } = {};
    const chartData: { month: string; revenue: number }[] = [];
    const now = new Date();

    // Initialize the last 7 months
    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyRevenue[monthKey] = 0;
    }
    
    // Use only paid invoices for revenue calculation
    const sevenMonthsAgo = startOfMonth(subMonths(now, 6));
    
    paidInvoices.forEach(inv => {
        const invoiceDate = new Date(inv.date);
        if(invoiceDate >= sevenMonthsAgo) {
            const monthKey = format(invoiceDate, 'yyyy-MM');
            if(monthlyRevenue.hasOwnProperty(monthKey)) {
                monthlyRevenue[monthKey] += parseFloat(inv.amount || '0');
            }
        }
    });

    // Generate final chart data structure, ordered from oldest to newest
    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        chartData.push({
            month: format(monthDate, 'MMM'),
            revenue: monthlyRevenue[monthKey] || 0,
        });
    }

    // --- FINAL DATA STRUCTURE ---
    return {
      stats: {
        totalRevenue,
        activeRentals,
        availableVehicles,
        vehiclesInMaintenance
      },
      recentReservations: recentReservations,
      recentInvoices: allInvoices.slice(0, 5), // Use allInvoices for recent list
      recentContracts: recentContracts,
      chartData: chartData,
    };
  } catch (error: any) {
    console.error("Error fetching dashboard data on server:", error.message);
    // Return empty/default data on error to prevent crashing the page
    return {
      stats: { totalRevenue: 0, activeRentals: 0, availableVehicles: 0, vehiclesInMaintenance: 0 },
      recentReservations: [],
      recentInvoices: [],
      recentContracts: [],
      chartData: [],
      error: `Failed to fetch dashboard data. Details: ${error.message}`
    };
  }
}
