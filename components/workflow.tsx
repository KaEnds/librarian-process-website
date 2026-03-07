"use client"

import React, { useEffect, useState } from 'react';
import { FileText, Send, Home, UserCheck } from 'lucide-react';

interface ProcessState {
  process_id: number;
  status: string;
  updated_at: string;
}

const iconMap = [FileText, Send, Home, UserCheck];
const labelMap = [
  'คัดเลือกคำร้อง',
  'ส่งอีเมลขอใบเสนอราคา',
  'คัดเลือกร้านค้า',
  'ทำใบอนุมัติจัดซื้อ',
];

const Workflow = () => {
  const [processStates, setProcessStates] = useState<ProcessState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProcessStates = async () => {
      try {
        const response = await fetch('/api/get-all-process-states');
        if (response.ok) {
          const data = await response.json();
          setProcessStates(data.data);
        }
      } catch (error) {
        console.error('Error fetching process states:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcessStates();

    // Poll every 3 seconds to keep updated
    const interval = setInterval(fetchProcessStates, 3000);
    return () => clearInterval(interval);
  }, []);

  const mapStatus = (dbStatus: string): string => {
    switch (dbStatus) {
      case 'DONE':
        return 'Done';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PENDING':
        return 'Pending';
      default:
        return 'Pending';
    }
  };

  const steps = processStates.map((process) => ({
    id: process.process_id,
    label: labelMap[process.process_id - 1] || `Process ${process.process_id}`,
    icon: iconMap[process.process_id - 1] || FileText,
    status: mapStatus(process.status),
  }));

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6">กระบวนการทำงาน</h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(236, 72, 153, 0.6);
            transform: scale(1.05);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-rotate {
          animation: rotate 1.8s linear infinite;
        }

        .spinner-ring-outer {
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          border: 3px solid rgba(255, 255, 255, 0.25);
          border-top-color: rgba(255, 255, 255, 0.95);
          border-right-color: rgba(255, 255, 255, 0.85);
          animation: rotate 1.1s linear infinite;
          pointer-events: none;
        }

        .spinner-ring-inner {
          position: absolute;
          inset: 8px;
          border-radius: 9999px;
          border: 2px dashed rgba(255, 255, 255, 0.7);
          animation: rotate-reverse 1.4s linear infinite;
          pointer-events: none;
        }

        @keyframes arrow-flow {
          0%,
          100% {
            transform: translateX(0);
            opacity: 0.7;
          }
          50% {
            transform: translateX(4px);
            opacity: 1;
          }
        }

        .arrow-active {
          color: rgb(244 114 182);
          animation: arrow-flow 1s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(244, 114, 182, 0.5));
        }
      `}</style>
      
      <h3 className="text-lg font-semibold mb-6">กระบวนการทำงาน</h3>
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 mb-3 transition-all duration-300
                ${step.status === 'Done' ? 'border-green-500 bg-green-50 text-green-600' : 
                  step.status === 'In Progress' ? 'border-pink-400 bg-pink-400 text-white animate-pulse-glow' : 
                  'border-gray-300 bg-gray-50 text-gray-400'}`}>
                {step.status === 'In Progress' && (
                  <>
                    <span className="spinner-ring-outer" />
                    <span className="spinner-ring-inner" />
                  </>
                )}
                <step.icon 
                  size={32} 
                  className={step.status === 'In Progress' ? 'animate-rotate' : ''}
                />
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
                {(() => {
                  const currentStep = steps[index];
                  const nextStep = steps[index + 1];
                  const arrowClass =
                    currentStep?.status === 'Done' && nextStep?.status === 'Done'
                      ? 'text-green-500'
                      : nextStep?.status === 'In Progress'
                        ? 'arrow-active'
                        : 'text-gray-400';

                  return (
                <svg
                  width="40"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={arrowClass}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                  );
                })()}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Workflow;