import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function useCountAnimation(value) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (value) => setDisplayValue(Math.floor(value)),
    });

    return () => controls.stop();
  }, [value]);

  return displayValue;
}
