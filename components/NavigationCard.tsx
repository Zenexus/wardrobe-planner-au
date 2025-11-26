"use client";

import { CircleArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import MenuSheetContentHomePage from "@/components/MenuSheetContentHomePage";

type NavigationActionCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
  type: "link" | "openSheet";
};

const NavigationActionCard = ({
  imageSrc,
  imageAlt,
  title,
  description,
  bgColor,
  textColor,
  type,
}: NavigationActionCardProps) => {
  const router = useRouter();

  const handleCardClick = () => {
    if (type === "link") {
      router.push("/planner");
    }
  };

  const renderActionButton = () => {
    if (type === "link") {
      return (
        <div
          className="bg-primary text-background rounded-full hover:bg-background hover:text-primary cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          <CircleArrowRight className="w-10 h-10 stroke-1" />
        </div>
      );
    } else if (type === "openSheet") {
      return (
        <Sheet>
          <SheetTrigger asChild>
            <div
              className="bg-secondary text-primary rounded-full hover:bg-[var(--tertiary)] hover:text-background cursor-pointer transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <CircleArrowRight className="w-10 h-10 stroke-1" />
            </div>
          </SheetTrigger>
          <SheetContent side="top" className="sm:hidden h-[50vh]">
            <VisuallyHidden>
              <SheetTitle>Open Design</SheetTitle>
            </VisuallyHidden>
            <MenuSheetContentHomePage />
          </SheetContent>
          <SheetContent side="right" className="hidden sm:block">
            <VisuallyHidden>
              <SheetTitle>Open Design</SheetTitle>
            </VisuallyHidden>
            <MenuSheetContentHomePage />
          </SheetContent>
        </Sheet>
      );
    }
  };

  return (
    <div
      className="flex flex-col cursor-pointer border border-primary h-full min-h-[50vh] lg:min-h-[55vh] 2xl:min-h-[60vh]"
      style={{ backgroundColor: bgColor }}
      onClick={handleCardClick}
    >
      <div className="w-full aspect-square flex-shrink-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>
      <div
        className="p-4 flex flex-col justify-between items-start flex-grow"
        style={{ color: textColor }}
      >
        <div className="pb-4">
          <p className="text-lg font-bold pb-2 hover:underline">{title}</p>
          <p className="text-sm min-h-[3rem]">{description}</p>
        </div>
        <div className="mt-auto">{renderActionButton()}</div>
      </div>
    </div>
  );
};

export default NavigationActionCard;
