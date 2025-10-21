import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  // Note: This component is primarily for the @radix-ui/react-toast implementation
  // When using Sonner (recommended), use the Sonner component from @/components/ui/sonner instead
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
