import { useState, useEffect } from "react";
import { MessageSquareIcon } from "lucide-react";

export function FloatingSupportButton({ phoneNumber }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Default to bottom right, but keeping it inside screen bounds
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 140
    });
  }, []);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    // Constrain to window bounds
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e) => {
    if (isDragging) {
      // Prevent click if we were dragging
      e.preventDefault();
      return;
    }
    
    // Remove any + or spaces
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };

  return (
    <div
      className="fixed z-[9999] cursor-pointer"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: "none"
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
        <div className="bg-success text-white p-3.5 rounded-full shadow-lg shadow-success/30 flex items-center justify-center hover:scale-110 transition-transform relative z-10 border border-success/50 backdrop-blur">
          <MessageSquareIcon className="size-6 sm:size-7" fill="currentColor" />
        </div>
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-base-100 shadow-md text-xs font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block border border-base-200">
          Chat with Support
        </div>
      </div>
    </div>
  );
}
