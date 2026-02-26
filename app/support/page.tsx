"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setStatus("Submitting...");

    // Get logged in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("You must be logged in.");
      return;
    }

    const { error } = await supabase.from("support_queries").insert([
      {
        user_id: user.id,
        subject,
        message,
      },
    ]);

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Query submitted successfully!");
      setSubject("");
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded w-[400px]"
      >
        <h2 className="text-2xl mb-6 text-center">
          Query & Support
        </h2>

        <input
          type="text"
          placeholder="Subject"
          className="w-full p-3 mb-4 bg-gray-800 rounded"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <textarea
          placeholder="Describe your issue..."
          className="w-full p-3 mb-4 bg-gray-800 rounded"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 p-3 rounded"
        >
          Submit
        </button>

        {status && (
          <p className="mt-4 text-center text-green-400">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}