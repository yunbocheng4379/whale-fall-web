import { useEffect, useRef, useState } from 'react';

const useCountdown = (initialSeconds = 60) => {
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const start = (seconds = initialSeconds) => {
    clearInterval(timerRef.current);
    setCountdown(seconds);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
      //setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setCountdown(0);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { countdown, start, reset };
};

export default useCountdown;
