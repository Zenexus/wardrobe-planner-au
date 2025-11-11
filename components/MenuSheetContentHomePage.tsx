"use client";

// home page use, no email form
import ResumeDesignForm from "@/components/ResumeDesignForm";

export default function MenuSheetContentHomePage() {
  return (
    <div className="flex flex-col h-full p-4 px-10">
      <div
        className="flex-1 overflow-y-auto mt-16"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="flex items-center">
          <span className="text-xl font-bold text-foreground">Open Design</span>
        </div>

        <ResumeDesignForm />
      </div>
    </div>
  );
}
