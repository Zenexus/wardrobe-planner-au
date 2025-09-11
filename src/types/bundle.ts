export type Bundle = {
  ItemName: string;
  code: string;
  name: string;
  description: string;
  intro?: string;
  thumbnail: string;
  model: string;
  price?: number; // Optional for input, will be calculated
  packDetails?: string[];
};

export type BundleWithPrice = Bundle & {
  price: number; // Required after calculation
};

export type BundleData = {
  bundles: Bundle[];
};
