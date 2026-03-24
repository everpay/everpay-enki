import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface InactivityWarningDialogProps {
  open: boolean;
  secondsLeft: number;
  onStayActive: () => void;
}

export function InactivityWarningDialog({ open, secondsLeft, onStayActive }: InactivityWarningDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">Session Expiring</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 text-sm">
            Your session will expire due to inactivity in <span className="font-bold text-foreground">{secondsLeft}s</span>. Click below to stay signed in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayActive}>Stay Signed In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
