"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignUp() {

  const router = useRouter();

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [fullName,setFullName]=useState("");
  const [accountId,setAccountId]=useState("");
  const [balance,setBalance]=useState("");
  const [currency,setCurrency]=useState("");

  const handleSignup = async () => {

  // create auth user
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      return;
    }

    // login immediately
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      alert(loginError.message);
      return;
    }

    // get logged user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User session missing");
      return;
    }

    // insert profile
    const { error: profileError } =
      await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: fullName,
          account_id: accountId,
          balance: Number(balance),
          currency: currency,
        });

    if (profileError) {
      alert(profileError.message);
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">

      <div className="w-[380px] border rounded-xl p-8 shadow-md space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Sign Up
        </h1>
        <input
          placeholder="Full Name"
          className="w-full border p-3 rounded-md"
          onChange={(e)=>setFullName(e.target.value)}
        />

        <input
          placeholder="Account ID"
          className="w-full border p-3 rounded-md"
          onChange={(e)=>setAccountId(e.target.value)}
        />

        <input
          type="number"
          placeholder="Balance"
          className="w-full border p-3 rounded-md"
          onChange={(e)=>setBalance(e.target.value)}
        />

        <input
          placeholder="Currency"
          className="w-full border p-3 rounded-md"
          onChange={(e)=>setCurrency(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded-md"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded-md"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700"
        >
          Sign Up
        </button>

      </div>
    </div>
  );
}