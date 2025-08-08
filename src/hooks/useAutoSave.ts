import { useEffect, useRef } from "react";
import { useStore } from "../store";

// Auto-save hook that saves the state when it changes
export const useAutoSave = () => {
  const saveCurrentState = useStore((state) => state.saveCurrentState);
  const wardrobeInstances = useStore((state) => state.wardrobeInstances);
  const wallsDimensions = useStore((state) => state.wallsDimensions);
  const customizeMode = useStore((state) => state.customizeMode);
  const autoSaveEnabled = useStore((state) => state.autoSaveEnabled);

  // Use ref to track if this is the initial render
  const isInitialRender = useRef(true);
  const startTime = useRef(Date.now());

  // Debounced save function to avoid too frequent saves
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip auto-save on initial render to avoid overwriting loaded state
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!autoSaveEnabled) {
      console.log("⏸️ Auto-save is disabled");
      return;
    }

    // Clear existing timeout
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    // Debounce save by 1 second
    saveTimeout.current = setTimeout(() => {
      const success = saveCurrentState();
      if (success) {
        console.log("Auto-saved design state");
      }
    }, 1000);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [
    wardrobeInstances,
    wallsDimensions,
    customizeMode,
    autoSaveEnabled,
    saveCurrentState,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);
};
