"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type PaymentResult = {
  id: string;
  status: "CREATED" | "PROCESSING" | "SUCCESS" | "FAILED";
  failure_reason: string | null;
  amount: number;
  created_at: string;
};

const STATUS_CONFIG = {
  SUCCESS:    { color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)",  icon: "✓", label: "Successful"  },
  FAILED:     { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", icon: "✕", label: "Failed"      },
  PROCESSING: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)",  icon: "⟳", label: "Processing"  },
  CREATED:    { color: "#a78bfa", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)",  icon: "○", label: "Created"     },
};

export default function CheckStatusPage() {
  const [paymentId, setPaymentId] = useState("");
  const [result, setResult]       = useState<PaymentResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleSearch = async () => {
    const trimmed = paymentId.trim();
    if (!trimmed) { setError("Please enter a Payment ID."); return; }
    setError(""); setResult(null); setLoading(true);

    const { data, error: err } = await supabase
      .from("payments")
      .select("id, status, failure_reason, amount, created_at")
      .eq("id", trimmed)
      .single();

    setLoading(false);

    if (err || !data) {
      setError(`Payment not found. (${err?.message ?? "no data returned"})`);
      return;
    }

    setResult(data);
  };

  const cfg = result ? (STATUS_CONFIG[result.status] ?? STATUS_CONFIG.CREATED) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810 !important; }
        .page { font-family: 'Syne', sans-serif; min-height: 100vh; background: #080810; color: #e2e2f0; display: flex; align-items: center; justify-content: center; padding: 40px 20px; position: relative; }
        .bg-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px); background-size: 44px 44px; }
        .orb1 { position: fixed; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%); top: -200px; right: -150px; pointer-events: none; z-index: 0; }
        .orb2 { position: fixed; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%); bottom: -100px; left: -80px; pointer-events: none; z-index: 0; }
        .card { position: relative; z-index: 1; width: 100%; max-width: 520px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px 36px; display: flex; flex-direction: column; gap: 28px; }
        .card-header { text-align: center; }
        .card-icon { width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 16px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 8px 28px rgba(139,92,246,0.35); }
        .card-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
        .card-sub { font-size: 13px; color: #71717a; }
        .search-wrap { display: flex; flex-direction: column; gap: 12px; }
        .inp { width: 100%; padding: 14px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #e2e2f0; outline: none; transition: border-color 0.2s; }
        .inp:focus { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.04); }
        .inp::placeholder { color: #3f3f46; }
        .btn { width: 100%; padding: 14px; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(139,92,246,0.3); }
        .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(139,92,246,0.45); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .err-msg { font-size: 13px; color: #f87171; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; padding: 11px 14px; text-align: center; }
        .result { border-radius: 16px; padding: 24px; border: 1px solid; display: flex; flex-direction: column; gap: 18px; animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .result-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .status-badge { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; padding: 7px 16px; border-radius: 20px; border: 1px solid; }
        .divider { height: 1px; background: rgba(255,255,255,0.06); }
        .rows { display: flex; flex-direction: column; gap: 12px; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .row-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #52525b; padding-top: 2px; flex-shrink: 0; }
        .row-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #c4b5fd; text-align: right; word-break: break-all; }
        .row-val.sm { color: #a1a1aa; font-size: 12px; }
        .failure-box { border-radius: 10px; padding: 12px 14px; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); }
        .failure-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #f87171; margin-bottom: 6px; }
        .failure-reason { font-size: 13px; color: #fca5a5; font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="page">
        <div className="bg-grid" /><div className="orb1" /><div className="orb2" />
        <div className="card">
          <div className="card-header">
            <div className="card-icon">🔍</div>
            <div className="card-title">Check Payment Status</div>
            <div className="card-sub">Click a TXN ID on the dashboard to copy, then paste here</div>
          </div>

          <div className="search-wrap">
            <input
              className="inp"
              placeholder="Paste full Payment UUID here"
              value={paymentId}
              onChange={e => { setPaymentId(e.target.value); setError(""); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <button className="btn" onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Check Status"}
            </button>
          </div>

          {error && <p className="err-msg">{error}</p>}

          {result && cfg && (
            <div className="result" style={{ background: cfg.bg, borderColor: cfg.border }}>
              <div className="result-top">
                <span className="status-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                  {cfg.icon} {cfg.label}
                </span>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: cfg.color }}>
                  {result.amount != null ? `₹${Number(result.amount).toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="divider" />
              <div className="rows">
                <div className="row">
                  <span className="row-lbl">Payment ID</span>
                  <span className="row-val">{result.id}</span>
                </div>
                <div className="row">
                  <span className="row-lbl">Created At</span>
                  <span className="row-val sm">{new Date(result.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </div>
              {result.status === "FAILED" && (
                <>
                  <div className="divider" />
                  <div className="failure-box">
                    <div className="failure-lbl">Failure Reason</div>
                    <div className="failure-reason">{result.failure_reason ?? "No reason provided."}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}