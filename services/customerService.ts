import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/db/firebase";

export interface CustomerData {
  email: string;
  name: string;
  postcode: string;
  acceptEmail: boolean;
  designId: string;
  createdAt?: any; // Firebase timestamp
  unixTimestamp?: number; // Unix timestamp in seconds
}

const CUSTOMERS_COLLECTION = "customers";

/**
 * Save customer data to Firebase when user submits the Share via Email form
 * @param customerData - The customer data to save
 */
export const saveCustomerData = async (
  customerData: Omit<CustomerData, "createdAt" | "unixTimestamp">
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const db = getDb();
    const currentUnixTimestamp = Math.floor(Date.now() / 1000);

    // Create a new document with auto-generated ID
    const docRef = doc(collection(db, CUSTOMERS_COLLECTION));

    await setDoc(docRef, {
      ...customerData,
      createdAt: serverTimestamp(),
      unixTimestamp: currentUnixTimestamp,
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
