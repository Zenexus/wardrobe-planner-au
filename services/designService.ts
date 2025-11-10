import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/db/firebase";
import { SavedDesignState } from "@/utils/memorySystem";

export interface FirebaseDesignState extends SavedDesignState {
  id?: string;
  createdAt?: any;
  updatedAt?: any;
  unixTimestamp?: number; // Unix timestamp in seconds
}

// currently the firebase use this name
const DESIGNS_COLLECTION = "designs";
const BUNNINGS_DESIGNS_COLLECTION = "bunnings_designs";
const BUNNINGS_TRADE_DESIGNS_COLLECTION = "bunnings_trade_designs";

/**
 * Save design state to Firebase
 * @param designState - The design state to save
 * @param firebaseId - Optional specific ID for updates, if not provided will use designId as document ID
 */
export const saveDesignToFirebase = async (
  designState: SavedDesignState,
  firebaseId?: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const currentUnixTimestamp = Math.floor(Date.now() / 1000);
    const designData: Omit<FirebaseDesignState, "id"> = {
      ...designState,
      unixTimestamp: currentUnixTimestamp,
      updatedAt: serverTimestamp(),
    };

    let docRef;
    const documentId = firebaseId || designState.designId;

    if (firebaseId) {
      // Update existing design using firebaseId
      docRef = doc(db, DESIGNS_COLLECTION, firebaseId);
      await updateDoc(docRef, {
        ...designData,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new design using designId as document ID
      docRef = doc(db, DESIGNS_COLLECTION, designState.designId);
      await setDoc(docRef, {
        ...designData,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true, id: documentId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get design state from Firebase by designId (now used as document ID)
 * @param designId - The design ID to retrieve (e.g., W3K8ZQ12)
 */
export const getDesignFromFirebase = async (
  designId: string
): Promise<{
  success: boolean;
  data?: FirebaseDesignState;
  error?: string;
}> => {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as FirebaseDesignState;
      return {
        success: true,
        data: {
          ...data,
          id: docSnap.id,
        },
      };
    } else {
      return {
        success: false,
        error: "Design not found",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get design by designId (human-friendly code) - now just an alias for getDesignFromFirebase
 * @param designCode - The design code (e.g., W3K8ZQ12)
 */
export const getDesignByCode = async (
  designCode: string
): Promise<{
  success: boolean;
  data?: FirebaseDesignState;
  error?: string;
}> => {
  // Since we now use designId as document ID, this is just a direct lookup
  return getDesignFromFirebase(designCode);
};

/**
 * Get the latest design (useful for anonymous users)
 * This gets the most recently updated design
 */
export const getLatestDesign = async (): Promise<{
  success: boolean;
  data?: FirebaseDesignState;
  error?: string;
}> => {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data() as FirebaseDesignState;
      return {
        success: true,
        data: {
          ...data,
          id: doc.id,
        },
      };
    } else {
      return {
        success: false,
        error: "No designs found",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save design state to Bunnings collection
 * @param designState - The design state to save
 * @param firebaseId - Optional specific ID for updates, if not provided will use designId as document ID
 */
export const saveDesignToBunnings = async (
  designState: SavedDesignState,
  firebaseId?: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const currentUnixTimestamp = Math.floor(Date.now() / 1000);
    const designData: Omit<FirebaseDesignState, "id"> = {
      ...designState,
      unixTimestamp: currentUnixTimestamp,
      updatedAt: serverTimestamp(),
    };

    let docRef;
    const documentId = firebaseId || designState.designId;

    if (firebaseId) {
      // Update existing design using firebaseId
      docRef = doc(db, BUNNINGS_DESIGNS_COLLECTION, firebaseId);
      await updateDoc(docRef, {
        ...designData,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new design using designId as document ID
      docRef = doc(db, BUNNINGS_DESIGNS_COLLECTION, designState.designId);
      await setDoc(docRef, {
        ...designData,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true, id: documentId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save design state to Bunnings Trade collection
 * @param designState - The design state to save
 * @param firebaseId - Optional specific ID for updates, if not provided will use designId as document ID
 */
export const saveDesignToBunningsTrade = async (
  designState: SavedDesignState,
  firebaseId?: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const currentUnixTimestamp = Math.floor(Date.now() / 1000);
    const designData: Omit<FirebaseDesignState, "id"> = {
      ...designState,
      unixTimestamp: currentUnixTimestamp,
      updatedAt: serverTimestamp(),
    };

    let docRef;
    const documentId = firebaseId || designState.designId;

    if (firebaseId) {
      // Update existing design using firebaseId
      docRef = doc(db, BUNNINGS_TRADE_DESIGNS_COLLECTION, firebaseId);
      await updateDoc(docRef, {
        ...designData,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new design using designId as document ID
      docRef = doc(db, BUNNINGS_TRADE_DESIGNS_COLLECTION, designState.designId);
      await setDoc(docRef, {
        ...designData,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true, id: documentId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Delete a design from Firebase
 * @param designId - The design ID to delete (e.g., W3K8ZQ12)
 */
export const deleteDesignFromFirebase = async (
  designId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    await updateDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      unixTimestamp: Math.floor(Date.now() / 1000), // Update unix timestamp on deletion
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
