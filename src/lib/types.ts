
export type UserRole = 'Admin' | 'Supervisor' | 'Secretary' | 'Client';

export type UserProfile = {
    id: string; // Corresponds to Firebase Auth UID
    name: string;
    email: string;
    role: UserRole;
    photoURL?: string;
};

export type Customer = {
    id: string;
    name: string;
    email: string;
    phone: string;
    idOrPassport: string;
    license: string;
    address: string;
    createdAt: string; // ISO string
};

export type Vehicle = {
    id: string; 
    make: string;
    model: string;
    plate: string;
    category: 'Economy' | 'Sedan' | 'SUV' | 'Luxury';
    status: 'Available' | 'Rented' | 'Maintenance';
    imageUrls: string[];
    dataAiHint: string;
    pricePerDay: number;
    insuranceCost: number;
    deductible: number;
    specs: {
        seats: number;
        transmission: string;
        engine: string;
    };
    lastServiceDate: string; // ISO string
};

export type VehicleInspection = {
    photos: string[]; // URLs of the inspection photos
    notes: string;
    fuelLevel: 'Full' | '3/4' | '1/2' | '1/4' | 'Empty';
    mileage: number;
    signatureUrl: string; // URL of the customer's signature image
    timestamp: string; // ISO string of when the inspection was done
};

export type Reservation = {
    id: string;
    customerId: string;
    customerName: string;
    vehicleId: string;
    vehicle: string;
    pickupDate: string; // yyyy-MM-dd
    dropoffDate: string; // yyyy-MM-dd
    status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';
    agent: string;
    insuranceCost: number;
    totalCost: number; 
    departureInspection?: VehicleInspection;
    returnInspection?: VehicleInspection;
    contractId?: string;
};

export type Contract = {
    id: string;
    reservationId: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    vehicleId: string;
    vehicleName: string;
    pickupDate: string;
    dropoffDate: string;
    totalCost: number;
    status: 'pending_signature' | 'signed_by_client' | 'pending' | 'signed' | 'completed' | 'cancelled';
    content?: string;
    clientSignatureUrl?: string;
    clientIdPhotoUrl?: string;
    agentSignatureUrl?: string;
    finalPdfUrl?: string;
    createdAt: any; 
    signedAt?: string;
};


export type Invoice = {
  id: string;
  customer: string;
  date: string; // yyyy-MM-dd
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  createdBy: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'N/A';
  reservationId?: string;
};

export type Expense = {
    id: string;
    description: string;
    category: 'Maintenance' | 'Fuel' | 'Insurance' | 'Salaries' | 'Office Supplies' | 'Utilities' | 'Other';
    amount: string;
    date: string; // yyyy-MM-dd
    status: 'Pending' | 'Paid' | 'Overdue';
    createdBy: string;
    vehicleId?: string;
};

export type MaintenanceLog = {
    id: string;
    vehicleId: string;
    vehicleName: string;
    date: string; // yyyy-MM-dd
    serviceType: string;
    cost: string;
    notes: string;
    createdBy: string;
};

export type ActivityLog = {
    id: string;
    timestamp: string; // ISO string
    user: string;
    action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout' | 'Cancel' | 'Review';
    entityType: 'Reservation' | 'Vehicle' | 'User' | 'Invoice' | 'Expense' | 'Contract' | 'Auth' | 'Maintenance' | 'Customer' | 'Review' | 'Checklist' | 'Document';
    entityId: string;
    details: string;
};

export type Review = {
    id: string;
    vehicleId: string;
    reservationId: string;
    customerId: string;
    customerName: string;
    rating: number;
    comment: string;
    timestamp: string; // ISO string
    status: 'Pending' | 'Approved' | 'Rejected';
};

export type Document = {
    id: string;
    customer: string;
    type: "Driver's License" | "ID Card (Cédula)" | "Passport" | "Other" | "Rental Agreement" | "Departure Checklist";
    date: string;
    fileUrl: string;
    fileName: string;
    status: 'Verified' | 'Pending' | 'Rejected' | 'Signed' | 'Generated';
    reservationId?: string;
    content?: string | object;
}
