import { useMemo, useCallback } from "react";
import { ProductCard } from "./ui/product-card";
import productsData from "../products.json";
import { useStore } from "../store";
import { Product } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ColorSwatch from "./ColorSwatch";

// Constants for better maintainability and type safety
const CATEGORIES = {
  CORE: "Core Wardrobe Range",
  FOUR_HUNDRED_MM: "400mm Wardrobe Range",
} as const;

const COLORS = {
  WHITE: "White",
  OAK: "Oak",
} as const;

const DEPTH_TABS = {
  CORE: "Core",
  FOUR_HUNDRED_MM: "400mm",
} as const;

const COLOR_CONFIGS = {
  [COLORS.WHITE]: {
    value: COLORS.WHITE,
    background: "#E6E6E6",
    label: "White",
    image: undefined,
  },
  [COLORS.OAK]: {
    value: COLORS.OAK,
    background: "#D8B589",
    label: "Oak",
    image: "/images/Oak.avif",
  },
} as const;

type ColorOption = (typeof COLORS)[keyof typeof COLORS];

/**
 * Hook for filtering and memoizing products by category and color
 * Performance optimization: prevents re-filtering on every render
 */
const useFilteredProducts = () => {
  return useMemo(() => {
    const coreProducts = productsData.products.filter(
      (product) => product.category === CATEGORIES.CORE
    );

    const fourHundredProducts = productsData.products.filter(
      (product) => product.category === CATEGORIES.FOUR_HUNDRED_MM
    );

    const whiteProducts = fourHundredProducts.filter(
      (product) => product.color === COLORS.WHITE
    );

    const oakProducts = fourHundredProducts.filter(
      (product) => product.color === COLORS.OAK
    );

    return {
      core: coreProducts,
      fourHundredWhite: whiteProducts,
      fourHundredOak: oakProducts,
    };
  }, []); // Empty dependency array since productsData is static
};

/**
 * Reusable component for rendering product grids
 * Reduces code duplication and improves maintainability
 */
type ProductGridProps = {
  products: Product[];
  onAddToDesign: (product: Product) => void;
  checkSpaceAvailability: (model: string) => boolean;
  className?: string;
  title?: string;
};

const ProductGrid = ({
  products,
  onAddToDesign,
  checkSpaceAvailability,
  className = "grid grid-cols-2 gap-4 mt-2",
  title,
}: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No products available in this category
      </div>
    );
  }

  return (
    <section>
      {title && <div className="font-bold mb-2">{title}</div>}
      <div className={className}>
        {products.map((product) => {
          const hasSpace = checkSpaceAvailability(product.model);
          return (
            <ProductCard
              key={product.itemNumber}
              product={product}
              onAddToDesign={onAddToDesign}
              hasSpace={hasSpace}
            />
          );
        })}
      </div>
    </section>
  );
};

/**
 * Color selection component with improved accessibility and type safety
 */
interface ColorSelectorProps {
  selectedColor: ColorOption;
  onColorChange: (color: ColorOption) => void;
  availableColors: ColorOption[];
}

const ColorSelector = ({
  selectedColor,
  onColorChange,
  availableColors,
}: ColorSelectorProps) => (
  <section className="mt-4">
    <h3 id="color-selection-label" className="font-semibold mb-4">
      Change colour
    </h3>

    <div
      className="flex items-start gap-6 mt-2"
      role="radiogroup"
      aria-labelledby="color-selection-label"
    >
      {availableColors.map((color) => {
        const config = COLOR_CONFIGS[color];
        return (
          <ColorSwatch
            key={color}
            selectedColor={selectedColor}
            value={config.value}
            onClick={() => onColorChange(color)}
            background={config.background}
            image={config.image}
          />
        );
      })}
    </div>
  </section>
);

/**
 * Main ProductSelection component with improved architecture
 * - Better separation of concerns
 * - Performance optimizations
 * - Enhanced type safety
 * - Reduced code duplication
 */
const ProductSelection = () => {
  const {
    addWardrobeInstance,
    checkSpaceAvailability,
    selectedColor,
    setSelectedColor,
    depthTab,
    setDepthTab,
  } = useStore();

  const filteredProducts = useFilteredProducts();

  // Memoized handlers for better performance
  const handleAddToDesign = useCallback(
    (product: Product) => {
      addWardrobeInstance(product);
    },
    [addWardrobeInstance]
  );

  const handleDepthTabChange = useCallback(
    (value: string) => {
      // Type-safe depth tab handling
      const validValues = Object.values(DEPTH_TABS);
      if (validValues.includes(value as any)) {
        setDepthTab(value as "Core" | "400mm");
      }
    },
    [setDepthTab]
  );

  const handleColorChange = useCallback(
    (color: ColorOption) => {
      setSelectedColor(color);
    },
    [setSelectedColor]
  );

  // Determine available colors based on selected depth tab
  const availableColors: ColorOption[] = useMemo(() => {
    if (depthTab === DEPTH_TABS.CORE) {
      return [COLORS.WHITE];
    }
    return [COLORS.WHITE, COLORS.OAK];
  }, [depthTab]);

  // Get products for 400mm tab based on selected color
  const fourHundredProducts = useMemo(() => {
    return selectedColor === COLORS.WHITE
      ? filteredProducts.fourHundredWhite
      : filteredProducts.fourHundredOak;
  }, [selectedColor, filteredProducts]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-primary">
          Design your Flexi Wardrobe
        </h1>
      </header>

      <ColorSelector
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
        availableColors={availableColors}
      />

      <section className="mt-6">
        <h2 className="font-semibold mb-4">Depth</h2>
        <Tabs
          value={depthTab}
          onValueChange={handleDepthTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value={DEPTH_TABS.CORE}>Core</TabsTrigger>
            <TabsTrigger value={DEPTH_TABS.FOUR_HUNDRED_MM}>400mm</TabsTrigger>
          </TabsList>

          <TabsContent value={DEPTH_TABS.CORE} className="mt-2">
            <ProductGrid
              products={filteredProducts.core}
              onAddToDesign={handleAddToDesign}
              checkSpaceAvailability={checkSpaceAvailability}
              title="Core Wardrobe Range"
            />
          </TabsContent>

          <TabsContent value={DEPTH_TABS.FOUR_HUNDRED_MM} className="mt-2">
            <ProductGrid
              products={fourHundredProducts}
              onAddToDesign={handleAddToDesign}
              checkSpaceAvailability={checkSpaceAvailability}
              title="400mm Wardrobe Range"
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default ProductSelection;
