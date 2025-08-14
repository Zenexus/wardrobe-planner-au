import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Summary from "./pages/Summary";
import DesignMemoryModal from "./components/DesignMemoryModal";
import {
  hasSavedDesign,
  loadDesignState,
  clearSavedDesign,
} from "./utils/memorySystem";
import { useStore } from "./store";

export default function App() {
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [isCheckingMemory, setIsCheckingMemory] = useState(true);
  const loadSavedState = useStore((state) => state.loadSavedState);
  const resetToDefaultState = useStore((state) => state.resetToDefaultState);
  const setAutoSaveEnabled = useStore((state) => state.setAutoSaveEnabled);

  useEffect(() => {
    // Check for saved design on app startup
    const checkForSavedDesign = async () => {
      try {
        const hasSaved = hasSavedDesign();

        if (hasSaved) {
          setShowMemoryModal(true);
        } else {
          // No saved design, start with default state
          resetToDefaultState();
          // Enable auto-save immediately since there's no conflict
          setAutoSaveEnabled(true);
        }
      } catch (error) {
        resetToDefaultState();
      } finally {
        setIsCheckingMemory(false);
      }
    };

    checkForSavedDesign();
  }, [resetToDefaultState]);

  const handleResumeDesign = () => {
    const savedState = loadDesignState();

    if (savedState) {
      const success = loadSavedState(savedState);
      if (success) {
        // Enable auto-save after successful load
        setTimeout(() => {
          setAutoSaveEnabled(true);
        }, 2000); // Wait 2 seconds before enabling auto-save
      } else {
        resetToDefaultState();
        setAutoSaveEnabled(true);
      }
    } else {
      resetToDefaultState();
      setAutoSaveEnabled(true);
    }
    setShowMemoryModal(false);
  };

  const handleNewDesign = () => {
    resetToDefaultState();
    // Optionally clear the saved design
    clearSavedDesign();
    // Enable auto-save immediately for new designs
    setAutoSaveEnabled(true);
    setShowMemoryModal(false);
  };

  const handleCloseModal = () => {
    // If user closes modal without choosing, default to new design
    handleNewDesign();
  };

  // Show loading state while checking for saved design
  if (isCheckingMemory) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <DesignMemoryModal
        isOpen={showMemoryModal}
        onClose={handleCloseModal}
        onNewDesign={handleNewDesign}
        onResumeDesign={handleResumeDesign}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/summary" element={<Summary />} />
      </Routes>
    </Router>
  );
}
