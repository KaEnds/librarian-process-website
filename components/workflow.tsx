import React from 'react';
import { FileText, Send, Home, UserCheck } from 'lucide-react';

const steps = [
  { id: 1, label: 'คัดเลือกคำร้อง', icon: FileText, status: 'Done' },
  { id: 2, label: 'ส่งอีเมลขอใบเสนอราคา', icon: Send, status: 'In Progress' },
  { id: 3, label: 'คัดเลือกร้านค้า', icon: Home, status: 'Pending' },
  { id: 4, label: 'ทำใบอนุมัติจัดซื้อ', icon: UserCheck, status: 'Pending' },
];

const Workflow = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-6">กระบวนการทำงาน</h3>
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 mb-3 
                ${step.status === 'Done' ? 'border-blue-500 bg-white text-blue-500' : 
                  step.status === 'In Progress' ? 'border-pink-400 bg-pink-400 text-white shadow-lg shadow-pink-200' : 
                  'border-blue-400 bg-white text-blue-400'}`}>
                <step.icon size={32} />
              </div>
              
              <span className="text-sm font-medium mb-2">{step.label}</span>
              
              {/* Status Badge */}
              <span className={`px-4 py-1 rounded-full text-xs font-medium
                ${step.status === 'Done' ? 'bg-green-100 text-green-600' : 
                  step.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 
                  'bg-gray-200 text-gray-500'}`}>
                • {step.status}
              </span>
            </div>

            {/* Connector Arrow */}
            {index < steps.length - 1 && (
              <div className="flex-shrink-0 mx-4 mt-[-40px]">
                <svg width="40" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Workflow;