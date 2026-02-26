"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PaymentPage() {

  const [currency, setCurrency] = useState("INR");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] =
    useState<"idle" | "processing" | "success" | "failed">("idle");

  // ===============================
  // LISTEN PAYMENT STATUS
  // ===============================
  const listenForStatus = (paymentId: string) => {

    supabase
      .channel("payment-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `id=eq.${paymentId}`,
        },
        (payload) => {

          const status = payload.new.status;

          if (status === "success")
            setPaymentStatus("success");

          if (status === "failed")
            setPaymentStatus("failed");
        }
      )
      .subscribe();
  };

  // ===============================
  // HANDLE PAYMENT
  // ===============================
  const handlePayment = async () => {

    setLoading(true);
    setPaymentStatus("processing");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("No session");
      return;
    }

    // find receiver
    const { data: receiver } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("account_id", customerId)
        .single();

    if (!receiver) {
      alert("Receiver not found");
      setPaymentStatus("failed");
      return;
    }

    // insert payment (status auto = created)
    const { data, error } =
      await supabase
        .from("payments")
        .insert({
          sender_id: user.id,
          receiver_id: receiver.id,
          sender_amount: Number(amount),
          sender_currency: currency
        })
        .select()
        .single();

    if (error) {
      alert(error.message);
      setPaymentStatus("failed");
      return;
    }

    listenForStatus(data.id);
  };

  // ===============================
  // SUCCESS UI
  // ===============================
  if (paymentStatus === "success") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-6xl">✅</div>
          <p className="text-xl font-bold mt-4">
            Payment Successful
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // FAILED UI
  // ===============================
  if (paymentStatus === "failed") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl">❌</div>
          <p className="text-xl font-bold mt-4">
            Payment Failed
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // PROCESSING UI
  // ===============================
  if (paymentStatus === "processing") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"/>
          <p className="font-semibold">
            Processing payment...
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // PAYMENT FORM
  // ===============================
  return (
    <div className="flex justify-center mt-20 bg-white text-black">

      <div className="border shadow-md p-10 rounded-lg w-96 space-y-6">

        <select
          className="w-full p-3 border rounded-md"
          value={currency}
          onChange={(e)=>setCurrency(e.target.value)}
        >
          <option>INR</option>
          <option>USD</option>
          <option>EUR</option>
        </select>

        <input
          placeholder="Customer ID"
          className="w-full p-3 border rounded-md"
          onChange={(e)=>setCustomerId(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          className="w-full p-3 border rounded-md"
          onChange={(e)=>setAmount(e.target.value)}
        />

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-full"
        >
          Pay
        </button>

      </div>
    </div>
  );
}