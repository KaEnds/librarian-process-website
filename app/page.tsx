import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      hello librarian
      สวัสดี
      <h1 className="text-4xl">เว็บไซต์สำหรับบรรณารักษ์</h1>
      <div className="flex gap-4">
        <Button className="mt-4" variant={"default"}>สวัสดี</Button>
        <Button className="mt-4" variant={"default"}>Primary</Button>
        <Button className="mt-4" variant={"outline"}>outline</Button>
        <Button className="mt-4" variant={"ghost"}>ghost</Button>
        <Button className="mt-4" variant={"destructive"}>destructive</Button>

      </div>
      <div className="container">
        <Input className="mt-4" placeholder="Type here..." />
      </div>
    </div>
  );
}
