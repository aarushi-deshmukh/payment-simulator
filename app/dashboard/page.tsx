"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  status: "CREATED" | "PROCESSING" | "SUCCESS" | "FAILURE";
  failure_reason: string | null;
  created_at: string;
};

const fmt = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(n);

const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function Dashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchData = async (uid: string) => {
    const [{ data: prof }, { data: pays }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase
        .from("payments")
        .select("*")
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order("created_at", { ascending: false }),
    ]);

    if (prof) setProfile(prof);
    setPayments((pays as Payment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/signin");
        return;
      }

      await fetchData(user.id);
    };

    load();
  }, [router]);

  const stats = {
    total: payments.length,
    success: payments.filter(p => p.status === "SUCCESS").length,
    failed: payments.filter(p => p.status === "FAILURE").length,
    processing: payments.filter(
      p => p.status === "PROCESSING" || p.status === "CREATED"
    ).length,
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">

      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <div className="flex gap-4 items-center">
          <Link href="/dashboard/summary">
            <button className="bg-purple-600 px-4 py-2 rounded">
              Summary
            </button>
          </Link>

          <Link href="/dashboard/query">
            <button className="bg-blue-600 px-4 py-2 rounded">
              Query
            </button>
          </Link>

          <Link href="/dashboard/support">
            <button className="bg-green-600 px-4 py-2 rounded">
              Support
            </button>
          </Link>

          <button
            onClick={handleSignOut}
            className="bg-red-500 px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="mb-8 bg-gray-900 p-6 rounded">
        <h2 className="text-xl font-semibold">
          {profile?.full_name}
        </h2>
        <p className="text-gray-400">
          Account ID: {profile?.account_id}
        </p>
        <p className="text-2xl mt-4">
          {fmt(profile?.balance || 0, profile?.currency || "INR")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 p-4 rounded">
          <p>Total</p>
          <p className="text-xl">{stats.total}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded">
          <p>Success</p>
          <p className="text-green-400 text-xl">{stats.success}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded">
          <p>Processing</p>
          <p className="text-yellow-400 text-xl">{stats.processing}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded">
          <p>Failed</p>
          <p className="text-red-400 text-xl">{stats.failed}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900 rounded overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-4">ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Failure Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-t border-gray-800">
                <td
                  className="p-4 cursor-pointer"
                  onClick={() => copyId(p.id)}
                >
                  {p.id.slice(0, 8)}...
                  {copiedId === p.id && " ✓"}
                </td>
                <td>{fmt(p.amount)}</td>
                <td>{p.status}</td>
                <td>{p.failure_reason || "—"}</td>
                <td>{timeAgo(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}