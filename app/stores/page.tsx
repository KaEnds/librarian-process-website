"use client";
import React, { useState, useMemo } from 'react';
import { Plus, Filter, Trash2, ExternalLink, Search } from "lucide-react";
import AddStorePopup from "@/components/AddStorePopup";

// ข้อมูลจำลอง (Mock Data)
const initialStores = [
  { id: 1, name: 'นายอินทร์', email: 'cs@naiin.com', contact: 'ธนกร วัฒนชัย', status: 'Active' },
  { id: 2, name: 'SE-ED Book Center', email: 'e-commerce@se-ed.com', contact: 'ปรียานุช ศรีสวัสดิ์', status: 'Active' },
  { id: 3, name: 'Asia Books', email: 'ecommerce@asiabooks.com', contact: 'กิตติพงษ์ อินทรสุข', status: 'Active' },
  { id: 4, name: 'Kinokuniya', email: 'th_member@kinokuniya.com', contact: 'ณัฐธิดา พิทักษ์ธรรม', status: 'Not Active' },
  { id: 5, name: 'CU BOOK', email: 'customer@cubook.chula.ac.th', contact: 'ชลธิชา รัตนมณี', status: 'Active' },
];

export default function StoreSettingsPage() {
  const [stores, setStores] = useState(initialStores);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // ส่วน Filter: กรองข้อมูลจากชื่อร้านค้าหรือ Email
  const filteredStores = useMemo(() => {
    return stores.filter(store => 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, stores]);

  // ส่วน Delete: ลบรายการที่ถูกเลือก
  const handleDelete = () => {
    if (selectedIds.length === 0) return alert("กรุณาเลือกรายการที่ต้องการลบ");
    if (confirm(`คุณต้องการลบ ${selectedIds.length} รายการที่เลือกใช่หรือไม่?`)) {
      setStores(stores.filter(store => !selectedIds.includes(store.id)));
      setSelectedIds([]); // ล้างค่าการเลือกหลังลบ
    }
  };

  // จัดการการเลือก Checkbox
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {/* Header & Controls */}
        <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">
              ร้านค้าสั่งซื้อหนังสือ 
              <span className="text-blue-500 font-medium text-sm ml-2">{filteredStores.length} ร้านค้า</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">จัดการรายชื่อร้านค้าสำหรับส่งใบเสนอราคา</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Filter Input */}
            <div className="relative border rounded-md px-2 py-1.5 flex items-center bg-gray-50 focus-within:bg-white transition-all">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="ค้นหาร้านค้า..." 
                className="bg-transparent text-sm outline-none w-40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              onClick={handleDelete}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                selectedIds.length > 0 ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <Trash2 size={18} /> Delete {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>

            <button 
              onClick={() => setIsPopupOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-all text-sm"
            >
              <Plus size={18} /> เพิ่มร้านค้า
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 w-12">
                   <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if(e.target.checked) setSelectedIds(filteredStores.map(s => s.id));
                      else setSelectedIds([]);
                    }}
                    checked={selectedIds.length === filteredStores.length && filteredStores.length > 0}
                   />
                </th>
                <th className="px-4 py-4 font-medium text-center w-12">No.</th>
                <th className="px-6 py-4 font-medium">ชื่อร้านค้า</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium text-center">เปิดใช้งาน</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredStores.map((store, index) => (
                <tr key={store.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(store.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(store.id)}
                      onChange={() => toggleSelect(store.id)}
                    />
                  </td>
                  <td className="px-4 py-4 text-center text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{store.name}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{store.email}</td>
                  <td className="px-6 py-4 text-gray-500">{store.contact}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                      store.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-500 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${store.status === 'Active' ? 'bg-blue-500' : 'bg-red-500'}`} />
                      {store.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-right">
                    <ExternalLink size={18} className="cursor-pointer hover:text-blue-500 inline" />
                  </td>
                </tr>
              ))}
              {filteredStores.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">ไม่พบข้อมูลที่ค้นหา...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStorePopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </div>
  );
}