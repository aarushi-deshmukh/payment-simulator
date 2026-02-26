"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Payment = {
  id: string;
  amount: number;
  status: string;
  failure_reason: string | null;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/signin");
        return;
      }

      const { data } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      setPayments(data || []);
      setLoading(false);
    };

    load();
  }, [router]);

  const filtered = payments
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => p.id.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: payments.length,
    success: payments.filter(p => p.status === "SUCCESS").length,
    failed: payments.filter(p => p.status === "FAILURE").length,
    processing: payments.filter(p =>
      p.status === "PROCESSING" || p.status === "CREATED"
    ).length,
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8 min-h-screen bg-black text-white">

      <h1 className="text-3xl font-bold mb-6">Transaction Summary</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        >
          <option value="all">All</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
          <option value="PROCESSING">Processing</option>
          <option value="CREATED">Created</option>
        </select>

        <input
          type="text"
          placeholder="Search by ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 p-4 rounded">Total: {stats.total}</div>
        <div className="bg-gray-900 p-4 rounded text-green-400">Success: {stats.success}</div>
        <div className="bg-gray-900 p-4 rounded text-yellow-400">Processing: {stats.processing}</div>
        <div className="bg-gray-900 p-4 rounded text-red-400">Failed: {stats.failed}</div>
      </div>

      {/* Table */}
      <table className="w-full bg-gray-900 rounded">
        <thead className="bg-gray-800 text-gray-400">
          <tr>
            <th className="p-4">ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Failure</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id} className="border-t border-gray-800">
              <td className="p-4">{p.id.slice(0,8)}...</td>
              <td>₹ {p.amount}</td>
              <td>{p.status}</td>
              <td>{p.failure_reason || "—"}</td>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}