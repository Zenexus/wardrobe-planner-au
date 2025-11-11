"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider>{children}</TooltipProvider>
    </DndProvider>
  );
}
