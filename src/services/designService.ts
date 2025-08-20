import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
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
}

const DESIGNS_COLLECTION = "designs";

/**
 * Save design state to Firebase
 * @param designState - The design state to save
 * @param designId - Optional specific ID, if not provided will generate one
 * @param userId - Optional user ID for multi-user support
 */
export const saveDesignToFirebase = async (
  designState: SavedDesignState,
  firebaseId?: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const designData: Omit<FirebaseDesignState, "id"> = {
      ...designState,
      updatedAt: serverTimestamp(),
    };

    let docRef;

    if (firebaseId) {
      // Update existing design
      docRef = doc(db, DESIGNS_COLLECTION, firebaseId);
      await updateDoc(docRef, {
        ...designData,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new design
      docRef = doc(collection(db, DESIGNS_COLLECTION));
      await setDoc(docRef, {
        ...designData,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving design to Firebase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get design state from Firebase by ID
 * @param designId - The design ID to retrieve
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
    console.error("Error getting design from Firebase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get design by designId (human-friendly code)
 * @param designCode - The design code (e.g., W3K8ZQ12)
 */
export const getDesignByCode = async (
  designCode: string
): Promise<{
  success: boolean;
  data?: FirebaseDesignState;
  error?: string;
}> => {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where("designId", "==", designCode),
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
        error: "Design not found",
      };
    }
  } catch (error) {
    console.error("Error getting design by code from Firebase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
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
    console.error("Error getting latest design from Firebase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Delete a design from Firebase
 * @param designId - The design ID to delete
 */
export const deleteDesignFromFirebase = async (
  designId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    await updateDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting design from Firebase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
