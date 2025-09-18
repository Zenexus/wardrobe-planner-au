import { useEffect } from "react";
import { useStore } from "../store";

export const useKeyboardShortcuts = () => {
  const { undo, redo, canUndo, canRedo } = useStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (Undo) or Cmd+Z on Mac
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // Check for Ctrl+Y (Redo) or Ctrl+Shift+Z or Cmd+Shift+Z on Mac
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === "Z")
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);
};
