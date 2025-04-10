"use client";

import Image from "next/image";

import { useAuth } from '@/lib/hooks/useAuth';

export default function SignInWithGoogle(): JSX.Element {
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async (): Promise<void> => {
    try {
        await signInWithGoogle();
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error during Google sign-in attempt:", error.message);
        } else {
            console.error("An unexpected error occurred during Google sign-in:", String(error));
        }
    }
  };

  return (
    <button
      onClick={() => {
 void handleSignIn(); 
}}
      className="flex items-center justify-center bg-white text-gray-700 font-semibold py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 transition duration-300 ease-in-out shadow-sm"
    >
      <Image 
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
        alt="Google logo" 
        width={20} 
        height={20} 
        className="mr-3" 
      />
      Sign in with Google
    </button>
  );
}
