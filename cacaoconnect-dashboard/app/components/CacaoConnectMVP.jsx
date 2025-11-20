'use client';

import React, { useState } from 'react';
import {
  Truck,
  TrendingUp,
  ArrowRight,
  Leaf
} from 'lucide-react';

import { useToast, ToastNotification } from './shared';
import ProcessorApp from './ProcessorApp';
import FarmerApp from './FarmerApp';

export default function CacaoConnectMVP() {
  const [activeApp, setActiveApp] = useState(null);
  const { toast, showToast } = useToast();

  if (!activeApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center p-4 font-sans">
        <style>{`
          .animate-fade-in { animation: fadeIn 0.5s ease-out; }
          .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          .animate-slide-in { animation: slideIn 0.3s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>
        
        <div className="max-w-5xl w-full">
           <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-stone-900 mb-2 tracking-tight">Cacao<span className="text-amber-600">Connect</span></h1>
              <p className="text-stone-500">Select your portal to begin</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Farmer Portal Card */}
            <div 
              onClick={() => setActiveApp('farmer')}
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl hover:shadow-3xl transition-all cursor-pointer border-b-8 border-emerald-600 group relative overflow-hidden transform hover:-translate-y-2"
            >
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-50 rounded-full transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform shadow-sm">
                  <Truck className="text-emerald-600 w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-stone-900 mb-3">Farmer App</h2>
                <p className="text-stone-500 mb-8 text-lg leading-relaxed">Mobile interface for field operations. Receive orders, check AI forecasts, and manage harvests.</p>
                <div className="flex items-center font-bold text-emerald-600 text-lg">
                  Launch Mobile View <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={24}/>
                </div>
              </div>
            </div>

            {/* Processor Portal Card */}
            <div 
              onClick={() => setActiveApp('processor')}
              className="bg-stone-900 p-10 rounded-[2.5rem] shadow-2xl hover:shadow-3xl transition-all cursor-pointer border-b-8 border-indigo-500 group relative overflow-hidden transform hover:-translate-y-2 text-white"
            >
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full transition-transform group-hover:scale-110"></div>
               <div className="relative z-10">
                <div className="bg-stone-800 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform shadow-inner border border-stone-700">
                  <TrendingUp className="text-indigo-400 w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-3">Processor HQ</h2>
                <p className="text-stone-400 mb-8 text-lg leading-relaxed">Central command for supply chain. Monitor live volume, broadcast demand, and analyze risks.</p>
                <div className="flex items-center font-bold text-indigo-400 text-lg">
                  Access Dashboard <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={24}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      <ToastNotification toast={toast} />
      {activeApp === 'farmer' ? (
        <div className="max-w-md mx-auto h-screen shadow-2xl bg-stone-50 overflow-hidden relative">
           <FarmerApp onLogout={() => setActiveApp(null)} showToast={showToast} />
        </div>
      ) : (
        <ProcessorApp onLogout={() => setActiveApp(null)} showToast={showToast} />
      )}
    </>
  );
}