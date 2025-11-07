import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapContextType {
  center: [number, number];
  zoom: number;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  // Tatry coordinates: 49.2794, 19.9495
  const [center, setCenter] = useState<[number, number]>([19.9495, 49.2794]);
  const [zoom, setZoom] = useState<number>(11);

  return (
    <MapContext.Provider value={{ center, zoom, setCenter, setZoom }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
