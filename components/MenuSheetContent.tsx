"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MailCheck, Frame } from "lucide-react";
import ContactEmailForm from "@/components/ContactEmailForm";
import ResumeDesignForm from "@/components/ResumeDesignForm";

export default function MenuSheetContent() {
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto p-4 mt-20"
        style={{ scrollbarGutter: "stable" }}
      >
        <Accordion type="single" collapsible className="w-full space-y-3 px-4">
          <AccordionItem value="share-email">
            <AccordionTrigger className="text-base">
              <div className="flex items-center gap-4">
                <MailCheck className="size-5" />
                <span className="text-lg">Share Via Email</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ContactEmailForm />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="open-design">
            <AccordionTrigger className="text-base">
              <div className="flex items-center gap-4">
                <Frame className="size-5" />
                <span className="text-lg">Open Design</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ResumeDesignForm />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
