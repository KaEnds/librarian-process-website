'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import logo from "@/images/KMUTT_logo.jpg";
import Link from "next/link";
import { createUser } from "@/actions/auth";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await createUser({
        username,
        password,
        confirmPassword,
        userRole,
        accountStatus: "active",
        name,
        surname,
      });

      showToast(response.message ?? "สมัครสมาชิกสำเร็จ", "success");
      router.push("/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "สมัครสมาชิกไม่สำเร็จ";
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
            The Agentic AI Library process
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
              <span className="text-">สร้างบัญชี</span>
              <span className="">LibAIry</span>
              <img src={logo.src} alt="Logo" className="w-12 h-14"/>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Sign Up to Get Started</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              placeholder="First Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <Input
              type="text"
              placeholder="Surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {/* <option value="admin">admin</option> */}
              <option value="librarian">librarian</option>
              <option value="director">director</option>
            </select>

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Login
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
