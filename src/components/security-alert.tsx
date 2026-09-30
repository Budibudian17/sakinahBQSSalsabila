import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ShieldAlert } from "lucide-react";

interface SecurityAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecurityAlert({ open, onOpenChange }: SecurityAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose/10 text-rose">
            <ShieldAlert size={24} />
          </div>
          <AlertDialogTitle className="text-center font-display font-bold">
            Akses Dilarang
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Fitur developer tools dan inspect element dinonaktifkan untuk keamanan sistem.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction className="w-full" onClick={() => onOpenChange(false)}>
          Mengerti
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
