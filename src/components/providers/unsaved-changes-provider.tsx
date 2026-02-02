"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect,
  useRef,
  ReactNode 
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnsavedChangesContextType {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Set the dirty state */
  setDirty: (dirty: boolean) => void;
  /** Mark the form as having unsaved changes */
  markDirty: () => void;
  /** Mark the form as clean (saved) */
  markClean: () => void;
  /** Navigate with confirmation if dirty */
  navigateWithConfirm: (href: string) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error("useUnsavedChanges must be used within an UnsavedChangesProvider");
  }
  return context;
}

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const isDirtyRef = useRef(isDirty);
  const isNavigatingRef = useRef(false);
  const lastPathnameRef = useRef(pathname);

  // Keep ref in sync with state
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Browser beforeunload handler (handles refresh/close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        // Modern browsers show a generic message, but we still need to set returnValue
        e.returnValue = "Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Handle browser back/forward button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (isDirtyRef.current && !isNavigatingRef.current) {
        // Push state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        // Show confirmation dialog
        setPendingNavigation("__back__");
        setShowDialog(true);
      }
    };

    // Push initial state to enable popstate detection
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Intercept link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Only intercept left clicks without modifier keys
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      if (!link) return;
      
      const href = link.getAttribute("href");
      
      // Ignore external links, hash links, and javascript: links
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("javascript:")) {
        return;
      }

      // Check if we're dirty
      if (isDirtyRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setPendingNavigation(href);
        setShowDialog(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Reset dirty state when pathname changes (successful navigation)
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      // Only reset if we're not in a pending navigation
      if (!showDialog) {
        setIsDirty(false);
      }
    }
  }, [pathname, showDialog]);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);
  const setDirty = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  const navigateWithConfirm = useCallback((href: string) => {
    if (isDirtyRef.current) {
      setPendingNavigation(href);
      setShowDialog(true);
    } else {
      router.push(href);
    }
  }, [router]);

  const handleConfirmLeave = () => {
    setShowDialog(false);
    setIsDirty(false);
    isNavigatingRef.current = true;
    
    if (pendingNavigation === "__back__") {
      // Go back in history
      window.history.back();
    } else if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    
    setPendingNavigation(null);
    
    // Reset navigation flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  };

  const handleCancelLeave = () => {
    setShowDialog(false);
    setPendingNavigation(null);
  };

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        setDirty,
        markDirty,
        markClean,
        navigateWithConfirm,
      }}
    >
      {children}
      
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
            <AlertDialogDescription>
              Sie haben ungespeicherte Änderungen. Wenn Sie diese Seite verlassen, 
              gehen Ihre Änderungen verloren. Möchten Sie wirklich fortfahren?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLeave}
              className="bg-red-600 hover:bg-red-700"
            >
              Änderungen verwerfen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}
