import { signOut, auth } from './firebase';

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
  }
}
