"use client";

import { useRouter } from "next/navigation";
import { useLoading } from "@/components/loading-provider";
import { useClerk, useAuth } from "@clerk/nextjs";

/**
 * A custom hook for handling navigation with loading states and authentication
 */
export function useLoadingNavigation() {
  const router = useRouter();
  const { startLoading } = useLoading();
  const { openSignIn, openSignUp } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  
  /**
   * Navigate to a protected route with loading indicator
   * @param route The route to navigate to
   */
  const navigateWithLoading = (route: string) => {
    // Just trigger loading and navigate - our NavigationEvents component
    // will handle stopping the loading state when navigation completes
    startLoading();
    router.push(route);
  };
  
  /**
   * Handle an action that requires authentication
   * @param onAuthenticated Function to call when user is authenticated
   * @param signInMode Whether to use 'signIn' or 'signUp' if user is not authenticated
   */
  const handleAuthAction = (
    onAuthenticated: () => void, 
    signInMode: 'signIn' | 'signUp' = 'signIn'
  ) => {
    if (!isLoaded) return;
    
    if (isSignedIn) {
      onAuthenticated();
    } else {
      if (signInMode === 'signIn') {
        openSignIn();
      } else {
        openSignUp();
      }
    }
  };
  
  /**
   * Navigate to dashboard with authentication and loading
   */
  const navigateToDashboard = () => {
    handleAuthAction(() => {
      navigateWithLoading('/dashboard');
    }, 'signIn');
  };
  
  return {
    navigateWithLoading,
    handleAuthAction,
    navigateToDashboard,
    isSignedIn,
    isLoaded
  };
} 