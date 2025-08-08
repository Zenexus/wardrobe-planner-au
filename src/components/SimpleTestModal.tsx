import React from "react";
import { createPortal } from "react-dom";

interface SimpleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleTestModal({
  isOpen,
  onClose,
}: SimpleTestModalProps) {
  console.log("🧪 SimpleTestModal render - isOpen:", isOpen);

  if (!isOpen) return null;

  const handleClick = () => {
    console.log("🎯 Simple modal button clicked!");
    onClose();
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 0, 0, 0.8)", // Red background to make it obvious
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483647,
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        console.log("🎯 Simple modal backdrop clicked");
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          pointerEvents: "auto",
          cursor: "default",
        }}
        onClick={(e) => {
          console.log("🎯 Simple modal content clicked");
          e.stopPropagation();
        }}
      >
        <h2
          style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "bold" }}
        >
          Simple Test Modal
        </h2>
        <p style={{ margin: "0 0 16px 0" }}>
          If you can see this and click the button, the modal system works!
        </p>
        <button
          onClick={handleClick}
          style={{
            backgroundColor: "#007acc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Close Modal
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
