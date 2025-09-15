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
          <CircleArrowRight className="w-12 h-12 stroke-1" />
        </div>
      );
    } else if (type === "openSheet") {
      return (
        <Sheet>
          <SheetTrigger asChild>
            <div
              className="bg-secondary text-primary rounded-full hover:bg-background hover:text-primary cursor-pointer transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <CircleArrowRight className="w-12 h-12 stroke-1" />
            </div>
          </SheetTrigger>
          <SheetContent side="right">
            <MenuSheetContentHomePage />
          </SheetContent>
        </Sheet>
      );
    }
  };

  // For openSheet type, we need to wrap the entire card in a Sheet
  if (type === "openSheet") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <div
            className="h-120 cursor-pointer"
            style={{ backgroundColor: bgColor }}
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
              <div className="pb-6">
                <p className="text-lg h-16 font-bold pb-2 hover:underline">
                  {title}
                </p>
                <p className="text-sm">{description}</p>
              </div>

              {renderActionButton()}
            </div>
          </div>
        </SheetTrigger>
        <SheetContent side="right">
          <MenuSheetContentHomePage />
        </SheetContent>
      </Sheet>
    );
  }

  // For link type, the entire card is clickable
  return (
    <div
      className="h-120 cursor-pointer"
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
        <div className="pr-1">{renderActionButton()}</div>
      </div>
    </div>
  );
};

export default NavigationActionCard;
