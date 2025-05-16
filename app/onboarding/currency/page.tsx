"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getAvailableCurrencies } from "@/lib/currency";

// Import the select components directly from the file we created
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Get currencies from our utility function
const currencies = getAvailableCurrencies();

export default function CurrencySelectionPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCurrencySelect = (value: string) => {
    setSelectedCurrency(value);
  };

  const handleNext = async () => {
    if (!selectedCurrency) {
      toast.error("Please select a currency");
      return;
    }

    setIsLoading(true);

    try {
      // Store the selected currency in a cookie
      // Make sure the cookie is set with the correct attributes
      document.cookie = `userCurrency=${selectedCurrency}; path=/; max-age=${60*60*24*365}; SameSite=Lax`; // 1 year expiry
      
      console.log("Setting currency cookie:", selectedCurrency);
      
      // Add a small delay to ensure the cookie is set before navigation
      setTimeout(() => {
        // Navigate to the dashboard
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      toast.error("Failed to save currency preference");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col items-center justify-center p-4" 
         style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)", 
                  backgroundSize: "40px 40px" }}>
      <Card className="w-full max-w-md bg-transparent border-0 text-white">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-white">Welcome<br />to trackwise.</h1>
            <p className="text-xl mt-6">What is your primary currency?</p>
          </div>

          <div className="mt-6">
            <Select onValueChange={handleCurrencySelect} value={selectedCurrency}>
              <SelectTrigger className="w-full h-12 bg-transparent border-b border-t-0 border-x-0 rounded-none text-white focus:ring-0 focus:border-white">
                <SelectValue placeholder="e.g. Naira" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-gray-700 text-white">
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code} className="hover:bg-gray-700">
                    {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 mt-10 pt-10">
            <Button 
              onClick={handleNext} 
              disabled={isLoading || !selectedCurrency}
              className="w-full bg-[#F5F5DC] text-black hover:bg-[#E5E5C5] h-12 rounded-md font-medium"
            >
              {isLoading ? "Saving..." : "Next"}
            </Button>
            <Button 
              onClick={handleBack} 
              variant="outline" 
              className="w-full bg-transparent border border-white text-white hover:bg-gray-800 h-12 rounded-md font-medium mt-2"
            >
              Back
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
