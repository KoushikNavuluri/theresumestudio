import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  credits: z.coerce
    .number()
    .min(1, "Must be at least 1 credit")
    .max(10000, "Maximum 10,000 credits"),
  max_uses: z.coerce.number().min(1, "Must be at least 1 use").optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface PromoCode {
  id: string;
  code: string;
  credits: number;
  max_uses: number | null;
  uses: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string;
}

interface EditPromoCodeDialogProps {
  code: PromoCode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<PromoCode>) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

export function EditPromoCodeDialog({
  code,
  open,
  onOpenChange,
  onUpdate,
  loading,
}: EditPromoCodeDialogProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credits: code.credits,
      max_uses: code.max_uses ?? undefined,
      expires_at: code.expires_at ? code.expires_at.split("T")[0] : "",
      is_active: code.is_active ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    const result = await onUpdate(code.id, {
      credits: data.credits,
      max_uses: data.max_uses,
      expires_at: data.expires_at || null,
      is_active: data.is_active,
    });

    if (result.success) {
      toast({
        title: "Promo code updated",
        description: `Code ${code.code} has been updated successfully.`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update promo code",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {code.code}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credits</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_uses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Uses</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
