import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  completed: "default",
  pending: "secondary",
  cancelled: "destructive",
  processing: "secondary",
  refunded: "outline",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders?.length ?? 0} total orders</p>
      </div>

      {!orders?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">Orders will appear here once customers start purchasing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-sm">#{order.order_number}</p>
                    <Badge variant={statusVariant[order.status] ?? "outline"} className="text-xs">{order.status}</Badge>
                    <Badge variant="outline" className="text-xs">{order.payment_status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.customer_name} · {order.customer_email} · {formatDate(order.created_at)}
                  </p>
                </div>
                <p className="font-semibold text-sm shrink-0">{formatCurrency(order.total)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
