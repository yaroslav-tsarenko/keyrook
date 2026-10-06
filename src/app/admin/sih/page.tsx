"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AdminButton as Button } from "@/components/admin/AdminButton/AdminButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";
import { formatPrice } from "@/lib/utils/format-price";

interface SyncRun {
  id: string;
  source: string;
  status: string;
  fetched: number;
  eligible: number;
  selected: number;
  created: number;
  updated: number;
  archived: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface BacklogRow {
  id: string;
  orderId: string;
  orderNumber: string;
  marketHashName: string;
  price: number;
  currency: string;
  status: string;
  error: string | null;
  email: string | null;
  createdAt: string;
}

interface RecentRow {
  id: string;
  orderId: string;
  orderNumber: string;
  marketHashName: string;
  price: number;
  cost: number;
  currency: string;
  status: string;
  sihStatus: string | null;
  email: string | null;
  createdAt: string;
}

interface Dashboard {
  balance: number | null;
  balanceError: string | null;
  lowBalanceThreshold: number;
  counts: Record<string, number>;
  activeProducts: number;
  runs: SyncRun[];
  refundBacklog: BacklogRow[];
  recent: RecentRow[];
}

const STATUS_ORDER = ["awaiting_payment", "paid", "submitted", "processing", "sent", "finished", "failed", "refund_pending", "rolled_back", "refunded"];

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("en-GB") : "—";
}

export default function AdminSihPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetch("/api/admin/sih", { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          setData((await res.json()) as Dashboard);
        })
        .catch(() => {
          toast.error("Could not load the delivery dashboard");
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const syncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sih/sync", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error || "Sync failed");
      toast.success(`Catalogue synced: ${body.selected} listed, ${body.created} new, ${body.archived} archived`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const markRefunded = async (id: string) => {
    setRefunding(id);
    try {
      const res = await fetch("/api/admin/sih/refund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id }) });
      if (!res.ok) throw new Error("Refund update failed");
      toast.success("Marked as refunded");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund update failed");
    } finally {
      setRefunding(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="admin-empty">Dashboard unavailable</div>;

  const lowBalance = data.balance !== null && data.balance < data.lowBalanceThreshold;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="admin-page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="admin-page-title">Catalogue sync and Steam delivery</h1>
        <Button color="primary" onPress={syncNow} isLoading={syncing}>
          Sync now
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="admin-info-card">
          <h3>Supplier balance</h3>
          <p style={{ fontSize: "1.25rem", color: lowBalance ? "var(--admin-danger, #c0392b)" : "var(--admin-text)" }}>
            {data.balance !== null ? formatPrice(data.balance, "USD") : "—"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>
            {data.balanceError ?? `Alert below ${formatPrice(data.lowBalanceThreshold, "USD")}`}
          </p>
        </div>
        <div className="admin-info-card">
          <h3>Listed skins</h3>
          <p style={{ fontSize: "1.25rem", color: "var(--admin-text)" }}>{data.activeProducts}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>Last sync: {when(data.runs[0]?.finishedAt ?? data.runs[0]?.startedAt ?? null)}</p>
        </div>
        <div className="admin-info-card">
          <h3>Deliveries by status</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--admin-text)", lineHeight: 1.7 }}>
            {STATUS_ORDER.filter((s) => data.counts[s]).map((s) => `${s}: ${data.counts[s]}`).join(" · ") || "No orders yet"}
          </p>
        </div>
      </div>

      <h2 className="admin-page-title" style={{ fontSize: "1rem", margin: "2rem 0 0.75rem" }}>Sync runs</h2>
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Started</th>
              <th>Source</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Offers</th>
              <th style={{ textAlign: "right" }}>Eligible</th>
              <th style={{ textAlign: "right" }}>Listed</th>
              <th style={{ textAlign: "right" }}>New</th>
              <th style={{ textAlign: "right" }}>Archived</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {data.runs.length === 0 ? (
              <tr>
                <td colSpan={9}>No sync has run yet. Press Sync now, or run npm run catalog:sync locally.</td>
              </tr>
            ) : (
              data.runs.map((run) => (
                <tr key={run.id}>
                  <td>{when(run.startedAt)}</td>
                  <td>{run.source}</td>
                  <td>{run.status}</td>
                  <td style={{ textAlign: "right" }}>{run.fetched}</td>
                  <td style={{ textAlign: "right" }}>{run.eligible}</td>
                  <td style={{ textAlign: "right" }}>{run.selected}</td>
                  <td style={{ textAlign: "right" }}>{run.created}</td>
                  <td style={{ textAlign: "right" }}>{run.archived}</td>
                  <td style={{ fontSize: "0.75rem" }}>{run.error ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 id="refunds" className="admin-page-title" style={{ fontSize: "1rem", margin: "2rem 0 0.75rem" }}>
        Refund backlog ({data.refundBacklog.length})
      </h2>
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Item</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Reason</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.refundBacklog.length === 0 ? (
              <tr>
                <td colSpan={7}>Nothing to refund.</td>
              </tr>
            ) : (
              data.refundBacklog.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/admin/orders/${row.orderId}`}>{row.orderNumber.slice(-8).toUpperCase()}</Link>
                  </td>
                  <td>{row.marketHashName}</td>
                  <td>{row.email ?? "—"}</td>
                  <td>{row.status}</td>
                  <td style={{ fontSize: "0.75rem" }}>{row.error ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>{formatPrice(row.price, row.currency)}</td>
                  <td>
                    <Button size="sm" onPress={() => markRefunded(row.id)} isLoading={refunding === row.id}>
                      Mark refunded
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 id="deliveries" className="admin-page-title" style={{ fontSize: "1rem", margin: "2rem 0 0.75rem" }}>
        Recent deliveries
      </h2>
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Created</th>
              <th>Order</th>
              <th>Item</th>
              <th>Customer</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.length === 0 ? (
              <tr>
                <td colSpan={7}>No deliveries yet.</td>
              </tr>
            ) : (
              data.recent.map((row) => (
                <tr key={row.id}>
                  <td>{when(row.createdAt)}</td>
                  <td>
                    <Link href={`/admin/orders/${row.orderId}`}>{row.orderNumber.slice(-8).toUpperCase()}</Link>
                  </td>
                  <td>{row.marketHashName}</td>
                  <td>{row.email ?? "—"}</td>
                  <td>
                    {row.status}
                    {row.sihStatus ? ` (${row.sihStatus})` : ""}
                  </td>
                  <td style={{ textAlign: "right" }}>{formatPrice(row.price, row.currency)}</td>
                  <td style={{ textAlign: "right" }}>{formatPrice(row.cost, row.currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
