import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Vehicle, ServiceBooking } from "../types";
import { isGoogleConnected, createCalendarEvent } from "../lib/googleApi";
import { notify } from "../lib/notifyClient";

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
  applyPersona: (kind: "full" | "empty" | "admin") => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultVehicles: Vehicle[] = [
  {
    id: "v1",
    make: "Tesla",
    model: "Model 3",
    year: 2022,
    licensePlate: "EV-987-FL",
    currentMilage: 12500,
    lastOilChangeMilage: 0, // Electric, but good for demo
    lastTireRotationMilage: 8000,
  },
  {
    id: "v2",
    make: "Chevrolet",
    model: "Bolt EV",
    year: 2021,
    licensePlate: "EV-123-FL",
    currentMilage: 18400,
    lastOilChangeMilage: 0,
    lastTireRotationMilage: 15000,
  }
];

// Demo seeds are computed relative to "today" so the dashboard always shows
// a live, current-looking schedule no matter when the demo happens.
const isoDaysFromNow = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const defaultBookings: ServiceBooking[] = [
  {
    id: "b1",
    type: "Tire Rotation",
    date: isoDaysFromNow(4),
    time: "10:00 AM",
    status: "confirmed",
    vehicleId: "v1"
  },
  {
    id: "b2",
    type: "Battery Diagnostic",
    date: isoDaysFromNow(0),
    time: "02:00 PM",
    status: "in_progress",
    vehicleId: "v2"
  },
  {
    id: "b3",
    type: "Car Wash & Detailing",
    date: isoDaysFromNow(-9),
    time: "09:00 AM",
    status: "completed",
    vehicleId: "v1"
  }
];

const defaultUser: User = {
  id: "u1",
  name: "Jasmel Acosta",
  email: "jasmelacosta@gmail.com",
  phone: "+1 (305) 555-0123"
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

  // Mirror bookings to the server store so reminders run even when the app
  // is closed (the morning cron reads from there). Fire-and-forget.
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings, clientName: user?.name, clientPhone: user?.phone }),
      }).catch(() => { /* offline demo — client-local reminders still work */ });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

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

    // Confirmation fan-out: client email + WhatsApp (best-effort; the server
    // composes in demo mode when provider keys are absent) + staff Telegram.
    const clientEmail = user?.email || "";
    const clientPhone = user?.phone || "";
    const confirmMsg = `MACALOCATOR — ${newB.type} confirmed for ${newB.date} at ${newB.time}. Our technician comes straight to you. Reply 1 to confirm or 2 to reschedule. / Confirmado: nuestro técnico irá hasta usted.`;
    if (clientEmail) {
      notify({ channel: "email", to: clientEmail, message: confirmMsg, subject: `MACALOCATOR — ${newB.type} confirmed` })
        .catch(() => {});
    }
    if (clientPhone) {
      notify({ channel: "whatsapp", to: clientPhone.replace(/[^\d+]/g, ""), message: confirmMsg })
        .catch(() => {});
    }
    notify({ channel: "telegram", message: `🆕 MACALOCATOR — New booking: ${newB.type} · ${newB.date} ${newB.time} · Client: ${user?.name || "VIP client"}` })
      .catch(() => {});

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

  // Demo persona switcher — powers the skip buttons on the welcome gate.
  // "full": Jasmel Acosta, complete CRM + vehicles + a booking today.
  // "empty": brand-new client — nothing registered, to walk the registration
  //          workflow from scratch. "admin": JASMELADM straight to Mission
  //          Control with the full dataset behind it.
  const applyPersona = (kind: "full" | "empty" | "admin") => {
    if (kind === "empty") {
      localStorage.setItem("ev_user", JSON.stringify({ id: "u_new", name: "New Client", email: "", phone: "", role: "client" as const }));
      localStorage.setItem("ev_vehicles", "[]");
      localStorage.setItem("ev_bookings", "[]");
    } else if (kind === "admin") {
      localStorage.setItem("ev_user", JSON.stringify({
        ...defaultUser,
        name: "JASMELADM",
        email: "admin@macalocator.com",
        role: "admin" as const,
        address: "MACALOCATOR HQ, 3950 Biscayne Blvd, Miami, FL",
        preferredLanguage: "en" as const,
      }));
      localStorage.setItem("ev_vehicles", JSON.stringify(defaultVehicles));
      localStorage.setItem("ev_bookings", JSON.stringify(defaultBookings));
    } else {
      localStorage.setItem("ev_user", JSON.stringify({
        ...defaultUser,
        address: "1000 Brickell Plaza, Apt 4202, Miami, FL",
        gpsLat: 25.7617,
        gpsLng: -80.1918,
        insuranceCarrier: "GEICO",
        insurancePolicy: "GEO-4471-882",
        preferredLanguage: "es" as const,
        marketingOptIn: true,
      }));
      localStorage.setItem("ev_vehicles", JSON.stringify(defaultVehicles));
      localStorage.setItem("ev_bookings", JSON.stringify(defaultBookings));
    }
    // Reset the operations engine so each persona starts a clean day
    ["maca_staff", "maca_tasks", "maca_inventory", "maca_ledger", "maca_reminder_done"].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("maca_persona", kind);
    if (kind === "admin") localStorage.setItem("maca_persona_dest", "/admin");
    window.location.href = "/";
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
        applyPersona,
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
