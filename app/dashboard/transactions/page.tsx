"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function TransactionSummary() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }

      setLoading(false);
    };

    loadTransactions();
  }, []);

  const filtered =
    statusFilter === "all"
      ? transactions
      : transactions.filter((t) => t.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Transaction Summary
      </h1>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="bg-gray-800 p-2 rounded mb-6"
      >
        <option value="all">All</option>
        <option value="success">Success</option>
        <option value="processing">Processing</option>
        <option value="failure">Failure</option>
        <option value="created">Created</option>
      </select>

      <div className="overflow-x-auto bg-gray-900 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-4">Transaction ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((txn) => (
              <tr
                key={txn.id}
                className="border-t border-gray-800 hover:bg-gray-800"
              >
                <td className="p-4">
                  {txn.id.slice(0, 8)}...
                </td>
                <td>₹ {txn.amount}</td>
                <td>{txn.status}</td>
                <td>
                  {new Date(txn.created_at).toLocaleDateString()}
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
    </div>
  );
}