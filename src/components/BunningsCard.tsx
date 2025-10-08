import { useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { getBundleComposition } from "@/utils/bundleComposition";

type AccountType = "normal" | "powerPass";

export default function BunningsCard() {
  const wardrobeInstances = useStore((s) => s.wardrobeInstances);
  const selectedOrganizers = useStore((s) => s.selectedOrganizers);
  const { getBundles, getProducts, getAccessories } = useStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bundlesData, setBundlesData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [accessoriesData, setAccessoriesData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bundles, products, accessories] = await Promise.all([
          getBundles(),
          getProducts(),
          getAccessories(),
        ]);
        setBundlesData(bundles);
        setProductsData(products);
        setAccessoriesData(accessories);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, [getBundles, getProducts, getAccessories]);

  const groupedCart = useMemo(() => {
    const map = new Map<
      string,
      { itemNumber: string; qty: number; price: number }
    >();

    // Add wardrobe instances (decompose bundles)
    for (const instance of wardrobeInstances) {
      const bundleComposition = getBundleComposition(
        instance,
        bundlesData,
        productsData,
        accessoriesData
      );

      if (bundleComposition.isBundle) {
        // For bundles, add each component item
        for (const item of bundleComposition.totalItems) {
          const key = item.itemNumber;
          const price = item.price;
          const quantity = item.quantity;

          const current = map.get(key);
          if (current) {
            current.qty += quantity;
          } else {
            map.set(key, { itemNumber: key, qty: quantity, price });
          }
        }
      } else {
        // For regular products, add as before
        const key = instance.product.itemNumber;
        const price = instance.product.price;
        const current = map.get(key);
        if (current) {
          current.qty += 1;
        } else {
          map.set(key, { itemNumber: key, qty: 1, price });
        }
      }
    }

    // Add selected organizers
    for (const selectedOrganizer of selectedOrganizers) {
      const key = selectedOrganizer.organizer.itemNumber;
      const price = selectedOrganizer.organizer.price;
      const quantity = selectedOrganizer.quantity;

      const current = map.get(key);
      if (current) {
        current.qty += quantity;
      } else {
        map.set(key, { itemNumber: key, qty: quantity, price });
      }
    }

    return Array.from(map.values());
  }, [
    wardrobeInstances,
    selectedOrganizers,
    bundlesData,
    productsData,
    accessoriesData,
  ]);

  const makeShareUrls = useCallback(
    (accountType: AccountType) => {
      const venv = (import.meta as any).env as Record<
        string,
        string | undefined
      >;
      const region = (venv.VITE_SITE_REGION || "AU").toString().toUpperCase();
      const isNZ = region === "NZ";
      const domain = isNZ ? "co.nz" : "com.au";
      const prefix =
        accountType === "powerPass"
          ? "https://trade.bunnings."
          : "https://www.bunnings.";
      const baseURL = `${prefix}${domain}/share-cart?items=`;
      // FIXME: Update UTM parameters
      const utmWebsite =
        "&utm_source=wardrobe-planner&utm_medium=supplier&utm_campaign=planner&utm_content=website";
      const utmEmail =
        "&utm_source=wardrobe-planner&utm_medium=supplier&utm_campaign=planner&utm_content=email";

      const items = groupedCart
        .map((i) => `${i.itemNumber}:${i.qty}`)
        .join(",");
      return {
        website: `${baseURL}${items}${utmWebsite}`,
        email: `${baseURL}${items}${utmEmail}`,
      };
    },
    [groupedCart]
  );

  const validate = useCallback(() => {
    if (groupedCart.length === 0) {
      return { ok: false, reason: "Your cart is empty." } as const;
    }
    const allQtyOk = groupedCart.every((i) => i.qty < 999);
    if (!allQtyOk)
      return {
        ok: false,
        reason: "Quantity per product must be < 999.",
      } as const;
    if (groupedCart.length >= 999)
      return {
        ok: false,
        reason: "Too many unique items (limit 999).",
      } as const;
    const priceOk =
      groupedCart.reduce((s, i) => s + i.qty * i.price, 0) < 30000;
    if (!priceOk)
      return { ok: false, reason: "Total must be under $30,000." } as const;
    return { ok: true } as const;
  }, [groupedCart]);

  const handleCheckout = (accountType: AccountType) => {
    const v = validate();
    if (!v.ok) {
      setErrorMessage(v.reason);
      return;
    }
    const { website, email } = makeShareUrls(accountType);

    const websiteQs = website.split("?")[1] || "";
    const emailQs = email.split("?")[1] || "";
    if (websiteQs.length >= 2048) {
      setErrorMessage("The share link is too long.");
      return;
    }
    if (emailQs.length >= 2048) {
      setErrorMessage("The email share link is too long.");
      return;
    }
    window.open(website, "_blank");
  };

  return (
    <div className="w-full bg-gray-100 rounded p-6 mt-6">
      <div className="flex flex-col">
        <div className="text-[#0D5257] font-bold text-lg mb-6">
          Order these products with the Bunnings website
        </div>
        <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center justify-between mb-4">
          <p className="text-gray-800">
            Or place an order at your local Bunnings at the Customer Special
            Order desk. Stock availability depends on store or location.
          </p>
          <Button
            className="bg-[#DA291C] hover:bg-[#b52218] text-white px-4 py-5 h-auto w-full xl:w-64 justify-center items-center gap-2 cursor-pointer"
            onClick={() => handleCheckout("normal")}
          >
            <span>Checkout at</span>
            <img
              src="/logo/Bunnings_Logo.png"
              alt="Bunnings"
              className="h-5 w-auto object-contain"
            />
          </Button>
        </div>
        <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center justify-between">
          <p className="text-gray-800">
            PowerPass account required to checkout at Bunnings Trade.
            <br />
            PowerPass pricing will be visible once logged in.
          </p>
          <Button
            className="bg-[#FFAB00] hover:bg-[#e09a00] text-gray-900 px-4 py-5 h-auto w-full xl:w-64 justify-center items-center gap-2 cursor-pointer"
            onClick={() => handleCheckout("powerPass")}
          >
            <span>Checkout at</span>
            <img
              src="/logo/Bunnings_Trade_Logo.png"
              alt="Bunnings Trade"
              className="h-5 w-auto object-contain"
            />
          </Button>
        </div>
        {errorMessage && (
          <div className="mt-4 text-sm text-red-600">{errorMessage}</div>
        )}
      </div>
    </div>
  );
}
