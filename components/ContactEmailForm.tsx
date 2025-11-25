"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/store";
import { getBundleComposition } from "@/utils/bundleComposition";
import { saveCustomerData } from "@/services/customerService";

const ContactEmailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().min(1, "Name is required"),
  postcode: z.string().optional().or(z.literal("")),
  subscribe: z.boolean().default(false).optional(),
});

type ContactEmailValues = z.infer<typeof ContactEmailSchema>;

const ContactEmailForm = () => {
  const {
    wardrobeInstances,
    selectedOrganizers,
    currentDesignCode,
    getBundles,
    getProducts,
    getAccessories,
  } = useStore();
  const screenshotFromStore = useStore((s) => s.canvasScreenshotDataUrl);

  // Use state for screenshot to avoid hydration mismatch
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // Load screenshot from localStorage after hydration
  useEffect(() => {
    const screenshotFromStorage =
      window.localStorage.getItem("designScreenshot");
    setScreenshot(screenshotFromStore || screenshotFromStorage);
  }, [screenshotFromStore]);

  const form = useForm<ContactEmailValues>({
    resolver: zodResolver(ContactEmailSchema),
    defaultValues: {
      email: "",
      name: "",
      postcode: "",
      subscribe: false,
    },
  });

  const [status, setStatus] = useState<
    null | "idle" | "loading" | "success" | "error"
  >(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onSubmit = async (values: ContactEmailValues) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      // Helper function to get image URL (prefers cloud URL, fallback to local)
      const getImageUrl = (item: any) => {
        // First try imageUrl from Firebase (cloud-hosted)
        if (item?.imageUrl) return item.imageUrl;

        // Fallback to local images with absolute URL
        const localPath = item?.images?.[0] || item?.thumbnail || "";
        if (!localPath) return "";
        if (localPath.startsWith("http")) return localPath;

        const baseUrl = window.location.origin;
        return `${baseUrl}${localPath.startsWith("/") ? localPath : "/" + localPath}`;
      };

      // Load data for bundle decomposition
      const [bundlesData, productsData, accessoriesData] = await Promise.all([
        getBundles(),
        getProducts(),
        getAccessories(),
      ]);

      // Prepare product data with bundle decomposition
      const productMap = new Map<string, any>();

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
            const existing = productMap.get(key);

            if (existing) {
              existing.quantity += item.quantity;
              existing.totalPrice += item.price * item.quantity;
            } else {
              // Find the product details from productsData or accessoriesData
              const productDetail =
                productsData.find((p) => p.itemNumber === item.itemNumber) ||
                accessoriesData.find((a) => a.itemNumber === item.itemNumber);

              productMap.set(key, {
                itemNumber: item.itemNumber,
                name: item.name,
                image: getImageUrl(productDetail),
                price: item.price,
                quantity: item.quantity,
                totalPrice: item.price * item.quantity,
                dimensions: productDetail
                  ? {
                      width: productDetail.width,
                      height: productDetail.height,
                      depth: productDetail.depth,
                    }
                  : undefined,
              });
            }
          }
        } else {
          // For regular products
          const key = instance.product.itemNumber;
          const existing = productMap.get(key);

          if (existing) {
            existing.quantity += 1;
            existing.totalPrice += instance.product.price;
          } else {
            productMap.set(key, {
              itemNumber: instance.product.itemNumber,
              name: instance.product.name,
              image: getImageUrl(instance.product),
              price: instance.product.price,
              quantity: 1,
              totalPrice: instance.product.price,
              dimensions: {
                width: instance.product.width,
                height: instance.product.height,
                depth: instance.product.depth,
              },
            });
          }
        }
      }

      const groupedProductsArray = Array.from(productMap.values());

      // Prepare organizer data
      const organizerData = selectedOrganizers.map((item) => {
        return {
          itemNumber: item.organizer.itemNumber,
          name: item.organizer.name,
          image: getImageUrl(item.organizer),
          price: item.organizer.price,
          quantity: item.quantity,
          totalPrice: item.organizer.price * item.quantity,
          dimensions: {
            width: item.organizer.width,
            height: item.organizer.height,
            depth: item.organizer.depth,
          },
        };
      });

      // Calculate totals
      const wardrobeTotalPrice = wardrobeInstances.reduce(
        (sum, instance) => sum + instance.product.price,
        0
      );
      const organizerTotalPrice = selectedOrganizers.reduce(
        (sum, item) => sum + item.organizer.price * item.quantity,
        0
      );
      const totalPrice = wardrobeTotalPrice + organizerTotalPrice;
      const totalItems =
        groupedProductsArray.length + selectedOrganizers.length;
      const totalQuantity =
        wardrobeInstances.length +
        selectedOrganizers.reduce((sum, item) => sum + item.quantity, 0);

      // Generate design code if not exists
      const designCode =
        currentDesignCode || `W${Date.now().toString().slice(-6)}`;

      // Save the generated code to store if it was newly created
      if (!currentDesignCode) {
        useStore.getState().setCurrentDesignCode(designCode);
      }

      // Generate Bunnings checkout URLs using the same decomposed data
      const generateBunningsUrls = () => {
        try {
          // Build cart from decomposed products
          const cartMap = new Map<
            string,
            { itemNumber: string; qty: number }
          >();

          // Add all products (already decomposed)
          for (const product of groupedProductsArray) {
            cartMap.set(product.itemNumber, {
              itemNumber: product.itemNumber,
              qty: product.quantity,
            });
          }

          // Add organizers
          for (const item of selectedOrganizers) {
            const key = item.organizer.itemNumber;
            const current = cartMap.get(key);
            if (current) {
              current.qty += item.quantity;
            } else {
              cartMap.set(key, {
                itemNumber: key,
                qty: item.quantity,
              });
            }
          }

          const groupedCart = Array.from(cartMap.values());
          const items = groupedCart
            .map((i) => `${i.itemNumber}:${i.qty}`)
            .join(",");

          // Generate URLs for email (using email UTM)
          const region = (process.env.NEXT_PUBLIC_SITE_REGION || "AU")
            .toString()
            .toUpperCase();
          const isNZ = region === "NZ";
          const domain = isNZ ? "co.nz" : "com.au";
          const utmEmail =
            "&utm_source=flexi-storage-wardrobe&utm_medium=supplier&utm_campaign=planner&utm_content=email";

          return {
            bunnings: `https://www.bunnings.${domain}/share-cart?items=${items}${utmEmail}`,
            trade: `https://trade.bunnings.${domain}/share-cart?items=${items}${utmEmail}`,
          };
        } catch (error) {
          console.error("Failed to generate Bunnings URLs:", error);
          return { bunnings: "", trade: "" };
        }
      };

      const bunningsUrls = generateBunningsUrls();

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: values.email,
          subject: `Your Flexi Wardrobe Design - ${values.name}`,
          url: `https://wardrobe-planner.flexistorage.com.au/?code=${designCode}`,
          customerName: values.name,
          screenshotBase64: screenshot,
          products: groupedProductsArray,
          organizers: organizerData,
          totalPrice,
          totalItems,
          totalQuantity,
          designCode: designCode,
          bunningsCheckoutUrl: bunningsUrls.bunnings,
          bunningsTradeCheckoutUrl: bunningsUrls.trade,
        }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        // Save customer data to database
        const customerResult = await saveCustomerData({
          email: values.email,
          name: values.name,
          postcode: values.postcode || "",
          acceptEmail: values.subscribe || false,
          designId: designCode,
        });

        if (!customerResult.success) {
          console.error("Failed to save customer data:", customerResult.error);
          // Don't show error to user since email was sent successfully
        }

        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setErrorMessage(
          result.error || "Failed to send email. Please try again."
        );
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
      console.error("Email submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input type="email" {...field} className="h-[50px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} className="h-[50px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode</FormLabel>
              <FormControl>
                <Input {...field} className="h-[50px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subscribe"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={!!field.value}
                    className="h-5 w-5 cursor-pointer"
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                    aria-label="Subscribe to updates"
                  />
                  <span className="text-gray-800">
                    Send me Flexi Wardrobe News, events and exclusive offers. We
                    will email you occasional news and special offers. We will
                    not sell or distribute your email to any third party at any
                    time.
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={
              status === "loading" ||
              !form.watch("email") ||
              !form.watch("name")
            }
            className="w-full h-[50px] cursor-pointer"
          >
            {status === "loading" ? "Submitting..." : "Submit"}
          </Button>
          {status === "success" && (
            <span className="text-green-600 text-sm">Submitted.</span>
          )}
          {status === "error" && (
            <span className="text-red-600 text-sm">{errorMessage}</span>
          )}
        </div>
      </form>
    </Form>
  );
};

export default ContactEmailForm;
