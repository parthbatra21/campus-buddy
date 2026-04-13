import { useEffect, useRef } from 'react';

export const usePolling = (callback, delay, dependencies = []) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay, ...dependencies]);
};
