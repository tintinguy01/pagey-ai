"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/components/loading-provider";

/**
 * Component that listens to navigation events and shows loading spinners
 * This component should be included in the root layout
 */
function NavigationEventsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startLoading, stopLoading } = useLoading();
  
  // Track the previous path to detect navigation
  useEffect(() => {
    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    let navigationTimeout: NodeJS.Timeout | null = null;
    
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      // Check if this is an internal navigation (not external link)
      if (anchor && 
          anchor.href && 
          anchor.href.startsWith(window.location.origin) && 
          anchor.target !== '_blank' &&
          !anchor.hasAttribute('download') && 
          e.button === 0 && // Left click only
          !e.metaKey && !e.ctrlKey && !e.shiftKey // No modifier keys
      ) {
        const newPath = anchor.href.replace(window.location.origin, '');
        
        // Only show loading for actual path changes
        if (newPath !== currentPath) {
          startLoading();
          
          // Set a timeout to stop loading in case navigation fails or takes too long
          navigationTimeout = setTimeout(() => {
            stopLoading();
          }, 5000);
        }
      }
    };
    
    // Handle form submissions that navigate
    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form.method === 'get' && !form.hasAttribute('target')) {
        startLoading();
        
        navigationTimeout = setTimeout(() => {
          stopLoading();
        }, 5000);
      }
    };
    
    // Handle browser back/forward buttons
    const handlePopState = () => {
      startLoading();
      
      navigationTimeout = setTimeout(() => {
        stopLoading();
      }, 5000);
    };
    
    // Handle beforeunload for full page navigations
    const handleBeforeUnload = () => {
      startLoading();
    };
    
    // Add event listeners
    document.addEventListener('click', handleAnchorClick);
    document.addEventListener('submit', handleFormSubmit);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('click', handleAnchorClick);
      document.removeEventListener('submit', handleFormSubmit);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [pathname, searchParams, startLoading, stopLoading]);
  
  // Reset loading state when we detect a completed navigation
  useEffect(() => {
    // When pathname or search params change, navigation is complete
    stopLoading();
  }, [pathname, searchParams, stopLoading]);
  
  return null;
}

// Wrap the component in a Suspense boundary
export function NavigationEvents() {
  return (
    <Suspense fallback={null}>
      <NavigationEventsContent />
    </Suspense>
  );
} 