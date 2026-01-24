import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Ticket, BarChart3, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { useAdmin } from "@/hooks/useAdmin";
import { PromoCodeTable } from "@/components/admin/PromoCodeTable";
import { CreatePromoCodeDialog } from "@/components/admin/CreatePromoCodeDialog";
import { PromoCodeStats } from "@/components/admin/PromoCodeStats";

export default function Admin() {
  const navigate = useNavigate();
  const {
    isAdmin,
    loading,
    codes,
    stats,
    actionLoading,
    fetchCodes,
    fetchStats,
    createCode,
    updateCode,
    toggleCodeStatus,
    deleteCode,
  } = useAdmin();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCodes();
      fetchStats();
    }
  }, [isAdmin, fetchCodes, fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage promo codes and view stats</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="codes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="codes" className="gap-2">
              <Ticket className="h-4 w-4" />
              Promo Codes
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="codes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Promo Codes</h2>
              <CreatePromoCodeDialog onCreate={createCode} loading={actionLoading} />
            </div>
            <PromoCodeTable
              codes={codes}
              onToggleStatus={toggleCodeStatus}
              onDelete={deleteCode}
              onUpdate={updateCode}
              actionLoading={actionLoading}
            />
          </TabsContent>

          <TabsContent value="stats">
            <PromoCodeStats stats={stats} loading={!stats} />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
