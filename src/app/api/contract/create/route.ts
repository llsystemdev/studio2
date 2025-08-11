import { NextRequest, NextResponse } from 'next/server';
import { runGenerateContract } from '@/lib/server-actions/ai-actions';
import type { Vehicle, Reservation } from '@/lib/types';
import { format } from 'date-fns';

// Force the runtime to Node.js to ensure compatibility with firebase-admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  vehicle: Vehicle;
  customerData: { name: string; [k: string]: any };
  dateRange: { from: string | Date; to: string | Date };
  insuranceCost?: number;
  totalCost: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const { vehicle, customerData, dateRange, insuranceCost = 0, totalCost } = body;

    // Validaciones claras y con mensajes útiles
    if (!vehicle?.id || !vehicle?.make || !vehicle?.model) {
      return NextResponse.json(
        { error: 'vehicle incompleto: se requiere id, make y model.' },
        { status: 400 }
      );
    }
    if (!customerData?.name) {
      return NextResponse.json(
        { error: 'customerData.name es requerido.' },
        { status: 400 }
      );
    }
    if (!dateRange?.from || !dateRange?.to) {
      return NextResponse.json(
        { error: 'dateRange.from y dateRange.to son requeridos.' },
        { status: 400 }
      );
    }

    const pickupDate = new Date(dateRange.from);
    const dropoffDate = new Date(dateRange.to);
    if (Number.isNaN(pickupDate.getTime()) || Number.isNaN(dropoffDate.getTime())) {
      return NextResponse.json(
        { error: 'Fechas inválidas. Envía valores parseables por Date().' },
        { status: 400 }
      );
    }

    // Si Reservation te exige más campos, cambia a Partial<Reservation>
    const tempReservation: Reservation = {
      id: '',
      customerId: '',
      customerName: customerData.name,
      vehicleId: vehicle.id,
      vehicle: `${vehicle.make} ${vehicle.model}`,
      pickupDate: format(pickupDate, 'yyyy-MM-dd'),
      dropoffDate: format(dropoffDate, 'yyyy-MM-dd'),
      status: 'Upcoming',
      agent: 'Online System',
      insuranceCost: insuranceCost,
      totalCost: totalCost,
    };

    // Llama al flujo de IA (Genkit) que genera el contrato y devuelve un ID
    const newContractId = await runGenerateContract(
      tempReservation,
      vehicle,
      'es',
      customerData
    );

    return NextResponse.json({ success: true, contractId: newContractId });
  } catch (error: any) {
    console.error('Error en /api/contract/create:', error);
    return NextResponse.json(
      { error: 'Failed to create pre-contract.', details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
