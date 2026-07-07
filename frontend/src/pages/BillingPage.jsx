import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Shield, CreditCard } from "lucide-react";
import ManagerBillingView from "@/components/billing/ManagerBillingView";
import AdminBillingView from "@/components/billing/AdminBillingView";
import { useAuth } from "@/contexts/AuthContext";

export default function BillingPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-5 animate-fade-in py-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? "Manage subscriptions, usage, and platform revenue"
              : "Manage your subscription and usage"}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="manager" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="manager" className="gap-2">
              <Crown className="h-3.5 w-3.5" />
              My Subscription
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-3.5 w-3.5" />
              Platform Admin
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manager">
            <ManagerBillingView />
          </TabsContent>
          <TabsContent value="admin">
            <AdminBillingView />
          </TabsContent>
        </Tabs>
      ) : (
        <ManagerBillingView />
      )}
    </div>
  );
}
