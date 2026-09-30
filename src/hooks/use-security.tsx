import { useEffect, useState } from "react";
import { SecurityAlert } from "@/components/security-alert";

export function useSecurity() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      // e.preventDefault();
      // setShowAlert(true);
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        // e.preventDefault();
        // setShowAlert(true);
        return;
      }

      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        // e.preventDefault();
        // setShowAlert(true);
        return;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        // e.preventDefault();
        // setShowAlert(true);
        return;
      }

      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        // e.preventDefault();
        // setShowAlert(true);
        return;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        // e.preventDefault();
        // setShowAlert(true);
        return;
      }

      // Ctrl+Shift+U (View Source in some browsers)
      if (e.ctrlKey && e.shiftKey && e.key === "U") {
        // e.preventDefault();
        // setShowAlert(true);
        return;
      }
    };

    // Disable drag to inspect
    const handleDragStart = (e: DragEvent) => {
      // e.preventDefault();
    };

    // Disable select text
    const handleSelectStart = (e: Event) => {
      // e.preventDefault();
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  return { showAlert, setShowAlert };
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { showAlert, setShowAlert } = useSecurity();

  return (
    <>
      {children}
      <SecurityAlert open={showAlert} onOpenChange={setShowAlert} />
    </>
  );
}
