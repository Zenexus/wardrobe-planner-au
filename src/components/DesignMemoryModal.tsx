import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { getSavedDesignMetadata, clearSavedDesign } from "@/utils/memorySystem";

interface DesignMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewDesign: () => void;
  onResumeDesign: () => void;
}

export default function DesignMemoryModal({
  isOpen,
  onClose,
  onNewDesign,
  onResumeDesign,
}: DesignMemoryModalProps) {
  const [isClearing, setIsClearing] = useState(false);

  console.log("🎯 DesignMemoryModal render - isOpen:", isOpen);

  // Disable pointer events on body when modal is open to prevent Canvas interference
  React.useEffect(() => {
    if (isOpen) {
      // Find and disable pointer events on canvas
      const canvases = document.querySelectorAll("canvas");
      canvases.forEach((canvas) => {
        canvas.style.pointerEvents = "none";
      });

      // Also try to disable on the canvas wrapper
      const canvasWrappers = document.querySelectorAll(".w-7\\/10");
      canvasWrappers.forEach((wrapper) => {
        (wrapper as HTMLElement).style.pointerEvents = "none";
      });

      console.log("🚫 Disabled pointer events on canvas elements");

      return () => {
        // Re-enable pointer events when modal closes
        canvases.forEach((canvas) => {
          canvas.style.pointerEvents = "auto";
        });
        canvasWrappers.forEach((wrapper) => {
          (wrapper as HTMLElement).style.pointerEvents = "auto";
        });
        console.log("✅ Re-enabled pointer events on canvas elements");
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const savedMetadata = getSavedDesignMetadata();
  const savedDate = savedMetadata ? new Date(savedMetadata.timestamp) : null;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
  };

  const handleClearSavedDesign = async () => {
    setIsClearing(true);
    const success = clearSavedDesign();
    if (success) {
      // Close modal and start new design
      onNewDesign();
    }
    setIsClearing(false);
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 2147483647, // Maximum safe z-index value
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        pointerEvents: "auto",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        cursor: "default",
      }}
      onClick={(e) => {
        console.log("🎯 Backdrop clicked");
        // Only close if clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden relative"
        style={{
          zIndex: 2147483647, // Maximum safe z-index value
          pointerEvents: "auto",
          position: "relative",
          cursor: "default",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Welcome Back!</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              We found a saved design from your previous session.
            </p>
            {savedDate && (
              <p className="text-sm text-gray-500">
                Last saved: {formatDate(savedDate)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => {
                onResumeDesign();
              }}
              className="w-full h-12 rounded-full  bg-black hover:bg-black/80 text-white cursor-pointer"
            >
              Resume Previous Design
            </Button>

            <Button
              onClick={() => {
                onNewDesign();
              }}
              variant="outline"
              className="w-full h-12 rounded-full border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              Start New Design
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside the normal DOM hierarchy
  return createPortal(modalContent, document.body);
}
