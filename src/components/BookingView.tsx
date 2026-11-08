import { useState } from "react";
import { useAppState } from "../context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Car, Clock, Sparkles, MapPin, ShieldCheck, HelpCircle } from "lucide-react";
import { Link } from "react-router";

export function BookingView() {
  const { addBooking, vehicles } = useAppState();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-07-02");
  const [selectedTime, setSelectedTime] = useState("");
  const [serviceAddress, setServiceAddress] = useState("VIP Residence, 1000 Brickell Plaza, Miami, FL");

  const services = [
    { name: "Full Mobile Diagnostics", desc: "Premium electronic scan, battery diagnostics & calibration check at your site." },
    { name: "White-Glove Oil Change & Fluid Flush", desc: "Premium high-grade synthetic oil replacement & filter check in your driveway." },
    { name: "At-Home Brake Calibration & Replacement", desc: "Certified performance pad and rotor replacements with no car transport required." },
    { name: "Concierge Tire Maintenance & Balancing", desc: "Nitrogen inflation, thread inspection, and rotation on-site." },
    { name: "Elite Battery Install & Diagnostics", desc: "Next-day delivery and certified calibration of premium 12V or EV auxiliary batteries." },
    { name: "Detailing & Eco-Wash Suite", desc: "Waterless premium ceramic hand coating and interior sterilization at your villa/office." }
  ];

  const times = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "04:00 PM"];

  const handleSelectService = (service: string) => {
    setSelectedService(service);
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
    setStep(2);
  };

  const handleConfirmBooking = (time: string) => {
    setSelectedTime(time);
    addBooking({
      type: selectedService,
      date: selectedDate,
      time: time,
      vehicleId: selectedVehicleId || undefined,
    });
    setStep(3);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Informational VIP Concept Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 border border-blue-800 shadow-md flex items-start gap-4">
        <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 shrink-0">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm tracking-wide text-amber-300 uppercase">MACALOCATOR At-Your-Door Service Model</h3>
          <p className="text-xs text-slate-200 leading-relaxed">
            Forget driving to a greasy service center. MACALOCATOR operates 100% on-demand. Our certified elite mechanics transport specialized diagnostic equipment and high-end tools straight to your home, secure workplace, or hotel parking. Select a service below to dispatch a technician!
          </p>
        </div>
      </div>

      <Card className="shadow-md border-slate-200/80 rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Executive Service Scheduler
          </CardTitle>
          <CardDescription className="text-xs">Schedule professional automotive maintenance delivered directly to your doorstep in Miami & Miami Beach.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 text-sm border-b pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">1</span>
                Select Mobile VIP Service Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {services.map(service => (
                  <Button 
                    key={service.name} 
                    variant="outline" 
                    className="h-28 flex flex-col items-start p-4 hover:border-blue-600 hover:bg-blue-50/40 justify-center text-left rounded-xl transition-all border-slate-200" 
                    onClick={() => handleSelectService(service.name)}
                  >
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                      {service.name}
                    </span>
                    <span className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">{service.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Vehicle, Date, Time & Delivery Address */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-700 text-sm border-b pb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">2</span>
                Appointment, Vehicle & Doorstep Delivery Address
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Vehicle Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Selected Vehicle</label>
                    {vehicles.length === 0 ? (
                      <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg text-xs text-amber-800 space-y-1.5">
                        <p className="font-medium">No vehicles registered</p>
                        <p>Register your vehicle in the profile tab to get smart alerts and accurate booking history.</p>
                        <Link to="/profile">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] mt-1 bg-white border-amber-300">
                            Register Car
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {vehicles.map(v => (
                          <div 
                            key={v.id} 
                            onClick={() => setSelectedVehicleId(v.id)}
                            className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${selectedVehicleId === v.id ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'hover:bg-slate-50 border-slate-200'}`}
                          >
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-extrabold text-slate-800">{v.year} {v.make} {v.model}</span>
                            </div>
                            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase">{v.licensePlate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Destination Address of Service */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      Technician Dispatch Destination Address
                    </label>
                    <Input 
                      type="text" 
                      value={serviceAddress} 
                      onChange={(e) => setServiceAddress(e.target.value)}
                      placeholder="Enter home or office address in Miami or Miami Beach"
                      className="bg-white border-slate-200 rounded-lg focus-visible:ring-blue-600 text-xs h-9"
                    />
                    <p className="text-[10px] text-slate-400">Our VIP mobile workshop team travels straight to this exact address.</p>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Choose Appointment Date</label>
                    <div className="relative">
                      <Input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Time selector */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 block">Select Available Dispatch Hour</span>
                  <div className="grid grid-cols-2 gap-2">
                    {times.map(time => (
                      <Button 
                        key={time} 
                        variant="outline" 
                        className="h-11 hover:border-blue-600 hover:bg-blue-50/30 text-xs font-medium text-slate-700 rounded-lg transition-all"
                        onClick={() => handleConfirmBooking(time)}
                      >
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600 opacity-80" /> {time}
                      </Button>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 text-[11px] text-blue-800 space-y-1">
                    <p className="font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Professional Guarantee
                    </p>
                    <p className="text-slate-500 leading-relaxed">Your technician will arrive within a tight 30-minute window of the selected time, equipped with genuine parts and mobile diagnostic scanners.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between border-t">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-lg text-xs font-bold">Back</Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation Success */}
          {step === 3 && (
            <div className="space-y-5 text-center py-10">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Doorstep Booking Confirmed! 🎉</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Our elite technician team is preparing dispatch instructions. We will travel straight to you.</p>
              
              <div className="max-w-md mx-auto bg-slate-50 border rounded-2xl p-5 text-left space-y-2.5 text-sm text-slate-600">
                <p className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase">Service Type</span> 
                  <span className="font-extrabold text-slate-800">{selectedService}</span>
                </p>
                <p className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase">Scheduled Date</span> 
                  <span className="font-mono text-slate-800">{selectedDate}</span>
                </p>
                <p className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase">Dispatch Time</span> 
                  <span className="font-mono text-slate-800">{selectedTime}</span>
                </p>
                <p className="flex justify-between items-start text-xs pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase shrink-0">Service Address</span> 
                  <span className="font-semibold text-slate-800 text-right max-w-[200px] leading-tight">{serviceAddress}</span>
                </p>
                {selectedVehicleId && (
                  <p className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase">Vehicle Info</span> 
                    <span className="font-extrabold text-slate-800">
                      {vehicles.find(v => v.id === selectedVehicleId)?.make} {vehicles.find(v => v.id === selectedVehicleId)?.model}
                    </span>
                  </p>
                )}
              </div>
              
              <div className="pt-6 flex justify-center gap-3">
                <Link to="/">
                  <Button variant="outline" className="rounded-lg text-xs font-bold">Go to Dashboard</Button>
                </Link>
                <Button onClick={() => setStep(1)} className="bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold">Book Another Service</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
