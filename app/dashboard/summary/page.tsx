"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Payment = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function TransactionSummary() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      setPayments(data || []);
      setLoading(false);
    };

    fetch();
  }, []);

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        Transaction Summary
      </h1>

      <div className="bg-gray-900 p-6 rounded">
        <p>Total Transactions: {payments.length}</p>
        <p>
          Successful: {
            payments.filter(p => p.status === "SUCCESS").length
          }
        </p>
        <p>
          Failed: {
            payments.filter(p => p.status === "FAILURE").length
          }
        </p>
      </div>
    </div>
  );
}