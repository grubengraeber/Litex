// Simple toast hook - can be enhanced later with a proper toast library
export function useToast() {
  return {
    toast: ({ title, description, variant }: {
      title: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      // Simple alert for now - can be replaced with proper toast UI
      const message = description ? `${title}\n${description}` : title;
      if (variant === "destructive") {
        alert(`❌ ${message}`);
      } else {
        alert(`✅ ${message}`);
      }
    }
  };
}
