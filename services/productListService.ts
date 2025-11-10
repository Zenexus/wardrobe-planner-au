import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/db/firebase";

// Get wardrobe planner products
const getProducts = async (): Promise<any[]> => {
  const productsRef = query(
    collection(db, "products")
    //FIXME: add isAvailabled to the database, currently we don't have
    // where("isAvailabled", "==", true)
  );
  const productsSp = await getDocs(productsRef);

  const products = productsSp.docs.map((doc) => doc.data()) as any[];
  return products;
};

// Get wardrobe planner accessories
const getAccessories = async (): Promise<any[]> => {
  const accessoriesRef = query(
    collection(db, "accessories")
    //FIXME: add isAvailabled to the database, currently we don't have
    // where("isAvailabled", "==", true)
  );
  const accessoriesSp = await getDocs(accessoriesRef);

  const accessories = accessoriesSp.docs.map((doc) => doc.data()) as any[];
  return accessories;
};

// Get wardrobe planner organisors
const getOrganisors = async (): Promise<any[]> => {
  const organisorsRef = query(
    collection(db, "organisors")
    //FIXME: add isAvailabled to the database, currently we don't have
    // where("isAvailabled", "==", true)
  );
  const organisorsSp = await getDocs(organisorsRef);

  const organisors = organisorsSp.docs.map((doc) => doc.data()) as any[];
  return organisors;
};

const getBundles = async (): Promise<any[]> => {
  const bundlesRef = query(
    collection(db, "bundles")
    //FIXME: add isAvailabled to the database, currently we don't have
    // where("isAvailabled", "==", true)
  );
  const bundlesSp = await getDocs(bundlesRef);

  const bundles = bundlesSp.docs.map((doc) => doc.data()) as any[];
  return bundles;
};

// Get all wardrobe planner products (products + accessories + components)
const getAllWardrobeProducts = async (): Promise<any[]> => {
  const [products, accessories, organisors, bundles] = await Promise.all([
    getProducts(),
    getAccessories(),
    getOrganisors(),
    getBundles(),
  ]);

  const allItems = [...products, ...accessories, ...organisors, ...bundles];
  return allItems;
};

const WardrobePlannerProductService = {
  getProducts,
  getAccessories,
  getOrganisors,
  getBundles,
  getAllWardrobeProducts,
};

export default WardrobePlannerProductService;
