import React, { useState, useEffect } from 'react';
import {
  Truck,
  Users,
  TrendingUp,
  X,
  CheckCircle,
  Calendar,
  ShoppingBag,
  BrainCircuit,
  Sparkles,
  Loader2,
  LogOut,
  Plus,
  AlertTriangle,
  MapPin,
  Leaf,
  DollarSign,
  Activity,
  CloudRain,
  PieChart,
  Package,
  Box,
  Clock,
  XOctagon,
  Eye,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Warehouse,
  CalendarClock
} from 'lucide-react';

import {
  DataService,
  supabase,
  callOpenAIJSON,
  StatSkeleton,
  StatusBadge,
  ProgressTimeline,
  PaymentCalculator,
  OrderSummaryStats
} from './shared';

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

const ProcessorApp = ({ onLogout, showToast }) => {
  const [orders, setOrders] = useState([]);
  const [supply, setSupply] = useState([]);
  const [myStock, setMyStock] = useState([]);
  const [partners, setPartners] = useState([]);
  const [readyForPickup, setReadyForPickup] = useState([]);
  const [stats, setStats] = useState({ totalVol: 0, activeFarmers: 0, pendingCommitments: 0, inTransit: 0, activeOrders: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeView, setActiveView] = useState('orders');
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

  const generateAIInsights = async () => {
    setAiLoading(true);
    
    const context = {
      currentStock: myStock.reduce((sum, item) => sum + Number(item.quantity_kg || 0), 0),
      availableSupply: supply.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      activeOrders: orders.filter(o => ['open', 'filled'].includes(o.derivedStatus)).length,
      pendingVolume: orders.filter(o => o.derivedStatus === 'open').reduce((sum, o) => sum + Number(o.volume_kg || 0), 0),
      inTransitVolume: stats.inTransit * 50,
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

    const result = await callOpenAIJSON(prompt);
    if (result) {
      setAiInsights(result);
      setSupplyForecast(result.supplyForecast);
    } else {
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
      if (!supabase) throw new Error("Supabase disconnected");
      
      await supabase.from('commitments').delete().eq('order_id', orderId);
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
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <BrainCircuit className="mr-2 text-indigo-600"/> AI Supply Chain Insights
                </h3>
                <p className="text-sm text-slate-500 mt-1">Intelligent recommendations powered by OpenAI</p>
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

              <OrderSummaryStats order={selectedOrder} />

              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <ProgressTimeline order={selectedOrder} />
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-4">Farmer Commitments ({selectedOrder.commitments?.length || 0})</h3>
                
                {selectedOrder.commitments?.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No commitments yet</p>
                ) : (
                  <div className="space-y-4">
                    {selectedOrder.commitments?.map(commitment => (
                      <div key={commitment.id} className="border border-slate-200 rounded-xl overflow-hidden">
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
                        
                        {['delivered', 'paid'].includes(commitment.status) && (
                          <div className="border-t border-slate-100 p-4 bg-slate-50">
                            <PaymentCalculator commitment={commitment} pricePerKg={selectedOrder.price_per_kg} />
                          </div>
                        )}
                        
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

export default ProcessorApp;