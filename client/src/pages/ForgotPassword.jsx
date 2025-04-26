// client/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch {
      setMessage("Oops—something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left graphic panel */}
      <div className="hidden lg:block md:w-1/2 bg-gradient-to-tr from-green-400 to-blue-600 relative overflow-hidden">
        <div className="absolute top-16 left-[-4rem] w-72 h-72 bg-white opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-16 right-[-3rem] w-56 h-56 bg-white opacity-20 rounded-full animate-ping"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-5xl font-extrabold drop-shadow-lg">
            Reset Your Password
          </h1>
        </div>
      </div>

      {/* Right form pane */}
      <div className="flex w-full h-screen lg:w-1/2 items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 dark:text-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {message ? (
              <p className="p-4 bg-green-100 text-green-800 rounded text-center">
                {message}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full border border-gray-300 text-black bg-amber-200 hover:bg-amber-300 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <div className="relative my-4">
                  {/* Line behind */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                  </div>

                  {/* Text above line */}
                  <div className="relative z-10 flex justify-center">
                    <span className="px-3 bg-white dark:bg-[#101828] text-gray-500 text-xs uppercase">
                      Or go back to
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <a
                    href="/signin"
                    className="text-black bg-blue-400 block rounded-[5px] p-[6px] hover:bg-blue-300 text-md font-semibold"
                  >
                    Sign In
                  </a>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
