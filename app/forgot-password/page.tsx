"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e:any) => {
    e.preventDefault();

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:3000/reset-password",
      });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Reset link sent to your email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleReset}
        className="bg-gray-900 p-8 rounded w-96"
      >
        <h2 className="text-2xl mb-6 text-center">
          Forgot Password
        </h2>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 mb-4 bg-gray-800 rounded"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 p-3 rounded">
          Send Reset Link
        </button>

        {message && (
          <p className="mt-4 text-center">{message}</p>
        )}
      </form>
    </div>
  );
}