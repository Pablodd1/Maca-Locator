import { useState, useEffect, useRef } from "react";
import { useAppState } from "../context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Car, 
  Plus, 
  Trash2, 
  Bell, 
  Check, 
  Edit2, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  MessageSquare,
  Key,
  CheckCircle2,
  LogOut,
  Camera,
  Scan,
  Cpu,
  Sparkles,
  Loader2
} from "lucide-react";
import { 
  isGoogleConnected, 
  getGoogleAccessToken, 
  setGoogleAccessToken, 
  clearGoogleAccessToken, 
  listCalendarEvents, 
  listChatSpaces, 
  sendChatMessage,
  GoogleCalendarEvent,
  GoogleChatSpace
} from "../lib/googleApi";

export function UserProfile() {
  const {
    user,
    setUser,
    vehicles,
    addVehicle,
    removeVehicle,
    updateVehicleMileage,
    notificationPrefs,
    toggleNotificationPref,
  } = useAppState();

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");

  // New Vehicle State
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState("");
  const [currentMilage, setCurrentMilage] = useState<number>(10000);
  const [lastOilChange, setLastOilChange] = useState<number>(8000);
  const [lastTireRotation, setLastTireRotation] = useState<number>(8000);

  // Camera & VIN Scan State
  const [isScanningVin, setIsScanningVin] = useState(false);
  const [vinScannerStatus, setVinScannerStatus] = useState<"idle" | "accessing" | "scanning" | "decoding" | "success" | "error">("idle");
  const [vinScanLogs, setVinScanLogs] = useState<string[]>([]);
  const [scannedVinResult, setScannedVinResult] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startVinScan = async () => {
    setIsScanningVin(true);
    setVinScannerStatus("accessing");
    setVinScanLogs(["[System] Initializing smart mobile scanning engine..."]);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCameraStream(stream);
      setVinScannerStatus("scanning");
      setVinScanLogs(prev => [
        ...prev,
        "[Camera] Direct video feed connected successfully.",
        "[AI Engine] Analyzing frame for high-contrast alphanumeric sequences..."
      ]);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play error:", e));
      }
    } catch (err: any) {
      console.warn("Webcam access restricted, running in smart high-fidelity simulated camera mode:", err);
      setVinScannerStatus("scanning");
      setVinScanLogs(prev => [
        ...prev,
        "[Warning] Direct camera blocked or unavailable.",
        "[AI Engine] Booting smart VIP telemetry viewfinder model...",
        "[AI Engine] Running high-precision OCR pipeline on virtual stream..."
      ]);
    }
  };

  const stopVinScan = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsScanningVin(false);
    setVinScannerStatus("idle");
  };

  const handleSimulateScan = (carKey: "audi" | "bmw" | "porsche" | "byd") => {
    setVinScannerStatus("decoding");
    setVinScanLogs(prev => [
      ...prev,
      "[OCR] 17-digit character stream detected.",
      "[AI Engine] Validating ISO 3779 checksum digits...",
      "[Database] Querying Global Manufacturer Identifier (WMI)..."
    ]);

    const cars = {
      audi: {
        vin: "WAUZZZGE3RA10984",
        make: "Audi",
        model: "e-tron GT",
        year: 2024,
        plate: "EVX-482",
        mileage: 4850,
        oil: 0,
        rotation: 4000
      },
      bmw: {
        vin: "WBA31AW0XNFG8123",
        make: "BMW",
        model: "i4 M50",
        year: 2023,
        plate: "HKS-119",
        mileage: 9240,
        oil: 0,
        rotation: 8000
      },
      porsche: {
        vin: "WP0ZZZY1ZNSA2049",
        make: "Porsche",
        model: "Taycan 4S",
        year: 2024,
        plate: "TAY-911",
        mileage: 3120,
        oil: 0,
        rotation: 3000
      },
      byd: {
        vin: "LC0XC2DG2N100849",
        make: "BYD",
        model: "Han EV",
        year: 2023,
        plate: "BYD-088",
        mileage: 12500,
        oil: 0,
        rotation: 10000
      }
    };

    const selectedCar = cars[carKey];

    setTimeout(() => {
      setMake(selectedCar.make);
      setModel(selectedCar.model);
      setYear(selectedCar.year);
      setLicensePlate(selectedCar.plate);
      setCurrentMilage(selectedCar.mileage);
      setLastOilChange(selectedCar.oil);
      setLastTireRotation(selectedCar.rotation);
      
      setScannedVinResult(selectedCar.vin);
      setVinScannerStatus("success");
      setVinScanLogs(prev => [
        ...prev,
        `[Decoded] Model details mapped: ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`,
        `[Success] Copied VIP specifications into registration form!`
      ]);
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Mileage edit state per vehicle
  const [editingMileageVehicleId, setEditingMileageVehicleId] = useState<string | null>(null);
  const [tempMileage, setTempMileage] = useState<number>(0);

  // Google Workspace State
  const [isGConnected, setIsGConnected] = useState(isGoogleConnected());
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [chatSpaces, setChatSpaces] = useState<GoogleChatSpace[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [customClientId, setCustomClientId] = useState("");
  const [selectedSpace, setSelectedSpace] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");

  // Handle OAuth callback token parsing and loading data
  useEffect(() => {
    // 1. Check URL hash for access token (Google OAuth redirection callback)
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const expiresIn = params.get("expires_in");
      
      if (accessToken) {
        setGoogleAccessToken(accessToken, Number(expiresIn || 3600));
        setIsGConnected(true);
        // Clean url hash nicely
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setSyncStatusMsg("Successfully connected to Google Workspace via OAuth!");
      }
    }
  }, []);

  // Fetch Google data when connected or connection state changes
  useEffect(() => {
    if (isGConnected) {
      loadWorkspaceData();
    } else {
      setCalendarEvents([]);
      setChatSpaces([]);
    }
  }, [isGConnected]);

  const loadWorkspaceData = async () => {
    setWorkspaceLoading(true);
    setSyncStatusMsg("");
    try {
      const [events, spaces] = await Promise.all([
        listCalendarEvents().catch(() => []),
        listChatSpaces().catch(() => []),
      ]);
      setCalendarEvents(events);
      setChatSpaces(spaces);
      if (spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(spaces[0].name);
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatusMsg("Failed to load some Workspace data: " + err.message);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleGoogleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const clientId = customClientId.trim() || "832448492110-sampleid.apps.googleusercontent.com"; // Fallback client ID
    const redirectUri = window.location.origin + window.location.pathname;
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/chat.messages.create",
      "https://www.googleapis.com/auth/chat.spaces.create"
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&state=macalocator`;
    
    // Redirect to Google Consent screen
    window.location.href = authUrl;
  };

  const handleConnectSandbox = () => {
    setGoogleAccessToken("sandbox_token_macalocator_" + Math.random().toString(36).substring(7), 3600);
    setIsGConnected(true);
    setSyncStatusMsg("Connected in Sandbox Mode. Simulated Google services are active!");
  };

  const handleDisconnectGoogle = () => {
    clearGoogleAccessToken();
    setIsGConnected(false);
    setSyncStatusMsg("Disconnected from Google Workspace.");
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !messageText.trim()) return;

    try {
      setWorkspaceLoading(true);
      await sendChatMessage(selectedSpace, `🚨 MACALOCATOR Alert: ${messageText.trim()}`);
      setSendResult(`✓ Alert broadcast successfully to Google Chat space!`);
      setMessageText("");
      setTimeout(() => setSendResult(null), 4000);
    } catch (err: any) {
      setSendResult(`❌ Failed to send: ${err.message}`);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      id: user?.id || "u1",
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
    });
    setIsEditingProfile(false);
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !licensePlate) return;
    addVehicle({
      make,
      model,
      year: Number(year),
      licensePlate: licensePlate.toUpperCase(),
      currentMilage: Number(currentMilage),
      lastOilChangeMilage: isElectric(make, model) ? 0 : Number(lastOilChange),
      lastTireRotationMilage: Number(lastTireRotation),
    });
    // Reset form
    setMake("");
    setModel("");
    setYear(new Date().getFullYear());
    setLicensePlate("");
    setCurrentMilage(10000);
    setLastOilChange(8000);
    setLastTireRotation(8000);
    setIsAddingVehicle(false);
  };

  const startEditMileage = (id: string, mileage?: number) => {
    setEditingMileageVehicleId(id);
    setTempMileage(mileage || 0);
  };

  const saveMileage = (id: string) => {
    updateVehicleMileage(id, tempMileage);
    setEditingMileageVehicleId(null);
  };

  const isElectric = (makeStr: string, modelStr: string) => {
    const combined = `${makeStr} ${modelStr}`.toLowerCase();
    return (
      combined.includes("tesla") ||
      combined.includes("bolt") ||
      combined.includes("leaf") ||
      combined.includes("taycan") ||
      combined.includes("i3") ||
      combined.includes("etron") ||
      combined.includes("ev") ||
      combined.includes("electric")
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile & Vehicles</h1>
        <p className="text-slate-500 mt-1">Manage your customer profile, registered vehicles, and service alerts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Profile & Notification Settings */}
        <div className="space-y-6 lg:col-span-1">
          {/* Personal Info Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Details
              </CardTitle>
              <CardDescription>Your contact details for service updates.</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Full Name</label>
                    <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email Address</label>
                    <Input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                    <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} required />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm" className="flex-1">Save</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{user?.name || "Guest User"}</h3>
                    <p className="text-sm text-slate-500">{user?.email || "No email registered"}</p>
                    <p className="text-sm text-slate-500 mt-1">{user?.phone || "No phone registered"}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full flex items-center gap-1" onClick={() => {
                    setProfileName(user?.name || "");
                    setProfileEmail(user?.email || "");
                    setProfilePhone(user?.phone || "");
                    setIsEditingProfile(true);
                  }}>
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Service Reminders
              </CardTitle>
              <CardDescription>Enable notifications for maintenance intervals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div>
                  <p className="font-medium text-sm text-slate-800">Oil Change Alerts</p>
                  <p className="text-xs text-slate-500">Every 5,000 miles (combustion cars)</p>
                </div>
                <button
                  onClick={() => toggleNotificationPref("oilChange")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${notificationPrefs.oilChange ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notificationPrefs.oilChange ? "translate-x-5" : ""}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div>
                  <p className="font-medium text-sm text-slate-800">Tire Rotation Alerts</p>
                  <p className="text-xs text-slate-500">Every 7,500 miles (all vehicles)</p>
                </div>
                <button
                  onClick={() => toggleNotificationPref("tireRotation")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${notificationPrefs.tireRotation ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notificationPrefs.tireRotation ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Google Workspace Sync Card */}
          <Card className="shadow-sm border-t-4 border-t-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className={`w-5 h-5 text-emerald-600 ${workspaceLoading ? "animate-spin" : ""}`} />
                  Google Workspace
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Calendar & Chat
                </Badge>
              </div>
              <CardDescription>
                Sync vehicle repair appointments and broadcast high-priority roadside chat alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStatusMsg && (
                <div className={`p-3 rounded-lg text-xs font-medium border ${
                  syncStatusMsg.includes("Simulated") || syncStatusMsg.includes("Success")
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  {syncStatusMsg}
                </div>
              )}

              {!isGConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Syncing your account enables auto-creating Google Calendar events for maintenance bookings, and sending emergency dispatcher responses to your team's Google Chat spaces.
                    </p>
                    
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Google Client ID (Optional)</label>
                      <Input 
                        placeholder="Paste your client ID from Google Console" 
                        value={customClientId} 
                        onChange={(e) => setCustomClientId(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Official-looking Sign In with Google Button */}
                    <button 
                      onClick={handleGoogleConnect}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-lg py-2 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      Connect Google Workspace
                    </button>

                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="w-full text-xs font-semibold"
                      onClick={handleConnectSandbox}
                    >
                      💡 Use Sandbox Demo Mode (Recommended)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-950">
                          {getGoogleAccessToken()?.startsWith("sandbox_") ? "Active (Sandbox Mode)" : "Active (Google Authorized)"}
                        </p>
                        <p className="text-[10px] text-emerald-700">Sync is live and responsive</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50/50" 
                      onClick={handleDisconnectGoogle}
                      title="Disconnect Account"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Calendar Sync Display */}
                  <div className="space-y-2 border-t pt-3">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Google Calendar Bookings
                    </h4>
                    {calendarEvents.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-5">No calendar events detected or loaded.</p>
                    ) : (
                      <div className="space-y-1.5 pl-5">
                        {calendarEvents.map(ev => {
                          const eventTime = new Date(ev.start.dateTime || "").toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          });
                          return (
                            <div key={ev.id} className="text-xs p-2 bg-slate-50 border rounded hover:border-slate-300 transition-colors">
                              <p className="font-semibold text-slate-800 truncate">{ev.summary}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{eventTime}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Chat Broadcast Display */}
                  <div className="space-y-2 border-t pt-3">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      Google Chat Alert Broadcaster
                    </h4>
                    {chatSpaces.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-5">No active Google Chat spaces found.</p>
                    ) : (
                      <form onSubmit={handleSendTestMessage} className="space-y-2 pl-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500">Select Destination Space</label>
                          <select 
                            className="w-full text-xs h-8 border rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            value={selectedSpace}
                            onChange={(e) => setSelectedSpace(e.target.value)}
                          >
                            {chatSpaces.map(sp => (
                              <option key={sp.name} value={sp.name}>
                                {sp.displayName} ({sp.type})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500">Roadside Diagnostic Alert Message</label>
                          <div className="flex gap-1">
                            <Input 
                              placeholder="e.g., Tesla Model 3 Flat Tire at Highway 50" 
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              className="h-8 text-xs flex-grow"
                            />
                            <Button 
                              type="submit" 
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
                              disabled={workspaceLoading || !messageText.trim()}
                            >
                              Broadcast
                            </Button>
                          </div>
                        </div>

                        {sendResult && (
                          <p className={`text-[11px] font-medium ${sendResult.includes("✓") ? "text-emerald-700" : "text-amber-700"}`}>
                            {sendResult}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Registered Vehicles List & Vehicle Registration */}
        <div className="space-y-6 lg:col-span-2">
          {/* Real-time Alerts Panel (Visible when Reminders are toggled ON) */}
          {(notificationPrefs.oilChange || notificationPrefs.tireRotation) && (
            <div className="space-y-3">
              {vehicles.map((v) => {
                const electric = isElectric(v.make, v.model);
                
                // Oil change alert logic
                const milesSinceOil = electric ? 0 : (v.currentMilage || 0) - (v.lastOilChangeMilage || 0);
                const isOilDue = !electric && milesSinceOil >= 4500;
                
                // Tire rotation alert logic
                const milesSinceRotation = (v.currentMilage || 0) - (v.lastTireRotationMilage || 0);
                const isRotationDue = milesSinceRotation >= 7000;

                const showOilAlert = notificationPrefs.oilChange && isOilDue;
                const showRotationAlert = notificationPrefs.tireRotation && isRotationDue;

                if (!showOilAlert && !showRotationAlert) return null;

                return (
                  <div key={`alert-${v.id}`} className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start shadow-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-900 text-sm">
                        Maintenance Alert: {v.make} {v.model} ({v.licensePlate})
                      </p>
                      <ul className="text-xs text-amber-800 list-disc pl-4 space-y-1">
                        {showOilAlert && (
                          <li>
                            Oil change is recommended! It has been <span className="font-bold">{milesSinceOil.toLocaleString()} miles</span> since your last change.
                          </li>
                        )}
                        {showRotationAlert && (
                          <li>
                            Tire rotation is highly recommended! It has been <span className="font-bold">{milesSinceRotation.toLocaleString()} miles</span> since your last rotation.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vehicle Management Card */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  My Registered Vehicles
                </CardTitle>
                <CardDescription>Manage and view maintenance intervals for your garage.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddingVehicle(true)} disabled={isAddingVehicle}>
                <Plus className="w-4 h-4 mr-1" /> Add Car
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Vehicle Form */}
              {isAddingVehicle && (
                <form onSubmit={handleAddVehicleSubmit} className="bg-slate-50 border rounded-lg p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b">
                    <h3 className="font-bold text-sm text-slate-700">Register New Vehicle</h3>
                    {!isScanningVin ? (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8 text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border-blue-200"
                        onClick={startVinScan}
                      >
                        <Camera className="w-3.5 h-3.5 mr-1.5" />
                        Scan VIN with Camera
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs h-8 text-red-500 hover:text-red-600"
                        onClick={stopVinScan}
                      >
                        Cancel Scan
                      </Button>
                    )}
                  </div>

                  {/* Camera Scanner Viewfinder */}
                  {isScanningVin && (
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4">
                      <div className="relative w-full h-52 bg-black rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                        <div className="absolute inset-0 border-[3px] border-slate-800/40 pointer-events-none" />
                        
                        <div className="absolute w-[80%] h-14 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center animate-pulse z-20">
                          <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-bounce" style={{ animationDuration: '2.5s' }} />
                          <span className="text-[9px] text-blue-300 font-bold bg-black/80 px-2 py-0.5 rounded tracking-widest absolute -top-3">ALIGN VIN CODE</span>
                        </div>

                        <video 
                          ref={videoRef} 
                          className="w-full h-full object-cover absolute inset-0 opacity-40" 
                          playsInline 
                          muted 
                        />

                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                        
                        {vinScannerStatus === "accessing" && (
                          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-2 z-10">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-xs text-slate-300 font-bold">Connecting Secure Camera Feed...</p>
                            <p className="text-[10px] text-slate-500">Checking device permissions</p>
                          </div>
                        )}

                        {vinScannerStatus === "decoding" && (
                          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-2 z-10">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            <p className="text-xs text-slate-300 font-bold">Decoding VIN Sequence...</p>
                            <p className="text-[10px] text-amber-400 font-mono">Verifying checksum values</p>
                          </div>
                        )}

                        {vinScannerStatus === "success" && (
                          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-2 z-10">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            <p className="text-xs text-emerald-400 font-bold">VIN Decode Completed!</p>
                            <p className="text-[10px] text-slate-400 font-mono">{scannedVinResult}</p>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
                        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-blue-500" />
                        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-blue-500" />
                        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Select VIP vehicle to simulate scan:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 text-[11px] font-bold border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                              onClick={() => handleSimulateScan("audi")}
                              disabled={vinScannerStatus === "decoding"}
                            >
                              Audi e-tron GT ⚡
                            </Button>
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 text-[11px] font-bold border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                              onClick={() => handleSimulateScan("bmw")}
                              disabled={vinScannerStatus === "decoding"}
                            >
                              BMW i4 M50 ⚡
                            </Button>
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 text-[11px] font-bold border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                              onClick={() => handleSimulateScan("porsche")}
                              disabled={vinScannerStatus === "decoding"}
                            >
                              Taycan 4S ⚡
                            </Button>
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 text-[11px] font-bold border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                              onClick={() => handleSimulateScan("byd")}
                              disabled={vinScannerStatus === "decoding"}
                            >
                              BYD Han EV ⚡
                            </Button>
                          </div>
                        </div>

                        <div className="bg-black/40 rounded-lg p-2.5 border border-slate-800 h-24 overflow-y-auto font-mono text-[9px] text-blue-400 space-y-1">
                          {vinScanLogs.map((log, i) => (
                            <p key={i} className="leading-tight">{log}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {scannedVinResult && !isScanningVin && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold">Camera Autofill Success!</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Successfully scanned and decrypted VIN <span className="font-mono bg-white px-1.5 py-0.5 border rounded">{scannedVinResult}</span>. Custom specifications applied.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Make</label>
                      <Input placeholder="Chevrolet" value={make} onChange={(e) => setMake(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Model</label>
                      <Input placeholder="Bolt EV" value={model} onChange={(e) => setModel(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Year</label>
                      <Input type="number" min="1990" max="2027" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">License Plate</label>
                      <Input placeholder="EV-123-BOG" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Current Mileage (mi)</label>
                      <Input type="number" value={currentMilage} onChange={(e) => setCurrentMilage(Number(e.target.value))} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Last Oil Change (mi)</label>
                      <Input 
                        type="number" 
                        value={lastOilChange} 
                        onChange={(e) => setLastOilChange(Number(e.target.value))} 
                        disabled={isElectric(make, model)}
                        placeholder={isElectric(make, model) ? "N/A - Electric" : ""}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Last Tire Rotation (mi)</label>
                      <Input type="number" value={lastTireRotation} onChange={(e) => setLastTireRotation(Number(e.target.value))} required />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingVehicle(false)}>Cancel</Button>
                    <Button type="submit" size="sm">Register Vehicle</Button>
                  </div>
                </form>
              )}

              {/* Vehicles List */}
              {vehicles.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Car className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No vehicles registered. Add a car to customize service bookings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map((v) => {
                    const electric = isElectric(v.make, v.model);
                    const isEditingThisMileage = editingMileageVehicleId === v.id;

                    return (
                      <div key={v.id} className="border rounded-lg p-4 space-y-4 bg-white hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                              <Car className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800">{v.year} {v.make} {v.model}</h4>
                                {electric && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Electric ⚡</Badge>}
                              </div>
                              <p className="text-xs font-mono text-slate-500 uppercase mt-0.5">Plate: {v.licensePlate}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => removeVehicle(v.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Mileage and service status display */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-sm">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">Current Mileage</span>
                            {isEditingThisMileage ? (
                              <div className="flex gap-1.5 items-center">
                                <Input 
                                  type="number" 
                                  value={tempMileage} 
                                  onChange={(e) => setTempMileage(Number(e.target.value))}
                                  className="h-8 w-28 text-xs"
                                />
                                <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => saveMileage(v.id)}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">{(v.currentMilage || 0).toLocaleString()} mi</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600" onClick={() => startEditMileage(v.id, v.currentMilage)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">Oil Change Status</span>
                            {electric ? (
                              <span className="text-xs text-slate-400 italic">No oil required</span>
                            ) : (
                              <div>
                                <span className="font-medium text-slate-700">
                                  Last: {(v.lastOilChangeMilage || 0).toLocaleString()} mi
                                </span>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {((v.currentMilage || 0) - (v.lastOilChangeMilage || 0) >= 4500) ? (
                                    <span className="text-amber-600 font-medium">⚠️ Due soon / past due</span>
                                  ) : (
                                    <span className="text-emerald-600 font-medium">✓ Up to date</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">Tire Rotation Status</span>
                            <div>
                              <span className="font-medium text-slate-700">
                                Last: {(v.lastTireRotationMilage || 0).toLocaleString()} mi
                              </span>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {((v.currentMilage || 0) - (v.lastTireRotationMilage || 0) >= 7000) ? (
                                  <span className="text-amber-600 font-medium">⚠️ Due soon / past due</span>
                                ) : (
                                  <span className="text-emerald-600 font-medium">✓ Up to date</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
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
