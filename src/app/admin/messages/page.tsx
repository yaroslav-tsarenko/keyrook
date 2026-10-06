"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Chip } from "@heroui/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { AdminButton as Button } from "@/components/admin/AdminButton/AdminButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner/LoadingSpinner";

type MessageStatus = "NEW" | "REPLIED";

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  orderNumber: string | null;
  message: string;
  ip: string | null;
  status: MessageStatus;
  createdAt: string;
}

interface MessagesResponse {
  data: ContactMessageRow[];
  total: number;
  unread: number;
  page: number;
  totalPages: number;
}

export default function AdminMessagesPage() {
  const [result, setResult] = useState<MessagesResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/contact/messages?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: MessagesResponse) => setResult(d))
      .catch(() => toast.error("Messages could not be loaded"));
  }, [statusFilter, page, version]);

  const setStatus = async (id: string, status: MessageStatus) => {
    const res = await fetch("/api/contact/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => null);
    if (!res?.ok) {
      toast.error("Status could not be updated");
      return;
    }
    toast.success(status === "REPLIED" ? "Marked as replied" : "Marked as new");
    setVersion((v) => v + 1);
  };

  if (!result) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="admin-page-header">
        <h1 className="admin-page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Mail size={24} /> Messages
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="admin-badge admin-badge-warning" style={{ whiteSpace: "nowrap" }}>{result.unread} new</span>
          <select
            className="admin-select"
            style={{ maxWidth: "12rem" }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All</option>
            <option value="NEW">New</option>
            <option value="REPLIED">Replied</option>
          </select>
        </div>
      </div>

      {result.data.length === 0 ? (
        <p className="admin-empty" style={{ color: "var(--admin-text-secondary)" }}>
          No messages{statusFilter ? " with this status" : " yet"}.
        </p>
      ) : (
        <div className="admin-table-container">
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>From</th>
                <th>Subject</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((m) => (
                <Fragment key={m.id}>
                  <tr>
                    <td style={{ color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>{format(new Date(m.createdAt), "MMM d, yyyy HH:mm")}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{m.name}</div>
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} style={{ color: "var(--admin-accent)" }}>
                        {m.email}
                      </a>
                    </td>
                    <td>
                      <div style={{ color: "var(--admin-text)" }}>{m.subject}</div>
                      {m.orderNumber ? <div style={{ color: "var(--admin-text-muted)", fontFamily: "monospace" }}>Order {m.orderNumber}</div> : null}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <Chip size="sm" color={m.status === "NEW" ? "warning" : "success"}>{m.status === "NEW" ? "New" : "Replied"}</Chip>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <Button size="sm" variant="flat" aria-expanded={openId === m.id} onPress={() => setOpenId(openId === m.id ? null : m.id)}>
                          {openId === m.id ? "Hide" : "Read"}
                        </Button>
                        <Button size="sm" variant={m.status === "NEW" ? "primary" : "flat"} onPress={() => setStatus(m.id, m.status === "NEW" ? "REPLIED" : "NEW")}>
                          {m.status === "NEW" ? "Mark replied" : "Mark new"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {openId === m.id ? (
                    <tr>
                      <td colSpan={5} style={{ whiteSpace: "pre-wrap", color: "var(--admin-text-secondary)", lineHeight: 1.6 }}>
                        {m.message}
                        {m.ip ? <div style={{ marginTop: "0.75rem", color: "var(--admin-text-muted)", fontSize: "0.75rem" }}>Sent from {m.ip}</div> : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.totalPages > 1 ? (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            Page {result.page} of {result.totalPages} · {result.total} messages
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="flat" isDisabled={page >= result.totalPages} onPress={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
