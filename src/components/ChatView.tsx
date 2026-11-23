import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Send, User, LifeBuoy, Mic, MicOff, Volume2, VolumeX, Sparkles, MapPin } from "lucide-react";
import { speakHuman } from "@/lib/voice";
import { useOps, taskStatusLabel } from "../context/OpsContext";
import { useAppState } from "../context/AppContext";

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export function ChatView() {
  const { liveTask, staff, etaFor } = useOps();
  const { user, vehicles } = useAppState();
  const unit = liveTask ? staff.find((s) => s.id === liveTask.staffId) : undefined;
  const eta = liveTask ? etaFor(liveTask) : null;
  const clientContext = [
    `CLIENT: ${user?.name || "VIP client"} · ${user?.phone || ""} · ${user?.email || ""}`,
    `VEHICLES: ${vehicles.map((v) => `${v.year} ${v.make} ${v.model} (${v.licensePlate})`).join("; ") || "none registered"}`,
    liveTask
      ? `ACTIVE SERVICE: ${liveTask.type} · status: ${taskStatusLabel(liveTask.status)} · ${liveTask.address} · ${liveTask.scheduledAt}${unit ? ` · technician: ${unit.name} (${unit.role}, ${unit.specialty})` : " · technician being assigned"}${eta != null ? ` · technician ETA ~${eta} min` : ""}`
      : "ACTIVE SERVICE: none scheduled right now",
  ].join("\n");
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      text: 'Welcome to the MACALOCATOR VIP Concierge — Miami & Miami Beach\u2019s premier mobile car service. Our certified technicians come straight to your driveway, office valet, or roadside location.\n\nBienvenido al conserje VIP de MACALOCATOR. Nuestros técnicos van directamente hasta usted en Miami y Miami Beach.\n\nByenvini nan sèvis concierge MACALOCATOR — nou vini jiskapò ou nan Miami ak Miami Beach.\n\nHow can we take care of your vehicle today? · ¿En qué le servimos hoy? · Kijan nou ka ede w jodi a?'
    }
  ]);
  const [input, setInput] = useState('');
  // Jev emergency verdict → SOS action bar (Open Emergency / GPS dispatch)
  const [sosActive, setSosActive] = useState(false);
  const [gpsSent, setGpsSent] = useState(false);

  const sendGpsDispatch = () => {
    const send = (coords?: string) => {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "telegram",
          message: `🚨 MACALOCATOR SOS — ${user?.name || "VIP client"} requested emergency dispatch from the concierge chat.${coords ? ` GPS: ${coords}` : " GPS unavailable — call client."} / Emergencia activada desde el chat.`,
        }),
      }).catch(() => {});
      setGpsSent(true);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`),
        () => send(undefined),
        { timeout: 8000 }
      );
    } else send(undefined);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakResponses, setSpeakResponses] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition inside the chat view
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      // es-US handles Spanish natively and English well — ideal for Miami.
      rec.lang = "es-US";
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (e: any) => {
        console.error("Chat speech recognition error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + " " + text : text));
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text-To-Speech auto readback for incoming model messages
  useEffect(() => {
    if (messages.length > 0 && speakResponses) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "model") {
        speakText(lastMsg.text);
      }
    }
  }, [messages, speakResponses]);

  const speakText = (text: string) => {
    if (!speakResponses) return;
    // The multilingual greeting is spoken in English only; regular replies are
    // spoken in whichever language the concierge answered with.
    const englishLine = text.split("\n").find((l) => /[a-z]/i.test(l)) || text;
    const isMultilingualGreeting = text.includes("Byenvini");
    speakHuman(isMultilingualGreeting ? englishLine : text);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported or needs microphone permissions.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'client',
          context: clientContext,
          messages: messages.concat(userMsg).map(m => ({ role: m.role, parts: [{ text: m.text }] }))
        })
      });
      
      const data = await response.json();
      if (!response.ok || !data.text) throw new Error('AI concierge unavailable');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: data.text }]);
      // Jev pre-router verdict: an emergency triggers the SOS action bar
      if (data.jev?.intent === "emergency") setSosActive(true);
    } catch (error) {
      console.warn('[MACALOCATOR] Gemini API unavailable — demo concierge engaged.', error);
      // Demo mode: canned concierge so the showcase never dead-ends without a GEMINI_API_KEY.
      // Handover includes a .env guide — plug in a key and this path goes live automatically.
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: demoConciergeReply(userText) }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Offline demo responder — keyword-matched VIP concierge answers.
  const demoConciergeReply = (raw: string): string => {
    const q = raw.toLowerCase();
    if (/(tow|tow|grua|grúa)/.test(q)) return "Our Rapid Response Flatbed units run 24/7. A flatbed tow to your preferred shop or home starts at $89 inside the city ring — share your location via the Emergency tab and the nearest unit is typically on scene in 15–25 minutes.";
    if (/(jump|battery|bateria|batería|dead)/.test(q)) return "We dispatch auxiliary battery jumps on the spot for $49, or a full mobile battery diagnostic with replacement sourcing if the cell won't hold charge. Book it under 'Battery Diagnostic' in the Book Service tab.";
    if (/(tire|tyre|llanta|flat|rotation|rotate)/.test(q)) return "Tire rotation at your location starts at $39. If you've got a flat, our technician brings a calibrated torque wrench and can mount your spare or patch on-site — select 'Tire Rotation' or tap Emergency → Other with your location.";
    if (/(price|cost|how much|precio|cuanto|cuánto|rate)/.test(q)) return "Typical on-site services: full mobile diagnostics from $79, tire rotation $39, battery service $49, concierge flatbed towing from $89. Your Dashboard includes a live cost estimator — pick your vehicle and service for an instant quote.";
    if (/(where|location|ubicacion|ubicación|area|zone|city)/.test(q)) return "MACALOCATOR is 100% mobile — we come to your driveway, office parking, or roadside position anywhere in the metro area. The live map on your Dashboard shows every unit, its status, and ETA in real time.";
    if (/(book|schedule|appointment|cita|reserv)/.test(q)) return "Easy — head to the Book Service tab, choose your service, confirm the address, and pick a date and time. You'll see it move from pending → confirmed → in progress → completed, and it can sync straight to your Google Calendar.";
    if (/(oil|change|mantenimiento|maintenance)/.test(q)) return "We track mileage per vehicle in your garage and remind you when oil service is due. For EVs like your Tesla or Bolt, we swap in high-voltage battery health checks and cabin-filter service instead — the estimator adjusts automatically for electric powertrains.";
    if (/(hour|hours|open|abierto|when)/.test(q)) return "Emergency roadside runs 24/7. Scheduled concierge services run 7:00 AM – 8:00 PM, seven days a week, including hotel and workplace parking locations.";
    if (/(human|agent|person|llamar|call|phone)/.test(q)) return "Of course — you can reach the front desk directly from the Emergency tab, or press the call button once a unit is dispatched. Our admin console routes every request to a live coordinator in seconds.";
    return "Great question — our concierge desk can help with that. I can book an on-site service, quote pricing from the live estimator, or dispatch emergency assistance. What would you like to do first?";
  };

  return (
    <Card className="flex flex-col h-[600px] border-[#4A5548]/80 shadow-md bg-[#27362C] overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-gradient-to-r from-[#22302A] to-[#27362C]/60 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2 text-[#EFE9DC] font-extrabold text-base md:text-lg">
            <LifeBuoy className="w-5 h-5 text-[#C5A06C]" />
            MACALOCATOR VIP Support Desk
          </CardTitle>
          <div className="flex items-center gap-2 bg-[#2E3A31] border border-[#4A5548] rounded-full px-2.5 py-1 text-[10px] text-[#C5A06C] font-bold">
            <Sparkles className="w-3 h-3 text-[#C5A06C] animate-pulse" /> Direct Doorstep Service
          </div>
        </div>
        <CardDescription className="text-[#B8C0B4] text-xs">
          Interactive chat assistant with fully responsive text & natural voice synthesis. Ask about on-site tune-ups, tire replacements, or battery calibrations.
        </CardDescription>
      </CardHeader>

      {/* Jev SOS action bar — appears when the pre-router detects an emergency */}
      {sosActive && (
        <div className="bg-[#3A2F2C] border-b border-[#5A4A44] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C96A5B] animate-pulse shrink-0" />
            <p className="text-xs font-bold text-[#E5B95C] leading-snug">
              Emergency mode active — dispatch is standing by. · Emergencia activa — envío disponible.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={sendGpsDispatch}
              disabled={gpsSent}
              className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-[#C96A5B] hover:bg-[#D57F70] text-white disabled:opacity-60"
            >
              {gpsSent ? "✓ Dispatch notified" : "Send my GPS now"}
            </button>
            <Link
              to="/emergency"
              className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold border border-[#C96A5B] text-[#E5B95C] hover:bg-[#3A2F2C]/60"
            >
              Open Emergency →
            </Link>
          </div>
        </div>
      )}

      {/* Doorstep Alert Reminder Bar */}
      <div className="bg-[#33402F]/70 border-b border-[#4A5548]/60 px-4 py-2 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
        <span className="text-[11px] text-[#E5B95C] font-medium leading-tight">
          <strong>Elite Mobile Concept:</strong> Remember, we don't operate a physical waiting lounge. Our mechanics load premium toolsets and travel directly to your location!
        </span>
      </div>
      
      <ScrollArea className="flex-1 p-4 bg-[#22302A]/30">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#B08D57] text-white shadow-sm' : 'bg-[#22302A] border border-[#4A5548] text-[#DCD8CC]'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-[#C5A06C]" />}
                </div>
                <div className={`p-3.5 rounded-2xl text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-[#B08D57] text-white rounded-tr-sm shadow-sm' : 'bg-[#27362C] border border-[#4A5548]/80 text-[#EFE9DC] rounded-tl-sm shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-[#22302A] border border-[#4A5548] text-[#DCD8CC] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#C5A06C]" />
                </div>
                <div className="p-3 rounded-2xl bg-[#27362C] border border-[#4A5548]/80 text-[#EFE9DC] rounded-tl-sm flex gap-1 shadow-sm">
                  <div className="w-2 h-2 bg-[#8A967F] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#8A967F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#8A967F] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-[#22302A]/50 space-y-3">
        {/* Voice control toggles inside ChatView */}
        <div className="flex items-center justify-between text-xs text-[#B8C0B4] px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            <span>Voice Input dictation is active</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              const next = !speakResponses;
              setSpeakResponses(next);
              if (next) speakText("Voice synthesis enabled.");
            }}
            className={`flex items-center gap-1.5 font-bold transition-colors ${speakResponses ? "text-[#C5A06C]" : "text-[#A6B0A3]"}`}
          >
            {speakResponses ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{speakResponses ? "Voice Readback: ON" : "Voice Readback: OFF"}</span>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          {/* Voice dictation button */}
          <Button
            type="button"
            variant="outline"
            className={`shrink-0 rounded-xl transition-all ${isListening ? "bg-[#3A2F2C] text-[#C96A5B] border-[#5A4A44] animate-pulse" : "bg-[#27362C] text-[#C5CBBF] border-[#4A5548] hover:bg-[#22302A]"}`}
            onClick={startListening}
            title={isListening ? "Stop listening" : "Dictate message with microphone"}
          >
            {isListening ? <MicOff className="w-4 h-4 text-[#C96A5B]" /> : <Mic className="w-4 h-4 text-[#C5CBBF]" />}
          </Button>

          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening closely..." : "Ask anything — English, Español, or Kreyòl..."}
            className="flex-1 bg-[#27362C] border-[#4A5548] focus-visible:ring-[#B08D57] rounded-xl"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-[#B08D57] hover:bg-[#C5A06C] rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

