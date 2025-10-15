import { useEffect, useRef } from 'react';
import { useLocationStore } from '../stores/locationStore';

export const useLocation = () => {
  const {
    latitude,
    longitude,
    hasPermission,
    isLoading,
    requestPermission,
    getCurrentLocation,
  } = useLocationStore();
  
  const initialized = useRef(false);

  useEffect(() => {
    const initializeLocation = async () => {
      if (initialized.current) return;
      initialized.current = true;
      
      if (!hasPermission) {
        await requestPermission();
      }
    };

    initializeLocation();
  }, []); // Only run once on mount

  return {
    location: { latitude, longitude },
    hasPermission,
    isLoading,
    requestPermission,
    getCurrentLocation,
  };
};