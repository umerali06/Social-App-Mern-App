// client/src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // If no token in URL, redirect back to sign-in
  useEffect(() => {
    if (!token) navigate("/signin");
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setMessage("Password reset! Redirecting to Sign In…");
      setTimeout(() => navigate("/signin"), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left graphic panel */}
      <div className="hidden lg:block md:w-1/2 bg-gradient-to-tr from-blue-500 to-purple-600 relative overflow-hidden">
        <div className="absolute top-16 left-[-4rem] w-72 h-72 bg-white opacity-10 rounded-full animate-pulse" />
        <div className="absolute bottom-16 right-[-3rem] w-56 h-56 bg-white opacity-20 rounded-full animate-ping" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-5xl font-extrabold drop-shadow-lg">
            Create a New Password
          </h1>
        </div>
      </div>

      {/* Right form pane */}
      <div className="flex w-full h-screen lg:w-1/2 items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 dark:text-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Reset Password
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
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium"
                  >
                    New Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full border-b-amber-50 border-[1px] hover:bg-amber-50 hover:text-black cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Set New Password"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or go back to
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <a
                    href="/signin"
                    className="text-black bg-blue-600 block rounded p-1 hover:bg-blue-400 text-md font-semibold"
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
