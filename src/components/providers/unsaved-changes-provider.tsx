"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect,
  ReactNode 
} from "react";
import { useRouter } from "next/navigation";
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
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Browser beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Modern browsers show a generic message, but we still need to set returnValue
        e.returnValue = "Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);
  const setDirty = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  const navigateWithConfirm = useCallback((href: string) => {
    if (isDirty) {
      setPendingNavigation(href);
      setShowDialog(true);
    } else {
      router.push(href);
    }
  }, [isDirty, router]);

  const handleConfirmLeave = () => {
    setShowDialog(false);
    setIsDirty(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
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
