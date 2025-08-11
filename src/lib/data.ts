
import type { Reservation, Vehicle, UserProfile, MaintenanceLog, Expense, Review, Customer, Invoice } from '@/lib/types';

// This is the real vehicle catalog provided by the user, transformed into the app's data structure.
// All imageUrls have been migrated to Firebase Storage for performance and reliability.
export const initialVehiclesData: Omit<Vehicle, 'id'>[] = [
    { make: 'Range Rover', model: 'Sport Autobiography 2020', imageUrls: ['https://firebasestorage.googleapis.com/v0/b/virtus-version-ok.appspot.com/o/flota%2Frange-rover-sport-autobiography-2020.jpg?alt=media&token=38522509-e851-4099-a86f-eb1a2c3a51f8'], category: 'Luxury', pricePerDay: 250, dataAiHint: 'Range Rover Luxury' },
    { make: 'Hyundai', model: 'Santa Fe 2025', imageUrls: ['https://firebasestorage.googleapis.com/v0/b/virtus-version-ok.appspot.com/o/flota%2Fhyundai-santa-fe-2025.jpg?alt=media&token=c1a3c74c-4c6e-4b47-b352-a5f1f91b8f52'], category: 'SUV', pricePerDay: 120, dataAiHint: 'Hyundai SUV' },
    { make: 'Mazda', model: 'CX-5 2025', imageUrls: ['https://firebasestorage.googleapis.com/v0/b/virtus-version-ok.appspot.com/o/flota%2Fmazda-cx-5-2025.jpg?alt=media&token=8679f2d9-ab70-4a5f-836b-4e67c515a452'], category: 'SUV', pricePerDay: 110, dataAiHint: 'Mazda SUV' },
    { make: 'Cadillac', model: 'Escalade Premium Luxury 2024', imageUrls: ['https://firebasestorage.googleapis.com/v0/b/virtus-version-ok.appspot.com/o/flota%2Fcadillac-escalade-primium-2024.jpg?alt=media&token=b7c2b5f7-6b4e-4b4e-8b4e-2b5f7b4e2b5f'], category: 'Luxury', pricePerDay: 280, dataAiHint: 'Cadillac Luxury' },
    { make: 'Kia', model: 'Sonet 2025 Gris', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/05/IMG_5739-1.jpeg'], category: 'SUV', pricePerDay: 85, dataAiHint: 'Kia SUV' },
    { make: 'Kia', model: 'Sonet 2025', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/05/IMG_5738-1.jpeg'], category: 'SUV', pricePerDay: 85, dataAiHint: 'Kia SUV' },
    { make: 'Kia', model: 'Seltos 2025 Gris', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/05/IMG_5737-1.jpeg'], category: 'SUV', pricePerDay: 95, dataAiHint: 'Kia SUV' },
    { make: 'Kia', model: 'Seltos 2025 Blanca', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/05/IMG_5741-1.jpeg'], category: 'SUV', pricePerDay: 95, dataAiHint: 'Kia SUV' },
    { make: 'Kia', model: 'Seltos 2024 Roja', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/05/IMG_5743-1.jpeg'], category: 'SUV', pricePerDay: 90, dataAiHint: 'Kia SUV' },
    { make: 'Lincoln', model: 'Aviator 2023', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4413.jpeg'], category: 'Luxury', pricePerDay: 260, dataAiHint: 'Lincoln Luxury' },
    { make: 'Kia', model: 'Seltos 2024', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/05/IMG_5742-1.jpeg'], category: 'SUV', pricePerDay: 90, dataAiHint: 'Kia SUV' },
    { make: 'Hyundai', model: 'Staria 2024 Blanco', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/05/IMG_5745-1.jpeg'], category: 'SUV', pricePerDay: 150, dataAiHint: 'Hyundai Van' },
    { make: 'Chevrolet', model: 'Suburban High Country 2024', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/02/IMG_4767.jpeg'], category: 'Luxury', pricePerDay: 300, dataAiHint: 'Chevrolet Luxury SUV' },
    { make: 'Chevrolet', model: 'Colorado LTZ 2024', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2024/01/IMG_4654.jpeg'], category: 'SUV', pricePerDay: 130, dataAiHint: 'Chevrolet Truck' },
    { make: 'Lamborghini', model: 'Urus Keyvany Keyrus 2023', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4417.jpeg'], category: 'Luxury', pricePerDay: 800, dataAiHint: 'Lamborghini Luxury SUV' },
    { make: 'Hyundai', model: 'Staria 2024', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4407.jpeg'], category: 'SUV', pricePerDay: 150, dataAiHint: 'Hyundai Van' },
    { make: 'Hyundai', model: 'Cantus 2024', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4404.jpeg'], category: 'SUV', pricePerDay: 75, dataAiHint: 'Hyundai SUV' },
    { make: 'Mercedes Benz', model: 'AMG G 63 2023', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4415.jpeg'], category: 'Luxury', pricePerDay: 750, dataAiHint: 'Mercedes Luxury SUV' },
    { make: 'Kia', model: 'Sportage 2024', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4405.jpeg'], category: 'SUV', pricePerDay: 105, dataAiHint: 'Kia SUV' },
    { make: 'Mercedes Benz', model: 'AMG GLE 53 2022', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4411.jpeg'], category: 'Luxury', pricePerDay: 350, dataAiHint: 'Mercedes Luxury SUV' },
    { make: 'BMW', model: 'X6 2022', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4412.jpeg'], category: 'Luxury', pricePerDay: 320, dataAiHint: 'BMW Luxury SUV' },
    { make: 'Chevrolet', model: 'Tahoe Premier Blindada 2018', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4425.jpeg'], category: 'Luxury', pricePerDay: 400, dataAiHint: 'Chevrolet Armored SUV' },
    { make: 'Chevrolet', model: 'Tahoe LS 2018', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4424.jpeg'], category: 'SUV', pricePerDay: 180, dataAiHint: 'Chevrolet SUV' },
    { make: 'Jeep', model: 'Grand Cherokee Limited 2018', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4423.jpeg'], category: 'SUV', pricePerDay: 140, dataAiHint: 'Jeep SUV' },
    { make: 'Jeep', model: 'Altitud 2018', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4422.jpeg'], category: 'SUV', pricePerDay: 135, dataAiHint: 'Jeep SUV' },
    { make: 'Jeep', model: 'SRT 2018', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4421.jpeg'], category: 'Luxury', pricePerDay: 250, dataAiHint: 'Jeep Luxury SUV' },
    { make: 'BMW', model: 'X5 2021', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4420.jpeg'], category: 'Luxury', pricePerDay: 300, dataAiHint: 'BMW Luxury SUV' },
    { make: 'Mercedes Benz', model: 'GLE-43 2019', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4419.jpeg'], category: 'Luxury', pricePerDay: 290, dataAiHint: 'Mercedes Luxury SUV' },
    { make: 'Toyota', model: '4Runner 2017', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4418.jpeg'], category: 'SUV', pricePerDay: 160, dataAiHint: 'Toyota SUV' },
    { make: 'Jeep', model: 'Rubicon 2020', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4416.jpeg'], category: 'SUV', pricePerDay: 200, dataAiHint: 'Jeep Offroad' },
    { make: 'Porsche', model: 'Cayenne 2020', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4414.jpeg'], category: 'Luxury', pricePerDay: 450, dataAiHint: 'Porsche Luxury SUV' },
    { make: 'Jeep', model: 'Summit 2019', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4410.jpeg'], category: 'SUV', pricePerDay: 170, dataAiHint: 'Jeep SUV' },
    { make: 'Honda', model: 'CR-V 2020', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4408.jpeg'], category: 'SUV', pricePerDay: 80, dataAiHint: 'Honda SUV' },
    { make: 'Kia', model: 'Seltos 2022', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4406.jpeg'], category: 'SUV', pricePerDay: 88, dataAiHint: 'Kia SUV' },
    { make: 'Hyundai', model: 'Santa Fe 2020', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4403.jpeg'], category: 'SUV', pricePerDay: 115, dataAiHint: 'Hyundai SUV' },
    { make: 'Kia', model: 'Seltos 2023', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4402.jpeg'], category: 'SUV', pricePerDay: 92, dataAiHint: 'Kia SUV' },
    { make: 'Hyundai', model: 'Cantus 2020', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4401.jpeg'], category: 'SUV', pricePerDay: 70, dataAiHint: 'Hyundai SUV' },
    { make: 'Hyundai', model: 'i20 2022', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4400.jpeg'], category: 'Economy', pricePerDay: 60, dataAiHint: 'Hyundai Economy' },
    { make: 'Hyundai', model: 'H1 2018', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4399.jpeg'], category: 'SUV', pricePerDay: 100, dataAiHint: 'Hyundai Van' },
    { make: 'Ford', model: 'Explorer 2018', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4398.jpeg'], category: 'SUV', pricePerDay: 130, dataAiHint: 'Ford SUV' },
    { make: 'Hyundai', model: 'Tucson 2022', imageUrls: ['https://www.virtuscarrentalsrl.com/wp-content/uploads/2023/11/IMG_4397.jpeg'], category: 'SUV', pricePerDay: 98, dataAiHint: 'Hyundai SUV' },
].map(v => ({
    ...v,
    plate: `V${Math.floor(Math.random() * 900) + 100}TR`,
    status: 'Available' as const,
    insuranceCost: 15,
    deductible: 500,
    specs: {
      seats: v.category === 'SUV' || v.model.includes('Staria') || v.model.includes('H1') || v.model.includes('Suburban') || v.model.includes('Escalade') ? 7 : 5,
      transmission: 'Automatic',
      engine: v.category === 'Luxury' ? '3.0L V6' : '2.0L'
    },
    lastServiceDate: new Date(new Date().setMonth(new Date().getMonth() - Math.floor(Math.random() * 5))).toISOString().split('T')[0]
}));

export const initialVehicles: Vehicle[] = initialVehiclesData.map((v, i) => ({
    ...v,
    id: `VEH-${String(i + 1).padStart(3, '0')}`,
}));

// --- CUSTOMERS ---
export const initialCustomers: Customer[] = [
    { id: 'CUST-001', name: 'Liam Johnson', email: 'liam.j@example.com', phone: '809-111-2222', idOrPassport: '123-4567890-1', license: 'US-LI-123', address: '123 Main St, Santo Domingo', createdAt: new Date().toISOString() },
    { id: 'CUST-002', name: 'Olivia Smith', email: 'olivia.s@example.com', phone: '829-333-4444', idOrPassport: 'A98765432', license: 'CA-OS-456', address: '456 Oak Ave, Punta Cana', createdAt: new Date().toISOString() },
    { id: 'CUST-003', name: 'Noah Williams', email: 'noah.w@example.com', phone: '849-555-6666', idOrPassport: '402-1234567-8', license: 'DO-NW-789', address: '789 Pine Rd, Santiago', createdAt: new Date().toISOString() }
];

// --- RESERVATIONS --- (Updated to use new vehicle IDs)
export const initialReservations: Reservation[] = [
    { id: 'RES-001', customerId: 'CUST-001', customerName: 'Liam Johnson', vehicleId: 'VEH-001', vehicle: `${initialVehicles[0].make} ${initialVehicles[0].model}`, pickupDate: '2024-07-25', dropoffDate: '2024-07-28', status: 'Completed', agent: 'Luis Mañon', totalCost: initialVehicles[0].pricePerDay * 3, insuranceCost: 25 },
    { id: 'RES-002', customerId: 'CUST-002', customerName: 'Olivia Smith', vehicleId: 'VEH-002', vehicle: `${initialVehicles[1].make} ${initialVehicles[1].model}`, pickupDate: '2024-07-26', dropoffDate: '2024-08-02', status: 'Active', agent: 'Sarah Johnson', totalCost: initialVehicles[1].pricePerDay * 7, insuranceCost: 15 },
    { id: 'RES-003', customerId: 'CUST-003', customerName: 'Noah Williams', vehicleId: 'VEH-003', vehicle: `${initialVehicles[2].make} ${initialVehicles[2].model}`, pickupDate: '2024-08-10', dropoffDate: '2024-08-15', status: 'Upcoming', agent: 'Luis Mañon', totalCost: initialVehicles[2].pricePerDay * 5, insuranceCost: 10 },
];

// --- INVOICES --- (Updated to use new vehicle data)
export const initialInvoices: Invoice[] = [
    { id: 'INV-001', customer: 'Liam Johnson', date: '2024-07-28', amount: String(initialVehicles[0].pricePerDay * 3), status: 'Paid', createdBy: 'Luis Mañon', paymentMethod: 'Credit Card', reservationId: 'RES-001' },
    { id: 'INV-002', customer: 'Olivia Smith', date: '2024-08-02', amount: String(initialVehicles[1].pricePerDay * 7), status: 'Paid', createdBy: 'Sarah Johnson', paymentMethod: 'Bank Transfer', reservationId: 'RES-002' },
    { id: 'INV-003', customer: 'Noah Williams', date: '2024-08-10', amount: String(initialVehicles[2].pricePerDay * 5), status: 'Draft', createdBy: 'Luis Mañon', paymentMethod: 'N/A', reservationId: 'RES-003' },
];

// --- EXPENSES --- (Updated to use new vehicle data)
export const initialExpenses: Expense[] = [
    { id: 'EXP-001', description: `Maintenance - ${initialVehicles[0].make} ${initialVehicles[0].model}`, category: 'Maintenance', amount: '350.00', date: '2024-07-20', status: 'Paid', createdBy: 'Luis Mañon', vehicleId: 'VEH-001' },
    { id: 'EXP-002', description: 'Office Rent - August', category: 'Utilities', amount: '1200.00', date: '2024-08-01', status: 'Paid', createdBy: 'Luis Mañon' },
    { id: 'EXP-003', description: 'Fuel for fleet', category: 'Fuel', amount: '500.00', date: '2024-07-29', status: 'Paid', createdBy: 'Sarah Johnson' },
];

// --- MAINTENANCE LOGS --- (Updated to use new vehicle data)
export const initialMaintenanceLogs: MaintenanceLog[] = [
    { id: 'MLOG-001', vehicleId: 'VEH-001', vehicleName: `${initialVehicles[0].make} ${initialVehicles[0].model}`, date: '2024-06-15', serviceType: 'Oil Change', cost: '180.00', notes: 'Replaced oil and filter.', createdBy: 'Luis Mañon' },
    { id: 'MLOG-002', vehicleId: 'VEH-005', vehicleName: `${initialVehicles[4].make} ${initialVehicles[4].model}`, date: '2024-07-20', serviceType: 'Brake Service', cost: '450.00', notes: 'Replaced front brake pads and rotors.', createdBy: 'Luis Mañon' },
];

// --- REVIEWS --- (Updated to use new vehicle data)
export const initialReviews: Review[] = [
    { id: 'REV-001', vehicleId: 'VEH-001', reservationId: 'RES-001', customerId: 'CUST-001', customerName: 'Liam Johnson', rating: 5, comment: 'Excellent car, very clean and luxurious. The service was top-notch!', timestamp: new Date().toISOString(), status: 'Approved'},
    { id: 'REV-002', vehicleId: 'VEH-002', reservationId: 'RES-002', customerId: 'CUST-002', customerName: 'Olivia Smith', rating: 4, comment: 'Good vehicle, but pickup took a little longer than expected. Overall a positive experience.', timestamp: new Date().toISOString(), status: 'Pending'},
];


// --- INSURANCE OPTIONS (Remains the same) ---
export const insuranceOptions = [
    { 
        id: 'law', 
        pricePerDay: 10,
        deposit: 500,
        deductible: 1000,
        title: {
            es: 'Seguro de Ley',
            en: 'Liability Insurance'
        },
        description: {
            es: 'Cobertura básica requerida. Cubre daños a terceros. Requiere un depósito de seguridad de $500 y tiene un deducible de $1,000.',
            en: 'Basic required coverage. Covers damages to third parties. Requires a $500 security deposit and has a $1,000 deductible.'
        }
    },
    { 
        id: 'semi-full', 
        pricePerDay: 25,
        deposit: 250,
        deductible: 500,
        title: {
            es: 'Seguro Semifull',
            en: 'Semi-Full Insurance'
        },
        description: {
            es: 'Cobertura ampliada que incluye daños al vehículo. Reduce el depósito a $250 y tiene un deducible de $500.',
            en: 'Extended coverage including damages to the vehicle. Reduces the deposit to $250 and has a $500 deductible.'
        }
    }
];
