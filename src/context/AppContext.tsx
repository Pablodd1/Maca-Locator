import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Vehicle, ServiceBooking } from "../types";
import { isGoogleConnected, createCalendarEvent } from "../lib/googleApi";

type NotificationPreferences = {
  oilChange: boolean;
  tireRotation: boolean;
};

type AppContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "id">) => void;
  removeVehicle: (id: string) => void;
  updateVehicleMileage: (id: string, currentMileage: number) => void;
  bookings: ServiceBooking[];
  addBooking: (booking: Omit<ServiceBooking, "id" | "status">) => void;
  updateBookingStatus: (id: string, status: ServiceBooking["status"]) => void;
  notificationPrefs: NotificationPreferences;
  toggleNotificationPref: (type: keyof NotificationPreferences) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultVehicles: Vehicle[] = [
  {
    id: "v1",
    make: "Tesla",
    model: "Model 3",
    year: 2022,
    licensePlate: "EV-987-COL",
    currentMilage: 12500,
    lastOilChangeMilage: 0, // Electric, but good for demo
    lastTireRotationMilage: 8000,
  },
  {
    id: "v2",
    make: "Chevrolet",
    model: "Bolt EV",
    year: 2021,
    licensePlate: "EV-123-BOG",
    currentMilage: 18400,
    lastOilChangeMilage: 0,
    lastTireRotationMilage: 15000,
  }
];

const defaultBookings: ServiceBooking[] = [
  {
    id: "b1",
    type: "Tire Rotation",
    date: "2026-11-12",
    time: "10:00 AM",
    status: "confirmed",
    vehicleId: "v1"
  },
  {
    id: "b2",
    type: "Battery Diagnostic",
    date: "2026-11-08",
    time: "02:00 PM",
    status: "in_progress",
    vehicleId: "v2"
  },
  {
    id: "b3",
    type: "Car Wash & Detailing",
    date: "2026-10-30",
    time: "09:00 AM",
    status: "completed",
    vehicleId: "v1"
  }
];

const defaultUser: User = {
  id: "u1",
  name: "Jasmel Acosta",
  email: "jasmelacosta@gmail.com",
  phone: "+57 300 123 4567"
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem("ev_user");
    return saved ? JSON.parse(saved) : defaultUser;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem("ev_vehicles");
    return saved ? JSON.parse(saved) : defaultVehicles;
  });

  const [bookings, setBookings] = useState<ServiceBooking[]>(() => {
    const saved = localStorage.getItem("ev_bookings");
    return saved ? JSON.parse(saved) : defaultBookings;
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem("ev_notifications");
    return saved ? JSON.parse(saved) : { oilChange: true, tireRotation: true };
  });

  useEffect(() => {
    localStorage.setItem("ev_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("ev_vehicles", JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem("ev_bookings", JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem("ev_notifications", JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
  };

  const addVehicle = (newV: Omit<Vehicle, "id">) => {
    const vehicle: Vehicle = {
      ...newV,
      id: "v_" + Math.random().toString(36).substr(2, 9),
    };
    setVehicles((prev) => [...prev, vehicle]);
  };

  const removeVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVehicleMileage = (id: string, currentMileage: number) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, currentMilage: currentMileage } : v))
    );
  };

  const addBooking = (newB: Omit<ServiceBooking, "id" | "status">) => {
    const booking: ServiceBooking = {
      ...newB,
      id: "b_" + Math.random().toString(36).substr(2, 9),
      status: "pending",
    };
    setBookings((prev) => [booking, ...prev]);

    // Automatically Sync to Google Calendar if connected!
    if (isGoogleConnected()) {
      createCalendarEvent({
        title: `MACALOCATOR: ${newB.type}`,
        description: `Automotive service booking scheduled via MACALOCATOR. State: Pending Confirmation.`,
        dateStr: newB.date,
        timeStr: newB.time,
      }).catch((err) => console.error("Could not sync to Google Calendar:", err));
    }
  };

  const updateBookingStatus = (id: string, status: ServiceBooking["status"]) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
  };

  const toggleNotificationPref = (type: keyof NotificationPreferences) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        vehicles,
        addVehicle,
        removeVehicle,
        updateVehicleMileage,
        bookings,
        addBooking,
        updateBookingStatus,
        notificationPrefs,
        toggleNotificationPref,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
};
