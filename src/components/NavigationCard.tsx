import { CircleArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (type === "link") {
      navigate("/planner");
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
            <MenuSheetContentHomePage />
          </SheetContent>
          <SheetContent side="right" className="hidden sm:block">
            <MenuSheetContentHomePage />
          </SheetContent>
        </Sheet>
      );
    }
  };

  return (
    <div
      className="h-120 cursor-pointer border-[1px] border-primary"
      style={{ backgroundColor: bgColor }}
      onClick={handleCardClick}
    >
      <div className="w-full h-[60%]">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>
      <div
        className="p-6 flex flex-col justify-between items-start"
        style={{ color: textColor }}
      >
        <div className="pb-4">
          <p className="text-lg font-bold pb-2 hover:underline h-16">{title}</p>
          <p className="text-sm">{description}</p>
        </div>
        <div className="">{renderActionButton()}</div>
      </div>
    </div>
  );
};

export default NavigationActionCard;
