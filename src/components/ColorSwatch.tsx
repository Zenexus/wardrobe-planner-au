// This component is used to display a color selector in the home page right hand side menu

type ColorSwatchProps = {
  isSelected: boolean;
  onClick: () => void;
  title: string;
  background: string;
};

const ColorSwatch = ({
  isSelected,
  onClick,
  title,
  background,
}: ColorSwatchProps) => {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={
        isSelected
          ? "w-14 h-14 rounded-full border-2 border-black shadow-sm hover:shadow cursor-pointer"
          : "w-14 h-14 rounded-full border-2 border-transparent shadow-sm hover:shadow cursor-pointer"
      }
      style={{ background }}
      title={title}
    />
  );
};

export default ColorSwatch;
