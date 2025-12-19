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
import { Coins, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LowCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credits: number;
}

export const LowCreditsDialog = ({ open, onOpenChange, credits }: LowCreditsDialogProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/profile");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
            <Coins className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">Low on Credits!</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You have only <span className="font-semibold text-foreground">{credits} credits</span> remaining. 
            Upgrade your plan to continue generating optimized resumes and unlock more features.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade} className="w-full sm:w-auto gap-2">
            <Zap className="h-4 w-4" />
            Upgrade Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
