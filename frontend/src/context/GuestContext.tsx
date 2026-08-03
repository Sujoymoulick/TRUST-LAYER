import { createContext, useContext, useState } from 'react';

interface GuestContextType {
  isGuest: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
}

const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  enterGuest: () => {},
  exitGuest: () => {},
});

export const useGuest = () => useContext(GuestContext);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  return (
    <GuestContext.Provider value={{ isGuest, enterGuest: () => setIsGuest(true), exitGuest: () => setIsGuest(false) }}>
      {children}
    </GuestContext.Provider>
  );
}
