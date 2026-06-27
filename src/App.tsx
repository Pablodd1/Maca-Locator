/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router";
import { AppProvider } from "./context/AppContext";
import { Dashboard } from "./components/Dashboard";
import { EmergencyView } from "./components/EmergencyView";
import { ChatView } from "./components/ChatView";
import { BookingView } from "./components/BookingView";
import { UserProfile } from "./components/UserProfile";
import { ImageGeneratorView } from "./components/ImageGeneratorView";
import { AdminView } from "./components/AdminView";
import { CarFront, AlertCircle, CalendarDays, MessageSquare, Home, ImageIcon, User, ShieldCheck } from "lucide-react";
import { MacalocatorLogo } from "./components/MacalocatorLogo";
import { VoiceController } from "./components/VoiceController";

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white border-r border-slate-200 text-slate-700 w-64 hidden md:flex flex-col h-screen fixed left-0 top-0 pt-6">
      <div className="px-6 mb-8 flex items-center font-semibold">
        <MacalocatorLogo size="md" />
      </div>
      
      <div className="flex-1 px-4 space-y-1">
        <Link to="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <Link to="/booking" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/booking' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          <CalendarDays className="w-4 h-4" />
          Book Service
        </Link>
        <Link to="/chat" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/chat' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          <MessageSquare className="w-4 h-4" />
          Service Support
        </Link>
        <Link to="/profile" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/profile' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          <User className="w-4 h-4" />
          Profile & Vehicles
        </Link>
        <Link to="/marketing" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/marketing' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          <ImageIcon className="w-4 h-4" />
          Marketing Assets
        </Link>
        <Link to="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === '/admin' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          <ShieldCheck className="w-4 h-4" />
          Admin & Front Desk
        </Link>
      </div>

      <div className="px-4 pb-6 mt-auto">
        <Link to="/emergency" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold shadow-sm">
          <AlertCircle className="w-4 h-4" />
          Emergency Help
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 md:pl-64 flex flex-col">
          {/* Mobile Header */}
          <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-10 md:hidden text-slate-800">
            <div className="flex items-center flex-1">
              <MacalocatorLogo size="sm" />
            </div>
            <Link to="/emergency" className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <AlertCircle className="w-3.5 h-3.5" /> Help
            </Link>
          </header>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex justify-around items-center z-10 px-2">
            <Link to="/" className="flex flex-col items-center text-slate-500 hover:text-blue-600">
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </Link>
            <Link to="/booking" className="flex flex-col items-center text-slate-500 hover:text-blue-600">
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Book</span>
            </Link>
            <Link to="/chat" className="flex flex-col items-center text-slate-500 hover:text-blue-600">
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Chat</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center text-slate-500 hover:text-blue-600">
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Profile</span>
            </Link>
            <Link to="/admin" className="flex flex-col items-center text-slate-500 hover:text-blue-600">
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
      </BrowserRouter>
    </AppProvider>
  );
}
