import { useState, useEffect } from "react";

import { 
  ShoppingBagIcon, 
  TruckIcon, 
  ShieldCheckIcon, 
  HeadphonesIcon, 
  SparklesIcon 
} from "lucide-react";

const TEXTS = [
  { text: "Welcome to the EmporiumCorner", icon: SparklesIcon },
  { text: "Shopping made Easy", icon: ShoppingBagIcon },
  { text: "Deliveries within 2-3 working days", icon: TruckIcon },
  { text: "Quality Products", icon: ShieldCheckIcon },
  { text: "Good Customer Support", icon: HeadphonesIcon }
];

export function TextTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TEXTS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-primary/10 border-y border-primary/20 h-10 sm:h-14 flex items-center justify-center overflow-hidden relative">
      {TEXTS.map((item, i) => {
        const Icon = item.icon;
        let translateClass = "-translate-x-full opacity-0";
        if (i === index) {
          translateClass = "translate-x-0 opacity-100";
        } else if (i === (index - 1 + TEXTS.length) % TEXTS.length) {
          translateClass = "translate-x-full opacity-0";
        }

        return (
          <div
            key={item.text}
            className={`absolute transition-all duration-700 ease-in-out w-full flex items-center justify-center px-4 ${translateClass}`}
          >
            <div className="flex items-center gap-2">
              <Icon className="size-4 sm:size-5 text-primary" aria-hidden />
              <span className="text-primary font-medium tracking-wide text-sm sm:text-base capitalize">
                {item.text}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
