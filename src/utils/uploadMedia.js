import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../services/firebase";

export const uploadMediaAsync = async (uri, path) => {
  try {
    // Convert local file URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);

    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
