import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Feed from "@/components/Feed";

export default function Home() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-4">
        Welcome, {user?.name || "User"}!
      </h1>
      <Feed />
      <p className="mb-6">This is your home feed—build it out as you like.</p>
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
      >
        Sign Out
      </button>
    </div>
  );
}
