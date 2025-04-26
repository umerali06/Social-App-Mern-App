// client/src/pages/SignUp.jsx
import React, { useState, useContext } from "react";
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

export default function SignUp() {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row dark:bg-black bg-white">
      {/* Left gradient & shapes */}
      <div className="hidden md:block md:w-1/2 relative bg-gradient-to-tr from-green-400 to-blue-500 overflow-hidden">
        <div className="absolute top-12 left-[-4rem] w-72 h-72 bg-white opacity-10 rounded-full animate-ping"></div>
        <div className="absolute bottom-12 right-[-3rem] w-56 h-56 bg-white opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-5xl font-extrabold drop-shadow-lg p-6 text-center leading-15">
            Join Our Social Community
          </h1>
        </div>
      </div>

      {/* Right form */}
      <div className="flex w-full h-screen lg:w-1/2 items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 dark:text-white">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl text-center">
              Create Account
            </CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="text-red-600 mb-4 text-center">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-medium font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-medium font-medium">
                  Email
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
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
            </form>

            {/* Separator */}
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
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href="http://localhost:5000/api/auth/google"
                className="flex items-center justify-center py-2 border rounded hover:bg-gray-100 hover:text-black transition"
              >
                <FaGoogle className="text-red-500 mr-2" /> Google
              </a>
              <a
                href="http://localhost:5000/api/auth/github"
                className="group flex items-center justify-center py-2 border rounded hover:bg-gray-100 hover:text-black transition"
              >
                <FaGithub className="dark:text-white mr-2 group-hover:text-black" />{" "}
                GitHub
              </a>
            </div>
          </CardContent>

          <CardFooter className="pt-2 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/signin" className="text-green-500 hover:underline">
                Sign In
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
