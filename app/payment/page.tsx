"use client";

import { useState } from "react";

export default function PaymentPage() {

  const [currency, setCurrency] = useState("INR");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="flex justify-center mt-20 bg-white text-black">

      <div className="bg-white border shadow-md p-10 rounded-lg w-96 space-y-6">

        {/* Currency */}
        <div>
          <label className="block mb-2 font-medium">
            Currency
          </label>

          <select
            className="w-full p-3 border rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currency}
            onChange={(e)=>setCurrency(e.target.value)}
          >
            <option>INR</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </div>

        {/* Customer ID */}
        <div>
          <label className="block mb-2 font-medium">
            Customer ID
          </label>

          <input
            className="w-full p-3 border rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e)=>setCustomerId(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block mb-2 font-medium">
            Amount
          </label>

          <input
            type="number"
            className="w-full p-3 border rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e)=>setAmount(e.target.value)}
          />
        </div>

        {/* Pay Button */}
        <button className="w-full bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition">
          Pay
        </button>

      </div>

    </div>
  );
}