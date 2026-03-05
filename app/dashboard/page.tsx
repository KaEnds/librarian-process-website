import Workflow from "@/components/workflow"; // เช็ค path ให้ตรงกับเครื่องคุณ

export default function DashboardPage() {
  return (
    <main className="p-6 bg-gray-50 h-[calc(100vh-80px)]">
      {/* ส่วน Header และ Stat Cards เดิมของคุณ */}
      
      <div className="mt-8">
        <Workflow />
      </div>

      {/* ส่วน DataTable ด้านล่าง */}
    </main>
  );
}