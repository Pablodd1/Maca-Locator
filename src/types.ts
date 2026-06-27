export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  currentMilage?: number;
  lastOilChangeMilage?: number;
  lastTireRotationMilage?: number;
};

export type ServiceBooking = {
  id: string;
  type: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed';
  vehicleId?: string;
};

export type EmergencyRequest = {
  id: string;
  type: string;
  location: string;
  timestamp: string;
  status: 'pending' | 'dispatched' | 'resolved';
};
