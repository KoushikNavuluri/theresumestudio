import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Power, PowerOff, Edit2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EditPromoCodeDialog } from "./EditPromoCodeDialog";

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

interface PromoCodeTableProps {
  codes: PromoCode[];
  onToggleStatus: (id: string, activate: boolean) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, updates: Partial<PromoCode>) => Promise<{ success: boolean; error?: string }>;
  actionLoading: boolean;
}

export function PromoCodeTable({
  codes,
  onToggleStatus,
  onDelete,
  onUpdate,
  actionLoading,
}: PromoCodeTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState<PromoCode | null>(null);

  const getStatus = (code: PromoCode) => {
    if (!code.is_active) return "inactive";
    if (code.expires_at && new Date(code.expires_at) < new Date()) return "expired";
    if (code.max_uses && (code.uses || 0) >= code.max_uses) return "exhausted";
    return "active";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "exhausted":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Exhausted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead className="text-center">Credits</TableHead>
              <TableHead className="text-center">Uses</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No promo codes found
                </TableCell>
              </TableRow>
            ) : (
              codes.map((code) => {
                const status = getStatus(code);
                return (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                    <TableCell className="text-center">{code.credits}</TableCell>
                    <TableCell className="text-center">
                      {code.uses || 0} / {code.max_uses || "∞"}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(status)}</TableCell>
                    <TableCell>
                      {code.expires_at
                        ? format(new Date(code.expires_at), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditCode(code)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(code.id, !code.is_active)}
                          >
                            {code.is_active ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(code.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promo code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editCode && (
        <EditPromoCodeDialog
          code={editCode}
          open={!!editCode}
          onOpenChange={(open) => !open && setEditCode(null)}
          onUpdate={onUpdate}
          loading={actionLoading}
        />
      )}
    </>
  );
}
