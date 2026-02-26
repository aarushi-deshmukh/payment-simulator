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

  const filtered =
    statusFilter === "all"
      ? payments
      : payments.filter(p => p.status === statusFilter);

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8 min-h-screen bg-black text-white">

      <h1 className="text-3xl font-bold mb-6">
        Transaction Summary
      </h1>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="bg-gray-800 p-2 rounded mb-6"
      >
        <option value="all">All</option>
        <option value="SUCCESS">Success</option>
        <option value="FAILURE">Failure</option>
        <option value="PROCESSING">Processing</option>
        <option value="CREATED">Created</option>
      </select>

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
              <td>
                {new Date(p.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="p-6 text-center text-gray-400">
          No transactions found.
        </div>
      )}
    </div>
  );
}