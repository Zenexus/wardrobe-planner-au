import React, { useState } from "react";

type SheetThumbnailsCarouselProps = {
  images: string[];
  alt: string;
  className?: string;
};

type ThumbProps = {
  selected: boolean;
  index: number;
  image: string;
  alt: string;
  onClick: () => void;
};

const Thumb: React.FC<ThumbProps> = ({
  selected,
  index,
  image,
  alt,
  onClick,
}) => {
  return (
    <div
      className={`border-[1px] border-gray-200 cursor-pointer overflow-hidden transition-all duration-200 ${
        selected
          ? "ring-2 ring-black/50 ring-offset-2"
          : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
      }`}
    >
      <button
        onClick={onClick}
        type="button"
        className="w-full h-full px-1 border-0 bg-transparent"
      >
        <img
          src={image}
          alt={`${alt} - Thumbnail ${index + 1}`}
          className="w-16 h-16 object-contain bg-gray-50"
        />
      </button>
    </div>
  );
};

const SheetThumbnailsCarousel: React.FC<SheetThumbnailsCarouselProps> = ({
  images,
  alt,
  className = "",
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleThumbClick = (index: number) => {
    setSelectedIndex(index);
  };

  // If only one image, show it without thumbnail navigation
  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-48 object-contain rounded-lg bg-gray-50"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <img
        src={images[selectedIndex]}
        alt={`${alt} - Main view`}
        className="w-full h-96 object-contain"
      />

      <div className="flex gap-2 items-center justify-start">
        {images.map((image, index) => (
          <Thumb
            key={index}
            selected={index === selectedIndex}
            index={index}
            image={image}
            alt={alt}
            onClick={() => handleThumbClick(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default SheetThumbnailsCarousel;
