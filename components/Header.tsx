"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="font-bold text-lg">
        Payment Simulator
      </h1>

      <div className="flex gap-6 items-center">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/payment">Make Payment</Link>
        <Link href="/support">Support</Link>

        <button
          onClick={handleSignOut}
          className="bg-red-500 px-3 py-1 rounded"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}