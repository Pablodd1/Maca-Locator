import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, VolumeX, HelpCircle, Navigation, Sparkles, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VoiceController() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("Ready for your voice command.");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        setTranscript("Listening...");
        speak("I am listening for your destination.");
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setVoiceFeedback("Microphone access blocked. Please allow permissions.");
        } else {
          setVoiceFeedback("Could not recognize. Please try again.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript.toLowerCase();
        setTranscript(resultText);
        handleVoiceCommand(resultText);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const speak = (text: string) => {
    if (!soundEnabled) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      
      // Try to find a premium female/male natural sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const executiveVoice = voices.find(
        (v) =>
          v.name.includes("Google US English") ||
          v.name.includes("Premium") ||
          v.name.includes("Natural")
      );
      if (executiveVoice) utterance.voice = executiveVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (cmd: string) => {
    let handled = false;
    
    if (cmd.includes("home") || cmd.includes("dashboard") || cmd.includes("main")) {
      navigate("/");
      setVoiceFeedback("Navigating you to your Home Dashboard.");
      speak("Welcome back to your MACALOCATOR VIP Dashboard.");
      handled = true;
    } else if (cmd.includes("book") || cmd.includes("schedule") || cmd.includes("reserve") || cmd.includes("service")) {
      navigate("/booking");
      setVoiceFeedback("Opening premium booking scheduler.");
      speak("Opening our white glove service scheduler. We will dispatch our expert technician to your exact address.");
      handled = true;
    } else if (cmd.includes("chat") || cmd.includes("support") || cmd.includes("assistant") || cmd.includes("help desk")) {
      navigate("/chat");
      setVoiceFeedback("Navigating to executive support.");
      speak("Connecting you to our VIP Auto Support Desk.");
      handled = true;
    } else if (cmd.includes("profile") || cmd.includes("car") || cmd.includes("vehicle") || cmd.includes("garage")) {
      navigate("/profile");
      setVoiceFeedback("Opening your premium vehicle garage.");
      speak("Here are your registered VIP vehicles and maintenance logs.");
      handled = true;
    } else if (cmd.includes("marketing") || cmd.includes("asset") || cmd.includes("flyer")) {
      navigate("/marketing");
      setVoiceFeedback("Opening marketing assets engine.");
      speak("Opening our generative marketing assets studio.");
      handled = true;
    } else if (cmd.includes("emergency") || cmd.includes("help") || cmd.includes("sos") || cmd.includes("accident")) {
      navigate("/emergency");
      setVoiceFeedback("🚨 Emergency SOS mode activated!");
      speak("Warning: Emergency mode activated. Dispatching priority immediate response team to your GPS location.");
      handled = true;
    }

    if (!handled) {
      setVoiceFeedback(`Command "${cmd}" not recognized. Say: "Go Home", "Book Service", "Support Desk", or "Emergency".`);
      speak("Command not matched. You can say: Go Home, Book Service, Support Desk, or Emergency.");
    }
  };

  const toggleListening = () => {
    if (!speechSupported) {
      speak("Voice commands are not supported or initialized on this device.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 md:p-5 shadow-xl border border-blue-900/40 relative overflow-hidden">
      {/* Premium Decorative VIP Background Lines */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-blue-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
              White-Glove Doorstep Service
            </span>
            <span className="text-xs text-slate-400">|</span>
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold">
              <Sparkles className="w-3 h-3" /> VIP Executive Assistant
            </div>
          </div>
          
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
            MACALOCATOR At-Your-Door Voice Control
          </h2>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            At MACALOCATOR, we provide <span className="text-blue-300 font-semibold">100% door-to-door, at-home, or at-work services</span>. Our expert mechanics travel straight to you with premium tools. Command this system with your voice!
          </p>
        </div>

        {/* Voice control layout */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Helper feedback screen */}
          <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-xl px-3 py-2 text-left min-w-[200px] max-w-[280px]">
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Assistant Feedback</p>
            <p className="text-xs font-semibold text-slate-200 truncate">{voiceFeedback}</p>
            {transcript && (
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate">
                ❝ {transcript} ❞
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Help Button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
              onClick={() => setShowHelp(!showHelp)}
              title="Show Voice Commands Help"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>

            {/* Sound Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`w-10 h-10 rounded-full border border-slate-800 bg-slate-900/60 hover:bg-slate-800 ${soundEnabled ? "text-blue-400" : "text-slate-500"}`}
              onClick={() => {
                const newSound = !soundEnabled;
                setSoundEnabled(newSound);
                if (newSound) {
                  // Wait briefly and read out confirmation
                  setTimeout(() => speak("VIP voice assistance sound enabled."), 100);
                }
              }}
              title={soundEnabled ? "Mute Voice Responses" : "Unmute Voice Responses"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>

            {/* Micro / Speech Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all duration-300 ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/20"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/15"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-emerald-300" />
                  <span>Speak to Concierge</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-slate-800/80 overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <p className="font-bold text-blue-400">"Go Home"</p>
                <p className="text-[10px] text-slate-400">Navigates to primary overview dashboard</p>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <p className="font-bold text-blue-400">"Book Service"</p>
                <p className="text-[10px] text-slate-400">Dispatch repair mechanics straight to you</p>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <p className="font-bold text-blue-400">"Support Desk"</p>
                <p className="text-[10px] text-slate-400">Text & Voice AI vehicle diagnostics</p>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <p className="font-bold text-blue-400">"Garage Profile"</p>
                <p className="text-[10px] text-slate-400">Manage cars & Google Workspace sync</p>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <p className="font-bold text-blue-400">"Marketing Studio"</p>
                <p className="text-[10px] text-slate-400">Generate creative vehicle assets</p>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-red-900/60 bg-red-950/10">
                <p className="font-bold text-red-400">"Emergency SOS"</p>
                <p className="text-[10px] text-slate-400">Triggers roadside dispatcher broadcast</p>
              </div>
            </div>

            <div className="mt-3 text-[11px] bg-blue-500/10 text-blue-300 p-2.5 rounded-lg border border-blue-500/20 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>VIP Dispatch Model:</strong> Unlike regular garages, MACALOCATOR operates in reverse. Whether you book via speech command, calendar scheduling, or SOS, our team loads professional diagnostic kits and drives directly to your designated villa, garage, or office in Colombia.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
