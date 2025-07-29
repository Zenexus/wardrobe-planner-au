export type Product = {
  itemNumber: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  color: string;
  desc: string;
  price: number;
  type: string;
  category: string;
  thumbnail: string;
  model: string;
};

export type WardrobeInstance = {
  id: string;
  product: Product;
  position: [number, number, number];
  rotation?: number; // Y-axis rotation in radians for wall attachment
  customizations?: Record<string, any>; // For future customization options
  addedAt: Date;
};
