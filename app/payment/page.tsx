"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PaymentPage() {

  const [currency, setCurrency] = useState("INR");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] =
    useState<"idle" | "created" | "processing" | "success" | "failure">("idle");

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

          // ✅ matches your DB enum "failure"
          if (status === "failure") {
            setPaymentStatus("failure");
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

    // verify receiver exists by account_id
    const { data: receiver, error: receiverError } = await supabase
      .from("profiles")
      .select("id, account_id")
      .eq("account_id", customerId.trim())
      .maybeSingle();

    if (!receiver) {
      alert(`Receiver not found. Searched for: "${customerId.trim()}"`);
      setPaymentStatus("idle");
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
      setPaymentStatus("idle");
      setLoading(false);
      return;
    }

    listenForStatus(data.id);
  };

  const resetForm = () => {
    setPaymentStatus("idle");
    setLoading(false);
    setAmount("");
    setCustomerId("");
  };

  // ===============================
  // SUCCESS UI
  // ===============================
  if (paymentStatus === "success") {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-center">
          <div className="text-green-500 text-6xl">✅</div>
          <p className="text-xl font-bold mt-4 text-white">Payment Successful</p>
          <button
            onClick={resetForm}
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
  if (paymentStatus === "failure") {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-center">
          <div className="text-red-500 text-6xl">❌</div>
          <p className="text-xl font-bold mt-4 text-white">Payment Failed</p>
          <button
            onClick={resetForm}
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
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-center space-y-4">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="font-semibold text-white">Processing payment...</p>
          <p className="text-sm text-gray-400">Please wait, do not close this page</p>
        </div>
      </div>
    );
  }

  // ===============================
  // PAYMENT FORM
  // ===============================
  return (
    <>
      <style>{`
        body {
          margin: 0;
          background: #0a0a0f;
          color: #e4e4f0;
          font-family: 'Syne', sans-serif;
        }
        .grid-bg {
          position: fixed; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .orb1 {
          position: fixed; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%);
          top: -150px; right: -100px; pointer-events: none;
        }
        .orb2 {
          position: fixed; width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%);
          bottom: -120px; left: -80px; pointer-events: none;
        }
        .pay-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px;
          width: 380px;
        }
        .input {
          width: 100%; padding: 14px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: white; outline: none; transition: 0.25s;
          box-sizing: border-box;
        }
        .input:focus { border-color: rgba(124,58,237,0.6); }
        .input option { background: #18181b; color: white; }
        .pay-btn {
          width: 100%; padding: 14px; border-radius: 999px; border: none;
          font-weight: 700; cursor: pointer; font-size: 15px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          color: white; transition: 0.25s;
        }
        .pay-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(124,58,237,0.4);
        }
        .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="grid-bg" />
      <div className="orb1" />
      <div className="orb2" />

      <div className="flex h-screen items-center justify-center">
        <div className="pay-card space-y-6">

          <h2 className="text-xl font-bold text-center">Make Payment</h2>

          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option>INR</option>
            <option>USD</option>
            <option>EUR</option>
          </select>

          <input
            placeholder="Receiver Account ID"
            className="input"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />

          <input
            type="number"
            placeholder="Amount"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button
            onClick={handlePayment}
            disabled={loading}
            className="pay-btn"
          >
            Pay Securely
          </button>

        </div>
      </div>
    </>
  );
}
