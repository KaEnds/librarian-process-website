'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import logo from "@/images/KMUTT_logo.jpg";
import { loginUser } from "@/actions/auth";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await loginUser(username, password);
      showToast(response.message ?? "เข้าสู่ระบบสำเร็จ", "success");
      router.push("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center px-12"
        style={{
          background: "linear-gradient(180deg, #0575E6 0%, #02298A 85%, #021B79 100%)",
        }}
      >
        <div>
            <h1 className="text-5xl font-bold text-white mb-4">LibAIry</h1>
            <p className="text-xl text-blue-100 mb-8">
            The Agentic AI Automation Library process
            </p>
            <Button className="bg-blue-500 hover:bg-blue-400 text-white rounded-full px-8 py-6">
            Read More
            </Button>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo and header */}
          <div className="mb-8 text-start">
            <div className="flex justify-start items-end gap-2 mb-4 font-bold text-3xl">
              <span className="text-">เข้าสู่ระบบ</span>
              <span className="">LibAIry</span>
              <img src={logo.src} alt="Logo" className="w-12 h-14"/>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Forgot password link */}
          <div className="text-center mt-4 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-800">
              Forgot Password
            </a>
            <span className="mx-2">|</span>
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
