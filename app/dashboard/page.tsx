"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchProfile = async () => {

      // ✅ get logged in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log("No user session");
        return;
      }

      // ✅ fetch matching profile
      const { data, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)   // 🔥 match auth id
          .single();

      if (error) {
        console.error(error);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();

  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-10 space-y-6">

      <div className="bg-gray-900 text-white p-6 rounded-lg">
        <h2 className="text-lg">Bank Balance</h2>
        <h1 className="text-3xl font-bold">₹ 45,000</h1>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-lg font-semibold">
          Account Details
        </h2>

        <p>Name: Aarushi Deshmukh</p>
        <p>Account: XXXX1234</p>
        <p>Bank: HDFC Bank</p>
      </div>

    </div>
  );
}

