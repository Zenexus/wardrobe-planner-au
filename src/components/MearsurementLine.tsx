// FIXME: Currently, this component not in use.

import { Vector3, LineCurve3 } from "three";
import { Html } from "@react-three/drei";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface MeasurementLineProps {
  start: [number, number, number];
  end: [number, number, number];
  label: number;
  color?: string;
}

function MearsurementLine({
  start,
  end,
  label,
  color = "#007acc",
}: MeasurementLineProps) {
  const startVec = new Vector3(...start);
  const endVec = new Vector3(...end);
  const midpoint = new Vector3().lerpVectors(startVec, endVec, 0.5);
  const { setGlobalHasDragging } = useStore();

  // State for popup
  const [showPopup, setShowPopup] = useState(false);
  const [inputValue, setInputValue] = useState(label.toString());
  const [customLabel, setCustomLabel] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Create curve for tube geometry
  const curve = new LineCurve3(startVec, endVec);

  // Determine if the line is along the z-axis (left-right orientation)
  // In 3D space, typically z-axis represents depth (left-right)
  const isLeftRight =
    Math.abs(startVec.z - endVec.z) > Math.abs(startVec.x - endVec.x);

  const handleSave = () => {
    const newValue = parseFloat(inputValue);
    if (!isNaN(newValue)) {
      setCustomLabel(inputValue);
      console.log(`Measurement updated: ${inputValue} cm`);
    }
    setShowPopup(false);
    setGlobalHasDragging(false);
  };

  const handleCancel = useCallback(() => {
    setInputValue(customLabel || label.toString());
    setShowPopup(false);
    setGlobalHasDragging(false);
  }, [customLabel, label, setGlobalHasDragging]);

  const displayLabel = customLabel || label.toString();

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    };

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup, handleCancel]);

  return (
    <group>
      {/* Main measurement line */}
      <mesh>
        <tubeGeometry args={[curve, 20, 0.008, 8, false]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Arrow caps */}
      <mesh position={start} rotation={[0, -Math.PI / 2, 0]}>
        <coneGeometry args={[0.02, 0.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={end} rotation={[0, -Math.PI / 2, 0]}>
        <coneGeometry args={[0.02, 0.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Label */}
      <Html
        position={[midpoint.x, midpoint.y, midpoint.z]}
        center
        zIndexRange={[16777271, 16777000]}
        pointerEvents="auto"
      >
        <div
          className={cn(
            "bg-white whitespace-nowrap px-4 py-2 rounded-lg shadow-lg cursor-pointer"
          )}
          style={{
            borderColor: color,
            color: color,
            transform: isLeftRight ? "rotate(-90deg)" : "none",
            transformOrigin: "center center",
            transition: "all 0.3s ease",
            zIndex: 9999,
            position: "relative",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowPopup(true);
            setGlobalHasDragging(true);
            setInputValue(customLabel || label.toString());
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            // Disable OrbitControls when hovering over HTML
            setGlobalHasDragging(true);

            const target = e.currentTarget as HTMLDivElement;
            target.style.transform = isLeftRight
              ? "rotate(-90deg) scale(1.25)"
              : "scale(1.25)";
            target.style.textDecoration = "underline";
            target.style.textDecorationColor = "#d3d3d3";
            target.style.textUnderlineOffset = "6px";
            target.style.textDecorationThickness = "1px";
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            // Re-enable OrbitControls when leaving HTML
            if (!showPopup) {
              setGlobalHasDragging(false);
            }

            const target = e.currentTarget as HTMLDivElement;
            target.style.transform = isLeftRight ? "rotate(-90deg)" : "none";
            target.style.textDecoration = "none";
          }}
        >
          {displayLabel} cm
        </div>

        {/* Popup Input Dialog */}
        {showPopup && (
          <div
            ref={modalRef}
            className="absolute bg-white p-4 rounded-lg shadow-xl"
            style={{
              zIndex: 999999,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              minWidth: "280px",
              pointerEvents: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <Label
                htmlFor="measurement-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Width (cm)
              </Label>
              <Input
                id="measurement-input"
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full"
                placeholder="Enter measurement in cm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  } else if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-black text-white rounded-md hover:bg-black/80 transition-colors text-sm cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Html>
    </group>
  );
}

export default MearsurementLine;
