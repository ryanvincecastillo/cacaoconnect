import React, { useState, useEffect } from 'react';
// [INSTRUCTION] UNCOMMENT THE LINE BELOW IN VS CODE:
import { createClient } from '@supabase/supabase-js'; 

import { 
  Truck, 
  Users, 
  TrendingUp, 
  Menu, 
  X, 
  Bell, 
  CheckCircle, 
  Calendar, 
  ShoppingBag, 
  ChevronRight, 
  BrainCircuit, 
  Sparkles, 
  Volume2, 
  Loader2, 
  Wifi, 
  Database,
  LogOut,
  Plus,
  ArrowRight,
  AlertTriangle,
  MapPin,
  Leaf,
  DollarSign,
  Activity,
  Search,
  CloudRain,
  PieChart,
  XCircle,
  Send,
  Scale,
  Package,
  Layers,
  Box,
  Clock,
  CheckCircle2,
  XOctagon,
  Navigation,
  Eye,
  RefreshCw,
  Filter,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  MapPinned,
  Warehouse,
  History,
  CalendarClock,
  Receipt,
  Camera,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Phone,
  User,
  Route
} from 'lucide-react';

// --- 1. CONFIGURATION & SERVICES ---

const SUPABASE_URL = "https://faupcdnglrfilagceykz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdXBjZG5nbHJmaWxhZ2NleWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjA5MjcsImV4cCI6MjA3OTE5NjkyN30.g5dCB0DFsYIjtY4HMLkEHK9mRQ1f7qht5y_S3sA28FU";

// OpenAI Configuration
const OPENAI_API_KEY = "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"; 

// Initialize Supabase Client
// [INSTRUCTION] UNCOMMENT THE LINE BELOW IN VS CODE:
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// [INSTRUCTION] REMOVE THE LINE BELOW IN VS CODE:
// const supabase = null; 

// --- 2. CONSTANTS & STATUS DEFINITIONS ---

// Order Status Workflow
const ORDER_STATUS = {
  DRAFT: 'draft',           // Processor created but not published
  OPEN: 'open',             // Published and accepting commitments
  FILLED: 'filled',         // Target volume reached
  IN_TRANSIT: 'in_transit', // Beans being collected/delivered
  DELIVERED: 'delivered',   // Arrived at processor warehouse
  COMPLETED: 'completed',   // Payment processed
  CANCELLED: 'cancelled'    // Order cancelled
};

// Commitment Status Workflow
const COMMITMENT_STATUS = {
  PENDING: 'pending',       // Farmer submitted, awaiting review
  APPROVED: 'approved',     // Processor accepted the commitment
  REJECTED: 'rejected',     // Processor declined
  READY: 'ready',           // Beans harvested and ready for pickup
  COLLECTED: 'collected',   // Picked up by logistics
  DELIVERED: 'delivered',   // Arrived at warehouse
  PAID: 'paid'              // Payment released
};

// Quality Grades
const QUALITY_GRADES = {
  A: { label: 'Grade A', color: 'emerald', multiplier: 1.0 },
  B: { label: 'Grade B', color: 'amber', multiplier: 0.85 },
  C: { label: 'Grade C', color: 'orange', multiplier: 0.7 }
};

// Status Colors & Icons
const getStatusConfig = (status) => {
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

// --- 3. UTILITIES (TOASTS & AI) ---

const ToastContext = React.createContext(null);

const useToast = () => {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast };
};

const ToastNotification = ({ toast }) => {
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

// AI Handlers - OpenAI
const callOpenAIJSON = async (prompt) => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
    console.warn("OpenAI API key not configured");
    return null;
  }
  
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an AI supply chain advisor. Always respond with valid JSON only, no markdown formatting or code blocks."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API Error:", error);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return null;
  }
};

// Text-to-Speech using Web Speech API (browser native)
const callTTS = async (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to find a good voice
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    
    speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser");
  }
};

// Alias for backward compatibility
const callGeminiJSON = callOpenAIJSON;
const callGeminiTTS = callTTS;

// --- 4. DATA SERVICE ---

const DataService = {
  // Enhanced: Get orders with full commitment details and calculated status
  getOrdersWithProgress: async () => {
    if (!supabase) throw new Error("Supabase Client disconnected. Please connect in VS Code.");
    
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
      
      // Calculate totals by status
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
      
      // Derive order status based on commitments
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

  // Get commitments for a specific farmer
  getFarmerCommitments: async (farmerId = null) => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      // For demo purposes, fetch all commitments (farmer_id requires UUID)
      // In production, you'd pass the actual user's UUID
      const { data: commitments, error: commitError } = await supabase
        .from('commitments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (commitError) {
        console.warn('Failed to fetch commitments:', commitError.message);
        return [];
      }
      
      if (!commitments || commitments.length === 0) return [];
      
      // Fetch orders to join manually
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
      
      // Join orders to commitments
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

  // Get supply movement/tracking data
  getSupplyMovement: async () => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    // Fetch commitments in transit states
    const { data: commitments, error: commitError } = await supabase
      .from('commitments')
      .select('*')
      .in('status', ['ready', 'collected', 'in_transit'])
      .order('updated_at', { ascending: false });
    if (commitError) throw commitError;
    
    // Fetch related orders
    const orderIds = [...new Set(commitments.map(c => c.order_id))];
    if (orderIds.length === 0) return [];
    
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, title')
      .in('id', orderIds);
    if (orderError) throw orderError;
    
    // Join
    const ordersMap = {};
    orders.forEach(o => { ordersMap[o.id] = o; });
    
    return commitments.map(c => ({
      ...c,
      orders: ordersMap[c.order_id] || { title: 'Unknown Order' }
    }));
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
  
  // Fetch Inventory by Owner Type
  getInventory: async (ownerType = 'farmer') => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      // Try with owner_type filter first
      const { data, error } = await supabase.from('inventory')
        .select('*')
        .eq('owner_type', ownerType);
      
      if (error) {
        // If owner_type column doesn't exist, fetch all inventory
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

  // Aggregate Inventory for Processor (Farmer Supply)
  getAggregatedSupply: async () => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      // Try with owner_type filter first
      let data = [];
      const { data: filtered, error } = await supabase.from('inventory')
        .select('bean_type, quantity_kg')
        .eq('owner_type', 'farmer');
      
      if (error) {
        // If owner_type column doesn't exist, fetch all
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

  // Create commitment with enhanced data
  commitToOrder: async (orderId, volume, farmerId = null, beanType = 'Wet Beans', qualityGrade = 'A') => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    // Build insert object - only include farmer_id if it's a valid UUID
    const insertData = { 
      order_id: orderId, 
      committed_volume_kg: volume, 
      bean_type: beanType,
      quality_grade: qualityGrade,
      status: 'pending',
      location: 'Calinan, Davao'
    };
    
    // Only add farmer_id if provided and looks like a UUID
    if (farmerId && farmerId.includes('-') && farmerId.length > 30) {
      insertData.farmer_id = farmerId;
    }
    
    const { error } = await supabase.from('commitments').insert(insertData);
    if (error) throw error;
    return true;
  },

  // Update commitment status
  updateCommitmentStatus: async (commitmentId, newStatus) => {
    if (!supabase) throw new Error("Supabase disconnected");
    const { error } = await supabase
      .from('commitments')
      .update({ status: newStatus })
      .eq('id', commitmentId);
    if (error) throw error;
    return true;
  },

  // Update order status
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

  // Mark farmer's commitment as ready for pickup
  markAsReady: async (commitmentId) => {
    return DataService.updateCommitmentStatus(commitmentId, 'ready');
  },

  // Get Partner Network data with inventory and performance metrics
  getPartnerNetwork: async () => {
    if (!supabase) throw new Error("Supabase disconnected");
    
    try {
      // Fetch all inventory (farmer stock)
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('*');
      if (invError) console.warn('Inventory fetch error:', invError.message);
      
      // Fetch all commitments to calculate performance
      const { data: commitments, error: commitError } = await supabase
        .from('commitments')
        .select('*');
      if (commitError) console.warn('Commitments fetch error:', commitError.message);
      
      // Group inventory by farmer
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
      
      // Add commitment data to farmers
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
        
        // Update location if available
        if (commit.location) {
          farmerMap[farmerId].location = commit.location;
        }
      });
      
      // Calculate reliability scores
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

  // Get farmers with ready-to-pickup stock
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

// --- 5. COMPONENTS & SKELETONS ---

const SkeletonCard = () => (
  <div className="bg-white p-4 rounded-xl border border-stone-100 mb-3 animate-pulse">
    <div className="h-6 bg-stone-200 rounded w-3/4 mb-3"></div>
    <div className="flex justify-between">
      <div className="h-4 bg-stone-200 rounded w-1/3"></div>
      <div className="h-4 bg-stone-200 rounded w-1/4"></div>
    </div>
  </div>
);

const StatSkeleton = () => (
  <div className="bg-white p-6 rounded-xl border border-stone-200 animate-pulse">
    <div className="h-4 bg-stone-200 rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-stone-200 rounded w-3/4"></div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status, size = 'sm' }) => {
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

// Progress Timeline Component
const ProgressTimeline = ({ order }) => {
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

// Commitment Timeline Component - Shows full journey of a commitment
const CommitmentTimeline = ({ commitment, order }) => {
  const stages = [
    { key: 'pending', label: 'Submitted', icon: Send, time: commitment.created_at },
    { key: 'approved', label: 'Approved', icon: ThumbsUp, time: commitment.status !== 'pending' && commitment.status !== 'rejected' ? commitment.updated_at : null },
    { key: 'ready', label: 'Ready', icon: Package, time: ['ready', 'collected', 'delivered', 'paid'].includes(commitment.status) ? commitment.updated_at : null },
    { key: 'collected', label: 'Collected', icon: Truck, time: ['collected', 'delivered', 'paid'].includes(commitment.status) ? commitment.updated_at : null },
    { key: 'delivered', label: 'Delivered', icon: Warehouse, time: ['delivered', 'paid'].includes(commitment.status) ? commitment.updated_at : null },
    { key: 'paid', label: 'Paid', icon: DollarSign, time: commitment.status === 'paid' ? commitment.updated_at : null }
  ];

  const statusOrder = ['pending', 'approved', 'ready', 'collected', 'delivered', 'paid'];
  const currentIndex = statusOrder.indexOf(commitment.status);
  const isRejected = commitment.status === 'rejected';

  return (
    <div className="relative">
      {isRejected ? (
        <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 text-center">
          <XOctagon className="w-8 h-8 text-rose-500 mx-auto mb-2"/>
          <p className="text-rose-700 font-medium">Commitment Rejected</p>
          <p className="text-xs text-rose-500 mt-1">This offer was not accepted</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isComplete = index <= currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={stage.key} className="flex items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isComplete 
                    ? isCurrent 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  <Icon size={14} />
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${isComplete ? 'text-slate-900' : 'text-slate-400'}`}>
                    {stage.label}
                  </p>
                  {stage.time && isComplete && (
                    <p className="text-xs text-slate-500">
                      {new Date(stage.time).toLocaleDateString()} {new Date(stage.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  )}
                </div>
                {index < stages.length - 1 && (
                  <div className={`absolute left-4 w-0.5 h-6 ${
                    index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} style={{ top: `${(index + 1) * 44 + 8}px` }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Payment Calculator Component
const PaymentCalculator = ({ commitment, pricePerKg }) => {
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

// Pickup Scheduler Component
const PickupScheduler = ({ commitment, onSchedule }) => {
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('08:00');
  const [driver, setDriver] = useState('');

  const drivers = [
    { id: 1, name: 'Juan Dela Cruz', phone: '0917-123-4567' },
    { id: 2, name: 'Pedro Santos', phone: '0918-234-5678' },
    { id: 3, name: 'Maria Garcia', phone: '0919-345-6789' }
  ];

  return (
    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
      <h4 className="font-bold text-indigo-900 mb-3 flex items-center">
        <CalendarClock size={16} className="mr-2"/> Schedule Pickup
      </h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-indigo-700 block mb-1">Pickup Date</label>
          <input 
            type="date" 
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-indigo-700 block mb-1">Pickup Time</label>
          <input 
            type="time" 
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-indigo-700 block mb-1">Assign Driver</label>
          <select 
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select driver...</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} - {d.phone}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => onSchedule && onSchedule({ pickupDate, pickupTime, driver })}
          disabled={!pickupDate || !driver}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Truck size={14} className="mr-2"/> Confirm Pickup
        </button>
      </div>
    </div>
  );
};

// Order Summary Stats Component
const OrderSummaryStats = ({ order }) => {
  const totalValue = order.approvedVolume * Number(order.price_per_kg);
  const paidVolume = order.commitments?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.committed_volume_kg || 0), 0) || 0;
  const paidValue = paidVolume * Number(order.price_per_kg);
  
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

// --- 6. PROCESSOR APP (ADMIN DASHBOARD) ---

const ProcessorApp = ({ onLogout, showToast }) => {
  const [orders, setOrders] = useState([]);
  const [supply, setSupply] = useState([]);
  const [myStock, setMyStock] = useState([]);
  const [partners, setPartners] = useState([]);
  const [readyForPickup, setReadyForPickup] = useState([]);
  const [stats, setStats] = useState({ totalVol: 0, activeFarmers: 0, pendingCommitments: 0, inTransit: 0, activeOrders: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeView, setActiveView] = useState('orders'); // orders, tracking, insights, partners
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [newOrderForm, setNewOrderForm] = useState({ title: '', volume: '', price: '', deadline: '', beanType: 'Wet Beans' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [supplyForecast, setSupplyForecast] = useState(null);

  const refreshData = async () => {
    try {
      setErrorMsg(null);
      const [ords, sts, supplyData, stockData, partnerData, readyData] = await Promise.all([
         DataService.getOrdersWithProgress(), 
         DataService.getStats(),
         DataService.getAggregatedSupply(),
         DataService.getInventory('processor'),
         DataService.getPartnerNetwork(),
         DataService.getFarmersReadyForPickup()
      ]);
      setOrders(ords);
      setStats(sts);
      setSupply(supplyData);
      setMyStock(stockData);
      setPartners(partnerData);
      setReadyForPickup(readyData);
    } catch (err) {
      if (err.message.includes("Supabase Client")) {
        setErrorMsg("PREVIEW MODE: Real-time DB is inactive here. Uncomment imports in VS Code.");
      } else {
        setErrorMsg("Network Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // AI-powered supply chain insights
  const generateAIInsights = async () => {
    setAiLoading(true);
    
    // Prepare context for AI
    const context = {
      currentStock: myStock.reduce((sum, item) => sum + Number(item.quantity_kg || 0), 0),
      availableSupply: supply.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      activeOrders: orders.filter(o => ['open', 'filled'].includes(o.derivedStatus)).length,
      pendingVolume: orders.filter(o => o.derivedStatus === 'open').reduce((sum, o) => sum + Number(o.volume_kg || 0), 0),
      inTransitVolume: stats.inTransit * 50, // Estimate
      completedThisMonth: orders.filter(o => o.derivedStatus === 'completed').length,
      avgFillRate: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.fillPercentage, 0) / orders.length) : 0,
      farmerCount: partners.length || stats.activeFarmers,
      supplyByType: supply,
      partnerData: partners.map(p => ({
        stock: p.totalStock,
        reliability: p.performance.reliabilityScore,
        location: p.location
      })),
      readyForPickup: readyForPickup.length,
      readyVolume: readyForPickup.reduce((sum, c) => sum + Number(c.committed_volume_kg || 0), 0)
    };

    const prompt = `You are an AI supply chain advisor for a cacao processor in Davao, Philippines. Analyze this data and provide actionable insights.

Current Situation:
- Warehouse Stock: ${context.currentStock} kg
- Available Farmer Supply: ${context.availableSupply} kg
- Active Orders: ${context.activeOrders}
- Pending Order Volume: ${context.pendingVolume} kg
- In-Transit: ${context.inTransitVolume} kg (estimated)
- Completed Orders This Month: ${context.completedThisMonth}
- Average Fill Rate: ${context.avgFillRate}%
- Partner Farmers: ${context.farmerCount}
- Ready for Pickup: ${context.readyForPickup} commitments (${context.readyVolume} kg)
- Supply by Type: ${JSON.stringify(context.supplyByType)}
- Partner Performance: ${JSON.stringify(context.partnerData)}

Current Date: ${new Date().toLocaleDateString()}
Season: ${new Date().getMonth() >= 9 || new Date().getMonth() <= 2 ? 'Peak Harvest (Oct-Feb)' : 'Lean Season (Mar-Sep)'}

Provide insights in this JSON format:
{
  "demandForecast": {
    "nextWeek": { "volume": number, "confidence": "high/medium/low", "reasoning": "string" },
    "nextMonth": { "volume": number, "confidence": "high/medium/low", "reasoning": "string" }
  },
  "supplyForecast": {
    "nextWeek": { "volume": number, "confidence": "high/medium/low", "reasoning": "string" },
    "nextMonth": { "volume": number, "confidence": "high/medium/low", "reasoning": "string" },
    "readyNow": { "volume": number, "farmers": number, "action": "string" }
  },
  "orderRecommendation": {
    "shouldOrder": boolean,
    "urgency": "immediate/this_week/next_week/no_rush",
    "suggestedVolume": number,
    "suggestedPrice": number,
    "beanType": "Wet Beans/Dried Beans/Fermented",
    "reasoning": "string",
    "targetFarmers": ["string"]
  },
  "riskAlerts": [
    { "type": "weather/supply/logistics/price", "severity": "high/medium/low", "message": "string", "action": "string" }
  ],
  "opportunities": [
    { "title": "string", "description": "string", "potentialImpact": "string" }
  ],
  "performanceInsights": {
    "fillRateAnalysis": "string",
    "supplierReliability": "string",
    "recommendations": ["string"]
  },
  "partnerInsights": {
    "topPerformers": ["string"],
    "needsAttention": ["string"],
    "networkHealth": "string"
  }
}`;

    const result = await callGeminiJSON(prompt);
    if (result) {
      setAiInsights(result);
      setSupplyForecast(result.supplyForecast);
    } else {
      // Fallback insights if AI fails
      const fallback = {
        demandForecast: {
          nextWeek: { volume: 2000, confidence: "medium", reasoning: "Based on historical patterns" },
          nextMonth: { volume: 8000, confidence: "low", reasoning: "Seasonal adjustment needed" }
        },
        supplyForecast: {
          nextWeek: { volume: context.availableSupply * 0.3, confidence: "medium", reasoning: "Based on current inventory" },
          nextMonth: { volume: context.availableSupply * 0.8, confidence: "low", reasoning: "Weather dependent" },
          readyNow: { volume: context.readyVolume, farmers: context.readyForPickup, action: "Schedule pickup immediately" }
        },
        orderRecommendation: {
          shouldOrder: context.currentStock < 1000,
          urgency: context.currentStock < 500 ? "immediate" : "this_week",
          suggestedVolume: 3000,
          suggestedPrice: 45,
          beanType: "Wet Beans",
          reasoning: "Stock levels indicate need for replenishment",
          targetFarmers: []
        },
        riskAlerts: [
          { type: "weather", severity: "medium", message: "Rainy season approaching - plan for delays", action: "Order 1 week earlier than usual" }
        ],
        opportunities: [
          { title: "Bulk Purchase", description: "High farmer supply available", potentialImpact: "10% cost savings" }
        ],
        performanceInsights: {
          fillRateAnalysis: `Current ${context.avgFillRate}% fill rate is ${context.avgFillRate >= 80 ? 'healthy' : 'needs improvement'}`,
          supplierReliability: "Farmer network performing well",
          recommendations: ["Consider adding more farmers to network", "Review rejected commitments for patterns"]
        },
        partnerInsights: {
          topPerformers: [],
          needsAttention: [],
          networkHealth: "Good"
        }
      };
      setAiInsights(fallback);
      setSupplyForecast(fallback.supplyForecast);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const orderPayload = {
        title: newOrderForm.title,
        volume_kg: Number(newOrderForm.volume),
        price_per_kg: Number(newOrderForm.price),
        deadline: newOrderForm.deadline,
        bean_type: newOrderForm.beanType,
        status: 'open'
      };
      await DataService.createOrder(orderPayload);
      setShowCreateModal(false);
      setNewOrderForm({ title: '', volume: '', price: '', deadline: '', beanType: 'Wet Beans' });
      showToast("Order Broadcasted Successfully");
      refreshData();
    } catch (err) {
      showToast("Failed to create order", "error");
    }
  };

  const handleCommitmentAction = async (commitmentId, action) => {
    try {
      await DataService.updateCommitmentStatus(commitmentId, action);
      showToast(`Commitment ${action}`);
      
      // Refresh data and update selectedOrder with fresh data
      const [ords, sts, supplyData, stockData] = await Promise.all([
         DataService.getOrdersWithProgress(), 
         DataService.getStats(),
         DataService.getAggregatedSupply(),
         DataService.getInventory('processor')
      ]);
      setOrders(ords);
      setStats(sts);
      setSupply(supplyData);
      setMyStock(stockData);
      
      // Update selectedOrder with fresh data
      if (selectedOrder) {
        const updatedOrder = ords.find(o => o.id === selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }
    } catch (err) {
      showToast("Action failed", "error");
    }
  };

  const handleRejectWithReason = async () => {
    if (!rejectionModal) return;
    try {
      await DataService.updateCommitmentStatus(rejectionModal, 'rejected');
      showToast(`Commitment rejected: ${rejectionReason || 'No reason provided'}`);
      setRejectionModal(null);
      setRejectionReason('');
      
      // Refresh data
      const ords = await DataService.getOrdersWithProgress();
      setOrders(ords);
      if (selectedOrder) {
        const updatedOrder = ords.find(o => o.id === selectedOrder.id);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      showToast("Rejection failed", "error");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order? This will delete the order and notify all committed farmers.')) return;
    try {
      // Delete the order (since 'cancelled' status is not in database constraints)
      if (!supabase) throw new Error("Supabase disconnected");
      
      // First delete related commitments
      await supabase.from('commitments').delete().eq('order_id', orderId);
      
      // Then delete the order
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      
      showToast('Order cancelled and deleted');
      setSelectedOrder(null);
      refreshData();
    } catch (err) {
      console.error('Cancel order error:', err);
      showToast('Failed to cancel order', 'error');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await DataService.updateOrderStatus(orderId, 'completed');
      showToast('Order marked as completed');
      setSelectedOrder(null);
      refreshData();
    } catch (err) {
      showToast('Failed to complete order', 'error');
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.derivedStatus === statusFilter);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 p-2 rounded-lg">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">CacaoConnect <span className="text-slate-400 font-normal">Processor</span></h1>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          {/* View Switcher */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setActiveView('orders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'orders' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Orders
            </button>
            <button 
              onClick={() => setActiveView('partners')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'partners' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Partners
            </button>
            <button 
              onClick={() => setActiveView('tracking')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'tracking' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Tracking
            </button>
            <button 
              onClick={() => { setActiveView('insights'); if (!aiInsights) generateAIInsights(); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center ${activeView === 'insights' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <Sparkles size={12} className="mr-1"/> AI Insights
            </button>
          </div>
          
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
             <div className={`w-2 h-2 rounded-full mr-2 ${errorMsg ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
             {errorMsg ? 'Offline' : 'Live System'}
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center">
            <LogOut size={16} className="mr-2"/> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-8 flex-1">
        {errorMsg && (
           <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center text-sm">
             <AlertTriangle className="w-4 h-4 mr-2"/>
             {errorMsg}
           </div>
        )}

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {loading ? (
            <> <StatSkeleton /> <StatSkeleton /> <StatSkeleton /> <StatSkeleton /> <StatSkeleton /> </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Committed</p>
                  <CheckCircle className="text-emerald-600 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">{stats.totalVol.toLocaleString()}<span className="text-sm text-slate-400 font-normal ml-1">kg</span></h2>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Orders</p>
                  <ShoppingBag className="text-indigo-500 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">{stats.activeOrders}</h2>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
                  <Clock className="text-amber-500 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-amber-600">{stats.pendingCommitments}</h2>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Transit</p>
                  <Truck className="text-indigo-500 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-indigo-600">{stats.inTransit}</h2>
              </div>

              <div 
                onClick={() => setShowCreateModal(true)}
                className="bg-slate-900 p-6 rounded-xl shadow-lg cursor-pointer group hover:bg-slate-800 transition-all flex flex-col justify-center items-center text-center"
              >
                 <Plus className="text-white w-6 h-6 group-hover:rotate-90 transition-transform" />
                 <span className="text-white font-bold text-sm mt-2">New Order</span>
              </div>
            </>
          )}
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Regional Supply Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regional Supply (Farmers)</p>
              <Leaf className="text-emerald-500 w-5 h-5" />
            </div>
            <div className="space-y-2">
              {supply.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No farm data.</p>
              ) : (
                supply.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">{item.type}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{item.quantity.toLocaleString()} kg</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Processor Warehouse Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Warehouse</p>
              <Box className="text-indigo-500 w-5 h-5" />
            </div>
            <div className="space-y-2">
              {myStock.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Warehouse empty.</p>
              ) : (
                myStock.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">{item.bean_type}</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{item.quantity_kg} kg</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Farmers */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network</p>
              <Users className="text-slate-500 w-5 h-5" />
            </div>
            <div className="text-center py-4">
              <h2 className="text-4xl font-extrabold text-slate-900">{stats.activeFarmers}</h2>
              <p className="text-xs text-slate-500 mt-1">Active Farmers</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {activeView === 'orders' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Market Orders</h3>
              <div className="flex items-center space-x-3">
                {/* Status Filter */}
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="filled">Filled</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={refreshData} className="p-2 text-slate-400 hover:text-slate-600">
                  <RefreshCw size={18}/>
                </button>
              </div>
            </div>
            
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Order</th>
                  <th className="px-6 py-3 font-semibold">Volume</th>
                  <th className="px-6 py-3 font-semibold">Fill Progress</th>
                  <th className="px-6 py-3 font-semibold">Delivery</th>
                  <th className="px-6 py-3 font-semibold">Price</th>
                  <th className="px-6 py-3 font-semibold">Deadline</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i}>
                      <td className="px-6 py-4" colSpan="8"><div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div></td>
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                      <p>No orders found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{order.title}</div>
                        {order.pendingCount > 0 && (
                          <span className="text-xs text-amber-600 font-medium">{order.pendingCount} pending review</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{Number(order.volume_kg).toLocaleString()} kg</td>
                      <td className="px-6 py-4 min-w-[160px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">{order.approvedVolume} kg</span>
                          <span className="text-xs font-bold text-slate-700">{order.fillPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${Math.min(100, order.fillPercentage)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[140px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">{order.deliveredVolume} kg</span>
                          <span className="text-xs font-bold text-indigo-700">{order.deliveryPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-indigo-500 transition-all duration-500" 
                            style={{ width: `${Math.min(100, order.deliveryPercentage)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700">₱{order.price_per_kg}</td>
                      <td className="px-6 py-4 text-slate-500">{order.deadline}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.derivedStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center"
                        >
                          <Eye size={14} className="mr-1"/> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Partner Network View */}
        {activeView === 'partners' && (
          <div className="space-y-6">
            {/* Supply Forecast Banner */}
            {readyForPickup.length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-emerald-100 p-3 rounded-xl mr-4">
                      <Package className="w-6 h-6 text-emerald-600"/>
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900">Ready for Pickup</h4>
                      <p className="text-sm text-emerald-700">
                        {readyForPickup.length} commitment{readyForPickup.length !== 1 ? 's' : ''} • {readyForPickup.reduce((sum, c) => sum + Number(c.committed_volume_kg || 0), 0).toLocaleString()} kg total
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveView('tracking')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
                  >
                    <Truck size={16} className="mr-2"/> Schedule Pickup
                  </button>
                </div>
              </div>
            )}

            {/* Supply Forecast Cards */}
            {supplyForecast && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center mb-3">
                    <Package className="text-emerald-500 mr-2"/>
                    <h4 className="font-bold text-slate-800">Available Now</h4>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">
                    {supplyForecast.readyNow?.volume?.toLocaleString() || 0} kg
                  </p>
                  <p className="text-xs text-slate-500">From {supplyForecast.readyNow?.farmers || 0} farmers</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center mb-3">
                    <Calendar className="text-indigo-500 mr-2"/>
                    <h4 className="font-bold text-slate-800">Next Week Forecast</h4>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    {supplyForecast.nextWeek?.volume?.toLocaleString() || '—'} kg
                  </p>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    supplyForecast.nextWeek?.confidence === 'high' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : supplyForecast.nextWeek?.confidence === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    {supplyForecast.nextWeek?.confidence || 'low'} confidence
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="text-indigo-500 mr-2"/>
                    <h4 className="font-bold text-slate-800">Next Month Forecast</h4>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    {supplyForecast.nextMonth?.volume?.toLocaleString() || '—'} kg
                  </p>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    supplyForecast.nextMonth?.confidence === 'high' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : supplyForecast.nextMonth?.confidence === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    {supplyForecast.nextMonth?.confidence || 'low'} confidence
                  </span>
                </div>
              </div>
            )}

            {/* Partner Network Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800">Partner Network</h3>
                  <p className="text-xs text-slate-500 mt-1">Farm partners of Cacao de Davao</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {partners.length} Partners
                  </span>
                  <button onClick={refreshData} className="p-2 text-slate-400 hover:text-slate-600">
                    <RefreshCw size={18}/>
                  </button>
                </div>
              </div>
              
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Partner</th>
                    <th className="px-6 py-3 font-semibold">Location</th>
                    <th className="px-6 py-3 font-semibold">Current Stock</th>
                    <th className="px-6 py-3 font-semibold">Inventory</th>
                    <th className="px-6 py-3 font-semibold">Reliability</th>
                    <th className="px-6 py-3 font-semibold">Commitments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [1,2,3].map(i => (
                      <tr key={i}>
                        <td className="px-6 py-4" colSpan="6"><div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div></td>
                      </tr>
                    ))
                  ) : partners.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                        <p>No partner data available</p>
                      </td>
                    </tr>
                  ) : (
                    partners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                              <Users size={14} className="text-emerald-600"/>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{partner.name}</div>
                              <div className="text-xs text-slate-400">ID: {partner.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-slate-600">
                            <MapPin size={14} className="mr-1 text-slate-400"/>
                            {partner.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-emerald-600">{partner.totalStock.toLocaleString()}</span>
                          <span className="text-slate-400 text-sm ml-1">kg</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {partner.inventory.slice(0, 2).map((item, i) => (
                              <span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                {item.bean_type}: {item.quantity_kg}kg
                              </span>
                            ))}
                            {partner.inventory.length > 2 && (
                              <span className="text-xs text-slate-400">+{partner.inventory.length - 2} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-16 bg-slate-200 rounded-full h-2 mr-2`}>
                              <div 
                                className={`h-2 rounded-full ${
                                  partner.performance.reliabilityScore >= 80 
                                    ? 'bg-emerald-500' 
                                    : partner.performance.reliabilityScore >= 50 
                                      ? 'bg-amber-500' 
                                      : 'bg-rose-500'
                                }`}
                                style={{ width: `${partner.performance.reliabilityScore}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold ${
                              partner.performance.reliabilityScore >= 80 
                                ? 'text-emerald-600' 
                                : partner.performance.reliabilityScore >= 50 
                                  ? 'text-amber-600' 
                                  : 'text-rose-600'
                            }`}>
                              {partner.performance.reliabilityScore}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-500">
                            <span className="text-emerald-600 font-medium">{partner.performance.completedCommitments}</span> completed
                            {partner.performance.rejectedCommitments > 0 && (
                              <span className="text-rose-500 ml-2">{partner.performance.rejectedCommitments} rejected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Actions */}
            {!supplyForecast && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
                <BrainCircuit className="w-10 h-10 text-indigo-400 mx-auto mb-3"/>
                <p className="text-indigo-900 font-medium mb-2">Get AI Supply Forecast</p>
                <p className="text-sm text-indigo-600 mb-4">Analyze partner data to predict upcoming supply</p>
                <button 
                  onClick={() => { setActiveView('insights'); generateAIInsights(); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Generate Forecast
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tracking View */}
        {activeView === 'tracking' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Supply Movement Tracker</h3>
              <p className="text-xs text-slate-500 mt-1">Real-time visibility of beans in transit</p>
            </div>
            
            <div className="p-6">
              {orders.filter(o => ['in_transit', 'filled'].includes(o.derivedStatus)).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                  <p>No active shipments</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.filter(o => ['in_transit', 'filled'].includes(o.derivedStatus)).map(order => (
                    <div key={order.id} className="border border-slate-200 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{order.title}</h4>
                          <p className="text-sm text-slate-500">{order.volume_kg} kg target</p>
                        </div>
                        <StatusBadge status={order.derivedStatus} size="md" />
                      </div>
                      
                      <ProgressTimeline order={order} />
                      
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2">Commitments in this order:</p>
                        <div className="flex flex-wrap gap-2">
                          {order.commitments?.slice(0, 5).map(c => (
                            <div key={c.id} className="flex items-center text-xs bg-slate-100 px-2 py-1 rounded">
                              <MapPin size={10} className="mr-1 text-slate-400"/>
                              {c.committed_volume_kg}kg - <StatusBadge status={c.status} size="sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Insights View */}
        {activeView === 'insights' && (
          <div className="space-y-6">
            {/* Header with Refresh */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <BrainCircuit className="mr-2 text-indigo-600"/> AI Supply Chain Insights
                </h3>
                <p className="text-sm text-slate-500 mt-1">Intelligent recommendations powered by Gemini AI</p>
              </div>
              <button 
                onClick={generateAIInsights}
                disabled={aiLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {aiLoading ? <Loader2 size={16} className="mr-2 animate-spin"/> : <RefreshCw size={16} className="mr-2"/>}
                {aiLoading ? 'Analyzing...' : 'Refresh Insights'}
              </button>
            </div>

            {aiLoading && !aiInsights ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4"/>
                <p className="text-slate-600 font-medium">Analyzing supply chain data...</p>
                <p className="text-slate-400 text-sm mt-1">This may take a few seconds</p>
              </div>
            ) : aiInsights ? (
              <>
                {/* Order Recommendation Card */}
                <div className={`rounded-xl border-2 p-6 ${
                  aiInsights.orderRecommendation?.shouldOrder 
                    ? aiInsights.orderRecommendation.urgency === 'immediate' 
                      ? 'bg-rose-50 border-rose-200' 
                      : 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl mr-4 ${
                        aiInsights.orderRecommendation?.shouldOrder 
                          ? aiInsights.orderRecommendation.urgency === 'immediate'
                            ? 'bg-rose-100'
                            : 'bg-amber-100'
                          : 'bg-emerald-100'
                      }`}>
                        <ShoppingBag className={`w-6 h-6 ${
                          aiInsights.orderRecommendation?.shouldOrder 
                            ? aiInsights.orderRecommendation.urgency === 'immediate'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                            : 'text-emerald-600'
                        }`}/>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">Order Recommendation</h4>
                        <p className={`text-sm font-medium ${
                          aiInsights.orderRecommendation?.shouldOrder 
                            ? aiInsights.orderRecommendation.urgency === 'immediate'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          {aiInsights.orderRecommendation?.shouldOrder 
                            ? `Action needed: ${aiInsights.orderRecommendation.urgency.replace('_', ' ')}`
                            : 'No immediate action needed'}
                        </p>
                      </div>
                    </div>
                    {aiInsights.orderRecommendation?.shouldOrder && (
                      <button 
                        onClick={() => {
                          setNewOrderForm({
                            title: `${aiInsights.orderRecommendation.beanType} Order - Week ${Math.ceil(new Date().getDate() / 7)}`,
                            volume: aiInsights.orderRecommendation.suggestedVolume.toString(),
                            price: aiInsights.orderRecommendation.suggestedPrice.toString(),
                            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            beanType: aiInsights.orderRecommendation.beanType
                          });
                          setShowCreateModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center"
                      >
                        <Plus size={16} className="mr-1"/> Create Order
                      </button>
                    )}
                  </div>
                  
                  {aiInsights.orderRecommendation?.shouldOrder && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold">Suggested Volume</p>
                        <p className="text-xl font-bold text-slate-900">{aiInsights.orderRecommendation.suggestedVolume?.toLocaleString()} kg</p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold">Suggested Price</p>
                        <p className="text-xl font-bold text-emerald-600">₱{aiInsights.orderRecommendation.suggestedPrice}/kg</p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold">Bean Type</p>
                        <p className="text-xl font-bold text-slate-900">{aiInsights.orderRecommendation.beanType}</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-slate-700">{aiInsights.orderRecommendation?.reasoning}</p>
                </div>

                {/* Demand Forecast */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center mb-4">
                      <Activity className="text-indigo-500 mr-2"/>
                      <h4 className="font-bold text-slate-800">Next Week Forecast</h4>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-2">
                      {aiInsights.demandForecast?.nextWeek?.volume?.toLocaleString()} kg
                    </p>
                    <div className="flex items-center mb-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        aiInsights.demandForecast?.nextWeek?.confidence === 'high' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : aiInsights.demandForecast?.nextWeek?.confidence === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {aiInsights.demandForecast?.nextWeek?.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{aiInsights.demandForecast?.nextWeek?.reasoning}</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="text-indigo-500 mr-2"/>
                      <h4 className="font-bold text-slate-800">Next Month Forecast</h4>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-2">
                      {aiInsights.demandForecast?.nextMonth?.volume?.toLocaleString()} kg
                    </p>
                    <div className="flex items-center mb-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        aiInsights.demandForecast?.nextMonth?.confidence === 'high' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : aiInsights.demandForecast?.nextMonth?.confidence === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {aiInsights.demandForecast?.nextMonth?.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{aiInsights.demandForecast?.nextMonth?.reasoning}</p>
                  </div>
                </div>

                {/* Supply Forecast */}
                {aiInsights.supplyForecast && (
                  <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
                    <div className="flex items-center mb-4">
                      <Leaf className="text-emerald-600 mr-2"/>
                      <h4 className="font-bold text-emerald-900">Partner Supply Forecast</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/80 p-4 rounded-lg">
                        <p className="text-xs text-emerald-600 uppercase font-bold mb-1">Ready Now</p>
                        <p className="text-2xl font-bold text-emerald-700">{aiInsights.supplyForecast.readyNow?.volume?.toLocaleString() || 0} kg</p>
                        <p className="text-xs text-emerald-600 mt-1">{aiInsights.supplyForecast.readyNow?.action}</p>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg">
                        <p className="text-xs text-emerald-600 uppercase font-bold mb-1">Next Week</p>
                        <p className="text-2xl font-bold text-emerald-700">{aiInsights.supplyForecast.nextWeek?.volume?.toLocaleString() || 0} kg</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          aiInsights.supplyForecast.nextWeek?.confidence === 'high' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {aiInsights.supplyForecast.nextWeek?.confidence} confidence
                        </span>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg">
                        <p className="text-xs text-emerald-600 uppercase font-bold mb-1">Next Month</p>
                        <p className="text-2xl font-bold text-emerald-700">{aiInsights.supplyForecast.nextMonth?.volume?.toLocaleString() || 0} kg</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          aiInsights.supplyForecast.nextMonth?.confidence === 'high' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {aiInsights.supplyForecast.nextMonth?.confidence} confidence
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Partner Insights */}
                {aiInsights.partnerInsights && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center mb-4">
                      <Users className="text-indigo-500 mr-2"/>
                      <h4 className="font-bold text-slate-800">Partner Network Insights</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Network Health</p>
                        <p className={`text-lg font-bold ${
                          aiInsights.partnerInsights.networkHealth === 'Good' || aiInsights.partnerInsights.networkHealth === 'Excellent'
                            ? 'text-emerald-600'
                            : aiInsights.partnerInsights.networkHealth === 'Fair'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                        }`}>
                          {aiInsights.partnerInsights.networkHealth}
                        </p>
                      </div>
                      {aiInsights.partnerInsights.topPerformers?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Top Performers</p>
                          <div className="space-y-1">
                            {aiInsights.partnerInsights.topPerformers.slice(0, 3).map((partner, i) => (
                              <p key={i} className="text-sm text-emerald-600 flex items-center">
                                <CheckCircle size={12} className="mr-1"/> {partner}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiInsights.partnerInsights.needsAttention?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Needs Attention</p>
                          <div className="space-y-1">
                            {aiInsights.partnerInsights.needsAttention.slice(0, 3).map((partner, i) => (
                              <p key={i} className="text-sm text-amber-600 flex items-center">
                                <AlertTriangle size={12} className="mr-1"/> {partner}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Alerts */}
                {aiInsights.riskAlerts?.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center mb-4">
                      <AlertTriangle className="text-amber-500 mr-2"/>
                      <h4 className="font-bold text-slate-800">Risk Alerts</h4>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.riskAlerts.map((alert, i) => (
                        <div key={i} className={`p-4 rounded-lg border-l-4 ${
                          alert.severity === 'high' 
                            ? 'bg-rose-50 border-rose-500'
                            : alert.severity === 'medium'
                              ? 'bg-amber-50 border-amber-500'
                              : 'bg-slate-50 border-slate-400'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">{alert.message}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              alert.severity === 'high' 
                                ? 'bg-rose-100 text-rose-700'
                                : alert.severity === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {alert.type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            <strong>Action:</strong> {alert.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opportunities */}
                {aiInsights.opportunities?.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center mb-4">
                      <Sparkles className="text-emerald-500 mr-2"/>
                      <h4 className="font-bold text-slate-800">Opportunities</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiInsights.opportunities.map((opp, i) => (
                        <div key={i} className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                          <h5 className="font-bold text-emerald-900 mb-1">{opp.title}</h5>
                          <p className="text-sm text-emerald-700 mb-2">{opp.description}</p>
                          <p className="text-xs text-emerald-600 font-medium">
                            Potential Impact: {opp.potentialImpact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Insights */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center mb-4">
                    <PieChart className="text-indigo-500 mr-2"/>
                    <h4 className="font-bold text-slate-800">Performance Analysis</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Fill Rate Analysis</p>
                      <p className="text-sm text-slate-500">{aiInsights.performanceInsights?.fillRateAnalysis}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Supplier Reliability</p>
                      <p className="text-sm text-slate-500">{aiInsights.performanceInsights?.supplierReliability}</p>
                    </div>
                    {aiInsights.performanceInsights?.recommendations?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {aiInsights.performanceInsights.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-slate-500 flex items-start">
                              <CheckCircle size={14} className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0"/>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-4"/>
                <p className="text-slate-600 font-medium">Click "Refresh Insights" to generate AI analysis</p>
                <p className="text-slate-400 text-sm mt-1">AI will analyze your supply chain and provide recommendations</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedOrder.title}</h2>
                <p className="text-sm text-slate-500 mt-1">Order Details & Commitments</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24}/>
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {/* Order Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Target Volume</p>
                  <p className="text-2xl font-bold text-slate-900">{Number(selectedOrder.volume_kg).toLocaleString()} kg</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Price</p>
                  <p className="text-2xl font-bold text-emerald-600">₱{selectedOrder.price_per_kg}/kg</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Deadline</p>
                  <p className="text-lg font-bold text-slate-900">{selectedOrder.deadline}</p>
                </div>
              </div>

              {/* Order Summary Stats */}
              <OrderSummaryStats order={selectedOrder} />

              {/* Progress Timeline */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <ProgressTimeline order={selectedOrder} />
              </div>

              {/* Commitments List */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4">Farmer Commitments ({selectedOrder.commitments?.length || 0})</h3>
                
                {selectedOrder.commitments?.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No commitments yet</p>
                ) : (
                  <div className="space-y-4">
                    {selectedOrder.commitments?.map(commitment => (
                      <div key={commitment.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        {/* Commitment Header */}
                        <div className="p-4 bg-white flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg font-bold text-slate-900">{commitment.committed_volume_kg} kg</span>
                              <StatusBadge status={commitment.status} />
                              {commitment.quality_grade && (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  commitment.quality_grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                  commitment.quality_grade === 'B' ? 'bg-amber-100 text-amber-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  Grade {commitment.quality_grade}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-slate-500 space-x-4">
                              <span className="flex items-center">
                                <MapPin size={14} className="mr-1"/>
                                {commitment.location || 'Calinan, Davao'}
                              </span>
                              <span className="flex items-center">
                                <Clock size={14} className="mr-1"/>
                                {new Date(commitment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons based on status */}
                          <div className="flex flex-col space-y-2 ml-4">
                            {commitment.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleCommitmentAction(commitment.id, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center"
                                >
                                  <ThumbsUp size={12} className="mr-1"/> Approve
                                </button>
                                <button 
                                  onClick={() => setRejectionModal(commitment.id)}
                                  className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-200 flex items-center"
                                >
                                  <ThumbsDown size={12} className="mr-1"/> Reject
                                </button>
                              </>
                            )}
                            {commitment.status === 'approved' && (
                              <span className="text-xs text-slate-400 italic">Waiting for farmer</span>
                            )}
                            {commitment.status === 'ready' && (
                              <button 
                                onClick={() => handleCommitmentAction(commitment.id, 'collected')}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center"
                              >
                                <Truck size={12} className="mr-1"/> Mark Collected
                              </button>
                            )}
                            {commitment.status === 'collected' && (
                              <button 
                                onClick={() => handleCommitmentAction(commitment.id, 'delivered')}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 flex items-center"
                              >
                                <Warehouse size={12} className="mr-1"/> Mark Delivered
                              </button>
                            )}
                            {commitment.status === 'delivered' && (
                              <button 
                                onClick={() => handleCommitmentAction(commitment.id, 'paid')}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center"
                              >
                                <DollarSign size={12} className="mr-1"/> Release Payment
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Payment Info for delivered/paid */}
                        {['delivered', 'paid'].includes(commitment.status) && (
                          <div className="border-t border-slate-100 p-4 bg-slate-50">
                            <PaymentCalculator commitment={commitment} pricePerKg={selectedOrder.price_per_kg} />
                          </div>
                        )}
                        
                        {/* Pickup Scheduler for ready status */}
                        {commitment.status === 'ready' && (
                          <div className="border-t border-slate-100 p-4">
                            <PickupScheduler 
                              commitment={commitment} 
                              onSchedule={(data) => {
                                showToast(`Pickup scheduled for ${data.pickupDate} at ${data.pickupTime}`);
                                handleCommitmentAction(commitment.id, 'collected');
                              }} 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Actions */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {selectedOrder.derivedStatus === 'open' && (
                      <button 
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 flex items-center"
                      >
                        <XOctagon size={14} className="mr-2"/> Cancel Order
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {selectedOrder.derivedStatus === 'delivered' && (
                      <button 
                        onClick={() => handleCompleteOrder(selectedOrder.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
                      >
                        <CheckCircle size={14} className="mr-2"/> Mark Order Complete
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-100">
              <h2 className="text-lg font-bold text-rose-900">Reject Commitment</h2>
              <p className="text-sm text-rose-600 mt-1">Provide a reason for rejection (optional)</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Volume exceeds current capacity, Quality grade not acceptable..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none h-24"
              />
              <div className="flex space-x-3 mt-4">
                <button 
                  onClick={() => { setRejectionModal(null); setRejectionReason(''); }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectWithReason}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">New Market Order</h2>
              <p className="text-sm text-slate-500 mt-1">Broadcast demand to all registered farmers.</p>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Order Title</label>
                <input autoFocus required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="e.g. Urgent Wet Beans Batch A" value={newOrderForm.title} onChange={e => setNewOrderForm({...newOrderForm, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bean Type</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newOrderForm.beanType}
                  onChange={e => setNewOrderForm({...newOrderForm, beanType: e.target.value})}
                >
                  <option value="Wet Beans">Wet Beans</option>
                  <option value="Dried Beans">Dried Beans</option>
                  <option value="Fermented">Fermented</option>
                  <option value="Grade A">Grade A Premium</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Volume (kg)</label>
                  <div className="relative">
                    <input required type="number" className="w-full p-3 pl-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="5000" value={newOrderForm.volume} onChange={e => setNewOrderForm({...newOrderForm, volume: e.target.value})} />
                    <span className="absolute right-4 top-3 text-slate-400 text-sm">kg</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price (₱/kg)</label>
                  <div className="relative">
                     <span className="absolute left-4 top-3 text-slate-400 text-sm">₱</span>
                    <input required type="number" step="0.01" className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="42.00" value={newOrderForm.price} onChange={e => setNewOrderForm({...newOrderForm, price: e.target.value})} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Deadline</label>
                <input required type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={newOrderForm.deadline} onChange={e => setNewOrderForm({...newOrderForm, deadline: e.target.value})} />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95">Broadcast Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 7. FARMER APP (MOBILE VIEW) ---

const FarmerApp = ({ onLogout, showToast }) => {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [myCommitments, setMyCommitments] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [aiState, setAiState] = useState('idle'); 
  const [aiData, setAiData] = useState(null);
  const [isCommitted, setIsCommitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [commitAmount, setCommitAmount] = useState('');
  const [selectedBeanType, setSelectedBeanType] = useState('Wet Beans');
  const [selectedGrade, setSelectedGrade] = useState('A');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ords, inv, commits] = await Promise.all([
          DataService.getOrdersWithProgress(), 
          DataService.getInventory('farmer'),
          DataService.getFarmerCommitments()
        ]);
        setOrders((ords || []).filter(o => o.derivedStatus === 'open'));
        setInventory(inv || []);
        setMyCommitments(commits || []);
      } catch (err) { 
        console.error('FarmerApp loadData error:', err.message || err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAIAnalysis = async (order) => {
    setAiState('loading');
    const profile = { location: "Calinan", farmSize: "2ha", weather: "Heavy Rain" };
    const prompt = `Analyze order: "${order.title}" (${order.volume_kg}kg due ${order.deadline}) for farmer in ${profile.location} with ${profile.weather}. Return JSON: {"prediction": "High/Low/Med", "text": "Short advice (max 15 words)", "action": "Commit 50kg", "suggested_amount": 50, "suggested_grade": "A"}`;
    
    const result = await callGeminiJSON(prompt);
    if (result) {
      setAiData(result);
      setCommitAmount(result.suggested_amount || 50);
      setSelectedGrade(result.suggested_grade || 'A');
      setAiState('success');
    } else {
      setAiData({ prediction: "Offline", text: "AI unavailable. Heavy rain risk.", action: "Commit Wet Beans" });
      setCommitAmount(50); 
      setAiState('success');
    }
  };

  const handleCommit = async () => {
    if (!commitAmount || isNaN(commitAmount) || Number(commitAmount) <= 0) {
        showToast("Please enter a valid amount", "error");
        return;
    }
    try {
      await DataService.commitToOrder(selectedOrder.id, Number(commitAmount), 'demo-farmer', selectedBeanType, selectedGrade); 
      setIsCommitted(true);
      showToast(`Offer sent: ${commitAmount}kg Grade ${selectedGrade}`);
    } catch (err) {
      showToast("Commit failed", "error");
    }
  };

  const handleMarkReady = async (commitmentId) => {
    try {
      await DataService.markAsReady(commitmentId);
      showToast("Marked as ready for pickup!");
      // Refresh data
      const commits = await DataService.getFarmerCommitments();
      setMyCommitments(commits);
    } catch (err) {
      showToast("Action failed", "error");
    }
  };

  // MOBILE: Order Detail View
  if (selectedOrder) {
    return (
      <div className="h-full bg-stone-50 flex flex-col animate-slide-up">
        <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
          <button onClick={() => { setSelectedOrder(null); setIsCommitted(false); setAiState('idle'); setCommitAmount(''); }} className="mr-4 p-2 hover:bg-stone-100 rounded-full"><ChevronRight className="rotate-180 text-stone-600"/></button>
          <h2 className="font-bold text-lg text-stone-800">Order Details</h2>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto pb-24">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
             <h1 className="text-xl font-bold text-stone-900 mb-1 mt-2">{selectedOrder.title}</h1>
             <p className="text-sm text-stone-500 mb-6">Posted by Cacao de Davao HQ</p>
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50 p-3 rounded-xl">
                   <p className="text-xs text-stone-400 uppercase font-bold">Price/kg</p>
                   <p className="text-2xl font-extrabold text-emerald-600">₱{selectedOrder.price_per_kg}</p>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                   <p className="text-xs text-stone-400 uppercase font-bold">Required</p>
                   <p className="text-2xl font-extrabold text-stone-800">{Number(selectedOrder.volume_kg).toLocaleString()}<span className="text-sm text-stone-400 ml-1 font-normal">kg</span></p>
                </div>
                <div className="col-span-2 bg-stone-50 p-3 rounded-xl">
                   <p className="text-xs text-stone-400 uppercase font-bold mb-2">Fill Progress</p>
                   <div className="w-full bg-stone-200 rounded-full h-3">
                     <div 
                       className="h-3 rounded-full bg-emerald-500 transition-all" 
                       style={{ width: `${selectedOrder.fillPercentage}%` }}
                     />
                   </div>
                   <p className="text-xs text-stone-500 mt-1">{selectedOrder.fillPercentage}% filled ({selectedOrder.approvedVolume}kg)</p>
                </div>
                <div className="col-span-2 bg-stone-50 p-3 rounded-xl flex items-center justify-between">
                   <div>
                      <p className="text-xs text-stone-400 uppercase font-bold">Deadline</p>
                      <p className="text-lg font-bold text-stone-800">{selectedOrder.deadline}</p>
                   </div>
                   <Calendar className="text-stone-300"/>
                </div>
             </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-3">
               <div className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                  <Sparkles className="w-4 h-4 text-indigo-600"/>
               </div>
               <h3 className="font-bold text-stone-700">Harvest Viability</h3>
            </div>

            {aiState === 'idle' && (
              <div onClick={() => handleAIAnalysis(selectedOrder)} className="bg-white border border-indigo-100 p-5 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 transition-all active:scale-95 group">
                 <div className="flex justify-between items-center">
                    <p className="text-stone-600 font-medium">Ask AI Assistant</p>
                    <div className="bg-indigo-600 text-white p-2 rounded-full group-hover:bg-indigo-700">
                       <BrainCircuit size={20} />
                    </div>
                 </div>
                 <p className="text-xs text-stone-400 mt-2">Checks weather, soil data & logistics</p>
              </div>
            )}

            {aiState === 'loading' && (
               <div className="bg-white p-8 rounded-2xl border border-stone-100 flex flex-col items-center justify-center text-center">
                 <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                 <p className="text-sm font-medium text-stone-600">Analyzing local conditions...</p>
               </div>
            )}

            {aiState === 'success' && (
              <div className="bg-gradient-to-b from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-xl -mr-12 -mt-12 opacity-50"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${aiData.prediction.includes('High') ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {aiData.prediction} Match
                  </span>
                  <button onClick={() => callGeminiTTS(aiData.text)} className="p-2 bg-white rounded-full shadow-sm text-indigo-600 active:scale-95"><Volume2 className="w-5 h-5"/></button>
                </div>
                
                <p className="text-indigo-900 text-lg font-medium leading-snug mb-2 relative z-10">"{aiData.text}"</p>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wide">AI Suggested: {commitAmount}kg Grade {selectedGrade}</p>
              </div>
            )}
          </div>

          {!isCommitted ? (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-stone-700">Your Offer</h3>
                </div>

                <div className="mb-4">
                   <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Bean Type</label>
                   <select 
                     value={selectedBeanType}
                     onChange={(e) => setSelectedBeanType(e.target.value)}
                     className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500"
                   >
                     <option value="Wet Beans">Wet Beans</option>
                     <option value="Dried Beans">Dried Beans</option>
                     <option value="Fermented">Fermented</option>
                   </select>
                </div>

                <div className="mb-4">
                   <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Quality Grade</label>
                   <div className="flex space-x-2">
                     {['A', 'B', 'C'].map(grade => (
                       <button
                         key={grade}
                         onClick={() => setSelectedGrade(grade)}
                         className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                           selectedGrade === grade 
                             ? 'bg-emerald-600 text-white' 
                             : 'bg-stone-100 text-stone-600'
                         }`}
                       >
                         Grade {grade}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="mb-6">
                   <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Quantity to Commit</label>
                   <div className="flex items-center relative">
                      <input 
                         type="number" 
                         value={commitAmount}
                         onChange={(e) => setCommitAmount(e.target.value)}
                         className="w-full p-4 pl-4 pr-16 bg-stone-50 border-2 border-stone-100 rounded-xl text-2xl font-bold text-stone-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                         placeholder="0"
                      />
                      <span className="absolute right-6 text-stone-400 font-bold">kg</span>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button 
                      onClick={() => setSelectedOrder(null)} 
                      className="flex-1 py-4 bg-white border-2 border-stone-100 text-stone-500 rounded-xl font-bold hover:bg-stone-50 transition-colors flex items-center justify-center active:scale-95"
                   >
                      <XCircle className="w-5 h-5 mr-2"/> Decline
                   </button>
                   <button 
                      onClick={handleCommit} 
                      className="flex-[2] py-4 bg-stone-900 text-white rounded-xl font-bold shadow-lg shadow-stone-200 hover:bg-black active:scale-95 transition-all flex items-center justify-center text-lg"
                   >
                      <Send className="w-5 h-5 mr-2"/> Send Offer
                   </button>
                </div>
             </div>
          ) : (
            <div className="bg-emerald-100 text-emerald-800 p-6 rounded-2xl flex flex-col items-center justify-center font-bold border border-emerald-200 animate-fade-in">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-600"/> 
               </div>
               <p className="text-xl">Offer Sent!</p>
               <p className="text-sm opacity-80 font-normal">You committed {commitAmount}kg Grade {selectedGrade}</p>
               <button onClick={() => setSelectedOrder(null)} className="mt-4 text-xs font-bold uppercase tracking-wide underline hover:text-emerald-900">Back to Orders</button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // MY COMMITMENTS VIEW
  if (activeTab === 'history') {
    return (
      <div className="h-full bg-stone-50 flex flex-col animate-fade-in relative">
        <div className="bg-stone-900 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl z-10">
           <h2 className="text-2xl font-bold">My Commitments</h2>
           <p className="text-stone-400 text-sm">Track your offers & deliveries</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 -mt-4 z-20 pb-24">
           {myCommitments.length === 0 ? (
              <div className="p-8 text-center text-stone-400 bg-white rounded-xl border border-stone-200">No commitments yet.</div>
           ) : (
              myCommitments.map((item, i) => (
                 <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-3">
                    <div className="flex justify-between items-start mb-3">
                       <div>
                          <h3 className="font-bold text-stone-800">{item.orders?.title || 'Order'}</h3>
                          <p className="text-xs text-stone-500">{item.committed_volume_kg} kg • Grade {item.quality_grade || 'A'}</p>
                       </div>
                       <StatusBadge status={item.status} />
                    </div>
                    
                    {/* Action buttons based on status */}
                    {item.status === 'approved' && (
                      <button 
                        onClick={() => handleMarkReady(item.id)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center active:scale-95"
                      >
                        <Package size={16} className="mr-2"/> Mark Ready for Pickup
                      </button>
                    )}
                    {item.status === 'ready' && (
                      <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs flex items-center">
                        <Truck size={14} className="mr-2"/> Waiting for collection
                      </div>
                    )}
                    {item.status === 'collected' && (
                      <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl text-xs flex items-center">
                        <Navigation size={14} className="mr-2"/> In transit to warehouse
                      </div>
                    )}
                    {item.status === 'paid' && (
                      <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs flex items-center">
                        <DollarSign size={14} className="mr-2"/> Payment received!
                      </div>
                    )}
                 </div>
              ))
           )}
        </div>
        
        {/* Navigation Bar */}
        <div className="absolute bottom-6 left-4 right-4 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex justify-around items-center z-30">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-400' : 'text-stone-500'}`}>
              <ShoppingBag size={24} />
           </button>
           <div className="w-px h-6 bg-stone-700"></div>
           <button onClick={() => setActiveTab('stock')} className={`flex flex-col items-center ${activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-500'}`}>
              <Package size={24} />
           </button>
           <div className="w-px h-6 bg-stone-700"></div>
           <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500'}`}>
              <History size={24} />
           </button>
        </div>
      </div>
    );
  }

  // INVENTORY VIEW
  if (activeTab === 'stock') {
      return (
        <div className="h-full bg-stone-50 flex flex-col animate-fade-in relative">
          <div className="bg-stone-900 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl z-10">
             <h2 className="text-2xl font-bold">My Inventory</h2>
             <p className="text-stone-400 text-sm">Available stock to sell</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 -mt-4 z-20 pb-24">
             {inventory.length === 0 ? (
                <div className="p-8 text-center text-stone-400 bg-white rounded-xl border border-stone-200">No stock recorded.</div>
             ) : (
                inventory.map((item, i) => (
                   <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-3 flex justify-between items-center">
                      <div>
                         <h3 className="font-bold text-stone-800">{item.bean_type}</h3>
                         <p className="text-xs text-stone-500 max-w-[200px] truncate">{item.quality_notes}</p>
                      </div>
                      <div className="text-right">
                         <span className="block text-2xl font-bold text-emerald-600">{Number(item.quantity_kg).toLocaleString()}</span>
                         <span className="text-xs text-stone-400 font-bold uppercase">kg</span>
                      </div>
                   </div>
                ))
             )}
             <button className="w-full py-3 border-2 border-dashed border-stone-300 text-stone-400 font-bold rounded-xl mt-2">+ Add Harvest</button>
          </div>
          
          {/* Navigation Bar */}
          <div className="absolute bottom-6 left-4 right-4 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex justify-around items-center z-30">
             <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-400' : 'text-stone-500'}`}>
                <ShoppingBag size={24} />
             </button>
             <div className="w-px h-6 bg-stone-700"></div>
             <button onClick={() => setActiveTab('stock')} className={`flex flex-col items-center ${activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-500'}`}>
                <Package size={24} />
             </button>
             <div className="w-px h-6 bg-stone-700"></div>
             <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500'}`}>
                <History size={24} />
             </button>
          </div>
        </div>
      )
  }

  // MOBILE: Home List View
  return (
    <div className="h-full bg-stone-50 flex flex-col animate-fade-in relative">
      {/* Sticky Header */}
      <div className="bg-stone-900 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl z-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
            <Leaf size={180} />
         </div>
         <div className="flex justify-between items-start mb-6 relative z-10">
           <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center font-bold border border-white/30">MJ</div>
              <div className="ml-3">
                 <p className="text-xs text-stone-400 uppercase tracking-wider">Location</p>
                 <p className="font-bold flex items-center"><MapPin size={14} className="mr-1 text-emerald-400"/> Calinan, Davao</p>
              </div>
           </div>
           <button onClick={onLogout}><LogOut size={20} className="opacity-70"/></button>
        </div>
        <h1 className="text-3xl font-bold leading-tight relative z-10">Maayong<br/>Buntag! 🌤️</h1>
      </div>
      
      {/* Content Overlay */}
      <div className="flex-1 overflow-y-auto px-4 -mt-8 relative z-20 pb-24">
        {/* Weather Widget */}
        <div className="bg-white p-4 rounded-2xl shadow-md mb-6 flex items-center justify-between border border-stone-100">
           <div className="flex items-center">
              <CloudRain className="text-indigo-500 w-8 h-8 mr-3" />
              <div>
                 <p className="font-bold text-stone-800">Heavy Rain Alert</p>
                 <p className="text-xs text-stone-500">Harvest early if possible.</p>
              </div>
           </div>
           <span className="text-2xl font-bold text-stone-800">28°</span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-400 uppercase font-bold">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{myCommitments.filter(c => c.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-400 uppercase font-bold">In Transit</p>
            <p className="text-2xl font-bold text-indigo-600">{myCommitments.filter(c => c.status === 'collected').length}</p>
          </div>
        </div>

        <h3 className="font-bold text-stone-500 text-xs uppercase mb-4 ml-1 tracking-wider">Open Orders</h3>
        
        {loading ? (
          <div className="space-y-3">
             <SkeletonCard /> <SkeletonCard />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-stone-400 bg-stone-100 rounded-2xl border border-stone-200 border-dashed">
             <p>No orders available right now.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-3 active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
               <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-8 -mt-8"></div>
               <h3 className="font-bold text-lg mb-1 text-stone-800 relative z-10">{order.title}</h3>
               <div className="flex justify-between items-end mt-3 relative z-10">
                  <div>
                     <p className="text-xs text-stone-400 mb-1">Volume Needed</p>
                     <div className="flex items-center text-stone-600 font-medium text-sm">
                        <Truck size={14} className="mr-1"/> {Number(order.volume_kg).toLocaleString()}kg
                     </div>
                     <div className="w-24 bg-stone-200 rounded-full h-1.5 mt-2">
                       <div 
                         className="h-1.5 rounded-full bg-emerald-500" 
                         style={{ width: `${order.fillPercentage}%` }}
                       />
                     </div>
                  </div>
                  <div className="text-right">
                     <span className="text-emerald-600 font-extrabold text-xl bg-emerald-50 px-3 py-1 rounded-lg">₱{order.price_per_kg}</span>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav Bar */}
      <div className="absolute bottom-6 left-4 right-4 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex justify-around items-center z-30">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <ShoppingBag size={24} />
         </button>
         <div className="w-px h-6 bg-stone-700"></div>
         <button onClick={() => setActiveTab('stock')} className={`flex flex-col items-center ${activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <Package size={24} />
         </button>
         <div className="w-px h-6 bg-stone-700"></div>
         <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <History size={24} />
         </button>
      </div>
    </div>
  );
};

// --- 8. PORTAL SELECTOR (MAIN ENTRY) ---

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
    <ToastContext.Provider value={{ toast, showToast }}>
      <ToastNotification toast={toast} />
      {activeApp === 'farmer' ? (
        <div className="max-w-md mx-auto h-screen shadow-2xl bg-stone-50 overflow-hidden relative">
           <FarmerApp onLogout={() => setActiveApp(null)} showToast={showToast} />
        </div>
      ) : (
        <ProcessorApp onLogout={() => setActiveApp(null)} showToast={showToast} />
      )}
    </ToastContext.Provider>
  );
}