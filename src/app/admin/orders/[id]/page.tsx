"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { AdminButton as Button } from "@/components/admin/AdminButton/AdminButton";
import { Chip } from "@heroui/react";
import { formatPrice } from "@/lib/utils/format-price";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import { toast } from "sonner";
import type { OrderDetail } from "@/types/order";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => { setOrder(data); setNewStatus(data.status); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Order status updated");
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="admin-empty">Order not found</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="admin-page-header" style={{ marginBottom: "2rem" }}>
        <h1 className="admin-page-title">Order #{order.orderNumber.slice(-8)}</h1>
        <Chip size="lg">{order.status}</Chip>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="admin-info-card">
          <h3>Customer</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--admin-text)" }}>{order.customerName}</p>
          <p style={{ fontSize: "0.875rem", color: "var(--admin-text-secondary)" }}>{order.customerEmail}</p>
        </div>
        <div className="admin-info-card">
          <h3>Key delivery</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--admin-text)" }}>
            Keys are issued to the customer account and never shown here.
            <br />
            Billing: {order.shippingAddress.address1}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>
            Withdrawal waiver accepted {order.waiverAcceptedAt ? new Date(order.waiverAcceptedAt).toLocaleString("en-GB") : "—"} (version {order.waiverVersion ?? "—"})
          </p>
        </div>
        <div className="admin-info-card">
          <h3>Update Status</h3>
          <select className="admin-select" style={{ marginBottom: "0.5rem" }} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button size="sm" color="primary" onPress={handleUpdateStatus} isLoading={updating} fullWidth>Update</Button>
        </div>
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Delivery</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td style={{ color: "var(--admin-text)" }}>{item.productName}{item.variantName && ` (${item.variantName})`}</td>
                <td style={{ fontSize: "0.75rem" }}>{item.keyOrder ? `${item.keyOrder.status} · ${item.keyOrder._count.keys}/${item.quantity} keys${item.keyOrder.supplierError ? ` · ${item.keyOrder.supplierError}` : ""}` : "—"}</td>
                <td style={{ textAlign: "right" }}>{formatPrice(item.price)}</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "var(--admin-text)" }}>{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "1.25rem", textAlign: "right", fontSize: "0.875rem", borderTop: "1px solid var(--admin-border)" }}>
          <div style={{ color: "var(--admin-text-secondary)" }}>Subtotal: {formatPrice(order.subtotal)}</div>
          <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--admin-text)", marginTop: "0.5rem" }}>Total: {formatPrice(order.total)}</div>
          {order.chargeTotal != null && order.currency !== "EUR" ? <div style={{ color: "var(--admin-text-secondary)" }}>Charged: {formatPrice(order.chargeTotal, order.currency)}</div> : null}
        </div>
      </div>
    </motion.div>
  );
}
