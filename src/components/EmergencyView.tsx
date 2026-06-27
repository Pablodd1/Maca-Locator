import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Phone, ShieldAlert, Truck } from "lucide-react";

export function EmergencyView() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'dispatched'>('idle');

  const handleRequest = () => {
    setStatus('requesting');
    setTimeout(() => {
      setStatus('dispatched');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-red-200 shadow-md">
        <CardHeader className="bg-red-50 rounded-t-xl border-b border-red-100 pb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <CardTitle className="text-red-700 text-2xl">Emergency Assistance</CardTitle>
          </div>
          <CardDescription className="text-red-600/80 text-base mt-2">
            24/7 Fast response for towing, lockouts, jump starts, and more.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-8">
          {status === 'idle' && (
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col gap-2 border-slate-200 hover:border-red-300 hover:bg-red-50">
                <Truck className="w-8 h-8 text-slate-600" />
                <span>Tow Truck</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 border-slate-200 hover:border-red-300 hover:bg-red-50">
                <ShieldAlert className="w-8 h-8 text-slate-600" />
                <span>Accident Help</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 border-slate-200 hover:border-red-300 hover:bg-red-50">
                <AlertTriangle className="w-8 h-8 text-slate-600" />
                <span>Jump Start</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 border-slate-200 hover:border-red-300 hover:bg-red-50">
                <MapPin className="w-8 h-8 text-slate-600" />
                <span>Other (Share Location)</span>
              </Button>
            </div>
          )}

          {status === 'requesting' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-slate-700">Locating nearest unit...</p>
            </div>
          )}

          {status === 'dispatched' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <Truck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">Help is on the way!</h3>
                <p className="text-green-700 mt-2">Driver Carlos is 8 minutes away.</p>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Phone className="w-4 h-4 mr-2" />
                Call Driver
              </Button>
            </div>
          )}
        </CardContent>
        
        {status === 'idle' && (
          <CardFooter className="bg-slate-50 pt-6 rounded-b-xl">
            <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-lg py-6" onClick={handleRequest}>
              <AlertTriangle className="w-5 h-5 mr-2" />
              Request Immediate Help
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
