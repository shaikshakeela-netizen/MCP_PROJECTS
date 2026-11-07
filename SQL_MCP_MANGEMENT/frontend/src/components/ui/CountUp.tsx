import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CountUpProps {
  value: number;
  decimals?: number;
}

export function CountUp({ value, decimals = 0 }: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: setShown,
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span>
      {shown.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
