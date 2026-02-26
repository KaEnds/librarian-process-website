"use client";
import React from 'react';
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AddStorePopup = ({ isOpen, onClose }: Props) => {
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
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Email ร้านค้า</label>
            <input 
              type="email" 
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="Example@gmail.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Contact person</label>
            <input 
              type="text" 
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="สมชาย บุญส่งดี"
            />
          </div>

          <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all mt-4">
            บันทึกรายการ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStorePopup;