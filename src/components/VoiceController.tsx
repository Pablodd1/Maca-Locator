import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, VolumeX, HelpCircle, Navigation, Sparkles, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakHuman } from "@/lib/voice";

export function VoiceController() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("Ready when you are — English or Spanish.");
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
      // es-US understands English well AND native Spanish — the best single
      // setting for Miami's bilingual clientele.
      rec.lang = "es-US";
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setTranscript("Listening...");
        speak("Go ahead, I'm listening.", "Estoy lista, dígame.");
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setVoiceFeedback("Microphone blocked — please allow access.");
        } else {
          setVoiceFeedback("Sorry, I didn't catch that. Try again?");
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

  const speak = (en: string, es?: string) => {
    if (!soundEnabled) return;
    speakHuman(es ?? en, es ? "es" : "en");
  };

  const hasAny = (cmd: string, words: string[]) => words.some((w) => cmd.includes(w));

  const handleVoiceCommand = (cmd: string) => {
    let handled = false;

    if (hasAny(cmd, ["home", "dashboard", "casa", "inicio", "principal"])) {
      navigate("/");
      setVoiceFeedback("Taking you home.");
      speak("Welcome back to your dashboard.", "Bienvenido de nuevo a su panel.");
      handled = true;
    } else if (hasAny(cmd, ["book", "schedule", "reserve", "service", "reserv", "cita", "agenda", "servicio"])) {
      navigate("/booking");
      setVoiceFeedback("Opening the scheduler.");
      speak("Let's get you booked. Our technician will come straight to you.", "Con gusto. Nuestro técnico irá directamente hasta usted.");
      handled = true;
    } else if (hasAny(cmd, ["chat", "support", "assistant", "help desk", "soporte", "ayuda", "asistente", "conversa"])) {
      navigate("/chat");
      setVoiceFeedback("Connecting you to the concierge.");
      speak("Connecting you with our concierge team.", "Le conecto con nuestro conserje.");
      handled = true;
    } else if (hasAny(cmd, ["profile", "car", "vehicle", "garage", "perfil", "carro", "vehiculo", "garaje"])) {
      navigate("/profile");
      setVoiceFeedback("Here are your vehicles.");
      speak("Here are your vehicles and their service history.", "Aquí están sus vehículos y su historial.");
      handled = true;
    } else if (hasAny(cmd, ["marketing", "asset", "flyer", "mercado", "publicidad"])) {
      navigate("/marketing");
      setVoiceFeedback("Opening the creative studio.");
      speak("Opening the marketing studio.", "Abriendo el estudio de marketing.");
      handled = true;
    } else if (hasAny(cmd, ["emergency", "sos", "accident", "emergencia", "auxilio", "accidente"])) {
      navigate("/emergency");
      setVoiceFeedback("🚨 Emergency mode — help is on the way.");
      speak("Emergency mode is on. We're getting a response team to your location right now.", "Modo de emergencia activado. Ya vamos en camino a su ubicación.");
      handled = true;
    }

    if (!handled) {
      setVoiceFeedback(`I didn't quite get that. Try: "Book Service" · "Reservar" · "Emergency"`);
      speak(
        "Sorry, I didn't catch that. You can say book service, support, or emergency.",
        "No le entendí. Puede decir reservar, soporte, o emergencia."
      );
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
            At MACALOCATOR, we provide <span className="text-blue-300 font-semibold">100% door-to-door, at-home, or at-work services</span> across Miami & Miami Beach. Our expert mechanics travel straight to you with premium tools. Command this system with your voice — English or Spanish!
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
                <strong>Habla Español / English / Kreyòl:</strong> Voice commands work in English and Spanish — say "Book Service" or "Reservar cita". The concierge chat answers in all three languages of our Miami & Miami Beach clientele.
                <br /><br />
                <strong>VIP Dispatch Model:</strong> Unlike regular garages, MACALOCATOR operates in reverse. Whether you book via speech command, calendar scheduling, or SOS, our team loads professional diagnostic kits and drives directly to your penthouse, villa, yacht dock, or office in Miami & Miami Beach.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
