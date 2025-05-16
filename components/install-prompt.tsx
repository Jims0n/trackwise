"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the device is iOS and if the app is not installed
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOS(isIOSDevice);
    setShowPrompt(isIOSDevice && !isStandalone);
  }, []);

  if (!showPrompt) return null;

  return (
    <Card className="bg-[#1c1c1c] text-white p-6 mb-6 max-w-md mx-auto">
      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-2xl font-bold text-center">Install trackwise on Safari.</h2>
        
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Tap the share icon at the bottom of the screen.</li>
          <li>Choose 'Add to Home Screen' from the options.</li>
          <li>Confirm by tapping 'Add.'</li>
        </ul>
        
        <Button 
          variant="outline" 
          className="mt-4 border-white text-white hover:bg-white hover:text-black"
          onClick={() => setShowPrompt(false)}
        >
          Continue in browser
        </Button>
      </div>
    </Card>
  );
}
