
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Car, CalendarCheck, Loader2 } from 'lucide-react';
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
  isWithinInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import type { Reservation } from '@/lib/types';
import { collection, onSnapshot, query } from 'firebase/firestore';

const carColors: { [key: string]: string } = {
  'VEH-001': 'bg-blue-500/80 border-blue-700',
  'VEH-002': 'bg-green-500/80 border-green-700',
  'VEH-003': 'bg-yellow-500/80 border-yellow-700',
  'VEH-004': 'bg-red-500/80 border-red-700',
  'VEH-005': 'bg-purple-500/80 border-purple-700',
  'VEH-006': 'bg-indigo-500/80 border-indigo-700',
};


export default function CalendarPage() {
  const { db } = useAuth();
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [today, setToday] = React.useState(startOfToday());
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(format(today, 'MMM-yyyy'));

  React.useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(collection(db, 'reservations'));
    const unsub = onSnapshot(q, (snapshot) => {
        const reservationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
        setReservations(reservationsData.filter(res => res.status === 'Active' || res.status === 'Upcoming'));
        setLoading(false);
    }, (error) => {
        console.error("Failed to fetch reservations in real-time: ", error);
        setLoading(false);
    });

    return () => unsub();
  }, [db]);
  
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  function previousMonth() {
    let firstDayPrevMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayPrevMonth, 'MMM-yyyy'));
  }

  function nextMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }
  
  const reservationsForDay = (day: Date) => {
    return reservations.filter(res => {
        try {
            if (!res.pickupDate || !res.dropoffDate) return false;
            const pickupDate = parse(res.pickupDate, 'yyyy-MM-dd', new Date());
            const dropoffDate = parse(res.dropoffDate, 'yyyy-MM-dd', new Date());
             // Check if the day is within the reservation interval (inclusive of start and end)
            return isWithinInterval(day, { start: pickupDate, end: dropoffDate });
        } catch(e) {
            console.error("Invalid date format in reservation: ", res);
            return false;
        }
    });
  }
  
  const selectedDayReservations = reservationsForDay(selectedDay);
  
  const reservationsInMonth = reservations.filter(res => {
     try {
        if (!res.pickupDate) return false;
        const pickupDate = parse(res.pickupDate, 'yyyy-MM-dd', new Date());
        return isSameMonth(pickupDate, firstDayCurrentMonth);
     } catch(e) {
        return false;
     }
  }).length;


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Booking Calendar</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {format(firstDayCurrentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center space-x-2">
                 <Button variant="outline" size="sm" onClick={() => {
                    const todayDate = startOfToday();
                    setToday(todayDate);
                    setSelectedDay(todayDate);
                    setCurrentMonth(format(todayDate, 'MMM-yyyy'));
                 }}>
                    Today
                 </Button>
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
                 <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            ): (
              <>
                <div className="grid grid-cols-7 text-xs font-semibold leading-6 text-center text-muted-foreground">
                  <div>SUN</div>
                  <div>MON</div>
                  <div>TUE</div>
                  <div>WED</div>
                  <div>THU</div>
                  <div>FRI</div>
                  <div>SAT</div>
                </div>
                <div className="grid grid-cols-7 mt-2 text-sm">
                  {days.map((day, dayIdx) => (
                    <div
                      key={day.toString()}
                      className={cn(
                        'py-1.5 border-t border-l border-border h-32',
                        dayIdx % 7 === 6 && 'border-r',
                        dayIdx >= days.length - 7 && 'border-b',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          'mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                          isEqual(day, selectedDay) && 'bg-primary text-primary-foreground',
                          !isEqual(day, selectedDay) && isToday(day) && 'text-primary font-bold',
                          !isEqual(day, selectedDay) && 'hover:bg-accent',
                          isSameMonth(day, firstDayCurrentMonth) ? 'text-foreground' : 'text-muted-foreground/50',
                        )}
                      >
                        <time dateTime={format(day, 'yyyy-MM-dd')}>
                          {format(day, 'd')}
                        </time>
                      </button>
                      <div className="w-full mt-1 space-y-1 px-1 overflow-y-auto max-h-20">
                        {reservationsForDay(day).slice(0, 2).map((res) => (
                            <div key={res.id} className={cn('text-xs text-white rounded-md px-1.5 py-0.5 border truncate', carColors[res.vehicleId as keyof typeof carColors] || 'bg-gray-500 border-gray-700')}>
                                {res.vehicle}
                            </div>
                        ))}
                        {reservationsForDay(day).length > 2 && (
                          <div className="text-xs text-muted-foreground">+ {reservationsForDay(day).length - 2} more</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 h-fit sticky top-4">
            <CardHeader>
                <CardTitle>
                    Reservations for <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>{format(selectedDay, 'MMMM d, yyyy')}</time>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                     <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     </div>
                ) : selectedDayReservations.length > 0 ? (
                    <ol className="space-y-4">
                        {selectedDayReservations.map(res => (
                             <li key={res.id} className="flex items-center space-x-3">
                                <div className={cn("h-2.5 w-2.5 rounded-full", carColors[res.vehicleId as keyof typeof carColors] || 'bg-gray-500')}></div>
                                <div className="flex-auto">
                                    <p className="font-semibold">{res.vehicle}</p>
                                    <p className="text-muted-foreground text-sm">{res.customerName}</p>
                                </div>
                                 <Badge variant={res.status === 'Active' ? 'default' : 'secondary'} className={res.status === 'Active' ? 'bg-green-600' : ''}>{res.status}</Badge>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-center text-muted-foreground py-4">
                        No reservations for this day.
                    </p>
                )}
                 <div className='mt-8 border-t pt-4'>
                    <h3 className='text-sm font-semibold text-muted-foreground mb-2'>Month Summary</h3>
                    <div className='flex items-center gap-4 text-sm'>
                        <div className='flex items-center gap-2'>
                           <CalendarCheck className='h-4 w-4 text-primary' /> 
                           <span>{reservationsInMonth} Total Reservations</span>
                        </div>
                    </div>
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
