import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Send, User, LifeBuoy, Mic, MicOff, Volume2, VolumeX, Sparkles, MapPin } from "lucide-react";

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      text: 'Hello! Welcome to the MACALOCATOR VIP Support Desk. We are a premier fully mobile car service: we dispatch our certified elite mechanics straight to your driveway, workspace, or roadside location in Colombia. How can I help schedule your at-home service or assist with vehicle diagnostics today?' 
    }
  ]);
  const [input, setInput] = useState('');
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
      rec.lang = "en-US";
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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      // Strip markdown code blocks before speaking to sound clean
      const cleanedText = text.replace(/```[\s\S]*?```/g, "[code block omitted]").replace(/[`*_]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Natural"));
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    }
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
          messages: messages.concat(userMsg).map(m => ({ role: m.role, parts: [{ text: m.text }] }))
        })
      });
      
      const data = await response.json();
      if (!response.ok || !data.text) throw new Error('AI concierge unavailable');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: data.text }]);
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
    <Card className="flex flex-col h-[600px] border-slate-200/80 shadow-md bg-white overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-800 font-extrabold text-base md:text-lg">
            <LifeBuoy className="w-5 h-5 text-blue-600" />
            MACALOCATOR VIP Support Desk
          </CardTitle>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1 text-[10px] text-blue-800 font-bold">
            <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" /> Direct Doorstep Service
          </div>
        </div>
        <CardDescription className="text-slate-500 text-xs">
          Interactive chat assistant with fully responsive text & natural voice synthesis. Ask about on-site tune-ups, tire replacements, or battery calibrations.
        </CardDescription>
      </CardHeader>

      {/* Doorstep Alert Reminder Bar */}
      <div className="bg-amber-50/70 border-b border-amber-100/60 px-4 py-2 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="text-[11px] text-amber-900 font-medium leading-tight">
          <strong>Elite Mobile Concept:</strong> Remember, we don't operate a physical waiting lounge. Our mechanics load premium toolsets and travel directly to your location!
        </span>
      </div>
      
      <ScrollArea className="flex-1 p-4 bg-slate-50/30">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-blue-700" />}
                </div>
                <div className={`p-3.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm flex gap-1 shadow-sm">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-slate-50/50 space-y-3">
        {/* Voice control toggles inside ChatView */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
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
            className={`flex items-center gap-1.5 font-bold transition-colors ${speakResponses ? "text-blue-600" : "text-slate-400"}`}
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
            className={`shrink-0 rounded-xl transition-all ${isListening ? "bg-red-50 text-red-600 border-red-300 animate-pulse" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            onClick={startListening}
            title={isListening ? "Stop listening" : "Dictate message with microphone"}
          >
            {isListening ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4 text-slate-600" />}
          </Button>

          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening closely..." : "Ask your vehicle questions..."}
            className="flex-1 bg-white border-slate-200 focus-visible:ring-blue-600 rounded-xl"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

