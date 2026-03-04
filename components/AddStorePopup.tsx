"use client";
import React, { useState } from 'react';
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    vendorName: string;
    contactPerson: string;
    vendorEmail: string;
    telephoneNumber: string;
    lineId: string;
    isActive: boolean;
  }) => Promise<void>;
}

const AddStorePopup = ({ isOpen, onClose, onSubmit }: Props) => {
  const [vendorName, setVendorName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [telephoneNumber, setTelephoneNumber] = useState("");
  const [lineId, setLineId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async () => {
    await onSubmit({
      vendorName,
      contactPerson,
      vendorEmail,
      telephoneNumber,
      lineId,
      isActive,
    });

    setVendorName("");
    setContactPerson("");
    setVendorEmail("");
    setTelephoneNumber("");
    setLineId("");
    setIsActive(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#334155]/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[450px] overflow-hidden">
        {/* Modal Header */}
        <div className="relative p-6 text-center">
          <h2 className="text-lg font-bold text-gray-800">เพิ่มร้านค้า</h2>
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">ชื่อร้านค้า</label>
            <input 
              type="text" 
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="สวนเงินมีมา"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Email ร้านค้า</label>
            <input 
              type="email" 
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="Example@gmail.com"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Contact person</label>
            <input 
              type="text" 
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="สมชาย บุญส่งดี"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Telephone Number</label>
            <input
              type="text"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="0999999999"
              value={telephoneNumber}
              onChange={(e) => setTelephoneNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Line ID</label>
            <input
              type="text"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="test_line"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            เปิดใช้งานร้านค้านี้
          </label>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all mt-4"
          >
            บันทึกรายการ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStorePopup;