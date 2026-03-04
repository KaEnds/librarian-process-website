"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import AddStorePopup from "@/components/AddStorePopup";

type Vendor = {
  vendor_id: number;
  vendor_name: string;
  contact_person: string;
  vendor_email: string;
  telephone_number: string;
  line_id: string;
  is_active: boolean;
};

export default function StoreSettingsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const loadVendors = async () => {
    try {
      const response = await fetch("/api/get-and-update-vendors");
      const payload = await response.json();
      const vendorList = Array.isArray(payload?.data) ? payload.data : [];
      setVendors(vendorList);
    } catch (error) {
      console.error("Error loading vendors:", error);
      setVendors([]);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return vendors.filter((vendor) =>
      vendor.vendor_name.toLowerCase().includes(normalizedSearch) ||
      vendor.vendor_email.toLowerCase().includes(normalizedSearch) ||
      vendor.contact_person.toLowerCase().includes(normalizedSearch) ||
      vendor.telephone_number.toLowerCase().includes(normalizedSearch) ||
      vendor.line_id.toLowerCase().includes(normalizedSearch)
    );
  }, [searchTerm, vendors]);

  const handleDeleteButtonClick = async () => {
    if (!isDeleteMode) {
      setIsDeleteMode(true);
      setSelectedIds([]);
      return;
    }

    if (selectedIds.length === 0) {
      alert("กรุณาเลือกร้านค้าที่ต้องการลบ");
      return;
    }

    if (!confirm(`คุณต้องการลบ ${selectedIds.length} ร้านค้าที่เลือกใช่หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch("/api/get-and-update-vendors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorIds: selectedIds }),
      });

      if (!response.ok) {
        const payload = await response.json();
        alert(payload?.message ?? "ไม่สามารถลบร้านค้าได้");
        return;
      }

      await loadVendors();
      setSelectedIds([]);
      setIsDeleteMode(false);
    } catch (error) {
      console.error("Error deleting vendors:", error);
    }
  };

  const handleInsertVendor = async (payload: {
    vendorName: string;
    contactPerson: string;
    vendorEmail: string;
    telephoneNumber: string;
    lineId: string;
    isActive: boolean;
  }) => {
    try {
      const response = await fetch("/api/get-and-update-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json();
        alert(errorPayload?.message ?? "ไม่สามารถเพิ่มร้านค้าได้");
        return;
      }

      setIsPopupOpen(false);
      await loadVendors();
    } catch (error) {
      console.error("Error inserting vendor:", error);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">
              ร้านค้าสั่งซื้อหนังสือ
              <span className="text-blue-500 font-medium text-sm ml-2">{filteredVendors.length} ร้านค้า</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">จัดการรายชื่อร้านค้าสำหรับส่งใบเสนอราคา</p>
          </div>

          <div className="flex flex-wrap gap-2">
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
              onClick={handleDeleteButtonClick}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                isDeleteMode ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-gray-600 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <Trash2 size={18} />
              {isDeleteMode ? `ยืนยันลบ${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}` : "Delete"}
            </button>

            {isDeleteMode && (
              <button
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedIds([]);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
            )}

            <button
              onClick={() => setIsPopupOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-all text-sm"
            >
              <Plus size={18} /> เพิ่มร้านค้า
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 w-12">
                  {isDeleteMode && (
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredVendors.map((vendor) => vendor.vendor_id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={selectedIds.length === filteredVendors.length && filteredVendors.length > 0}
                    />
                  )}
                </th>
                <th className="px-4 py-4 font-medium text-center w-12">No.</th>
                <th className="px-6 py-4 font-medium">vendorName</th>
                <th className="px-6 py-4 font-medium">contactPerson</th>
                <th className="px-6 py-4 font-medium">vendorEmail</th>
                <th className="px-6 py-4 font-medium">telephoneNumber</th>
                <th className="px-6 py-4 font-medium">lineId</th>
                <th className="px-6 py-4 font-medium text-center">isActive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredVendors.map((vendor, index) => (
                <tr
                  key={vendor.vendor_id}
                  className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(vendor.vendor_id) ? "bg-blue-50/30" : ""}`}
                >
                  <td className="px-6 py-4 text-center">
                    {isDeleteMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(vendor.vendor_id)}
                        onChange={() => toggleSelect(vendor.vendor_id)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{vendor.vendor_name}</td>
                  <td className="px-6 py-4 text-gray-500">{vendor.contact_person}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{vendor.vendor_email}</td>
                  <td className="px-6 py-4 text-gray-500">{vendor.telephone_number}</td>
                  <td className="px-6 py-4 text-gray-500">{vendor.line_id}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                        vendor.is_active
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : "bg-red-50 text-red-500 border-red-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${vendor.is_active ? "bg-blue-500" : "bg-red-500"}`}
                      />
                      {vendor.is_active ? "true" : "false"}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400 italic">
                    ไม่พบข้อมูลที่ค้นหา...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStorePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleInsertVendor}
      />
    </div>
  );
}
