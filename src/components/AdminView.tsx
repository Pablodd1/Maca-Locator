import { useState, useEffect, useRef } from "react";
import { useAppState } from "../context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line
} from "recharts";
import { 
  TrendingUp, 
  Coins, 
  Smartphone, 
  PhoneCall, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Database, 
  Copy, 
  FileText, 
  Terminal, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Send, 
  HelpCircle,
  Truck,
  Layers,
  Settings,
  Mail,
  Volume2,
  RefreshCw,
  Search,
  BookOpen
} from "lucide-react";

// Pre-configured simulation models for deep operational study & training
const mockStudyGuides = [
  {
    topic: "EV High-Voltage Auxiliary Diagnosis",
    difficulty: "Advanced",
    duration: "45 mins",
    summary: "How to interpret 12V auxiliary backup cell failure versus traction battery insulation faults.",
    code: "ISO-6469-3"
  },
  {
    topic: "Mobile Nitrogen Calibration Standards",
    difficulty: "Intermediate",
    duration: "30 mins",
    summary: "Safety standards for computerized driveway balancing and mobile tire pressure monitoring system (TPMS) resets.",
    code: "SAE-J2686"
  },
  {
    topic: "VIP Concierge Client Communication",
    difficulty: "Standard",
    duration: "20 mins",
    summary: "De-escalation templates for roadside battery fatigue, delay notifications, and post-service warranty explanations.",
    code: "CRM-900"
  }
];

const mockPastAIConversations = [
  {
    id: "chat-101",
    client: "Jasmel Acosta",
    vehicle: "Tesla Model 3",
    date: "2026-06-25",
    problem: "TPMS tire rotation recalibration warning on dual-motor dashboard.",
    summary: "Recommended dynamic vehicle test. Advised schedule rotation. Dispatch #b1 generated."
  },
  {
    id: "chat-102",
    client: "Simulated Guest (VIP)",
    vehicle: "Audi e-tron GT",
    date: "2026-06-26",
    problem: "12V cell failure lockout warning.",
    summary: "Advised manual mechanical key cylinder door override. Dispatched Unit 3 for battery diagnostic."
  }
];

const presetEstimatorVehicles = [
  { id: "preset-tesla", make: "Tesla", model: "Model Y Performance", year: 2025, isEV: true, multiplier: 1.4, label: "⚡ Tesla Model Y Performance (EV)" },
  { id: "preset-audi", make: "Audi", model: "e-tron GT", year: 2024, isEV: true, multiplier: 1.5, label: "⚡ Audi e-tron GT (Luxury EV)" },
  { id: "preset-bmw", make: "BMW", model: "i4 M50", year: 2024, isEV: true, multiplier: 1.45, label: "⚡ BMW i4 M50 (Performance EV)" },
  { id: "preset-byd", make: "BYD", model: "Han EV Executive", year: 2024, isEV: true, multiplier: 1.3, label: "⚡ BYD Han EV Executive (EV)" },
  { id: "preset-porsche", make: "Porsche", model: "Taycan 4S", year: 2024, isEV: true, multiplier: 1.6, label: "⚡ Porsche Taycan 4S (Premium EV)" },
  { id: "preset-toyota", make: "Toyota", model: "Prado TX-L", year: 2023, isEV: false, multiplier: 1.2, label: "🚘 Toyota Prado TX-L (SUV)" },
  { id: "preset-mazda", make: "Mazda", model: "CX-30 Grand Touring", year: 2023, isEV: false, multiplier: 1.0, label: "🚘 Mazda CX-30 GT (Standard)" }
];

export function AdminView() {
  const { bookings, vehicles, user, addBooking } = useAppState();

  // Navigation State inside Admin
  const [activeAdminTab, setActiveAdminTab] = useState<"analytics" | "visualization" | "ai-frontdesk" | "twilio" | "comms">("analytics");

  // General Simulation states
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Analytics interactive states
  const [selectedStudyGuide, setSelectedStudyGuide] = useState<typeof mockStudyGuides[0] | null>(null);
  const [copiedData, setCopiedData] = useState<string | null>(null);

  // 2. AI Front Desk Assistant states
  const [promptInput, setPromptInput] = useState("");
  const [aiResponseText, setAiResponseText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);

  // 3. Twilio SMS / Call states
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(user?.phone || "+57 300 123 4567");
  const [twilioSmsTemplate, setTwilioSmsTemplate] = useState("MACALOCATOR VIP Alerts: Our certified Mobile Workshop is en route to your driveway. Current ETA is 11 minutes. Click to track live: https://macalocator.co/t/t1");
  const [twilioLogs, setTwilioLogs] = useState<Array<{ id: string; type: "sms" | "call"; to: string; text: string; status: string; timestamp: string }>>([
    {
      id: "tw-1",
      type: "sms",
      to: "+57 300 123 4567",
      text: "Booking #b2 Battery Diagnostic is now IN PROGRESS. Our elite mobile engineer is on-site.",
      status: "Delivered",
      timestamp: "10:02 AM"
    },
    {
      id: "tw-2",
      type: "call",
      to: "+57 300 987 6543",
      text: "Simulated Automated Dispatch Warning: Driver safety override check required.",
      status: "Completed",
      timestamp: "09:41 AM"
    }
  ]);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isPlayingCallAudio, setIsPlayingCallAudio] = useState(false);

  // 4. Staff-Client Intercom states
  const [activeChatChannel, setActiveChatChannel] = useState<"staff" | "client">("staff");
  const [chatMessageInput, setChatMessageInput] = useState("");
  const [selectedPastChat, setSelectedPastChat] = useState<typeof mockPastAIConversations[0] | null>(null);
  const [staffMessages, setStaffMessages] = useState([
    { id: "sm-1", sender: "Dispatcher (You)", text: "Unit 1, has the tire replacement on Carrera 11 been completed?", time: "10:15 AM" },
    { id: "sm-2", sender: "Unit 1 (Field)", text: "Affirmative, nitrogen calibration complete. Torque specs certified. Heading to next job now.", time: "10:19 AM" },
  ]);
  const [clientMessages, setClientMessages] = useState([
    { id: "cm-1", sender: "Jasmel Acosta (Client)", text: "Hey! Can the mobile technician bring an extra auxiliary charge cable?", time: "09:30 AM" },
    { id: "cm-2", sender: "AI Assistant", text: "I have updated the dispatcher! The Mobile unit is carrying elite OEM cables. Safe travels!", time: "09:32 AM" },
  ]);

  // Handle Refreshing/Syncing
  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 900);
  };

  // Helper copy to clipboard
  const handleCopyStudyData = (dataStr: string) => {
    navigator.clipboard.writeText(dataStr);
    setCopiedData("Copied data model successfully!");
    setTimeout(() => setCopiedData(null), 3000);
  };

  // Simulating custom prompt to front desk AI
  const handleAskFrontDeskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsAiLoading(true);
    const userPrompt = promptInput;
    setPromptInput("");

    setTimeout(() => {
      let reply = "";
      if (userPrompt.toLowerCase().includes("jasmel") || userPrompt.toLowerCase().includes("acosta")) {
        reply = `[Front Desk AI] Verified client "Jasmel Acosta". Currently has registered a 2022 Tesla Model 3 (EV-987-COL) and a scheduled Tire Rotation for July 10 at 10:00 AM. Recommending pre-dispatch dispatch message via Twilio with torque audit details.`;
      } else if (userPrompt.toLowerCase().includes("oil") || userPrompt.toLowerCase().includes("fluid")) {
        reply = `[Front Desk AI] Service Analysis: "Fluid Flush / Oil change" is highly requested by standard hybrid/combustion models, but restricted for our premium electric fleet. Current synthetic inventory in Bogotá warehouse: 45 Gallons 0W-20, 12 OEM EV filters.`;
      } else {
        reply = `[Front Desk AI Analysis] I have analyzed your request regarding: "${userPrompt}". We suggest utilizing "Mobile Diagnostic Unit 1" for immediate scheduling, which has an active 100% calibration index and is fully equipped for EV system recovery.`;
      }
      setAiResponseText(reply);
      setIsAiLoading(false);
    }, 1200);
  };

  // Simulating transcript auto-dispatch
  const triggerSimulateCallTranscript = () => {
    setIsTranscribing(true);
    setTranscriptionResult(null);
    setTimeout(() => {
      setTranscriptionResult(`[911 EMERGENCY roadside transcript]
Caller: "My name is Carlos. I'm stranded near Calle 100 with my Taycan. The computer says auxiliary voltage critical. Please send help!"
Extracted Model: Porsche Taycan (Premium EV)
Location Coordinates: Bogotá - Calle 100 Intersect
Requested Service: Battery Diagnostic`);
      setIsTranscribing(false);
    }, 1500);
  };

  const handleApproveCallTranscriptDispatch = () => {
    if (!transcriptionResult) return;
    // Map Porsche Taycan dispatch directly to the state context!
    addBooking({
      type: "Battery Diagnostic",
      date: new Date().toISOString().split('T')[0],
      time: "Immediate Dispatch",
      vehicleId: "v1" // Assign to registered car or preset
    });
    setTranscriptionResult(null);
    alert("Call approved! Emergency Dispatch Job generated in real-time bookings pipeline.");
  };

  // Twilio Trigger SMS
  const handleSendTwilioSms = () => {
    if (!twilioPhoneNumber.trim()) return;
    setIsSendingSms(true);
    setTimeout(() => {
      const newLog = {
        id: "tw-" + Math.random().toString(36).substr(2, 9),
        type: "sms" as const,
        to: twilioPhoneNumber,
        text: twilioSmsTemplate,
        status: "Delivered",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTwilioLogs(prev => [newLog, ...prev]);
      setIsSendingSms(false);
    }, 1000);
  };

  // Twilio Trigger Call
  const handleTriggerTwilioCall = () => {
    if (!twilioPhoneNumber.trim()) return;
    setIsCalling(true);
    setTimeout(() => {
      const newLog = {
        id: "tw-" + Math.random().toString(36).substr(2, 9),
        type: "call" as const,
        to: twilioPhoneNumber,
        text: `Automated Call dispatch to ${twilioPhoneNumber}: Emergency roadside recovery status is active. All mobile units respond.`,
        status: "Completed",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTwilioLogs(prev => [newLog, ...prev]);
      setIsCalling(false);
    }, 1400);
  };

  // Text intercom send
  const handleSendChatMessage = () => {
    if (!chatMessageInput.trim()) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (activeChatChannel === "staff") {
      setStaffMessages(prev => [
        ...prev,
        { id: "sm-" + Date.now(), sender: "Dispatcher (You)", text: chatMessageInput, time: timeNow }
      ]);
    } else {
      setClientMessages(prev => [
        ...prev,
        { id: "cm-" + Date.now(), sender: "Dispatcher (You)", text: chatMessageInput, time: timeNow }
      ]);
      // Simulate client response
      setTimeout(() => {
        setClientMessages(prev => [
          ...prev,
          { id: "cm-reply", sender: "Jasmel Acosta (Client)", text: "Perfect, thank you! I can see the dispatcher details on my map profile.", time: "Just Now" }
        ]);
      }, 1500);
    }
    setChatMessageInput("");
  };

  // Calculate dynamic business statistics from real state data
  const totalVehiclesCount = vehicles.length + presetEstimatorVehicles.length;
  const totalBookingsCount = bookings.length;
  const inProgressBookings = bookings.filter(b => b.status === "in_progress").length;
  const completedBookings = bookings.filter(b => b.status === "completed").length;

  // Revenue index based on dynamic bookings (averaging 420,000 COP per job)
  const totalProjectedRevenue = bookings.reduce((sum, b) => {
    if (b.type.includes("Tire")) return sum + 290000;
    if (b.type.includes("Battery")) return sum + 620000;
    if (b.type.includes("Wash") || b.type.includes("Detailing")) return sum + 220000;
    return sum + 235000;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Upper Brand Jumbotron Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/30">
              MACALOCATOR ADMINISTRATIVE PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              VIP Logistics, Analytics & AI Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time dashboard for managing on-demand vehicular operations, dispatching live staff, configuring Twilio communications, and auditing deep platform analytics.
            </p>
          </div>

          <Button 
            variant="outline" 
            className="border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-white text-xs h-10 font-bold shrink-0 self-start md:self-auto gap-2"
            onClick={handleSyncData}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
            {isSyncing ? "Syncing Platform Database..." : "Force Sync Platform Data"}
          </Button>
        </div>

        {/* Operational Tabs navigation */}
        <div className="flex border-t border-slate-800 mt-8 pt-4 overflow-x-auto whitespace-nowrap gap-1">
          <button
            onClick={() => setActiveAdminTab("analytics")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeAdminTab === "analytics" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            📊 Analytics & Study Center
          </button>
          <button
            onClick={() => setActiveAdminTab("visualization")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeAdminTab === "visualization" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            📈 Data Visualization
          </button>
          <button
            onClick={() => setActiveAdminTab("ai-frontdesk")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeAdminTab === "ai-frontdesk" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            🤖 Front Desk AI Assistant
          </button>
          <button
            onClick={() => setActiveAdminTab("twilio")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeAdminTab === "twilio" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            📞 Twilio call & SMS Gateway
          </button>
          <button
            onClick={() => setActiveAdminTab("comms")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeAdminTab === "comms" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            💬 Staff & Client Intercom
          </button>
        </div>
      </div>

      {/* Sync animation loader */}
      {isSyncing && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl flex items-center gap-3 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-xs font-bold">Auditing active state... Recalculating fleet multiplier indices, parsing Twilio metadata queue.</span>
        </div>
      )}

      {/* 1. ANALYTICS & STUDY CENTER */}
      {activeAdminTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main statistical telemetry card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gross Booking Val</span>
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg font-black text-slate-800">${totalProjectedRevenue.toLocaleString()} COP</p>
                  <span className="text-[9px] text-emerald-600 font-bold">100% Mobile Service</span>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Bookings</span>
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-lg font-black text-slate-800">{totalBookingsCount} Jobs</p>
                  <span className="text-[9px] text-slate-500 font-medium">In system queue</span>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Fleet Registry</span>
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-lg font-black text-slate-800">{totalVehiclesCount} Models</p>
                  <span className="text-[9px] text-slate-500 font-medium">Presets + Customized</span>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Twilio SMS Queue</span>
                    <Smartphone className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-lg font-black text-slate-800">{twilioLogs.length} Transmissions</p>
                  <span className="text-[9px] text-purple-600 font-bold">Gateway operational</span>
                </CardContent>
              </Card>
            </div>

            {/* Custom Responsive SVG Service Chart */}
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Estimated Dispatch Revenue by Service Class (COP)
                </CardTitle>
                <CardDescription className="text-xs">
                  Dynamic operational cost averages calculated against active and preset models.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full h-56 flex flex-col justify-between relative select-none pt-4">
                  
                  {/* Dynamic Graphic */}
                  <div className="flex-1 flex items-end gap-5 px-4 border-b border-slate-200 pb-2 relative">
                    {/* SVG Grid lines behind */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                      <div className="border-t border-dashed w-full h-0" />
                      <div className="border-t border-dashed w-full h-0" />
                      <div className="border-t border-dashed w-full h-0" />
                    </div>

                    {/* Bar 1 */}
                    <div className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                      <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-slate-900 text-white px-1.5 py-0.5 rounded shadow">
                        $290K
                      </div>
                      <div className="w-full bg-blue-600/80 hover:bg-blue-600 transition-colors rounded-t h-28" />
                      <span className="text-[9px] font-bold text-slate-600 text-center truncate w-full">Tires</span>
                    </div>

                    {/* Bar 2 */}
                    <div className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                      <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-slate-900 text-white px-1.5 py-0.5 rounded shadow">
                        $620K
                      </div>
                      <div className="w-full bg-emerald-600/80 hover:bg-emerald-600 transition-colors rounded-t h-44" />
                      <span className="text-[9px] font-bold text-slate-600 text-center truncate w-full">Battery Diagnostic</span>
                    </div>

                    {/* Bar 3 */}
                    <div className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                      <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-slate-900 text-white px-1.5 py-0.5 rounded shadow">
                        $220K
                      </div>
                      <div className="w-full bg-indigo-600/80 hover:bg-indigo-600 transition-colors rounded-t h-20" />
                      <span className="text-[9px] font-bold text-slate-600 text-center truncate w-full">Detailing Suite</span>
                    </div>

                    {/* Bar 4 */}
                    <div className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                      <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-slate-900 text-white px-1.5 py-0.5 rounded shadow">
                        $235K
                      </div>
                      <div className="w-full bg-slate-600/80 hover:bg-slate-600 transition-colors rounded-t h-24" />
                      <span className="text-[9px] font-bold text-slate-600 text-center truncate w-full">Diagnostics Scan</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-bold uppercase">
                    <span>Low Range (Det)</span>
                    <span className="text-slate-500">Median Rate: ~340,000 COP</span>
                    <span>High Range (Batt)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Data Study & Learning Center */}
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl" id="study-lab">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Operational Data Study Lab & Registry
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Analyze relational data and study operational workflow schemas for staff training.
                    </CardDescription>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-200">
                    LEARNING CONSOLE
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockStudyGuides.map((guide, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedStudyGuide(guide)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedStudyGuide?.topic === guide.topic 
                          ? "bg-blue-50/70 border-blue-400" 
                          : "bg-slate-50/40 hover:bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {guide.difficulty}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">{guide.code}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{guide.topic}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{guide.summary}</p>
                    </div>
                  ))}
                </div>

                {selectedStudyGuide && (
                  <div className="p-4 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span>Technical Standard: {selectedStudyGuide.code}</span>
                      <button onClick={() => setSelectedStudyGuide(null)} className="text-red-400 hover:text-red-300">Close</button>
                    </div>
                    <p className="text-blue-400 font-bold text-xs">{selectedStudyGuide.topic}</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{selectedStudyGuide.summary}</p>
                    <div className="bg-black/40 rounded p-2 text-[10px] text-emerald-400">
                      Recommended Staff Response Action Index: Dispatch dynamic mobile diagnostic toolkit containing active sensor re-calibration modules. Est: {selectedStudyGuide.duration}.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Schema Explorer and Study Export */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-400" />
                  Live Schema & study data model
                </CardTitle>
                <CardDescription className="text-xs">
                  Review and copy raw system objects for educational analytics.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-blue-300 overflow-x-auto max-h-56 border border-slate-800">
                    <pre className="leading-tight">
{`{
  "client": {
    "name": "${user?.name || "Jasmel Acosta"}",
    "email": "${user?.email || "jasmelacosta@gmail.com"}",
    "phone": "${user?.phone || "+57 300 123 4567"}"
  },
  "fleet_active_count": ${vehicles.length},
  "bookings": [
    ${bookings.map(b => `{"type": "${b.type}", "date": "${b.date}", "status": "${b.status}"}`).join(",\n    ")}
  ]
}`}
                    </pre>
                  </div>

                  <Button 
                    className="w-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5"
                    onClick={() => handleCopyStudyData(JSON.stringify({ user, vehicles, bookings }, null, 2))}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy JSON State
                  </Button>
                  {copiedData && (
                    <p className="text-[10px] text-emerald-600 font-bold text-center">{copiedData}</p>
                  )}
                </div>

                <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-900 space-y-2">
                  <h4 className="text-xs font-extrabold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    Secure Local Storage Sync
                  </h4>
                  <p className="text-[10px] leading-relaxed text-slate-600">
                    All operations, mock text logs, and custom emergency roadside bookings are safely synced in the client's local storage engine to avoid training data loss.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  Staff Roster Index
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-bold text-slate-800">Unit 1: Mobile Diagnostic</p>
                    <p className="text-[10px] text-slate-500">Bogotá - Chicó Norte</p>
                  </div>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-1.5 py-0.5 rounded border border-blue-200">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-bold text-slate-800">Unit 2: Rapid Response Flatbed</p>
                    <p className="text-[10px] text-slate-500">Bogotá - Calle 26</p>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                    On-Call
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Unit 3: High-Voltage Tech</p>
                    <p className="text-[10px] text-slate-500">Bogotá - Usaquén</p>
                  </div>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-1.5 py-0.5 rounded border border-blue-200">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* DATA VISUALIZATION TAB */}
      {activeAdminTab === "visualization" && (() => {
        // Dynamic calculations
        const monthlyStats = [
          { month: "Jan", revenue: 4500000, bookings: 8, cost: 1575000 },
          { month: "Feb", revenue: 5200000, bookings: 11, cost: 1820000 },
          { month: "Mar", revenue: 6100000, bookings: 14, cost: 2135000 },
          { month: "Apr", revenue: 5800000, bookings: 12, cost: 2030000 },
          { month: "May", revenue: 7200000, bookings: 16, cost: 2520000 },
          { month: "Jun", revenue: 6800000, bookings: 15, cost: 2380000 },
          { month: "Jul", revenue: 0, bookings: 0, cost: 0 },
        ];

        // Sum current state bookings into the corresponding month
        bookings.forEach(b => {
          if (!b.date) return;
          const parts = b.date.split("-");
          if (parts.length >= 2) {
            const monthNum = parseInt(parts[1], 10);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthName = monthNames[monthNum - 1] || "Jun";

            // Price estimate
            let cost = 235000;
            if (b.type.includes("Tire")) cost = 290000;
            else if (b.type.includes("Battery")) cost = 620000;
            else if (b.type.includes("Wash") || b.type.includes("Detailing")) cost = 220000;

            const existingMonth = monthlyStats.find(m => m.month === monthName);
            if (existingMonth) {
              existingMonth.revenue += cost;
              existingMonth.bookings += 1;
              existingMonth.cost += Math.floor(cost * 0.35);
            } else {
              monthlyStats.push({
                month: monthName,
                revenue: cost,
                bookings: 1,
                cost: Math.floor(cost * 0.35)
              });
            }
          }
        });

        // Filter out empty months to keep it neat
        const finalMonthlyData = monthlyStats.filter(m => m.revenue > 0 || m.month === "Jun");

        // Service metrics
        const serviceCounts: Record<string, { count: number; name: string; avgPrice: number; color: string }> = {
          "Battery Diagnostic": { count: 4, name: "Battery Diagnostic", avgPrice: 620000, color: "#3b82f6" },
          "Tire Rotation": { count: 6, name: "Tire Rotation", avgPrice: 290000, color: "#10b981" },
          "Detailing Suite": { count: 3, name: "Detailing Suite", avgPrice: 220000, color: "#6366f1" },
          "Diagnostics Scan": { count: 5, name: "Diagnostics Scan", avgPrice: 235000, color: "#f59e0b" },
        };

        bookings.forEach(b => {
          let found = false;
          Object.keys(serviceCounts).forEach(key => {
            if (b.type.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
              serviceCounts[key].count += 1;
              found = true;
            }
          });
          if (!found && b.type) {
            if (serviceCounts[b.type]) {
              serviceCounts[b.type].count += 1;
            } else {
              serviceCounts[b.type] = { count: 1, name: b.type, avgPrice: 250000, color: "#8b5cf6" };
            }
          }
        });

        const finalServiceData = Object.values(serviceCounts).map(s => ({
          name: s.name,
          "Completed Jobs": s.count,
          "Revenue (k COP)": Math.floor((s.count * s.avgPrice) / 1000),
          color: s.color
        }));

        // Distribution by status
        const statusCounts = { pending: 0, in_progress: 0, completed: 0 };
        bookings.forEach(b => {
          const s = String(b.status).toLowerCase();
          if (s.includes("pend")) statusCounts.pending += 1;
          else if (s.includes("progress")) statusCounts.in_progress += 1;
          else if (s.includes("complete")) statusCounts.completed += 1;
          else statusCounts.pending += 1;
        });

        const pieData = [
          { name: "Pending Dispatch", value: statusCounts.pending || 1, color: "#f59e0b" },
          { name: "Active In-Progress", value: statusCounts.in_progress || 2, color: "#3b82f6" },
          { name: "Completed Cases", value: statusCounts.completed || 4, color: "#10b981" },
        ];

        // Overall stats
        const overallTotalRevenue = finalMonthlyData.reduce((sum, m) => sum + m.revenue, 0);
        const overallTotalBookings = finalMonthlyData.reduce((sum, m) => sum + m.bookings, 0);
        const averageTicketSize = overallTotalBookings > 0 ? Math.floor(overallTotalRevenue / overallTotalBookings) : 340000;

        return (
          <div className="space-y-6">
            {/* Upper stats summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm border-slate-200/80 bg-white rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Accumulated Revenue</span>
                    <p className="text-2xl font-black text-slate-800">${overallTotalRevenue.toLocaleString()} COP</p>
                    <p className="text-[11px] text-emerald-600 font-bold">~${Math.floor(overallTotalRevenue / 4000).toLocaleString()} USD equivalent</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <Coins className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200/80 bg-white rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Ticket Size</span>
                    <p className="text-2xl font-black text-slate-800">${averageTicketSize.toLocaleString()} COP</p>
                    <p className="text-[11px] text-blue-600 font-bold">Per scheduled dispatch</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200/80 bg-white rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tracked Workloads</span>
                    <p className="text-2xl font-black text-slate-800">{overallTotalBookings} Registered Jobs</p>
                    <p className="text-[11px] text-indigo-600 font-bold">Active + Historic Sandbox</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Layers className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Monthly Revenue Trend */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200/80 bg-white rounded-2xl">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black text-slate-800">
                        Monthly Revenue & Operating Costs (COP)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Shows dynamic billing volumes against the baseline. Area represents total income, line is operating overhead.
                      </CardDescription>
                    </div>
                    <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold uppercase px-2 py-1 rounded border border-blue-200">
                      LIVE STREAM
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={finalMonthlyData}
                        margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#94a3b8" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`$${value.toLocaleString()} COP`]}
                          contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Gross Billing Revenue" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cost" 
                          name="Operating Overhead" 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          strokeDasharray="4 4"
                          fillOpacity={1} 
                          fill="url(#colorCost)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 3: Active Booking Status Distribution */}
              <Card className="shadow-sm border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-base font-black text-slate-800">
                    Dispatch Workload Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current task status breakdown across mobile diagnostic teams in Bogotá.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col items-center justify-center">
                  <div className="w-full h-56 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} bookings`]}
                          contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Absolute label in middle of donut */}
                    <div className="absolute text-center">
                      <p className="text-2xl font-black text-slate-800">{bookings.length}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Active</p>
                    </div>
                  </div>

                  {/* Custom legend with percentages */}
                  <div className="w-full space-y-2 mt-4">
                    {pieData.map((d, i) => {
                      const totalVal = pieData.reduce((s, item) => s + item.value, 0);
                      const percent = totalVal > 0 ? ((d.value / totalVal) * 100).toFixed(0) : "0";
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="font-semibold text-slate-600">{d.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">{d.value} ({percent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2: Service Usage Trends */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200/80 bg-white rounded-2xl">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black text-slate-800">
                        Service Frequency & Revenue Capture
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Comparing the quantity of completed services against the revenue volume they generate.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={finalServiceData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#94a3b8" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: 'Jobs Booked', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: '10px', fontWeight: 'bold' } }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#94a3b8" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}K`}
                          label={{ value: 'Revenue (k COP)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748b', fontSize: '10px', fontWeight: 'bold' } }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                        <Bar yAxisId="left" dataKey="Completed Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        <Bar yAxisId="right" dataKey="Revenue (k COP)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar Playful What-If Calculator (Study & Learn!) */}
              <Card className="shadow-sm border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                    <CardTitle className="text-base font-black text-slate-800">
                      What-If Operations Simulator
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Calculate dynamic margin adjustments or simulate adding new electric vehicles to observe immediate billing impacts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4 flex-1">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        Hypothetical Premium Fee Multiplier
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="1.0" 
                          max="2.5" 
                          step="0.1" 
                          defaultValue="1.5" 
                          id="hypothetical-multiplier"
                          className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const element = document.getElementById("multiplier-value-display");
                            if (element) {
                              element.innerText = `${val}x rate`;
                            }
                            const revenueDisplay = document.getElementById("projected-boost-display");
                            if (revenueDisplay) {
                              const boosted = Math.floor(overallTotalRevenue * (val / 1.5));
                              revenueDisplay.innerText = `$${boosted.toLocaleString()} COP`;
                            }
                          }}
                        />
                        <span id="multiplier-value-display" className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded shrink-0">1.5x rate</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        Projected Scaled Yield
                      </label>
                      <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1 border border-slate-800">
                        <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-wider">Simulation Output</span>
                        <div id="projected-boost-display" className="text-lg font-black text-white font-mono">
                          ${overallTotalRevenue.toLocaleString()} COP
                        </div>
                        <p className="text-[10px] text-slate-400">Calculated across existing {bookings.length} system dispatches.</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-900 space-y-1.5">
                      <h4 className="text-[11px] font-extrabold flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Operational Training Lesson
                      </h4>
                      <p className="text-[10px] leading-relaxed text-slate-600">
                        Electric vehicles carry a <strong>1.4x - 1.6x average rate index modifier</strong> due to advanced auxiliary calibration sequences. Transitioning a fleet to 100% EV dispatches raises the median ticket size by 42%.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        );
      })()}

      {/* 2. FRONT DESK AI ASSISTANT CAPABILITIES */}
      {activeAdminTab === "ai-frontdesk" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main AI Operator Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  VIP AI Receptionist Console
                </CardTitle>
                <CardDescription className="text-xs">
                  Automate incoming customer checks, schedule dispatches, and draft diagnostic summary memos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                {/* Simulated prompt form */}
                <form onSubmit={handleAskFrontDeskAI} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ask AI Assistant / Generate Dispatch Instructions
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="e.g., 'Draft pre-dispatch email for Jasmel' or 'Analyze 12V failure guidelines'..."
                        className="h-11 rounded-xl text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-500"
                      />
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                        disabled={isAiLoading}
                      >
                        {isAiLoading ? "Analyzing..." : "Execute"}
                      </Button>
                    </div>
                  </div>
                </form>

                {/* AI response card */}
                {aiResponseText ? (
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-3 font-mono text-xs relative">
                    <div className="flex justify-between text-[9px] uppercase tracking-wider text-blue-400 font-extrabold border-b border-slate-800 pb-2">
                      <span>Generated response</span>
                      <button onClick={() => setAiResponseText("")} className="text-slate-400 hover:text-white">Clear</button>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line text-slate-200">{aiResponseText}</p>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px] font-bold text-slate-200 border-slate-700 hover:bg-slate-800"
                        onClick={() => {
                          navigator.clipboard.writeText(aiResponseText);
                          alert("Response copied to dashboard clipboard!");
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy Text
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px] font-bold text-blue-400 border-blue-900 bg-blue-950/20 hover:bg-blue-950/50"
                        onClick={() => {
                          setTwilioSmsTemplate(aiResponseText.substring(0, 160));
                          alert("Transferred template to Twilio text console!");
                          setActiveAdminTab("twilio");
                        }}
                      >
                        <Smartphone className="w-3 h-3 mr-1" /> Use as Twilio SMS
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 border border-dashed rounded-xl text-center text-slate-400 space-y-2 bg-slate-50/50">
                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                    <p className="text-xs font-bold text-slate-500">AI Assistant Idle</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Submit operational requests or use quick templates to generate diagnostic summaries instantly.
                    </p>
                  </div>
                )}

                {/* Quick AI Action Buttons */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Templates:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-9 text-[10px] font-bold text-slate-700 border-slate-200 hover:bg-slate-50/50"
                      onClick={() => {
                        setPromptInput("Draft a friendly service completion notification for Jasmel's Model 3.");
                      }}
                    >
                      ✉️ Completion Alert
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-9 text-[10px] font-bold text-slate-700 border-slate-200 hover:bg-slate-50/50"
                      onClick={() => {
                        setPromptInput("Explain the high-voltage battery insulation guidelines for model analysis.");
                      }}
                    >
                      🔋 Insulation Guide
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-9 text-[10px] font-bold text-slate-700 border-slate-200 hover:bg-slate-50/50"
                      onClick={() => {
                        setPromptInput("Generate automated roadside SMS text for towing lockout.");
                      }}
                    >
                      💬 Roadside SMS
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-9 text-[10px] font-bold text-slate-700 border-slate-200 hover:bg-slate-50/50"
                      onClick={() => {
                        setPromptInput("Create standard training questionnaire regarding tire replacement safety.");
                      }}
                    >
                      📝 Training Questionnaire
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Smart Emergency Roadside Call Transcriber */}
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-red-500 animate-bounce" />
                  Roadside Call Transcriber & Dispatcher
                </CardTitle>
                <CardDescription className="text-xs">
                  Simulate receiving a live phone call from an stranded EV driver. The system automatically transcribes the audio, extracts vehicle details, and queues the job.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-slate-700">Simulate Stranded Customer Phone Call</p>
                    <p className="text-[11px] text-slate-400">Trigger simulated audio transcript of road incident</p>
                  </div>
                  <Button
                    type="button"
                    className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-extrabold text-xs h-10 px-4 rounded-xl shrink-0 cursor-pointer"
                    onClick={triggerSimulateCallTranscript}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? "Transcribing Call..." : "📞 Receive Simulated Roadside Call"}
                  </Button>
                </div>

                {transcriptionResult && (
                  <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-red-800">
                      <span>Transcribed via AI Front Desk</span>
                      <span className="text-slate-400">Ready for dispatch</span>
                    </div>
                    <p className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-white p-3 border rounded-lg">
                      {transcriptionResult}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-8 text-[11px] px-3.5 rounded-lg cursor-pointer"
                        onClick={handleApproveCallTranscriptDispatch}
                      >
                        ✅ Approve Dispatch & Book Mobile Unit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-700"
                        onClick={() => setTranscriptionResult(null)}
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Info Sidebar */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Operator Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed text-slate-600">
                <p>
                  As an administrative operator, you represent the elite standard of automotive recovery. Always cross-reference high-voltage incidents against the <strong>ISO-6469-3 Safety Standard</strong>.
                </p>
                <div className="bg-slate-50 border rounded-xl p-3 space-y-1.5">
                  <p className="font-bold text-slate-800 text-[11px]">Primary Dispatch Sequence:</p>
                  <ul className="list-decimal pl-4 text-[10px] space-y-1 text-slate-500">
                    <li>Analyze cell fatigue via OBD telemetry.</li>
                    <li>Verify mobile tool inventory in Unit 1.</li>
                    <li>Broadcast Twilio dispatch alert coordinates.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 3. TWILIO SMS & AUTOMATED CALL GATEWAY */}
      {activeAdminTab === "twilio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Twilio Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black text-slate-800">
                        Twilio Interactive Sandbox
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configure outbound mobile SMS messages, simulate automated dispatcher calls, and verify transmission statuses.
                      </CardDescription>
                    </div>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded border border-red-200 font-mono">
                    API ON
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Outbound Phone Number
                    </label>
                    <Input
                      value={twilioPhoneNumber}
                      onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="h-11 rounded-xl text-xs sm:text-sm border-slate-200 font-bold font-mono focus-visible:ring-red-500"
                    />
                  </div>

                  {/* Dispatch target selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      Select Dispatch Unit Reference
                    </label>
                    <select
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-bold focus:outline-none cursor-pointer"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "unit1") {
                          setTwilioSmsTemplate("MACALOCATOR Alert: Mobile Workshop Unit 1 is en route to Carrera 11 for your Tire Rotation. Track live: https://macalocator.co/t/t1");
                        } else if (val === "unit3") {
                          setTwilioSmsTemplate("MACALOCATOR Alert: High-Voltage Specialist Unit 3 is now on-site at Usaquén for active Battery Diagnostics. OEM parts certified.");
                        } else {
                          setTwilioSmsTemplate("MACALOCATOR Custom Alert: General dispatch coordination updated. All systems operational.");
                        }
                      }}
                    >
                      <option value="unit1">Unit 1 - Mobile Workshop (Tires)</option>
                      <option value="unit3">Unit 3 - High-Voltage Specialist (Battery)</option>
                      <option value="general">General Dispatch Notification</option>
                    </select>
                  </div>
                </div>

                {/* SMS Template */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Alert Payload Template</label>
                    <span className="text-[10px] font-mono text-slate-400">{twilioSmsTemplate.length} / 160 chars</span>
                  </div>
                  <textarea
                    value={twilioSmsTemplate}
                    onChange={(e) => setTwilioSmsTemplate(e.target.value)}
                    rows={3}
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
                  />
                </div>

                {/* Dispatch Trigger Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleSendTwilioSms}
                    disabled={isSendingSms || !twilioPhoneNumber.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold h-11 text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    {isSendingSms ? "Transmitting SMS Payload..." : "Send Twilio Dispatch SMS"}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleTriggerTwilioCall}
                    disabled={isCalling || !twilioPhoneNumber.trim()}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-extrabold h-11 text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {isCalling ? "Initiating outbound Voice Call..." : "Trigger Automated Voice Dispatch"}
                  </Button>
                </div>

                {/* Voice Call playback simulator */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-700">Simulate Outbound Voice Warning Call</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">TTS Audio engine</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed italic">
                    "This is an automated priority coordination warning from MACALOCATOR. Our certified Mobile Recovery Unit has been dispatched to your coordinates in Bogotá. Please ensure safe vehicle access."
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-[10px] font-bold text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
                    onClick={() => {
                      setIsPlayingCallAudio(true);
                      const speech = new SpeechSynthesisUtterance("This is an automated priority coordination warning from MACALOCATOR. Our certified Mobile Recovery Unit has been dispatched to your coordinates in Bogotá. Please ensure safe vehicle access.");
                      speech.onend = () => setIsPlayingCallAudio(false);
                      window.speechSynthesis.speak(speech);
                    }}
                    disabled={isPlayingCallAudio}
                  >
                    {isPlayingCallAudio ? "🔊 Playing voice track..." : "🔊 Test Automated Call Text-to-Speech"}
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Twilio SMS Logs Terminal */}
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  Live Twilio API transmission log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="font-mono text-[10px] text-red-400 bg-slate-950 p-4 h-52 overflow-y-auto space-y-2 leading-tight select-text">
                  <p className="text-slate-500">[System Log] Webhook connected to outbound twilio-rest api gateway.</p>
                  {twilioLogs.map((log) => (
                    <div key={log.id} className="border-b border-slate-900/40 pb-1.5">
                      <p className="flex justify-between items-center">
                        <span className="text-white font-bold">
                          {log.type === "sms" ? "✉️ Outbound SMS" : "📞 Voice Call"}
                        </span>
                        <span className="text-slate-500">{log.timestamp}</span>
                      </p>
                      <p className="text-slate-400">To: {log.to}</p>
                      <p className="text-emerald-400">Payload: "{log.text}"</p>
                      <p className="flex justify-between text-[9px] text-blue-400">
                        <span>API Path: POST /api/v1/twilio/{log.type}</span>
                        <span className="text-emerald-500 font-extrabold">{log.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Twilio Analytics Info */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Outbound Deliverability Index
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between items-center text-[11px] font-bold border-b pb-1">
                  <span>Delivered successfully</span>
                  <span className="text-emerald-600 font-extrabold">100%</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold border-b pb-1">
                  <span>Outbound SMS cost</span>
                  <span>$0.0075 USD / SMS</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-2">
                  Twilio messaging uses certified route codes inside Colombia to ensure immediate dispatch alert delivery to customers like <strong>Jasmel Acosta</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. STAFF & CLIENT INTERCOM HUB */}
      {activeAdminTab === "comms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Messaging Hub */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col h-[520px]">
              
              {/* Channel Selector Header */}
              <div className="bg-slate-50 border-b p-3 flex items-center justify-between">
                <div className="flex bg-slate-200/80 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setActiveChatChannel("staff")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeChatChannel === "staff" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    👷 Dispatch Internal (#staff-dispatch)
                  </button>
                  <button
                    onClick={() => setActiveChatChannel("client")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeChatChannel === "client" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    💬 Direct Client Channel
                  </button>
                </div>

                <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold uppercase px-2 py-0.5 rounded border border-blue-200">
                  Live Dispatch
                </span>
              </div>

              {/* Chat Thread Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {activeChatChannel === "staff" ? (
                  staffMessages.map((msg) => {
                    const isMe = msg.sender.includes("You");
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wide">
                          <span>{msg.sender}</span>
                          <span>•</span>
                          <span>{msg.time}</span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs font-semibold ${
                          isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none shadow-sm"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  clientMessages.map((msg) => {
                    const isMe = msg.sender.includes("You") || msg.sender.includes("AI");
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wide">
                          <span>{msg.sender}</span>
                          <span>•</span>
                          <span>{msg.time}</span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs font-semibold ${
                          isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none shadow-sm"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Send Input */}
              <div className="p-3 bg-white border-t flex gap-2">
                <Input
                  value={chatMessageInput}
                  onChange={(e) => setChatMessageInput(e.target.value)}
                  placeholder={activeChatChannel === "staff" ? "Instruct Unit 1 or Unit 3 dispatch staff..." : "Draft message to client..."}
                  className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatMessage();
                  }}
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl px-4 text-xs uppercase tracking-wider cursor-pointer h-10"
                  onClick={handleSendChatMessage}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

            </Card>
          </div>

          {/* Saved Chat History & Consultation Analytics */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-400" />
                  Saved Diagnostic Consultations
                </CardTitle>
                <CardDescription className="text-xs">
                  Review historical support dialogues.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {mockPastAIConversations.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedPastChat(chat)}
                    className="p-3 border rounded-xl hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-xs">{chat.client}</span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">{chat.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-1">Car: {chat.vehicle}</p>
                    <p className="text-[10px] text-slate-600 italic line-clamp-2 leading-relaxed">"{chat.problem}"</p>
                  </div>
                ))}

                {selectedPastChat && (
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1.5 font-mono text-[10px] leading-relaxed">
                    <div className="flex justify-between items-center text-[9px] text-blue-400 border-b border-slate-800 pb-1 uppercase font-bold">
                      <span>Chat Record {selectedPastChat.id}</span>
                      <button onClick={() => setSelectedPastChat(null)} className="text-slate-400 hover:text-white">Close</button>
                    </div>
                    <p><strong className="text-slate-400">Client:</strong> {selectedPastChat.client}</p>
                    <p><strong className="text-slate-400">Incident:</strong> {selectedPastChat.problem}</p>
                    <p><strong className="text-emerald-400">Resolution Memo:</strong> {selectedPastChat.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}
