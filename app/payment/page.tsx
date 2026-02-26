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
          const status = String(payload.new.status).toLowerCase();

          if (status === "success") {
            setPaymentStatus("success");
            setLoading(false);
          }

          if (status === "failure" || status === "failed") {
            setPaymentStatus("failed");
            setLoading(false);
          }
        }
      )
      .subscribe();
  };

  // ===============================
  // HANDLE PAYMENT
  // ===============================
  const handlePayment = async () => {

    if (!customerId.trim() || !amount.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    setPaymentStatus("processing");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("No session");
      setLoading(false);
      setPaymentStatus("idle");
      return;
    }

    // 👇 DEBUG: check exact value being searched
    console.log("Looking for account_id:", JSON.stringify(customerId.trim()));

    // verify receiver exists by account_id
    const { data: receiver, error: receiverError } = await supabase
      .from("profiles")
      .select("id, account_id")
      .eq("account_id", customerId.trim())
      .maybeSingle();

    // 👇 DEBUG: check what supabase returned
    console.log("Receiver result:", receiver);
    console.log("Receiver error:", receiverError);

    if (!receiver) {
      alert(`Receiver not found. Searched for: "${customerId.trim()}". Check console for details.`);
      setPaymentStatus("failed");
      setLoading(false);
      return;
    }

    // receiver_id is account_id (text FK), amount matches schema
    const { data, error } = await supabase
      .from("payments")
      .insert({
        sender_id: user.id,
        receiver_id: receiver.account_id,
        amount: Number(amount),
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      setPaymentStatus("failed");
      setLoading(false);
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
          <p className="text-xl font-bold mt-4">Payment Successful</p>
          <button
            onClick={() => { setPaymentStatus("idle"); setLoading(false); setAmount(""); setCustomerId(""); }}
            className="mt-6 px-6 py-2 bg-green-500 text-white rounded-full text-sm"
          >
            Make Another Payment
          </button>
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
          <p className="text-xl font-bold mt-4">Payment Failed</p>
          <button
            onClick={() => { setPaymentStatus("idle"); setLoading(false); }}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-full text-sm"
          >
            Try Again
          </button>
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
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="font-semibold">Processing payment...</p>
          <p className="text-sm text-gray-400">Please wait, do not close this page</p>
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
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option>INR</option>
          <option>USD</option>
          <option>EUR</option>
        </select>

        <input
          placeholder="Account ID (e.g. 323338889)"
          className="w-full p-3 border rounded-md"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          className="w-full p-3 border rounded-md"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-full disabled:opacity-50"
        >
          Pay
        </button>

      </div>
    </div>
  );
}