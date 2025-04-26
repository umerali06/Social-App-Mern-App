// client/src/pages/SignIn.jsx
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { AuthContext } from "../context/AuthContext";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import { GithubLoginButton } from "react-social-login-buttons";
import api from "../api/axios";

export default function SignIn() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if the user is authenticated and redirect to home page
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/"); // Redirect to home page if the user is authenticated
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    console.log(response); // Log the entire response to inspect its structure

    const { credential, tokenId } = response; // ID Token is likely stored here

    try {
      // If 'credential' or 'tokenId' is available, use it to send to the backend
      const idToken = credential || tokenId; // Use whichever token is available

      if (!idToken) {
        throw new Error("ID Token is missing from the response");
      }

      // Send the ID Token to the backend for verification
      const res = await api.post("/auth/google-login", { id_token: idToken });

      // Assuming the backend sends a token on successful login
      if (res.data.token) {
        localStorage.setItem("token", res.data.token); // Save token in localStorage or cookies
        navigate("/"); // Redirect to homepage
      }
    } catch (error) {
      console.error(error); // Log the error for debugging
      setError("Google login failed. Please try again.");
    } // Add the missing semicolon here
  };

  // GitHub OAuth Success
  const handleGithubSuccess = async (response) => {
    const { code } = response; // GitHub OAuth code
    try {
      await api.post("/auth/github-login", { code }); // Send code to backend for exchange
      navigate("/"); // Redirect to home page
    } catch (error) {
      setError("GitHub login failed. Please try again.");
    }
  };

  const handleGitHubLogin = () => {
    const popup = window.open(
      "https://github.com/login/oauth/authorize?client_id=Ov23liH1w6AcyEh1I4A4&scope=user",
      "GitHub Login"
    );

    // Wait for the user to complete OAuth, and then handle response in the popup window
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval); // Clear the interval once the popup is closed
        navigate("/"); // Optionally handle the redirect or state change after successful login
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row dark:bg-black bg-white">
      {/* Left gradient & shapes */}
      <div className="hidden md:block md:w-1/2 relative bg-gradient-to-tr from-pink-500 to-purple-600 overflow-hidden">
        <div className="absolute top-12 left-[-4rem] w-72 h-72 bg-white opacity-10 rounded-full animate-ping"></div>
        <div className="absolute bottom-12 right-[-3rem] w-56 h-56 bg-white opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-5xl font-extrabold drop-shadow-lg">
            Welcome Back
          </h1>
        </div>
      </div>

      {/* Right form */}
      <div className="flex w-full h-screen lg:w-1/2 items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 dark:text-white">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl text-center">Sign In</CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="text-red-600 mb-4 text-center">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-medium font-medium">
                  Email:
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-medium font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border-amber-50 cursor-pointer dark:bg-white dark:text-black bg-fuchsia-500 text-white hover:text-shadow-zinc-300"
              >
                {loading ? "Logging in..." : "Sign In"}
              </Button>
              <p className="mt-[-10px] p-0">
                <Link
                  to="/forgot-password"
                  className="text-indigo-500 hover:underline block text-left"
                >
                  Forgot password?
                </Link>
              </p>
            </form>

            <div className="relative my-4">
              {/* Line behind */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>

              {/* Text above line */}
              <div className="relative z-10 flex justify-center">
                <span className="px-3 bg-white dark:bg-[#101828] text-gray-500 text-xs uppercase">
                  Or Continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-6 grid grid-cols-1 gap-3">
              {/* Google Login Button */}
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError("Google login failed. Please try again.")
                }
              />
              {/* GitHub Login Button */}
              <GithubLoginButton
                onClick={handleGitHubLogin} // Handle GitHub login
                className="flex items-center justify-center py-2 border rounded hover:bg-gray-100 hover:text-black transition w-full"
              />
            </div>
          </CardContent>

          <CardFooter className="pt-2 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-indigo-500 hover:underline">
                Sign Up
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
