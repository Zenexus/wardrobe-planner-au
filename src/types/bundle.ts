export type Bundle = {
  ItemName: string;
  code: string;
  name: string;
  description: string;
  thumbnail: string;
  model: string;
  price: number;
};

export type BundleData = {
  bundles: Bundle[];
};
