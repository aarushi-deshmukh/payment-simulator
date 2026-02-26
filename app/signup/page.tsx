"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignUp() {

  const router = useRouter();

  // auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // profile data
  const [fullName, setFullName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {

    setLoading(true);

    // ✅ create auth user
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    const user = data.user;

    // ✅ insert profile
    if (user) {
      const { error: profileError } =
        await supabase.from("profiles").insert({
          id: user.id,
          full_name: fullName,
          account_id: accountId,
          balance: Number(balance),
          currency: currency,
        });

      if (profileError) {
        alert(profileError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    alert("Account created ✅ Check your email");

    // go to signin after signup
    router.push("/signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">

      <div className="w-[420px] border rounded-xl p-8 shadow-md space-y-5">

        <h1 className="text-2xl font-bold text-center">
          Create Account
        </h1>

        {/* PROFILE */}

        <input
          placeholder="Full Name"
          className="input"
          onChange={(e)=>setFullName(e.target.value)}
        />

        <input
          placeholder="Account ID"
          className="input"
          onChange={(e)=>setAccountId(e.target.value)}
        />

        <input
          type="number"
          placeholder="Starting Balance"
          className="input"
          onChange={(e)=>setBalance(e.target.value)}
        />

        <input
          placeholder="Currency (INR, USD...)"
          className="input"
          onChange={(e)=>setCurrency(e.target.value)}
        />

        {/* AUTH */}

        <input
          type="email"
          placeholder="Email"
          className="input"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="input"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-600 font-medium">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}