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
      if (data.image) {
        setImage(data.image);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
              placeholder="e.g. A sleek modern electric charger station in Bogota at sunset"
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
