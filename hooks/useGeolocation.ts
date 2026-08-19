'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  isLocked: boolean;
  error: string | null;
  lastUpdated: string;
}

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeolocationState>({
    lat: 34.0522, // Default fallback (tactical grid)
    lng: -118.2437,
    accuracy: 12,
    heading: null,
    speed: null,
    isLocked: false,
    error: null,
    lastUpdated: new Date().toLocaleTimeString(),
  });

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoState((prev) => ({
        ...prev,
        error: 'Geolocation not supported by browser',
        isLocked: true, // Use tactical fallback
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          isLocked: true,
          error: null,
          lastUpdated: new Date().toLocaleTimeString(),
        });
      },
      (err) => {
        console.warn('Geolocation error (using fallback coordinates):', err.message);
        setGeoState((prev) => ({
          ...prev,
          isLocked: true,
          error: err.message,
          lastUpdated: new Date().toLocaleTimeString(),
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();

    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGeoState({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            isLocked: true,
            error: null,
            lastUpdated: new Date().toLocaleTimeString(),
          });
        },
        (err) => {
          console.warn('WatchPosition error:', err.message);
        },
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [requestLocation]);

  return { ...geoState, refreshLocation: requestLocation };
}
