import { useState, useEffect } from "react";

const TEXTS = [
  "Welcome to the EmporiumCorner",
  "Shopping made Easy",
  "Fast Deliveries",
  "Quality Products",
  "Good Customer Support"
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
      {TEXTS.map((text, i) => {
        let translateClass = "-translate-x-full opacity-0";
        if (i === index) {
          translateClass = "translate-x-0 opacity-100";
        } else if (i === (index - 1 + TEXTS.length) % TEXTS.length) {
          translateClass = "translate-x-full opacity-0";
        }

        return (
          <div
            key={text}
            className={`absolute transition-all duration-700 ease-in-out w-full text-center px-4 ${translateClass}`}
          >
            <span className="text-primary font-medium tracking-wide text-sm sm:text-base capitalize">
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
