/**
 * DrawerContext — global context that lets any screen trigger the SideDrawer
 * which is rendered at the AppStack level (above tabs + headers).
 */
import React, { createContext, useCallback, useContext, useState } from 'react';

const DrawerContext = createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});

export function DrawerProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
