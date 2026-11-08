import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Loader2 } from "lucide-react";

export function ImageGeneratorView() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ratios = ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9", "3:2", "2:3"];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setImage(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio })
      });
      const data = await res.json();
      if (!res.ok || !data.image) throw new Error("Image API unavailable");
      setImage(data.image);
    } catch (error) {
      console.warn("[MACALOCATOR] Image API unavailable — demo placeholder engaged.", error);
      // Demo mode: branded placeholder so the Creative Studio flow is fully clickable
      // without a GEMINI_API_KEY. Plug a key into env and real generations appear here.
      setImage(buildDemoAsset(prompt, aspectRatio));
    } finally {
      setIsLoading(false);
    }
  };

  // Offline demo asset — branded schematic card rendered as an SVG data URI.
  const buildDemoAsset = (text: string, ratio: string): string => {
    const dims: Record<string, [number, number]> = {
      "1:1": [800, 800], "3:4": [750, 1000], "4:3": [1000, 750], "9:16": [562, 1000],
      "16:9": [1280, 720], "21:9": [1470, 630], "3:2": [1050, 700], "2:3": [700, 1050],
    };
    const [w, h] = dims[ratio] || [1000, 750];
    const safe = text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] || c);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<g stroke="#ffffff22">${Array.from({ length: Math.floor(h / 40) }, (_, i) => `<line x1="0" y1="${i * 40}" x2="${w}" y2="${i * 40}"/>`).join("")}</g>
<text x="${w / 2}" y="${h / 2 - 20}" fill="#93c5fd" font-family="monospace" font-size="${Math.max(18, w / 40)}" text-anchor="middle" letter-spacing="4">MACALOCATOR</text>
<text x="${w / 2}" y="${h / 2 + 20}" fill="#e2e8f0" font-family="monospace" font-size="${Math.max(12, w / 70)}" text-anchor="middle">${safe.slice(0, 70)}</text>
<text x="${w / 2}" y="${h - 24}" fill="#64748b" font-family="monospace" font-size="12" text-anchor="middle">DEMO PREVIEW — connect GEMINI_API_KEY for AI-generated creatives</text>
</svg>`;
    return "data:image/svg+xml;base64," + btoa(svg);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Marketing Creative Studio
          </CardTitle>
          <CardDescription>Design premium visuals and flyers for your automotive listing or workshop branch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input 
              placeholder="e.g. A sleek modern electric charger station on Miami Beach at sunset"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {ratios.map(ratio => (
                <Button 
                  key={ratio} 
                  variant={aspectRatio === ratio ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setAspectRatio(ratio)}
                >
                  {ratio}
                </Button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            Generate Image
          </Button>

          {isLoading && (
            <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}

          {image && !isLoading && (
            <div className="mt-6 border-2 border-slate-100 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 relative group">
              <img src={image} alt="Generated asset" className="max-w-full max-h-[500px] object-contain" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
