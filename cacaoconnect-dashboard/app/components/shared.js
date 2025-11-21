import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Truck,
  CheckCircle,
  CheckCircle2,
  Clock,
  XOctagon,
  ThumbsUp,
  ThumbsDown,
  Package,
  Warehouse,
  DollarSign,
  AlertTriangle,
  Receipt
} from 'lucide-react';

// --- CONFIGURATION ---

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallback to allow the app to render even if keys are missing (functionality will be limited)
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// --- CONSTANTS ---

export const ORDER_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  FILLED: 'filled',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const COMMITMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  READY: 'ready',
  COLLECTED: 'collected',
  DELIVERED: 'delivered',
  PAID: 'paid'
};

export const QUALITY_GRADES = {
  A: { label: 'Grade A', color: 'emerald', multiplier: 1.0 },
  B: { label: 'Grade B', color: 'amber', multiplier: 0.85 },
  C: { label: 'Grade C', color: 'orange', multiplier: 0.7 }
};

export const getStatusConfig = (status) => {
  const configs = {
    draft: { color: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
    open: { color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    filled: { color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
    in_transit: { color: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck },
    delivered: { color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', icon: Warehouse },
    completed: { color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    cancelled: { color: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', icon: XOctagon },
    pending: { color: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    approved: { color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: ThumbsUp },
    rejected: { color: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', icon: ThumbsDown },
    ready: { color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', icon: Package },
    collected: { color: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck },
    paid: { color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: DollarSign }
  };
  return configs[status] || configs.pending;
};

// --- UTILITIES ---

export const useToast = () => {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast };
};

export const ToastNotification = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center transform transition-all duration-300 animate-slide-in ${
      toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-stone-900 text-white'
    }`}>
      {toast.type === 'error' ? <AlertTriangle className="mr-2 w-5 h-5"/> : <CheckCircle className="mr-2 w-5 h-5 text-emerald-400"/>}
      <span className="font-medium">{toast.msg}</span>
    </div>
  );
};

// AI Handlers
export const callOpenAIJSON = async (prompt) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("AI Service Error:", errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI Service Network Error:", error);
    return null;
  }
};

export const callTTS = async (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    
    speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser");
  }
};

// --- DATA SERVICE ---

export const DataService = {
  getOrdersWithProgress: async () => {
    if (!supabase) throw new Error("Supabase Client disconnected.");
    
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (orderError) throw orderError;

    const { data: commitments, error: commitError } = await supabase
      .from('commitments')
      .select('*');
    if (commitError) throw commitError;

    const enrichedOrders = orders.map(order => {
      const orderCommitments = commitments.filter(c => c.order_id === order.id);
      
      const approvedVolume = orderCommitments
        .filter(c => ['approved', 'ready', 'collected', 'delivered', 'paid'].includes(c.status))
        .reduce((sum, c) => sum + (Number(c.committed_volume_kg) || 0), 0);
      
      const pendingVolume = orderCommitments
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + (Number(c.committed_volume_kg) || 0), 0);
      
      const deliveredVolume = orderCommitments
        .filter(c => ['delivered', 'paid'].includes(c.status))
        .reduce((sum, c) => sum + (Number(c.committed_volume_kg) || 0), 0);

      const totalCommitted = approvedVolume + pendingVolume;
      const fillPercentage = Math.min(100, Math.round((approvedVolume / order.volume_kg) * 100));
      const deliveryPercentage = Math.round((deliveredVolume / order.volume_kg) * 100);
      
      let derivedStatus = order.status;
      if (order.status !== 'cancelled') {
        if (deliveryPercentage >= 100) {
          derivedStatus = 'completed';
        } else if (deliveredVolume > 0) {
          derivedStatus = 'delivered';
        } else if (orderCommitments.some(c => c.status === 'collected')) {
          derivedStatus = 'in_transit';
        } else if (fillPercentage >= 100) {
          derivedStatus = 'filled';
        } else {
          derivedStatus = 'open';
        }
      }

      return {
        ...order,
        commitments: orderCommitments,
        approvedVolume,
        pendingVolume,
        deliveredVolume,
        totalCommitted,
        fillPercentage,
        deliveryPercentage,
        derivedStatus,
        commitmentCount: orderCommitments.length,
        pendingCount: orderCommitments.filter(c => c.status === 'pending').length
      };
    });

    return enrichedOrders;
  },

  getFarmerCommitments: async (farmerId = null) => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      const { data: commitments, error: commitError } = await supabase
        .from('commitments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (commitError) {
        console.warn('Failed to fetch commitments:', commitError.message);
        return [];
      }
      
      if (!commitments || commitments.length === 0) return [];
      
      const orderIds = [...new Set(commitments.map(c => c.order_id).filter(Boolean))];
      if (orderIds.length === 0) return commitments.map(c => ({ ...c, orders: null }));
      
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds);
      
      if (orderError) {
        console.warn('Failed to fetch orders:', orderError.message);
        return commitments.map(c => ({ ...c, orders: null }));
      }
      
      const ordersMap = {};
      (orders || []).forEach(o => { ordersMap[o.id] = o; });
      
      return commitments.map(c => ({
        ...c,
        orders: ordersMap[c.order_id] || null
      }));
    } catch (error) {
      console.error('getFarmerCommitments error:', error);
      return [];
    }
  },

  getStats: async () => {
    if (!supabase) throw new Error("Supabase Client disconnected.");
    const { data: commitments, error: commitError } = await supabase
      .from('commitments')
      .select('committed_volume_kg, farmer_id, status');
    if (commitError) throw commitError;

    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('status');
    if (orderError) throw orderError;

    const approvedCommitments = commitments.filter(c => 
      ['approved', 'ready', 'collected', 'delivered', 'paid'].includes(c.status)
    );
    
    const totalVol = approvedCommitments.reduce((acc, curr) => acc + (Number(curr.committed_volume_kg) || 0), 0);
    const activeFarmers = new Set(commitments.map(d => d.farmer_id)).size;
    const pendingCommitments = commitments.filter(c => c.status === 'pending').length;
    const inTransit = commitments.filter(c => c.status === 'collected').length;
    const activeOrders = orders.filter(o => ['open', 'filled'].includes(o.status)).length;

    return { 
      totalVol, 
      activeFarmers: activeFarmers || commitments.length,
      pendingCommitments,
      inTransit,
      activeOrders
    };
  },
  
  getInventory: async (ownerType = 'farmer') => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      const { data, error } = await supabase.from('inventory')
        .select('*')
        .eq('owner_type', ownerType);
      
      if (error) {
        console.warn('owner_type filter failed, fetching all inventory:', error.message);
        const { data: allData, error: allError } = await supabase.from('inventory')
          .select('*');
        if (allError) {
          console.warn('Failed to fetch inventory:', allError.message);
          return [];
        }
        return allData || [];
      }
      
      return data || [];
    } catch (error) {
      console.error('getInventory error:', error);
      return [];
    }
  },

  getAggregatedSupply: async () => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      let data = [];
      const { data: filtered, error } = await supabase.from('inventory')
        .select('bean_type, quantity_kg')
        .eq('owner_type', 'farmer');
      
      if (error) {
        console.warn('owner_type filter failed:', error.message);
        const { data: allData, error: allError } = await supabase.from('inventory')
          .select('bean_type, quantity_kg');
        if (allError) {
          console.warn('Failed to fetch inventory:', allError.message);
          return [];
        }
        data = allData || [];
      } else {
        data = filtered || [];
      }
      
      const supply = data.reduce((acc, curr) => {
         const type = curr.bean_type;
         if (!acc[type]) acc[type] = 0;
         acc[type] += Number(curr.quantity_kg);
         return acc;
      }, {});
      
      return Object.keys(supply).map(type => ({ type, quantity: supply[type] }));
    } catch (error) {
      console.error('getAggregatedSupply error:', error);
      return [];
    }
  },

  commitToOrder: async (orderId, volume, farmerId = null, beanType = 'Wet Beans', qualityGrade = 'A') => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    const insertData = { 
      order_id: orderId, 
      committed_volume_kg: volume, 
      bean_type: beanType,
      quality_grade: qualityGrade,
      status: 'pending',
      location: 'Calinan, Davao'
    };
    
    if (farmerId && farmerId.includes('-') && farmerId.length > 30) {
      insertData.farmer_id = farmerId;
    }
    
    const { error } = await supabase.from('commitments').insert(insertData);
    if (error) throw error;
    return true;
  },

  updateCommitmentStatus: async (commitmentId, newStatus) => {
    if (!supabase) throw new Error("Supabase disconnected");
    const { error } = await supabase
      .from('commitments')
      .update({ status: newStatus })
      .eq('id', commitmentId);
    if (error) throw error;
    return true;
  },

  updateOrderStatus: async (orderId, newStatus) => {
    if (!supabase) throw new Error("Supabase disconnected");
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) throw error;
    return true;
  },

  createOrder: async (newOrder) => {
    if (!supabase) throw new Error("Supabase disconnected");
    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) throw error;
    return true;
  },

  markAsReady: async (commitmentId) => {
    return DataService.updateCommitmentStatus(commitmentId, 'ready');
  },

  getPartnerNetwork: async () => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('*');
      if (invError) console.warn('Inventory fetch error:', invError.message);
      
      const { data: commitments, error: commitError } = await supabase
        .from('commitments')
        .select('*');
      if (commitError) console.warn('Commitments fetch error:', commitError.message);
      
      const farmerMap = {};
      
      (inventory || []).forEach(item => {
        const farmerId = item.owner_id || item.farmer_id || 'unknown';
        if (!farmerMap[farmerId]) {
          farmerMap[farmerId] = {
            id: farmerId,
            name: `Partner ${farmerId.slice(0, 8)}`,
            location: 'Calinan, Davao',
            inventory: [],
            totalStock: 0,
            commitments: [],
            performance: {
              totalCommitments: 0,
              completedCommitments: 0,
              rejectedCommitments: 0,
              reliabilityScore: 100
            }
          };
        }
        farmerMap[farmerId].inventory.push(item);
        farmerMap[farmerId].totalStock += Number(item.quantity_kg) || 0;
      });
      
      (commitments || []).forEach(commit => {
        const farmerId = commit.farmer_id || 'unknown';
        if (!farmerMap[farmerId]) {
          farmerMap[farmerId] = {
            id: farmerId,
            name: `Partner ${farmerId.slice(0, 8)}`,
            location: commit.location || 'Davao',
            inventory: [],
            totalStock: 0,
            commitments: [],
            performance: {
              totalCommitments: 0,
              completedCommitments: 0,
              rejectedCommitments: 0,
              reliabilityScore: 100
            }
          };
        }
        farmerMap[farmerId].commitments.push(commit);
        farmerMap[farmerId].performance.totalCommitments++;
        
        if (commit.status === 'paid' || commit.status === 'delivered') {
          farmerMap[farmerId].performance.completedCommitments++;
        }
        if (commit.status === 'rejected') {
          farmerMap[farmerId].performance.rejectedCommitments++;
        }
        
        if (commit.location) {
          farmerMap[farmerId].location = commit.location;
        }
      });
      
      Object.values(farmerMap).forEach(farmer => {
        if (farmer.performance.totalCommitments > 0) {
          const completed = farmer.performance.completedCommitments;
          const total = farmer.performance.totalCommitments;
          const rejected = farmer.performance.rejectedCommitments;
          farmer.performance.reliabilityScore = Math.round(
            ((completed / total) * 100) - (rejected * 5)
          );
          farmer.performance.reliabilityScore = Math.max(0, Math.min(100, farmer.performance.reliabilityScore));
        }
      });
      
      return Object.values(farmerMap);
    } catch (error) {
      console.error('getPartnerNetwork error:', error);
      return [];
    }
  },

  getFarmersReadyForPickup: async () => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      const { data: readyCommitments, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('status', 'ready');
      
      if (error) {
        console.warn('Ready commitments fetch error:', error.message);
        return [];
      }
      
      return readyCommitments || [];
    } catch (error) {
      console.error('getFarmersReadyForPickup error:', error);
      return [];
    }
  }
};

// --- SHARED COMPONENTS ---

export const SkeletonCard = () => (
  <div className="bg-white p-4 rounded-xl border border-stone-100 mb-3 animate-pulse">
    <div className="h-6 bg-stone-200 rounded w-3/4 mb-3"></div>
    <div className="flex justify-between">
      <div className="h-4 bg-stone-200 rounded w-1/3"></div>
      <div className="h-4 bg-stone-200 rounded w-1/4"></div>
    </div>
  </div>
);

export const StatSkeleton = () => (
  <div className="bg-white p-6 rounded-xl border border-stone-200 animate-pulse">
    <div className="h-4 bg-stone-200 rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-stone-200 rounded w-3/4"></div>
  </div>
);

export const StatusBadge = ({ status, size = 'sm' }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';
  
  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full font-medium ${config.bg} ${config.text}`}>
      <Icon size={size === 'sm' ? 12 : 14} className="mr-1" />
      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

export const ProgressTimeline = ({ order }) => {
  const stages = [
    { key: 'open', label: 'Open', icon: CheckCircle },
    { key: 'filled', label: 'Filled', icon: CheckCircle2 },
    { key: 'in_transit', label: 'In Transit', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Warehouse },
    { key: 'completed', label: 'Completed', icon: DollarSign }
  ];

  const currentIndex = stages.findIndex(s => s.key === order.derivedStatus);

  return (
    <div className="flex items-center justify-between w-full">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isComplete 
                  ? isCurrent 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}>
                <Icon size={16} />
              </div>
              <span className={`text-xs mt-1 ${isComplete ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const PaymentCalculator = ({ commitment, pricePerKg }) => {
  const gradeMultipliers = { A: 1.0, B: 0.85, C: 0.7 };
  const grade = commitment.quality_grade || 'A';
  const multiplier = gradeMultipliers[grade] || 1.0;
  const baseAmount = Number(commitment.committed_volume_kg) * Number(pricePerKg);
  const adjustedAmount = baseAmount * multiplier;
  const deduction = baseAmount - adjustedAmount;

  return (
    <div className="bg-slate-50 p-4 rounded-xl">
      <h4 className="font-bold text-slate-800 mb-3 flex items-center">
        <Receipt size={16} className="mr-2"/> Payment Breakdown
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Volume</span>
          <span className="font-medium">{commitment.committed_volume_kg} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Price per kg</span>
          <span className="font-medium">₱{pricePerKg}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Base Amount</span>
          <span className="font-medium">₱{baseAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Quality Grade</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
            grade === 'B' ? 'bg-amber-100 text-amber-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            Grade {grade} ({(multiplier * 100).toFixed(0)}%)
          </span>
        </div>
        {deduction > 0 && (
          <div className="flex justify-between text-rose-600">
            <span>Grade Adjustment</span>
            <span>-₱{deduction.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-slate-200 pt-2 mt-2">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-slate-900">Total Payment</span>
            <span className="text-emerald-600">₱{adjustedAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OrderSummaryStats = ({ order }) => {
  const totalValue = order.approvedVolume * Number(order.price_per_kg);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-emerald-50 p-3 rounded-lg">
        <p className="text-xs text-emerald-600 font-medium">Approved</p>
        <p className="text-lg font-bold text-emerald-700">{order.approvedVolume.toLocaleString()} kg</p>
      </div>
      <div className="bg-amber-50 p-3 rounded-lg">
        <p className="text-xs text-amber-600 font-medium">Pending</p>
        <p className="text-lg font-bold text-amber-700">{order.pendingVolume.toLocaleString()} kg</p>
      </div>
      <div className="bg-indigo-50 p-3 rounded-lg">
        <p className="text-xs text-indigo-600 font-medium">Delivered</p>
        <p className="text-lg font-bold text-indigo-700">{order.deliveredVolume.toLocaleString()} kg</p>
      </div>
      <div className="bg-slate-50 p-3 rounded-lg">
        <p className="text-xs text-slate-600 font-medium">Est. Value</p>
        <p className="text-lg font-bold text-slate-700">₱{totalValue.toLocaleString()}</p>
      </div>
    </div>
  );
};