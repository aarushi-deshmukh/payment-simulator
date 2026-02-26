"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile = {
  id: string;
  full_name: string;
  account_id: string;
  balance: number;
  currency: string;
  created_at: string;
};

type Payment = {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  status: "created" | "processing" | "success" | "failure";
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "sent" | "received">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "processing" | "success" | "failure">("all");

  const fetchPayments = async (userId: string) => {

    let query = supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // ALL TAB
    if (activeTab === "all") {
      query = query.or(
        `sender_id.eq.${userId},receiver_id.eq.${userId}`
      );
    }

    // SENT TAB
    if (activeTab === "sent") {
      query = query.eq("sender_id", userId);
    }

    // RECEIVED TAB
    if (activeTab === "received") {
      query = query.eq("receiver_id", userId);
    }

    const { data, error } = await query;

    if (!error) setPayments(data ?? []);
  };

  // ── Auth + load ──────────────────────────────────────────────────────────
  useEffect(() => {

  const load = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/signin");
      return;
    }

    const { data: prof } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    setProfile(prof);

    await fetchPayments(user.id);

    setLoading(false);
  };

  load();

}, [router]);

useEffect(() => {

    if (!profile) return;

    fetchPayments(profile.id);

  }, [activeTab, profile]);

  const filtered = payments.filter((p) =>
    statusFilter === "all"
      ? true
      : p.status === statusFilter
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: payments.length,
    completed: payments.filter((p) => p.status === "success").length,
    pending: payments.filter((p) => p.status === "processing").length,
    failed: payments.filter((p) => p.status === "failure").length,
    totalSent: payments
      .filter((p) => p.sender_id === profile?.id && p.status === "success")
      .reduce((a, p) => a + p.amount, 0),
    totalReceived: payments
      .filter((p) => p.receiver_id === profile?.id && p.status === "success")
      .reduce((a, p) => a + p.amount, 0),
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0f; }
        .dash { font-family: 'Syne', sans-serif; min-height: 100vh; background: #0a0a0f; color: #e4e4f0; }

        .grid-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .orb1 {
          position: fixed; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
          top: -200px; right: -100px; pointer-events: none; z-index: 0;
        }
        .orb2 {
          position: fixed; width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%);
          bottom: -100px; left: -50px; pointer-events: none; z-index: 0;
        }
        .content { position: relative; z-index: 1; }

        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 32px; border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,10,15,0.8); backdrop-filter: blur(20px);
          position: sticky; top: 0; z-index: 50;
        }
        .nav-logo { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
        .nav-logo span { color: #7c3aed; }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .nav-user { font-size: 13px; color: #71717a; }
        .signout-btn {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          padding: 8px 16px; border-radius: 8px; cursor: pointer;
          background: rgba(239,68,68,0.1); color: #f87171;
          border: 1px solid rgba(239,68,68,0.2); transition: all 0.2s;
        }
        .signout-btn:hover { background: rgba(239,68,68,0.2); }

        .main { max-width: 1280px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 28px; }

        .profile-card {
          background: linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.1) 100%);
          border: 1px solid rgba(124,58,237,0.3); border-radius: 20px;
          padding: 28px 32px; display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 20px; position: relative; overflow: hidden;
        }
        .profile-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(124,58,237,0.05), transparent);
        }
        .profile-left { display: flex; align-items: center; gap: 20px; position: relative; }
        .avatar {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; color: white; flex-shrink: 0;
        }
        .profile-name { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
        .profile-acct { font-size: 13px; color: #71717a; }
        .profile-acct span { color: #a78bfa; font-family: 'JetBrains Mono', monospace; }
        .balance-block { text-align: right; position: relative; }
        .balance-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
        .balance-amount { font-size: 36px; font-weight: 800; color: #a78bfa; letter-spacing: -1px; }
        .balance-currency { font-size: 14px; color: #71717a; margin-top: 2px; }

        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        .stat-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 20px; transition: border-color 0.2s, transform 0.2s;
        }
        .stat-card:hover { border-color: rgba(124,58,237,0.3); transform: translateY(-2px); }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #52525b; margin-bottom: 10px; }
        .stat-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
        .stat-value.green  { color: #34d399; }
        .stat-value.amber  { color: #fbbf24; }
        .stat-value.red    { color: #f87171; }
        .stat-value.violet { color: #a78bfa; }
        .stat-value.cyan   { color: #22d3ee; }

        .panel {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
        }
        .panel-header {
          padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
        }
        .panel-title { font-size: 15px; font-weight: 700; }

        .tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); padding: 4px; border-radius: 10px; }
        .tab {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          padding: 7px 16px; border-radius: 8px; border: none; cursor: pointer;
          color: #71717a; background: transparent; transition: all 0.2s;
        }
        .tab.active { background: rgba(124,58,237,0.2); color: #a78bfa; }
        .tab:hover:not(.active) { color: #a1a1aa; }

        .panel-header-wrap { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 12px; }
        .panel-header-top { display: flex; align-items: center; gap: 16px; }
        .filter-select {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          padding: 7px 32px 7px 12px; border-radius: 9px; cursor: pointer;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          color: #a1a1aa; outline: none; transition: border-color 0.2s;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
        }
        .filter-select:focus { border-color: rgba(124,58,237,0.45); color: #e4e4f0; }
        .filter-select option { background: #18181b; color: #e4e4f0; }
        .tx-table th {
          font-size: 11px; text-transform: uppercase; letter-spacing: 2px;
          color: #52525b; font-weight: 600; padding: 12px 20px; text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .tx-table td { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
        .tx-row { transition: background 0.15s; }
        .tx-row:hover td { background: rgba(255,255,255,0.02); }
        .tx-row:last-child td { border-bottom: none; }
        .tx-amount-pos { color: #34d399; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .tx-amount-neg { color: #f87171; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .tx-id   { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #52525b; }
        .tx-time { font-size: 12px; color: #52525b; font-family: 'JetBrains Mono', monospace; }
        .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-completed { background: rgba(52,211,153,0.12);  color: #34d399; border: 1px solid rgba(52,211,153,0.25); }
        .badge-pending   { background: rgba(251,191,36,0.12);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
        .badge-failed    { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }
        .empty { text-align: center; padding: 64px; color: #52525b; font-size: 14px; }

        .table-wrap { overflow-x: auto; max-height: 560px; overflow-y: auto; }
        .table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
        .table-wrap::-webkit-scrollbar-track { background: transparent; }
        .table-wrap::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 2px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .main > * { animation: fadeIn 0.4s ease both; }
        .main > *:nth-child(1) { animation-delay: 0.05s; }
        .main > *:nth-child(2) { animation-delay: 0.10s; }
        .main > *:nth-child(3) { animation-delay: 0.15s; }
        .tx-slider {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          padding: 6px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .tx-slide-btn {
          position: relative;
          z-index: 2;
          border: none;
          background: transparent;
          color: #71717a;
          font-weight: 700;
          padding: 10px 0;
          cursor: pointer;
          transition: color 0.25s ease;
        }

        .tx-slide-btn.active {
          color: white;
        }

        .slider-indicator {
          position: absolute;
          top: 6px;
          left: 6px;
          width: calc(33.333% - 8px);
          height: calc(100% - 12px);
          background: linear-gradient(
            135deg,
            rgba(124,58,237,0.4),
            rgba(6,182,212,0.3)
          );
          border-radius: 10px;
          transition: transform 0.35s cubic-bezier(.4,0,.2,1);
        }
      `}</style>

      <div className="dash">
        <div className="grid-bg" />
        <div className="orb1" />
        <div className="orb2" />

        {/* Nav */}
        <nav className="nav content">
          <div className="nav-logo">Pay<span>Sim</span></div>
          <div className="nav-right">
            <span className="nav-user">{profile?.full_name}</span>
            <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
          </div>
        </nav>

        <div className="main content">

          {/* Profile card */}
          <div className="profile-card">
            <div className="profile-left">
              <div className="avatar">{profile?.full_name?.[0]?.toUpperCase() ?? "?"}</div>
              <div>
                <p className="profile-name">{profile?.full_name}</p>
                <p className="profile-acct">Account ID: <span>{profile?.account_id}</span></p>
              </div>
            </div>
            <div className="balance-block">
              <p className="balance-label">Available Balance</p>
              <p className="balance-amount">{fmt(profile?.balance ?? 0, profile?.currency)}</p>
              <p className="balance-currency">{profile?.currency}</p>
            </div>
          </div>

          {/* Transaction Filter Slider */}
          <div className="content">
            <div className="tx-slider">
              {(["all", "sent", "received"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`tx-slide-btn ${
                    activeTab === t ? "active" : ""
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
              <div
                className="slider-indicator"
                style={{
                  transform:
                    activeTab === "all"
                      ? "translateX(0%)"
                      : activeTab === "sent"
                      ? "translateX(100%)"
                      : "translateX(200%)",
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <p className="stat-label">Total Transactions</p>
              <p className="stat-value violet">{stats.total}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Completed</p>
              <p className="stat-value green">{stats.completed}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Pending</p>
              <p className="stat-value amber">{stats.pending}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Failed</p>
              <p className="stat-value red">{stats.failed}</p>
            </div>
          </div>

          {/* Transaction history — full width */}
          <div className="panel">
            <div className="panel-header-wrap">
              <div className="panel-header-top">
                <span className="panel-title">Transaction History</span>
              </div>
              <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "all"
                    | "processing"
                    | "success"
                    | "failure"
                )
              }
            >
              <option value="all">All Statuses</option>
              <option value="processing">⏳ Processing</option>
              <option value="success">✓ Successful</option>
              <option value="failure">✕ Failed</option>
            </select>
            </div>
            <div className="table-wrap">
              {filtered.length === 0 ? (
                <p className="empty">No transactions yet</p>
              ) : (
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Direction</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const isSent = p.sender_id === profile?.id;
                      return (
                        <tr key={p.id} className="tx-row">
                          <td><span className="tx-id">{p.id.slice(0, 8)}…</span></td>
                          <td>
                            <span style={{ fontSize: 12, color: isSent ? "#f87171" : "#34d399", fontWeight: 600 }}>
                              {isSent ? "↑ Sent" : "↓ Received"}
                            </span>
                          </td>
                          <td>
                            <span className={isSent ? "tx-amount-neg" : "tx-amount-pos"}>
                              {isSent ? "−" : "+"}{fmt(p.amount, profile?.currency)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${p.status}`}>
                              {p.status}
                            </span>
                          </td>
                          <td><span className="tx-time">{timeAgo(p.created_at)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

