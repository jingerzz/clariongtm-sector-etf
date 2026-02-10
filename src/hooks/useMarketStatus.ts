import { useState, useEffect } from "react";

export function useMarketStatus() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const day = et.getDay();
      const hours = et.getHours();
      const minutes = et.getMinutes();
      const totalMin = hours * 60 + minutes;
      setIsOpen(day >= 1 && day <= 5 && totalMin >= 570 && totalMin < 960);
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  return isOpen;
}
