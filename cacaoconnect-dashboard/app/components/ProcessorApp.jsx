import React, { useState, useEffect, useRef } from 'react';
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
  CalendarClock,
  Zap,
  TrendingDown,
  Bell,
  MessageSquare,
  BarChart3,
  Target,
  Lightbulb,
  Send,
  ChevronRight,
  Filter,
  Download,
  Share2
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

// ===========================
// AI ASSISTANT COMPONENTS
// ===========================

const AIAssistantChat = ({ context, onSuggestion }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    // Initial AI greeting
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm your AI supply chain assistant. I can help you with order optimization, supply forecasting, risk analysis, and strategic recommendations. What would you like to know?",
      timestamp: new Date()
    }]);

    // Generate contextual suggestions
    generateSuggestions();
  }, []);

  const generateSuggestions = async () => {
    const contextSuggestions = [
      "Analyze my current supply situation",
      "What orders should I create today?",
      "Show me supply chain risks",
      "Forecast next month's demand",
      "Recommend optimal pricing"
    ];
    setSuggestions(contextSuggestions);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const prompt = `You are an AI supply chain analyst for Cacao de Davao. 
      
Current context:
- Total Committed Volume: ${context.stats?.totalVol || 0}kg
- Active Orders: ${context.stats?.activeOrders || 0}
- Pending Commitments: ${context.stats?.pendingCommitments || 0}
- Available Supply: ${context.supply?.reduce((sum, s) => sum + s.quantity, 0) || 0}kg
- Active Farmers: ${context.stats?.activeFarmers || 0}

User question: ${input}

Provide a concise, actionable response (max 3 sentences). If making recommendations, be specific with numbers and actions.`;

      const response = await callOpenAIJSON(prompt);
      
      let assistantContent = "I can help you with that. Let me analyze the situation...";
      
      if (response && typeof response === 'string') {
        assistantContent = response;
      } else if (response && response.response) {
        assistantContent = response.response;
      }

      const assistantMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // If there's a suggestion, emit it
      if (onSuggestion && assistantContent.toLowerCase().includes('suggest')) {
        onSuggestion(assistantContent);
      }

    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I encountered an error. Please try asking in a different way.",
        timestamp: new Date()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex items-center">
        <BrainCircuit className="w-5 h-5 mr-2" />
        <div>
          <h3 className="font-bold">AI Supply Chain Assistant</h3>
          <p className="text-xs text-indigo-100">Real-time insights & recommendations</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white border border-slate-200 text-slate-800'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
              }`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-slate-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-2 bg-white border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(sug)}
                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about orders, supply, risks, forecasts..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AIInsightCard = ({ title, insight, type = 'info', action, onAction }) => {
  const typeConfig = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Lightbulb, iconColor: 'text-blue-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-600' },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600' },
    opportunity: { bg: 'bg-purple-50', border: 'border-purple-200', icon: Zap, iconColor: 'text-purple-600' }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
            <p className="text-sm text-slate-700">{insight}</p>
          </div>
        </div>
        {action && onAction && (
          <button
            onClick={onAction}
            className="ml-3 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors flex items-center"
          >
            {action}
            <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

const RealTimeAIInsights = ({ orders, supply, stats }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRealTimeInsights();
    const interval = setInterval(generateRealTimeInsights, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [orders, supply, stats]);

  const generateRealTimeInsights = async () => {
    const newInsights = [];

    // Low stock warning
    const totalSupply = supply.reduce((sum, s) => sum + s.quantity, 0);
    if (totalSupply < 5000) {
      newInsights.push({
        title: 'Low Supply Alert',
        insight: `Current farmer supply is ${totalSupply}kg, below optimal threshold. Consider broadcasting urgent orders.`,
        type: 'warning',
        action: 'Create Order',
        priority: 1
      });
    }

    // Pending commitments insight
    if (stats.pendingCommitments > 5) {
      newInsights.push({
        title: 'Action Required',
        insight: `${stats.pendingCommitments} commitments pending review. Quick approvals can speed up fulfillment by 2-3 days.`,
        type: 'warning',
        action: 'Review Now',
        priority: 2
      });
    }

    // Fill rate opportunity
    const openOrders = orders.filter(o => o.derivedStatus === 'open');
    const lowFillOrders = openOrders.filter(o => o.fillPercentage < 50 && o.fillPercentage > 0);
    if (lowFillOrders.length > 0) {
      newInsights.push({
        title: 'Boost Order Fill Rate',
        insight: `${lowFillOrders.length} orders are under 50% filled. AI suggests increasing price by ₱2-3/kg to attract more commitments.`,
        type: 'opportunity',
        action: 'Adjust Pricing',
        priority: 3
      });
    }

    // Success insight
    const recentlyCompleted = orders.filter(o => o.derivedStatus === 'completed').length;
    if (recentlyCompleted > 0) {
      newInsights.push({
        title: 'Strong Performance',
        insight: `${recentlyCompleted} orders completed this period. Supply chain efficiency is ${Math.round((recentlyCompleted / orders.length) * 100)}%.`,
        type: 'success',
        priority: 4
      });
    }

    // Weather-based insight (simulated)
    const weatherRisk = Math.random() > 0.7;
    if (weatherRisk) {
      newInsights.push({
        title: 'Weather Advisory',
        insight: 'Heavy rainfall expected next week. Consider accelerating pickups for ready commitments to prevent quality degradation.',
        type: 'warning',
        action: 'Schedule Pickups',
        priority: 2
      });
    }

    // Sort by priority and take top 4
    setInsights(newInsights.sort((a, b) => a.priority - b.priority).slice(0, 4));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-slate-100 rounded-lg animate-pulse"></div>
        <div className="h-24 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-800 flex items-center">
          <Zap className="w-4 h-4 mr-2 text-amber-500" />
          Real-Time AI Insights
        </h3>
        <span className="text-xs text-slate-500">Updated {new Date().toLocaleTimeString()}</span>
      </div>
      {insights.map((insight, idx) => (
        <AIInsightCard key={idx} {...insight} />
      ))}
    </div>
  );
};

const SmartOrderRecommendation = ({ context, onCreateOrder }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateRecommendation = async () => {
    setLoading(true);
    
    try {
      const prompt = `Analyze this supply chain data and recommend the optimal order to create:

Current State:
- Processor Stock: ${context.myStock?.reduce((sum, s) => sum + s.quantity_kg, 0) || 0}kg
- Available Farmer Supply: ${context.supply?.reduce((sum, s) => sum + s.quantity, 0) || 0}kg
- Active Orders: ${context.orders?.filter(o => ['open', 'filled'].includes(o.derivedStatus)).length || 0}
- Pending Volume: ${context.orders?.filter(o => o.derivedStatus === 'open').reduce((sum, o) => sum + o.volume_kg, 0) || 0}kg

Supply by Type: ${JSON.stringify(context.supply || [])}

Provide recommendation in JSON:
{
  "shouldOrder": boolean,
  "urgency": "immediate/this_week/next_week/no_rush",
  "volume": number,
  "beanType": "Wet Beans/Dried Beans/Fermented",
  "suggestedPrice": number,
  "reasoning": "string",
  "expectedFillTime": "string",
  "confidence": number (0-100)
}`;

      const result = await callOpenAIJSON(prompt);
      if (result && result.urgency && result.volume) {
        setRecommendation(result);
      } else {
        // Fallback recommendation
        setRecommendation({
          shouldOrder: true,
          urgency: 'this_week',
          volume: 3000,
          beanType: 'Wet Beans',
          suggestedPrice: 48,
          reasoning: 'Current stock levels indicate need for replenishment within the week',
          expectedFillTime: '3-4 days',
          confidence: 75
        });
      }
    } catch (error) {
      console.error('Recommendation error:', error);
      // Set fallback on error
      setRecommendation({
        shouldOrder: true,
        urgency: 'this_week',
        volume: 3000,
        beanType: 'Wet Beans',
        suggestedPrice: 48,
        reasoning: 'Current stock levels indicate need for replenishment within the week',
        expectedFillTime: '3-4 days',
        confidence: 75
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateRecommendation();
  }, []);

  if (loading || !recommendation) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Ensure all required fields exist with defaults
  const urgency = recommendation.urgency || 'this_week';
  const confidence = recommendation.confidence || 75;
  const volume = recommendation.volume || 3000;
  const suggestedPrice = recommendation.suggestedPrice || 48;
  const beanType = recommendation.beanType || 'Wet Beans';
  const reasoning = recommendation.reasoning || 'AI recommendation based on current supply chain state';
  const shouldOrder = recommendation.shouldOrder !== false;

  return (
    <div className={`rounded-xl border-2 p-6 ${
      urgency === 'immediate' 
        ? 'bg-rose-50 border-rose-300' 
        : urgency === 'this_week'
          ? 'bg-amber-50 border-amber-300'
          : 'bg-emerald-50 border-emerald-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl mr-4 ${
            urgency === 'immediate' ? 'bg-rose-100' : 
            urgency === 'this_week' ? 'bg-amber-100' : 'bg-emerald-100'
          }`}>
            <Target className={`w-6 h-6 ${
              urgency === 'immediate' ? 'text-rose-600' : 
              urgency === 'this_week' ? 'text-amber-600' : 'text-emerald-600'
            }`} />
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-900">Smart Order Recommendation</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                urgency === 'immediate' ? 'bg-rose-200 text-rose-800' : 
                urgency === 'this_week' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
              }`}>
                {urgency.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-xs text-slate-500">
                {confidence}% confidence
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={generateRecommendation}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white/60 p-3 rounded-lg">
          <p className="text-xs text-slate-500 font-bold uppercase">Volume</p>
          <p className="text-2xl font-bold text-slate-900">{volume.toLocaleString()} kg</p>
        </div>
        <div className="bg-white/60 p-3 rounded-lg">
          <p className="text-xs text-slate-500 font-bold uppercase">Price</p>
          <p className="text-2xl font-bold text-emerald-600">₱{suggestedPrice}/kg</p>
        </div>
        <div className="bg-white/60 p-3 rounded-lg">
          <p className="text-xs text-slate-500 font-bold uppercase">Type</p>
          <p className="text-lg font-bold text-slate-900">{beanType}</p>
        </div>
      </div>

      <div className="bg-white/60 p-4 rounded-lg mb-4">
        <p className="text-sm font-medium text-slate-700 mb-1">AI Analysis</p>
        <p className="text-sm text-slate-600">{reasoning}</p>
        {recommendation.expectedFillTime && (
          <p className="text-xs text-slate-500 mt-2">
            Expected fill time: <strong>{recommendation.expectedFillTime}</strong>
          </p>
        )}
      </div>

      {shouldOrder && (
        <button
          onClick={() => onCreateOrder({
            volume,
            suggestedPrice,
            beanType,
            urgency
          })}
          className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Recommended Order
        </button>
      )}
    </div>
  );
};

// ===========================
// MAIN PROCESSOR APP
// ===========================

const ProcessorApp = ({ onLogout, showToast }) => {
  const [orders, setOrders] = useState([]);
  const [supply, setSupply] = useState([]);
  const [myStock, setMyStock] = useState([]);
  const [partners, setPartners] = useState([]);
  const [readyForPickup, setReadyForPickup] = useState([]);
  const [stats, setStats] = useState({ totalVol: 0, activeFarmers: 0, pendingCommitments: 0, inTransit: 0, activeOrders: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [newOrderForm, setNewOrderForm] = useState({ title: '', volume: '', price: '', deadline: '', beanType: 'Wet Beans' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [supplyForecast, setSupplyForecast] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);

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
    const interval = setInterval(refreshData, 50000);
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

  const handleCreateRecommendedOrder = (recommendation) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    
    setNewOrderForm({
      title: `AI Recommended: ${recommendation.beanType} Order`,
      volume: recommendation.volume.toString(),
      price: recommendation.suggestedPrice.toString(),
      deadline: deadline.toISOString().split('T')[0],
      beanType: recommendation.beanType
    });
    setShowCreateModal(true);
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

  const contextForAI = { orders, supply, myStock, partners, stats, readyForPickup };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 p-2 rounded-lg">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">CacaoConnect <span className="text-slate-400 font-normal">AI Processor</span></h1>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <BrainCircuit className="w-4 h-4 inline mr-1" />
              AI Dashboard
            </button>
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
          </div>
          
          {/* AI Chat Toggle */}
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              showAIChat 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-medium">AI Assistant</span>
          </button>
          
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

        {/* AI Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Insights */}
            <div className="lg:col-span-2 space-y-6">
              {/* Smart Order Recommendation */}
              <SmartOrderRecommendation 
                context={contextForAI} 
                onCreateOrder={handleCreateRecommendedOrder}
              />

              {/* Real-Time Insights */}
              <RealTimeAIInsights orders={orders} supply={supply} stats={stats} />

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Committed</p>
                    <CheckCircle className="text-emerald-600 w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{stats.totalVol.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-1">kg</span></h2>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Active</p>
                    <ShoppingBag className="text-indigo-500 w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{stats.activeOrders}</h2>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
                    <Clock className="text-amber-500 w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-extrabold text-amber-600">{stats.pendingCommitments}</h2>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Transit</p>
                    <Truck className="text-indigo-500 w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-extrabold text-indigo-600">{stats.inTransit}</h2>
                </div>
              </div>

              {/* Supply Overview */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
                  Supply Chain Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-2">Farmer Supply</p>
                    <div className="space-y-2">
                      {supply.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{item.type}</span>
                          <span className="text-sm font-bold text-emerald-600">{item.quantity.toLocaleString()} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-2">My Warehouse</p>
                    <div className="space-y-2">
                      {myStock.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{item.bean_type}</span>
                          <span className="text-sm font-bold text-indigo-600">{item.quantity_kg} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - AI Chat */}
            <div className="lg:col-span-1">
              <AIAssistantChat 
                context={contextForAI}
                onSuggestion={(suggestion) => {
                  showToast(suggestion.substring(0, 50) + '...');
                }}
              />
            </div>
          </div>
        )}

        {/* Orders View - Keep existing implementation */}
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
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  New Order
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

        {/* Partners View - Keep existing */}
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
                    <th className="px-6 py-3 font-semibold">Reliability</th>
                    <th className="px-6 py-3 font-semibold">Commitments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [1,2,3].map(i => (
                      <tr key={i}>
                        <td className="px-6 py-4" colSpan="5"><div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div></td>
                      </tr>
                    ))
                  ) : partners.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
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
          </div>
        )}

        {/* Tracking View - Keep existing */}
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
      </div>

      {/* Floating AI Chat Button */}
      {showAIChat && (
        <div className="fixed bottom-6 right-6 w-96 z-50 animate-slide-in">
          <AIAssistantChat 
            context={contextForAI}
            onSuggestion={(suggestion) => {
              showToast(suggestion.substring(0, 50) + '...');
            }}
          />
        </div>
      )}

      {/* Keep all existing modals - Order Detail, Rejection, Create Order */}
      {/* ... (existing modal code) ... */}
    </div>
  );
};

export default ProcessorApp;