import { 
  db, 
  auth, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  updateProfile 
} from './firebase';
import { cleanForFirestore } from './quizDbService';
import { UserProfile } from '../types';

/**
 * Resizes and center-crops any image to exactly 500x500 pixels,
 * returning a clean base64 data URL string for Firebase storage.
 */
export function resizeImageToBase64_500x500(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image. Please select a JPG, PNG, or WEBP.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.onload = () => {
        try {
          const TARGET_SIZE = 500;
          const canvas = document.createElement('canvas');
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not initialize canvas context.'));
            return;
          }

          // Pre-fill canvas with white background so transparent PNGs don't become black
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

          // Enable high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Square center-crop (cover fit) for any image aspect ratio and size
          const srcWidth = img.naturalWidth || img.width;
          const srcHeight = img.naturalHeight || img.height;
          const minDim = Math.min(srcWidth, srcHeight);
          const sx = (srcWidth - minDim) / 2;
          const sy = (srcHeight - minDim) / 2;

          ctx.drawImage(
            img,
            sx,
            sy,
            minDim,
            minDim,
            0,
            0,
            TARGET_SIZE,
            TARGET_SIZE
          );

          // Convert to JPEG base64 string at 0.86 quality (~35-50KB, well under Firestore 1MB document limit)
          const base64String = canvas.toDataURL('image/jpeg', 0.86);
          resolve(base64String);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fetches user profile data from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return { uid: snap.id, ...snap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Saves or updates user profile in Firestore (saving 500x500 base64 image string)
 * and safely updates Firebase Auth display name without exceeding photoURL length limits.
 */
export async function saveUserProfile(
  userId: string,
  data: {
    displayName: string;
    photoBase64?: string | null;
    email?: string;
  }
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const payload: Record<string, any> = {
      uid: userId,
      displayName: data.displayName.trim(),
      updatedAt: serverTimestamp(),
    };

    if (data.email) {
      payload.email = data.email;
    }

    if (data.photoBase64 !== undefined) {
      payload.photoBase64 = data.photoBase64;
    }

    // 1. Save in Firestore users collection (can store up to 1MB, plenty for 500x500 base64 image)
    await setDoc(userDocRef, cleanForFirestore(payload), { merge: true });

    // 2. Safely sync with Firebase Auth user profile
    // CRITICAL: Firebase Auth photoURL has a strict limit of 2,048 characters.
    // Base64 data URLs exceed 2,048 chars and will trigger "auth/invalid-profile-attribute (Photo URL too long)".
    // Therefore, only standard HTTP(S) URLs or null are passed to auth.currentUser.photoURL.
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const authUpdates: { displayName?: string; photoURL?: string | null } = {
          displayName: data.displayName.trim(),
        };

        if (data.photoBase64 === null) {
          authUpdates.photoURL = null;
        } else if (data.photoBase64 && !data.photoBase64.startsWith('data:')) {
          // Standard external URL (e.g. Google avatar)
          authUpdates.photoURL = data.photoBase64;
        }

        await updateProfile(auth.currentUser, authUpdates);
      } catch (authError) {
        console.warn('Firebase Auth updateProfile non-critical warning:', authError);
      }
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}
