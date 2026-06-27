import { useState, useEffect } from "react";
import { useAppState } from "../context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CalendarDays, 
  MessageSquare, 
  Wrench, 
  MapPin, 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  Trash2, 
  ArrowRight,
  RefreshCw,
  Loader2,
  Filter,
  Map as MapIcon,
  Truck,
  ShieldCheck,
  Sparkles,
  Info,
  Coins,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router";
import { MacalocatorLogo } from "./MacalocatorLogo";

type MapPoint = {
  id: string;
  type: "team" | "request";
  name: string;
  locationName: string;
  lat: number; // Vertical percentage position
  lng: number; // Horizontal percentage position
  status: string;
  detail: string;
  vehicle?: string;
  eta?: string;
  priority?: "low" | "medium" | "high";
};

const mapPoints: MapPoint[] = [
  {
    id: "t1",
    type: "team",
    name: "Mobile Diagnostic Unit 1",
    locationName: "Bogotá - Chicó Norte",
    lat: 32,
    lng: 68,
    status: "En Route",
    detail: "Onboard high-voltage battery scanner & tire calibration toolkit.",
    vehicle: "Ford E-Transit Mobile Workshop",
    eta: "11 mins to Request 1"
  },
  {
    id: "t2",
    type: "team",
    name: "Rapid Response Flatbed 2",
    locationName: "Bogotá - Calle 26",
    lat: 68,
    lng: 35,
    status: "Ready & On Call",
    detail: "Equipped for flatbed towing, lockout recovery, and auxiliary battery jumps.",
    vehicle: "Heavy-duty Concierge Tow Truck",
    eta: "Stationed / Ready"
  },
  {
    id: "t3",
    type: "team",
    name: "Elite High-Voltage Specialist 3",
    locationName: "Bogotá - Usaquén",
    lat: 15,
    lng: 78,
    status: "Active Worksite",
    detail: "On-site executing premium brake system recalibration & software update.",
    vehicle: "Mobile Tech Mercedes Sprinter",
    eta: "On-site"
  },
  {
    id: "r1",
    type: "request",
    name: "Tesla Model 3 Flat Tire Alert",
    locationName: "Chicó Sector, Carrera 11",
    lat: 40,
    lng: 70,
    status: "Assigned",
    detail: "Client requesting nitrogen tire swap in driveway.",
    priority: "medium",
    eta: "Unit 1 arriving in 11 mins"
  },
  {
    id: "r2",
    type: "request",
    name: "Audi e-tron GT Battery Warning",
    locationName: "Usaquén, Calle 116",
    lat: 18,
    lng: 82,
    status: "In Progress",
    detail: "12V auxiliary backup cell discharging rapidly. Diagnostic scan underway.",
    priority: "high",
    eta: "Unit 3 on-site"
  },
  {
    id: "r3",
    type: "request",
    name: "Chevrolet Bolt EV Lockout",
    locationName: "Salitre Corridor, Av. El Dorado",
    lat: 72,
    lng: 28,
    status: "Dispatching",
    detail: "Driver locked keys inside secure office garage.",
    priority: "high",
    eta: "Assigning nearest backup unit..."
  }
];

const serviceCostDetails = {
  "Full Mobile Diagnostics": {
    basePriceMin: 180000,
    basePriceMax: 290000,
    laborHours: "1.0 - 1.5 hrs",
    partsEstimated: "None (Full OBD/EV Software & Diagnostics Scan)",
    historicalAvg: 235000,
    breakdown: { labor: "80%", parts: "0%", tools: "20%" },
    description: "Full electronic control unit scanning, high-voltage battery cell check, and calibration update."
  },
  "White-Glove Oil Change & Fluid Flush": {
    basePriceMin: 320000,
    basePriceMax: 540000,
    laborHours: "1.0 - 2.0 hrs",
    partsEstimated: "Synthetic Motor Oil (0W-20/5W-30) + Premium Oil Filter",
    historicalAvg: 410000,
    breakdown: { labor: "40%", parts: "50%", tools: "10%" },
    description: "Premium high-grade synthetic oil replacement & OEM grade filter with safe disposal.",
    electricRestricted: true
  },
  "At-Home Brake Calibration & Replacement": {
    basePriceMin: 550000,
    basePriceMax: 980000,
    laborHours: "2.0 - 3.5 hrs",
    partsEstimated: "Brake Pads + Brake Fluid Flush + Digital Wear Sensors",
    historicalAvg: 760000,
    breakdown: { labor: "45%", parts: "45%", tools: "10%" },
    description: "Certified performance pad and rotor replacement with digital caliper calibration."
  },
  "Concierge Tire Maintenance & Balancing": {
    basePriceMin: 220000,
    basePriceMax: 380000,
    laborHours: "1.5 - 2.0 hrs",
    partsEstimated: "Premium nitrogen inflation, sealant & optional balancing weights",
    historicalAvg: 290000,
    breakdown: { labor: "50%", parts: "20%", tools: "30%" },
    description: "Thread inspection, rotation, computerized balancing, and high-purity nitrogen inflation."
  },
  "Elite Battery Install & Diagnostics": {
    basePriceMin: 450000,
    basePriceMax: 850000,
    laborHours: "0.5 - 1.0 hrs",
    partsEstimated: "Premium 12V Auxiliary / AGM Battery Unit",
    historicalAvg: 620000,
    breakdown: { labor: "25%", parts: "70%", tools: "5%" },
    description: "Next-day mobile delivery, certified install, terminal cleaning, and battery memory saver connection."
  },
  "Detailing & Eco-Wash Suite": {
    basePriceMin: 150000,
    basePriceMax: 310000,
    laborHours: "2.0 - 3.0 hrs",
    partsEstimated: "Ceramic Coatings + Premium Sterilization solutions",
    historicalAvg: 220000,
    breakdown: { labor: "70%", parts: "20%", tools: "10%" },
    description: "Premium waterless premium ceramic hand coating, leather treatment, and interior UV sterilization."
  }
};

const presetEstimatorVehicles = [
  { id: "preset-tesla", make: "Tesla", model: "Model Y Performance", year: 2025, isEV: true, multiplier: 1.4, label: "⚡ Tesla Model Y Performance (EV)" },
  { id: "preset-audi", make: "Audi", model: "e-tron GT", year: 2024, isEV: true, multiplier: 1.5, label: "⚡ Audi e-tron GT (Luxury EV)" },
  { id: "preset-bmw", make: "BMW", model: "i4 M50", year: 2024, isEV: true, multiplier: 1.45, label: "⚡ BMW i4 M50 (Performance EV)" },
  { id: "preset-byd", make: "BYD", model: "Han EV Executive", year: 2024, isEV: true, multiplier: 1.3, label: "⚡ BYD Han EV Executive (EV)" },
  { id: "preset-porsche", make: "Porsche", model: "Taycan 4S", year: 2024, isEV: true, multiplier: 1.6, label: "⚡ Porsche Taycan 4S (Premium EV)" },
  { id: "preset-toyota", make: "Toyota", model: "Prado TX-L", year: 2023, isEV: false, multiplier: 1.2, label: "🚘 Toyota Prado TX-L (SUV)" },
  { id: "preset-mazda", make: "Mazda", model: "CX-30 Grand Touring", year: 2023, isEV: false, multiplier: 1.0, label: "🚘 Mazda CX-30 GT (Standard)" }
];

export function Dashboard() {
  const { bookings, vehicles, updateBookingStatus, notificationPrefs } = useAppState();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(mapPoints[0]);
  const [mapFilter, setMapFilter] = useState<"all" | "team" | "request">("all");

  const handleUpdateStatus = (id: string, status: "confirmed" | "in_progress" | "completed") => {
    setIsRefreshing(true);
    updateBookingStatus(id, status);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 850);
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto trigger small refresh simulation on mount to look premium & live
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Service Cost Estimator State
  const [selectedEstimatorVehicleId, setSelectedEstimatorVehicleId] = useState<string>("");
  const [selectedEstimatorService, setSelectedEstimatorService] = useState<string>("Full Mobile Diagnostics");

  // Select initial vehicle for estimator if not set
  useEffect(() => {
    if (vehicles.length > 0 && !selectedEstimatorVehicleId) {
      setSelectedEstimatorVehicleId(vehicles[0].id);
    } else if (vehicles.length === 0 && !selectedEstimatorVehicleId) {
      setSelectedEstimatorVehicleId("preset-tesla");
    }
  }, [vehicles, selectedEstimatorVehicleId]);

  // Helper to determine if a dynamic vehicle name is electric
  const isElectric = (make: string, model: string) => {
    const combined = `${make} ${model}`.toLowerCase();
    return combined.includes("tesla") || combined.includes("bolt") || combined.includes("leaf") || combined.includes("ev") || combined.includes("taycan") || combined.includes("tron");
  };

  const getSelectedVehicleDetails = () => {
    // Check in registered vehicles first
    const registered = vehicles.find(v => v.id === selectedEstimatorVehicleId);
    if (registered) {
      const isEv = isElectric(registered.make, registered.model);
      // Determine premium multiplier based on brand
      let multiplier = 1.0;
      const combined = `${registered.make} ${registered.model}`.toLowerCase();
      if (combined.includes("porsche") || combined.includes("taycan")) multiplier = 1.6;
      else if (combined.includes("audi") || combined.includes("e-tron")) multiplier = 1.5;
      else if (combined.includes("bmw") || combined.includes("i4")) multiplier = 1.45;
      else if (combined.includes("tesla")) multiplier = 1.4;
      else if (combined.includes("byd")) multiplier = 1.3;
      else if (combined.includes("prado") || combined.includes("toyota")) multiplier = 1.2;
      
      return {
        name: `${registered.year} ${registered.make} ${registered.model}`,
        isEV: isEv,
        multiplier,
        licensePlate: registered.licensePlate,
        isPreset: false
      };
    }
    // Check in presets
    const preset = presetEstimatorVehicles.find(p => p.id === selectedEstimatorVehicleId);
    if (preset) {
      return {
        name: `${preset.year} ${preset.make} ${preset.model}`,
        isEV: preset.isEV,
        multiplier: preset.multiplier,
        licensePlate: "PRESET",
        isPreset: true
      };
    }
    // Fallback default
    return {
      name: "Tesla Model Y Performance",
      isEV: true,
      multiplier: 1.4,
      licensePlate: "PRESET",
      isPreset: true
    };
  };

  const vehicleDetails = getSelectedVehicleDetails();
  const serviceDetails = serviceCostDetails[selectedEstimatorService as keyof typeof serviceCostDetails] || serviceCostDetails["Full Mobile Diagnostics"];

  // Calculate final dynamic prices using multiplier
  const finalMin = Math.round(serviceDetails.basePriceMin * vehicleDetails.multiplier);
  const finalMax = Math.round(serviceDetails.basePriceMax * vehicleDetails.multiplier);
  const finalAvg = Math.round(serviceDetails.historicalAvg * vehicleDetails.multiplier);

  // Conversion: 1 USD = 4,000 COP
  const minUSD = Math.round(finalMin / 4000);
  const maxUSD = Math.round(finalMax / 4000);
  const avgUSD = Math.round(finalAvg / 4000);

  // Helper for rendering status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1 hover:bg-yellow-100/50">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 hover:bg-blue-100/50">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse flex items-center gap-1 hover:bg-indigo-100/50">
            <PlayCircle className="w-3 h-3" /> In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 hover:bg-emerald-100/50">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Count active maintenance warnings
  const maintenanceAlertsCount = vehicles.filter(v => {
    const electric = isElectric(v.make, v.model);
    const milesSinceOil = electric ? 0 : (v.currentMilage || 0) - (v.lastOilChangeMilage || 0);
    const milesSinceRotation = (v.currentMilage || 0) - (v.lastTireRotationMilage || 0);

    const showOilAlert = notificationPrefs.oilChange && !electric && milesSinceOil >= 4500;
    const showRotationAlert = notificationPrefs.tireRotation && milesSinceRotation >= 7000;
    return showOilAlert || showRotationAlert;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100 shrink-0 w-fit">
            <MacalocatorLogo size="md" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Welcome to MACALOCATOR & Car Services</h1>
            <p className="text-slate-500 mt-0.5 text-xs md:text-sm">Real-time scheduling, vehicle health updates, Google Workspace sync, and emergency roadside help.</p>
          </div>
        </div>
        {maintenanceAlertsCount > 0 && (
          <Link to="/profile">
            <Badge className="bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 py-1.5 px-3.5 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              {maintenanceAlertsCount} Maintenance Alert{maintenanceAlertsCount > 1 ? "s" : ""}
            </Badge>
          </Link>
        )}
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/emergency">
          <Card className="hover:bg-red-50 transition-all duration-200 border-red-100 hover:border-red-200 shadow-sm cursor-pointer h-full group">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-red-700">Emergency Help</h3>
              <p className="text-xs text-red-600/80">Towing, roadside assistance, lockouts</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/booking">
          <Card className="hover:bg-blue-50 transition-all duration-200 border-slate-100 hover:border-blue-200 shadow-sm cursor-pointer h-full group">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800">Book Service</h3>
              <p className="text-xs text-slate-500">Scheduled maintenance & repairs</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/chat">
          <Card className="hover:bg-indigo-50 transition-all duration-200 border-slate-100 hover:border-indigo-200 shadow-sm cursor-pointer h-full group">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800">Support Assistant</h3>
              <p className="text-xs text-slate-500">Ask questions, diagnostic support</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/profile">
          <Card className="hover:bg-slate-50 transition-all duration-200 border-slate-100 hover:border-slate-200 shadow-sm cursor-pointer h-full group">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800">My Vehicles</h3>
              <p className="text-xs text-slate-500">Register cars & toggle reminders</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Dynamic Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Logistics Map */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-slate-200/80 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-blue-600" />
                  VIP Logistics & Dispatch Map
                </CardTitle>
                <CardDescription className="text-xs">Real-time status of emergency service teams & pending roadside requests across Bogotá.</CardDescription>
              </div>
              
              {/* Map Filter Controls */}
              <div className="flex bg-slate-100 p-1 rounded-xl border text-[11px] font-bold self-start sm:self-auto shrink-0">
                <button 
                  onClick={() => setMapFilter("all")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${mapFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  All Assets
                </button>
                <button 
                  onClick={() => setMapFilter("team")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${mapFilter === "team" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <span className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                  Teams (3)
                </button>
                <button 
                  onClick={() => setMapFilter("request")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${mapFilter === "request" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <span className="h-1.5 w-1.5 bg-red-400 rounded-full" />
                  Requests (3)
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Map Canvas Frame */}
              <div className="w-full h-[360px] bg-[#f8fafc] relative overflow-hidden border-b select-none">
                
                {/* Visual Grid Schematic Background of Bogotá, Colombia */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Main Simulated Expressways */}
                  {/* Avenida Boyacá (West) */}
                  <line x1="25%" y1="0%" x2="25%" y2="100%" stroke="#475569" strokeWidth="6" strokeDasharray="4 4" />
                  <text x="26%" y="8%" fill="#475569" className="text-[9px] font-bold tracking-wider uppercase">Av. Boyacá</text>

                  {/* Carrera 7 (East Corridor) */}
                  <line x1="75%" y1="0%" x2="75%" y2="100%" stroke="#475569" strokeWidth="6" />
                  <text x="76%" y="8%" fill="#475569" className="text-[9px] font-bold tracking-wider uppercase">Carrera 7</text>

                  {/* Calle 100 (North Corridor) */}
                  <line x1="0%" y1="30%" x2="100%" y2="30%" stroke="#475569" strokeWidth="5" />
                  <text x="5%" y="28%" fill="#475569" className="text-[9px] font-bold tracking-wider uppercase">Calle 100</text>

                  {/* Calle 26 / Av. El Dorado (Airport Expressway) */}
                  <line x1="0%" y1="70%" x2="100%" y2="70%" stroke="#475569" strokeWidth="5" />
                  <text x="5%" y="68%" fill="#475569" className="text-[9px] font-bold tracking-wider uppercase">Calle 26 / El Dorado</text>

                  {/* Major Intersect Nodes */}
                  <circle cx="75%" cy="30%" r="8" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" />
                  <circle cx="25%" cy="70%" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
                </svg>

                {/* Legend Watermark */}
                <div className="absolute top-3 left-4 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border text-[10px] font-extrabold text-slate-500 space-y-1 z-10 shadow-sm">
                  <p className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse inline-block" />
                    Mobile Dispatch Team
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    Active Rescue request
                  </p>
                </div>

                {/* Render Map Asset Markers */}
                {mapPoints
                  .filter(p => mapFilter === "all" || p.type === mapFilter)
                  .map(p => {
                    const isSelected = selectedPoint?.id === p.id;
                    const isTeam = p.type === "team";
                    return (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPoint(p)}
                        className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-20"
                        style={{ top: `${p.lat}%`, left: `${p.lng}%` }}
                      >
                        {/* Pulse echo background */}
                        <div className={`absolute -inset-2 rounded-full pointer-events-none opacity-40 animate-ping ${isTeam ? "bg-blue-400" : "bg-red-400"}`} />
                        
                        {/* Icon Node wrapper */}
                        <div className={`p-2 rounded-full border-2 shadow-lg transition-colors bg-white ${
                          isTeam 
                            ? isSelected ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-500/20" : "border-blue-500 text-blue-600 hover:border-blue-700"
                            : isSelected ? "border-red-600 bg-red-50 text-red-600 ring-2 ring-red-500/20" : "border-red-500 text-red-600 hover:border-red-700"
                        }`}>
                          {isTeam ? <Truck className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        </div>

                        {/* Direct floating label */}
                        <div className={`absolute left-9 top-1/2 -translate-y-1/2 bg-slate-900/90 text-white rounded px-2 py-0.5 text-[8px] font-bold tracking-wide uppercase whitespace-nowrap shadow-md pointer-events-none select-none border border-slate-700 ${isSelected ? "opacity-100 scale-100" : "opacity-60 scale-95 hover:opacity-100"}`}>
                          {isTeam ? `Unit ${p.id.replace("t", "")}` : `Req ${p.id.replace("r", "")}`}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Selected Asset Detailed Dispatch Drawer */}
              {selectedPoint && (
                <div className="p-4 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100">
                  <div className="flex gap-3 items-start">
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${selectedPoint.type === "team" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-red-50 border-red-100 text-red-600"}`}>
                      {selectedPoint.type === "team" ? <Truck className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-sm leading-none">{selectedPoint.name}</h4>
                        <Badge className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-1.5 rounded ${selectedPoint.type === "team" ? "bg-blue-100/60 text-blue-800 border-blue-200" : "bg-red-100/60 text-red-800 border-red-200"}`}>
                          {selectedPoint.type === "team" ? "Mobile Workshop" : "roadside priority"}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" /> {selectedPoint.locationName}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-lg">{selectedPoint.detail}</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-3 text-xs space-y-1.5 min-w-[210px] shadow-sm">
                    {selectedPoint.vehicle && (
                      <p className="flex justify-between font-medium text-slate-500 text-[11px]">
                        <span>Vehicle:</span>
                        <span className="font-bold text-slate-800">{selectedPoint.vehicle}</span>
                      </p>
                    )}
                    <p className="flex justify-between font-medium text-slate-500 text-[11px]">
                      <span>Dispatch:</span>
                      <span className="font-extrabold text-blue-600 uppercase tracking-wide">{selectedPoint.status}</span>
                    </p>
                    <p className="flex justify-between font-medium text-slate-500 text-[11px]">
                      <span>ETA Index:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{selectedPoint.eta || "Calculating..."}</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Service Cost Estimator */}
          <Card className="shadow-md border-slate-200/80 rounded-2xl overflow-hidden bg-white" id="service-cost-estimator">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-800">
                    VIP Service Cost Estimator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your vehicle model and requested dispatch service to generate real-time mobile cost projections.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side inputs */}
                <div className="space-y-5">
                  {/* Vehicle selection dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      1. Select Target Vehicle
                    </label>
                    <select
                      value={selectedEstimatorVehicleId}
                      onChange={(e) => setSelectedEstimatorVehicleId(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                    >
                      {vehicles.length > 0 && (
                        <optgroup label="My Registered Vehicles">
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              🚘 {v.year} {v.make} {v.model} ({v.licensePlate})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Explore Custom/EV Presets">
                        {presetEstimatorVehicles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Service selection list */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      2. Select Dispatch Service Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(serviceCostDetails).map((serviceName) => {
                        const isSelected = selectedEstimatorService === serviceName;
                        const service = serviceCostDetails[serviceName as keyof typeof serviceCostDetails];
                        return (
                          <button
                            key={serviceName}
                            type="button"
                            onClick={() => setSelectedEstimatorService(serviceName)}
                            className={`p-3 text-left rounded-xl border text-[11px] font-extrabold transition-all flex flex-col justify-between h-[84px] cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/70 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <span className="leading-tight">{serviceName}</span>
                            <span className="text-[10px] font-normal text-slate-500 mt-1 block">
                              🕒 {service.laborHours} avg
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right side Pricing intelligence output */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full inline-block animate-pulse" />
                        Live Average Index
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold tracking-wider font-mono">BOGOTÁ, COL</span>
                    </div>

                    {/* Price Range display */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Projected Pricing Range</span>
                      <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5 flex-wrap">
                        ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} COP
                      </div>
                      <p className="text-[11px] text-blue-400 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        Approx. ${minUSD} - ${maxUSD} USD equivalent
                      </p>
                    </div>

                    {/* Visual Slider Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>Min Quote</span>
                        <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded">Avg: ${finalAvg.toLocaleString()} COP</span>
                        <span>Max Quote</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full relative overflow-hidden border border-slate-700">
                        <div className="absolute top-0 bottom-0 left-[20%] right-[20%] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                        <div className="absolute top-1/2 -translate-y-1/2 left-[50%] h-3.5 w-1 bg-white rounded-full shadow-[0_0_8px_#3b82f6]" />
                      </div>
                    </div>

                    {/* Specs List */}
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Car:</span>
                        <span className="text-slate-200 font-bold">{vehicleDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Est. Service Duration:</span>
                        <span className="text-slate-200 font-bold">{serviceDetails.laborHours}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-slate-400 shrink-0">Included Components:</span>
                        <span className="text-slate-200 font-bold text-right leading-snug">{serviceDetails.partsEstimated}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800/60 pt-1.5 mt-1.5">
                        <span className="text-slate-400">Rate Index Modifier:</span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">
                          {vehicleDetails.multiplier}x rate index
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Advisory Notifications */}
                    {vehicleDetails.isEV && "electricRestricted" in serviceDetails && (serviceDetails as any).electricRestricted ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <div className="space-y-0.5 text-[10px] leading-relaxed">
                          <p className="font-extrabold uppercase tracking-wide text-[11px]">Engine Oil Not Applicable</p>
                          <p className="text-slate-300">
                            Electric drivetrains do not use motor oil. We advise scheduling <strong>Full Mobile Diagnostics</strong> or <strong>Detailing</strong> instead.
                          </p>
                        </div>
                      </div>
                    ) : vehicleDetails.isEV ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        <div className="space-y-0.5 text-[10px] leading-relaxed">
                          <p className="font-extrabold uppercase tracking-wide text-[11px]">EV Safety Calibration Included</p>
                          <p className="text-slate-300">
                            Includes complete diagnostic system sync, auxiliary lithium cell voltage audits, and low-emission diagnostics.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-start gap-2.5">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                        <div className="space-y-0.5 text-[10px] leading-relaxed">
                          <p className="font-extrabold uppercase tracking-wide text-[11px]">OEM Combustion Standard</p>
                          <p className="text-slate-300">
                            Guaranteed genuine fluids, synthetic filters, and comprehensive engine control diagnostic scanning on-site.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Book Service Action Link */}
                  <Link to="/booking" className="block w-full pt-2">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold h-11 text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-blue-500/15 flex items-center justify-center gap-1.5 cursor-pointer">
                      Book Scheduled Mobile Dispatch
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Booking & Recent Activity List with badging */}
        <div>
          <Card className="shadow-md h-full flex flex-col border-slate-200/85 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/50 border-b">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-800">Recent Bookings</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-7 h-7 text-slate-400 hover:text-slate-600 rounded-full"
                    onClick={triggerRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                  </Button>
                </div>
                <CardDescription className="text-[11px]">Real-time status updates & vehicle dispatching</CardDescription>
              </div>
              <Link to="/booking">
                <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1 p-0 px-2 h-7 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50">
                  Book <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            
            <CardContent className="space-y-4 flex-1 relative pt-4">
              {/* Live sync floating loading animation overlay */}
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center z-30 transition-all rounded-b-2xl">
                  <div className="bg-slate-900 text-white border border-slate-800 rounded-full px-3.5 py-2 shadow-xl flex items-center gap-2 animate-bounce">
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span className="text-[9px] font-black tracking-widest uppercase">refreshing database...</span>
                  </div>
                </div>
              )}

              {bookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No service bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {bookings.map((booking) => {
                    const vehicle = vehicles.find(v => v.id === booking.vehicleId);
                    
                    return (
                      <div key={booking.id} className="p-3 border rounded-xl bg-slate-50/40 hover:bg-white flex flex-col gap-2 hover:border-slate-300 transition-all duration-200 hover:shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm leading-tight">{booking.type}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> {booking.date} at {booking.time}
                            </p>
                            {vehicle && (
                              <p className="text-[11px] text-slate-400 font-bold mt-1 bg-slate-100/70 inline-block px-1.5 py-0.5 rounded border border-slate-200/40">
                                Car: {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                              </p>
                            )}
                          </div>
                          <div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>

                        {/* Simulate booking transitions for MVP presentation */}
                        {booking.status !== "completed" && (
                          <div className="flex gap-1.5 justify-end pt-2 border-t border-slate-100 mt-1">
                            {booking.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[10px] font-bold px-2.5 text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border-blue-200"
                                onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                              >
                                Accept Job
                              </Button>
                            )}
                            {booking.status === "confirmed" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[10px] font-bold px-2.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200"
                                onClick={() => handleUpdateStatus(booking.id, "in_progress")}
                              >
                                Start Work
                              </Button>
                            )}
                            {booking.status === "in_progress" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[10px] font-bold px-2.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200"
                                onClick={() => handleUpdateStatus(booking.id, "completed")}
                              >
                                Complete Job
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
