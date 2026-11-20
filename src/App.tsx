/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { AppProvider } from "./context/AppContext";
import { OpsProvider } from "./context/OpsContext";
import { Dashboard } from "./components/Dashboard";
import { EmergencyView } from "./components/EmergencyView";
import { ChatView } from "./components/ChatView";
import { BookingView } from "./components/BookingView";
import { UserProfile } from "./components/UserProfile";
import { ImageGeneratorView } from "./components/ImageGeneratorView";
import { AdminView } from "./components/AdminView";
import { PersonaGate } from "./components/PersonaGate";
import { AlertCircle, CalendarDays, MessageSquare, Home, User, ShieldCheck, Repeat } from "lucide-react";
import { MacalocatorLogo } from "./components/MacalocatorLogo";
import { VoiceController } from "./components/VoiceController";

// Switch demo profile — always one click away
function SwitchProfileButton({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={() => {
        localStorage.removeItem("maca_persona");
        localStorage.removeItem("maca_persona_dest");
        window.location.href = "/";
      }}
      className={`flex items-center gap-1.5 ${className}`}
      title="Switch demo profile"
    >
      <Repeat className="w-3.5 h-3.5" />
      Switch Profile
    </button>
  );
}

function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-[#27362C] border-r border-[#4A5548] text-[#DCD8CC] w-64 hidden md:flex flex-col h-screen fixed left-0 top-0 pt-6">
      <div className="px-6 mb-8 flex items-center font-semibold">
        <MacalocatorLogo size="md" />
      </div>

      <div className="flex-1 px-4 space-y-1">
        <Link to="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/' ? 'bg-[#2E3A31] text-[#C5A06C] font-semibold' : 'text-[#C5CBBF] hover:bg-[#22302A] hover:text-[#EFE9DC]'}`}>
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <Link to="/booking" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/booking' ? 'bg-[#2E3A31] text-[#C5A06C] font-semibold' : 'text-[#C5CBBF] hover:bg-[#22302A] hover:text-[#EFE9DC]'}`}>
          <CalendarDays className="w-4 h-4" />
          Book Service
        </Link>
        <Link to="/chat" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/chat' ? 'bg-[#2E3A31] text-[#C5A06C] font-semibold' : 'text-[#C5CBBF] hover:bg-[#22302A] hover:text-[#EFE9DC]'}`}>
          <MessageSquare className="w-4 h-4" />
          Service Support
        </Link>
        <Link to="/profile" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/profile' ? 'bg-[#2E3A31] text-[#C5A06C] font-semibold' : 'text-[#C5CBBF] hover:bg-[#22302A] hover:text-[#EFE9DC]'}`}>
          <User className="w-4 h-4" />
          Profile & Vehicles
        </Link>
        <Link to="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/admin' ? 'bg-[#2E3A31] text-[#C5A06C] font-semibold' : 'text-[#C5CBBF] hover:bg-[#22302A] hover:text-[#EFE9DC]'}`}>
          <ShieldCheck className="w-4 h-4" />
          Admin & Front Desk
        </Link>
      </div>

      <div className="px-4 pb-6 mt-auto space-y-2">
        <SwitchProfileButton className="w-full justify-center px-4 py-2 rounded-lg border border-[#4A5548] text-[#B8C0B4] hover:text-[#EFE9DC] hover:bg-[#22302A] transition-colors text-xs font-semibold" />
        <Link to="/emergency" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C96A5B] text-white hover:bg-[#D57F70] transition-colors text-sm font-semibold shadow-sm">
          <AlertCircle className="w-4 h-4" />
          Emergency Help
        </Link>
      </div>
    </nav>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState<string | null>(() => localStorage.getItem("maca_persona"));

  // Persona chosen as admin lands straight in Mission Control
  useEffect(() => {
    const dest = localStorage.getItem("maca_persona_dest");
    if (dest) {
      localStorage.removeItem("maca_persona_dest");
      navigate(dest);
    }
  }, [navigate]);

  // Welcome gate until a demo profile is chosen (skip buttons per persona)
  if (!persona) {
    return <PersonaGate onChosen={() => setPersona(localStorage.getItem("maca_persona"))} />;
  }

  return (
    <div className="min-h-screen bg-[#22302A] md:pl-64 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-[#27362C] border-b border-[#4A5548] h-16 flex items-center px-6 sticky top-0 z-10 md:hidden text-[#EFE9DC]">
        <div className="flex items-center flex-1">
          <MacalocatorLogo size="sm" />
        </div>
        <SwitchProfileButton className="mr-3 px-2.5 py-1.5 rounded-md border border-[#4A5548] text-[#B8C0B4] hover:text-[#EFE9DC] text-[11px] font-semibold" />
        <Link to="/emergency" className="bg-[#C96A5B] text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <AlertCircle className="w-3.5 h-3.5" /> Help
        </Link>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#27362C] border-t border-[#4A5548] h-16 flex justify-around items-center z-10 px-2">
        <Link to="/" className="flex flex-col items-center text-[#B8C0B4] hover:text-[#C5A06C]">
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </Link>
        <Link to="/booking" className="flex flex-col items-center text-[#B8C0B4] hover:text-[#C5A06C]">
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Book</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center text-[#B8C0B4] hover:text-[#C5A06C]">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Chat</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center text-[#B8C0B4] hover:text-[#C5A06C]">
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Profile</span>
        </Link>
        <Link to="/admin" className="flex flex-col items-center text-[#B8C0B4] hover:text-[#C5A06C]">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Admin</span>
        </Link>
      </div>

      <Navigation />

      {/* Main Container, adjust padding bottom for mobile bottom nav bar */}
      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">
        <div className="mb-6">
          <VoiceController />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/emergency" element={<EmergencyView />} />
          <Route path="/chat" element={<ChatView />} />
          <Route path="/booking" element={<BookingView />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/marketing" element={<ImageGeneratorView />} />
          <Route path="/admin" element={<AdminView />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <OpsProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </OpsProvider>
    </AppProvider>
  );
}
