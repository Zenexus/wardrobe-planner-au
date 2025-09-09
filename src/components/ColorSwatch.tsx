import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ColorSwatchProps = {
  selectedColor: "White" | "Oak";
  value: string;
  onClick: () => void;
  background: string;
  image?: string;
  className?: string;
};

const ColorSwatch = ({
  selectedColor,
  value,
  onClick,
  background,
  image,
  className,
}: ColorSwatchProps) => {
  const isSelected = selectedColor === value;

  return (
    <div className={cn("flex flex-col items-center gap-2 relative", className)}>
      <Button
        onClick={onClick}
        aria-label={`Select ${value} color`}
        aria-pressed={isSelected}
        className={cn(
          "w-12 h-12 rounded-full shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary overflow-hidden",
          isSelected
            ? "scale-105 shadow-lg ring-2 ring-primary ring-offset-1"
            : "border-secondary hover:border-secondary-foreground"
        )}
        style={!image ? { backgroundColor: background } : undefined}
      >
        {image ? (
          <img
            src={image}
            alt={`${value} texture`}
            className="w-12 h-12 object-cover object-center absolute top-0 left-0 rounded-full"
          />
        ) : null}
      </Button>

      <span className="text-sm text-foreground font-medium min-h-[1.25rem] flex items-center">
        {isSelected ? (
          <span className="font-semibold text-foreground">{value}</span>
        ) : (
          <span className="text-secondary-foreground">{value}</span>
        )}
      </span>
    </div>
  );
};

export default ColorSwatch;
