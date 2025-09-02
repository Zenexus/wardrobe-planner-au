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
          className="bg-[#003b4a] text-white rounded-full hover:bg-white hover:text-[#003b4a] cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when button is clicked
            handleCardClick();
          }}
        >
          <CircleArrowRight className="w-16 h-16 stroke-1" />
        </div>
      );
    } else if (type === "openSheet") {
      return (
        <Sheet>
          <SheetTrigger asChild>
            <div
              className="bg-[#f5f5f5] text-[#003b4a] rounded-full hover:bg-white hover:text-[#003b4a] cursor-pointer transition-colors"
              onClick={(e) => e.stopPropagation()} // Prevent card click when button is clicked
            >
              <CircleArrowRight className="w-16 h-16 stroke-1" />
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
            className="h-140 cursor-pointer transition-transform hover:scale-105"
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
              className="p-6 flex flex-col justify-between gap-10 items-start"
              style={{ color: textColor }}
            >
              <div className="pb-6">
                <p className="text-lg font-bold pb-2 hover:underline">
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
      className="h-140 cursor-pointer transition-transform hover:scale-105"
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
        className="p-6 flex flex-col justify-between gap-10 items-start"
        style={{ color: textColor }}
      >
        <div className="pb-0 lg:pb-6">
          <p className="text-lg font-bold pb-2 hover:underline">{title}</p>
          <p className="text-sm">{description}</p>
        </div>

        {renderActionButton()}
      </div>
    </div>
  );
};

export default NavigationActionCard;
