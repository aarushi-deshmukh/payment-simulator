"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PaymentPage() {

  const [currency, setCurrency] = useState("INR");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] =
    useState<"created" | "processing" | "success" | "failure">("created");

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

          if (status === "failure")
            setPaymentStatus("failure");
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
    const { data: receiver, error: receiverError } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("id", customerId.trim().toUpperCase())
        .maybeSingle();

    if (receiverError || !receiver) {
      alert("Receiver not found");
      setPaymentStatus("failure");
      setLoading(false);
      return;
    }

    // insert payment (status auto = created)
    const { data, error: paymentError } = await supabase
      .from("payments")
      .insert({
        sender_id: user.id,
        receiver_id: receiver.id,
        amount: Number(amount),
      })
      .select()
      .single();

    if (paymentError || !data) {
      alert(paymentError?.message ?? "Payment creation failed");
      setPaymentStatus("failure");
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
  if (paymentStatus === "failure") {
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
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .orb1 {
          position: fixed;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle,
            rgba(124,58,237,0.15),
            transparent 70%);
          top: -150px;
          right: -100px;
        }

        .orb2 {
          position: fixed;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle,
            rgba(6,182,212,0.12),
            transparent 70%);
          bottom: -120px;
          left: -80px;
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
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: white;
          outline: none;
          transition: 0.25s;
        }

        .input:focus {
          border-color: rgba(124,58,237,0.6);
        }

        .pay-btn {
          width: 100%;
          padding: 14px;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(
            135deg,
            #7c3aed,
            #06b6d4
          );
          color: white;
          transition: 0.25s;
        }

        .pay-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(124,58,237,0.4);
        }
      `}</style>

      <div className="grid-bg" />
      <div className="orb1" />
      <div className="orb2" />

      <div className="flex h-screen items-center justify-center">

        <div className="pay-card space-y-6">

          <h2 className="text-xl font-bold text-center">
            Make Payment
          </h2>

          <select
            className="input"
            value={currency}
            onChange={(e)=>setCurrency(e.target.value)}
          >
            <option>INR</option>
            <option>USD</option>
            <option>EUR</option>
          </select>

          <input
            placeholder="Receiver Account ID"
            className="input"
            onChange={(e)=>setCustomerId(e.target.value)}
          />

          <input
            type="number"
            placeholder="Amount"
            className="input"
            onChange={(e)=>setAmount(e.target.value)}
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