'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import { useFormStatus } from "react-dom";
import logo from "@/images/KMUTT_logo.jpg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const status = useFormStatus();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { username, password });
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
              disabled={status.pending}
            >
              Login
            </Button>
          </form>

          {/* Forgot password link */}
          <div className="text-center mt-4">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-800">
              Forgot Password
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
