"use client";

import { useState } from "react";

export default function QueryPage() {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    alert("Query submitted successfully!");
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        Raise a Query
      </h1>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe your issue..."
        className="w-full p-4 bg-gray-900 rounded mb-4"
      />

      <button
        onClick={handleSubmit}
        className="bg-purple-600 px-6 py-2 rounded"
      >
        Submit
      </button>
    </div>
  );
}