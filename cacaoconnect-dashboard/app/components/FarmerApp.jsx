import React, { useState, useEffect } from 'react';
import {
  Truck,
  X,
  CheckCircle,
  Calendar,
  ShoppingBag,
  ChevronRight,
  BrainCircuit,
  Sparkles,
  Volume2,
  Loader2,
  LogOut,
  Plus,
  AlertTriangle,
  MapPin,
  Leaf,
  DollarSign,
  Activity,
  CloudRain,
  XCircle,
  Send,
  Package,
  Clock,
  Navigation,
  Warehouse,
  History
} from 'lucide-react';

import {
  DataService,
  callOpenAIJSON,
  callTTS,
  SkeletonCard,
  StatusBadge
} from './shared';

const FarmerApp = ({ onLogout, showToast }) => {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [batches, setBatches] = useState([]);
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
  
  const [showAddHarvest, setShowAddHarvest] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [farmInsights, setFarmInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  const [harvestForm, setHarvestForm] = useState({
    beanType: 'Wet Beans',
    quantity: '',
    plot: 'Plot A',
    qualityGrade: 'A',
    moistureLevel: '',
    notes: ''
  });

  const getWeatherData = () => {
    return {
      current: {
        temp: 28,
        humidity: 85,
        condition: 'Partly Cloudy',
        icon: 'sun'
      },
      forecast: [
        { day: 'Today', temp: 28, rain: 20, icon: 'sun' },
        { day: 'Tomorrow', temp: 27, rain: 60, icon: 'cloud-rain' },
        { day: 'Wed', temp: 26, rain: 80, icon: 'cloud-rain' },
        { day: 'Thu', temp: 29, rain: 30, icon: 'cloud' },
        { day: 'Fri', temp: 30, rain: 10, icon: 'sun' },
        { day: 'Sat', temp: 29, rain: 15, icon: 'sun' },
        { day: 'Sun', temp: 28, rain: 25, icon: 'cloud' }
      ],
      alerts: [
        { type: 'rain', message: 'Heavy rain expected Wed-Thu', severity: 'warning' }
      ]
    };
  };

  const calculateAnalytics = () => {
    const paidCommits = myCommitments.filter(c => c.status === 'paid');
    const approvedCommits = myCommitments.filter(c => ['approved', 'ready', 'collected', 'delivered'].includes(c.status));
    const pendingCommits = myCommitments.filter(c => c.status === 'pending');
    const rejectedCommits = myCommitments.filter(c => c.status === 'rejected');
    
    const totalEarnings = paidCommits.reduce((sum, c) => {
      const price = c.orders?.price_per_kg || 45;
      const multiplier = c.quality_grade === 'A' ? 1.0 : c.quality_grade === 'B' ? 0.85 : 0.7;
      return sum + (Number(c.committed_volume_kg) * price * multiplier);
    }, 0);
    
    const pendingEarnings = approvedCommits.reduce((sum, c) => {
      const price = c.orders?.price_per_kg || 45;
      const multiplier = c.quality_grade === 'A' ? 1.0 : c.quality_grade === 'B' ? 0.85 : 0.7;
      return sum + (Number(c.committed_volume_kg) * price * multiplier);
    }, 0);
    
    const totalDelivered = paidCommits.reduce((sum, c) => sum + Number(c.committed_volume_kg || 0), 0);
    const currentStock = inventory.reduce((sum, item) => sum + Number(item.quantity_kg || 0), 0);
    
    const successRate = myCommitments.length > 0 
      ? Math.round(((paidCommits.length + approvedCommits.length) / myCommitments.length) * 100) 
      : 100;
    
    const gradeA = myCommitments.filter(c => c.quality_grade === 'A').length;
    const gradeB = myCommitments.filter(c => c.quality_grade === 'B').length;
    const gradeC = myCommitments.filter(c => c.quality_grade === 'C').length;
    
    return {
      totalEarnings,
      pendingEarnings,
      totalDelivered,
      currentStock,
      successRate,
      commitmentCount: myCommitments.length,
      paidCount: paidCommits.length,
      pendingCount: pendingCommits.length,
      rejectedCount: rejectedCommits.length,
      gradeDistribution: { A: gradeA, B: gradeB, C: gradeC }
    };
  };

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
        
        const batchData = (inv || []).map((item, index) => ({
          ...item,
          batchId: `BATCH-${String(index + 1).padStart(3, '0')}`,
          harvestDate: item.created_at,
          status: 'available',
          daysOld: Math.floor((new Date() - new Date(item.created_at)) / (1000 * 60 * 60 * 24)),
          fermentationStatus: item.bean_type === 'Fermented' ? 'complete' : item.bean_type === 'Wet Beans' ? 'not_started' : 'dried'
        }));
        setBatches(batchData);
        
        setWeatherData(getWeatherData());
      } catch (err) { 
        console.error('FarmerApp loadData error:', err.message || err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAIAnalysis = async (order) => {
    setAiState('loading');
    
    const analytics = calculateAnalytics();
    const weather = weatherData || getWeatherData();
    
    const prompt = `You are an AI farming advisor for a cacao farmer in Davao, Philippines.

ORDER DETAILS:
- Title: "${order.title}"
- Volume needed: ${order.volume_kg}kg
- Price: ₱${order.price_per_kg}/kg
- Deadline: ${order.deadline}
- Bean type: ${order.bean_type}
- Current fill: ${order.fillPercentage}%

FARMER'S SITUATION:
- Current stock: ${analytics.currentStock}kg
- Success rate: ${analytics.successRate}%
- Total delivered this period: ${analytics.totalDelivered}kg
- Pending commitments: ${analytics.pendingCount}

WEATHER FORECAST (Next 7 days):
${weather.forecast.map(d => `- ${d.day}: ${d.temp}°C, ${d.rain}% rain`).join('\n')}

Weather alerts: ${weather.alerts.map(a => a.message).join(', ') || 'None'}

Based on this data, provide advice in JSON format:
{
  "prediction": "High/Medium/Low",
  "confidence": 85,
  "text": "Brief advice in 20 words or less",
  "suggested_amount": number,
  "suggested_grade": "A/B/C",
  "harvest_timing": "Harvest now / Wait 2 days / Harvest before Wednesday",
  "weather_impact": "Brief weather consideration",
  "price_assessment": "Good/Fair/Below average",
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1"]
}`;
    
    const result = await callOpenAIJSON(prompt);
    if (result) {
      setAiData(result);
      setCommitAmount(result.suggested_amount || 50);
      setSelectedGrade(result.suggested_grade || 'A');
      setAiState('success');
    } else {
      setAiData({ 
        prediction: "Medium", 
        confidence: 70,
        text: "Good opportunity. Watch weather Wed-Thu for rain.", 
        suggested_amount: Math.min(50, analytics.currentStock),
        suggested_grade: "A",
        harvest_timing: "Harvest before Wednesday",
        weather_impact: "Rain expected mid-week",
        price_assessment: "Good",
        risks: ["Rain may affect drying"],
        opportunities: ["Price above average"]
      });
      setCommitAmount(Math.min(50, analytics.currentStock)); 
      setAiState('success');
    }
  };

  const generateFarmInsights = async () => {
    setInsightsLoading(true);
    
    const analytics = calculateAnalytics();
    const weather = weatherData || getWeatherData();
    
    const prompt = `You are an AI farming advisor analyzing a cacao farmer's operation.

FARM DATA:
- Total earnings: ₱${analytics.totalEarnings.toLocaleString()}
- Pending payments: ₱${analytics.pendingEarnings.toLocaleString()}
- Current stock: ${analytics.currentStock}kg
- Total delivered: ${analytics.totalDelivered}kg
- Success rate: ${analytics.successRate}%
- Commitments: ${analytics.commitmentCount} total (${analytics.paidCount} paid, ${analytics.pendingCount} pending, ${analytics.rejectedCount} rejected)
- Grade distribution: A=${analytics.gradeDistribution.A}, B=${analytics.gradeDistribution.B}, C=${analytics.gradeDistribution.C}

WEATHER (Next 7 days):
${weather.forecast.map(d => `${d.day}: ${d.rain}% rain`).join(', ')}

Provide comprehensive insights in JSON:
{
  "summary": "One sentence farm health summary",
  "earnings_forecast": {
    "next_week": number,
    "next_month": number,
    "trend": "up/stable/down"
  },
  "yield_prediction": {
    "next_harvest": number,
    "optimal_timing": "string",
    "confidence": number
  },
  "recommendations": [
    {"priority": "high/medium/low", "action": "string", "reason": "string"}
  ],
  "risks": [
    {"type": "weather/quality/timing", "description": "string", "mitigation": "string"}
  ],
  "opportunities": [
    {"title": "string", "description": "string", "potential_value": "string"}
  ],
  "quality_tips": ["tip1", "tip2"],
  "stock_alert": {
    "status": "healthy/low/critical",
    "message": "string",
    "days_until_depletion": number
  }
}`;

    const result = await callOpenAIJSON(prompt);
    if (result) {
      setFarmInsights(result);
    } else {
      setFarmInsights({
        summary: "Farm operations are healthy with good delivery track record.",
        earnings_forecast: {
          next_week: analytics.pendingEarnings * 0.5,
          next_month: analytics.totalEarnings * 1.2,
          trend: "up"
        },
        yield_prediction: {
          next_harvest: analytics.currentStock * 0.8,
          optimal_timing: "Harvest before Wednesday due to rain forecast",
          confidence: 75
        },
        recommendations: [
          { priority: "high", action: "Harvest wet beans before Wednesday", reason: "Heavy rain expected" },
          { priority: "medium", action: "Focus on Grade A quality", reason: "Better price multiplier" }
        ],
        risks: [
          { type: "weather", description: "Rain Wed-Thu may affect drying", mitigation: "Use covered drying area" }
        ],
        opportunities: [
          { title: "Premium pricing", description: "Current orders have good rates", potential_value: "₱5,000+ extra" }
        ],
        quality_tips: ["Ensure proper fermentation time", "Check moisture before packing"],
        stock_alert: {
          status: analytics.currentStock > 100 ? "healthy" : analytics.currentStock > 50 ? "low" : "critical",
          message: analytics.currentStock > 100 ? "Good stock levels" : "Consider harvesting soon",
          days_until_depletion: Math.ceil(analytics.currentStock / 20)
        }
      });
    }
    setInsightsLoading(false);
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
      const commits = await DataService.getFarmerCommitments();
      setMyCommitments(commits);
    } catch (err) {
      showToast("Action failed", "error");
    }
  };

  const handleAddHarvest = async () => {
    if (!harvestForm.quantity || Number(harvestForm.quantity) <= 0) {
      showToast("Please enter valid quantity", "error");
      return;
    }
    
    try {
      const newBatch = {
        id: `temp-${Date.now()}`,
        batchId: `BATCH-${String(batches.length + 1).padStart(3, '0')}`,
        bean_type: harvestForm.beanType,
        quantity_kg: Number(harvestForm.quantity),
        quality_notes: `${harvestForm.plot} - Grade ${harvestForm.qualityGrade} - ${harvestForm.notes}`,
        created_at: new Date().toISOString(),
        harvestDate: new Date().toISOString(),
        status: 'available',
        daysOld: 0,
        plot: harvestForm.plot,
        qualityGrade: harvestForm.qualityGrade,
        moistureLevel: harvestForm.moistureLevel,
        fermentationStatus: harvestForm.beanType === 'Wet Beans' ? 'not_started' : 'complete'
      };
      
      setBatches([newBatch, ...batches]);
      setInventory([newBatch, ...inventory]);
      setShowAddHarvest(false);
      setHarvestForm({
        beanType: 'Wet Beans',
        quantity: '',
        plot: 'Plot A',
        qualityGrade: 'A',
        moistureLevel: '',
        notes: ''
      });
      showToast(`Added ${harvestForm.quantity}kg ${harvestForm.beanType}`);
    } catch (err) {
      showToast("Failed to add harvest", "error");
    }
  };

  const analytics = calculateAnalytics();

  // --- Helper: Dynamic Greeting ---
  const getGreetingData = () => {
    const hour = new Date().getHours();
    let period = 'Buntag'; // Default Morning
    let icon = '🌤️';
    
    if (hour >= 12 && hour < 18) period = 'Hapon'; // Afternoon
    else if (hour >= 18 || hour < 5) {
        period = 'Gabii'; // Evening
        icon = '🌙';
    }
    
    // Weather override for icon
    if (weatherData?.current?.condition?.toLowerCase().includes('rain')) {
      icon = '🌧️';
    }
    
    return { period, icon };
  };

  const { period, greetingIcon } = getGreetingData();

  // --- RENDER: Order Detail View ---
  if (selectedOrder) {
    return (
      <div className="h-full bg-stone-50 flex flex-col animate-slide-up">
        <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
          <button onClick={() => { setSelectedOrder(null); setIsCommitted(false); setAiState('idle'); setCommitAmount(''); }} className="mr-4 p-2 hover:bg-stone-100 rounded-full">
            <ChevronRight className="rotate-180 text-stone-600"/>
          </button>
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
                  <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${selectedOrder.fillPercentage}%` }} />
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

          {weatherData?.alerts?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 flex items-start">
              <AlertTriangle className="text-amber-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0"/>
              <div>
                <p className="font-bold text-amber-800 text-sm">Weather Alert</p>
                <p className="text-xs text-amber-700">{weatherData.alerts[0].message}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                <Sparkles className="w-4 h-4 text-indigo-600"/>
              </div>
              <h3 className="font-bold text-stone-700">AI Harvest Advisor</h3>
            </div>

            {aiState === 'idle' && (
              <div onClick={() => handleAIAnalysis(selectedOrder)} className="bg-white border border-indigo-100 p-5 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 transition-all active:scale-95 group">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-stone-600 font-medium">Get AI Recommendation</p>
                    <p className="text-xs text-stone-400 mt-1">Analyzes weather, stock & market</p>
                  </div>
                  <div className="bg-indigo-600 text-white p-2 rounded-full group-hover:bg-indigo-700">
                    <BrainCircuit size={20} />
                  </div>
                </div>
              </div>
            )}

            {aiState === 'loading' && (
              <div className="bg-white p-8 rounded-2xl border border-stone-100 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-sm font-medium text-stone-600">Analyzing conditions...</p>
              </div>
            )}

            {aiState === 'success' && aiData && (
              <div className="bg-gradient-to-b from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      aiData.prediction === 'High' ? 'bg-emerald-500 text-white' : 
                      aiData.prediction === 'Medium' ? 'bg-amber-500 text-white' : 
                      'bg-rose-500 text-white'
                    }`}>
                      {aiData.prediction} Match
                    </span>
                    {aiData.confidence && (
                      <span className="ml-2 text-xs text-indigo-500">{aiData.confidence}% confident</span>
                    )}
                  </div>
                  <button onClick={() => callTTS(aiData.text)} className="p-2 bg-white rounded-full shadow-sm text-indigo-600 active:scale-95">
                    <Volume2 className="w-5 h-5"/>
                  </button>
                </div>
                
                <p className="text-indigo-900 text-lg font-medium leading-snug mb-4">"{aiData.text}"</p>
                
                <div className="space-y-3 text-sm">
                  {aiData.harvest_timing && (
                    <div className="flex items-center text-stone-700">
                      <Clock size={14} className="mr-2 text-indigo-500"/>
                      <span className="font-medium">{aiData.harvest_timing}</span>
                    </div>
                  )}
                  {aiData.weather_impact && (
                    <div className="flex items-center text-stone-700">
                      <CloudRain size={14} className="mr-2 text-indigo-500"/>
                      <span>{aiData.weather_impact}</span>
                    </div>
                  )}
                  {aiData.price_assessment && (
                    <div className="flex items-center text-stone-700">
                      <DollarSign size={14} className="mr-2 text-emerald-500"/>
                      <span>Price: <strong>{aiData.price_assessment}</strong></span>
                    </div>
                  )}
                  {aiData.risks?.length > 0 && (
                    <div className="bg-rose-50 p-2 rounded-lg">
                      <p className="text-xs font-bold text-rose-700 mb-1">Risks:</p>
                      {aiData.risks.map((risk, i) => (
                        <p key={i} className="text-xs text-rose-600">• {risk}</p>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-indigo-100">
                  <p className="text-xs text-indigo-500 font-bold uppercase">
                    Suggested: {commitAmount}kg Grade {selectedGrade}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isCommitted ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 animate-fade-in">
              <h3 className="font-bold text-stone-700 mb-4">Your Offer</h3>

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
                      <span className="block text-xs opacity-70">
                        {grade === 'A' ? '100%' : grade === 'B' ? '85%' : '70%'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                  Quantity <span className="text-stone-300">(Stock: {analytics.currentStock}kg)</span>
                </label>
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

              {commitAmount && Number(commitAmount) > 0 && (
                <div className="bg-emerald-50 p-4 rounded-xl mb-4">
                  <p className="text-xs text-emerald-600 font-bold uppercase">Estimated Earnings</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    ₱{(Number(commitAmount) * selectedOrder.price_per_kg * (selectedGrade === 'A' ? 1 : selectedGrade === 'B' ? 0.85 : 0.7)).toLocaleString()}
                  </p>
                </div>
              )}

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

  // --- RENDER: Analytics/Insights View ---
  if (activeTab === 'insights') {
    return (
      <div className="h-full bg-stone-50 flex flex-col animate-fade-in relative">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl z-10">
          <h2 className="text-2xl font-bold">Farm Insights</h2>
          <p className="text-indigo-200 text-sm">Analytics & AI Forecasting</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 -mt-4 z-20 pb-24">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-4">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center">
              <DollarSign size={18} className="mr-2 text-emerald-500"/> Earnings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-stone-400 uppercase font-bold">Total Received</p>
                <p className="text-2xl font-bold text-emerald-600">₱{analytics.totalEarnings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase font-bold">Pending</p>
                <p className="text-2xl font-bold text-amber-600">₱{analytics.pendingEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-4">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center">
              <Activity size={18} className="mr-2 text-indigo-500"/> Performance
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-900">{analytics.totalDelivered}</p>
                <p className="text-xs text-stone-400">kg Delivered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{analytics.successRate}%</p>
                <p className="text-xs text-stone-400">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-900">{analytics.commitmentCount}</p>
                <p className="text-xs text-stone-400">Commitments</p>
              </div>
            </div>
            
            <div className="bg-stone-50 p-3 rounded-xl">
              <p className="text-xs text-stone-500 font-bold mb-2">Grade Distribution</p>
              <div className="flex space-x-2">
                <div className="flex-1 bg-emerald-100 p-2 rounded text-center">
                  <p className="text-lg font-bold text-emerald-700">{analytics.gradeDistribution.A}</p>
                  <p className="text-xs text-emerald-600">Grade A</p>
                </div>
                <div className="flex-1 bg-amber-100 p-2 rounded text-center">
                  <p className="text-lg font-bold text-amber-700">{analytics.gradeDistribution.B}</p>
                  <p className="text-xs text-amber-600">Grade B</p>
                </div>
                <div className="flex-1 bg-orange-100 p-2 rounded text-center">
                  <p className="text-lg font-bold text-orange-700">{analytics.gradeDistribution.C}</p>
                  <p className="text-xs text-orange-600">Grade C</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-stone-800 flex items-center">
                <BrainCircuit size={18} className="mr-2 text-indigo-500"/> AI Forecast
              </h3>
              <button 
                onClick={generateFarmInsights}
                disabled={insightsLoading}
                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium"
              >
                {insightsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {insightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin"/>
              </div>
            ) : farmInsights ? (
              <div className="space-y-4">
                <p className="text-sm text-stone-600 bg-indigo-50 p-3 rounded-lg">{farmInsights.summary}</p>
                
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-xs font-bold text-emerald-700 mb-2">Earnings Forecast</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Next Week:</span>
                    <span className="font-bold">₱{farmInsights.earnings_forecast.next_week?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Next Month:</span>
                    <span className="font-bold">₱{farmInsights.earnings_forecast.next_month?.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-xs font-bold text-indigo-700 mb-2">Yield Prediction</p>
                  <p className="text-lg font-bold text-indigo-900">{farmInsights.yield_prediction.next_harvest}kg</p>
                  <p className="text-xs text-indigo-600">{farmInsights.yield_prediction.optimal_timing}</p>
                </div>
                
                {farmInsights.stock_alert && (
                  <div className={`p-3 rounded-lg ${
                    farmInsights.stock_alert.status === 'healthy' ? 'bg-emerald-50' :
                    farmInsights.stock_alert.status === 'low' ? 'bg-amber-50' : 'bg-rose-50'
                  }`}>
                    <p className={`text-xs font-bold mb-1 ${
                      farmInsights.stock_alert.status === 'healthy' ? 'text-emerald-700' :
                      farmInsights.stock_alert.status === 'low' ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      Stock: {farmInsights.stock_alert.status.toUpperCase()}
                    </p>
                    <p className="text-xs">{farmInsights.stock_alert.message}</p>
                  </div>
                )}
                
                {farmInsights.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-stone-500 mb-2">Recommendations</p>
                    {farmInsights.recommendations.map((rec, i) => (
                      <div key={i} className={`p-2 rounded mb-2 ${
                        rec.priority === 'high' ? 'bg-rose-50 border-l-4 border-rose-500' :
                        rec.priority === 'medium' ? 'bg-amber-50 border-l-4 border-amber-500' :
                        'bg-stone-50 border-l-4 border-stone-300'
                      }`}>
                        <p className="text-sm font-medium">{rec.action}</p>
                        <p className="text-xs text-stone-500">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BrainCircuit className="w-12 h-12 text-stone-200 mx-auto mb-3"/>
                <p className="text-sm text-stone-400">Tap Refresh to get AI insights</p>
              </div>
            )}
          </div>

          {weatherData && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-4">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center">
                <CloudRain size={18} className="mr-2 text-blue-500"/> 7-Day Weather
              </h3>
              <div className="flex overflow-x-auto space-x-3 pb-2">
                {weatherData.forecast.map((day, i) => (
                  <div key={i} className="flex-shrink-0 text-center p-3 bg-stone-50 rounded-xl min-w-[60px]">
                    <p className="text-xs text-stone-500 font-medium">{day.day}</p>
                    <p className="text-lg font-bold text-stone-900">{day.temp}°</p>
                    <p className={`text-xs font-medium ${day.rain > 50 ? 'text-blue-600' : 'text-stone-400'}`}>
                      {day.rain}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-6 left-4 right-4 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex justify-around items-center z-30">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <ShoppingBag size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('stock')} className={`flex flex-col items-center ${activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <Package size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('insights')} className={`flex flex-col items-center ${activeTab === 'insights' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <Activity size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <History size={24} />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: My Commitments View ---
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
                
                <div className="bg-stone-50 p-2 rounded-lg mb-3">
                  <p className="text-xs text-stone-400">Est. Value</p>
                  <p className="font-bold text-emerald-600">
                    ₱{(Number(item.committed_volume_kg) * (item.orders?.price_per_kg || 45) * (item.quality_grade === 'A' ? 1 : item.quality_grade === 'B' ? 0.85 : 0.7)).toLocaleString()}
                  </p>
                </div>
                
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
                {item.status === 'delivered' && (
                  <div className="bg-purple-50 text-purple-700 p-3 rounded-xl text-xs flex items-center">
                    <Warehouse size={14} className="mr-2"/> Delivered - Awaiting payment
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
        
        <div className="absolute bottom-6 left-4 right-4 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex justify-around items-center z-30">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <ShoppingBag size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('stock')} className={`flex flex-col items-center ${activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <Package size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('insights')} className={`flex flex-col items-center ${activeTab === 'insights' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <Activity size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <History size={24} />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: Enhanced Inventory View ---
  if (activeTab === 'stock') {
    return (
      <div className="h-full bg-stone-50 flex flex-col animate-fade-in relative">
        <div className="bg-emerald-700 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">My Inventory</h2>
              <p className="text-emerald-200 text-sm">Batch tracking & stock management</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{analytics.currentStock}</p>
              <p className="text-xs text-emerald-200">kg total</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 -mt-4 z-20 pb-24">
          <div className="bg-white p-4 rounded-xl border border-stone-100 mb-4">
            <p className="text-xs font-bold text-stone-400 uppercase mb-3">Stock by Type</p>
            <div className="grid grid-cols-3 gap-2">
              {['Wet Beans', 'Dried Beans', 'Fermented'].map(type => {
                const qty = inventory.filter(i => i.bean_type === type).reduce((sum, i) => sum + Number(i.quantity_kg || 0), 0);
                return (
                  <div key={type} className="bg-stone-50 p-3 rounded-lg text-center">
                    <p className="text-lg font-bold text-stone-800">{qty}</p>
                    <p className="text-xs text-stone-500">{type.split(' ')[0]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider">Batches</h3>
            <span className="text-xs text-stone-400">{batches.length} batches</span>
          </div>
          
          {batches.length === 0 ? (
            <div className="p-8 text-center text-stone-400 bg-white rounded-xl border border-stone-200">No stock recorded.</div>
          ) : (
            batches.map((batch, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-3">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center">
                      <span className="text-xs font-mono bg-stone-100 px-2 py-0.5 rounded mr-2">{batch.batchId}</span>
                      {batch.daysOld <= 2 && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Fresh</span>
                      )}
                    </div>
                    <h3 className="font-bold text-stone-800 mt-1">{batch.bean_type}</h3>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-emerald-600">{Number(batch.quantity_kg).toLocaleString()}</span>
                    <span className="text-xs text-stone-400 font-bold uppercase">kg</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-stone-50 p-2 rounded">
                    <span className="text-stone-400">Harvested</span>
                    <p className="font-medium text-stone-700">{new Date(batch.harvestDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-stone-50 p-2 rounded">
                    <span className="text-stone-400">Age</span>
                    <p className="font-medium text-stone-700">{batch.daysOld} days</p>
                  </div>
                </div>
                
                {batch.quality_notes && (
                  <p className="text-xs text-stone-500 mt-2 truncate">{batch.quality_notes}</p>
                )}
                
                {batch.bean_type === 'Wet Beans' && batch.daysOld >= 3 && (
                  <div className="mt-3 bg-amber-50 text-amber-700 p-2 rounded-lg text-xs flex items-center">
                    <AlertTriangle size={12} className="mr-1"/> Consider processing - {batch.daysOld} days old
                  </div>
                )}
              </div>
            ))
          )}
          
          <button 
            onClick={() => setShowAddHarvest(true)}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl mt-2 flex items-center justify-center active:scale-95"
          >
            <Plus size={20} className="mr-2"/> Add Harvest
          </button>
        </div>
        
        {showAddHarvest && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50 animate-fade-in">
            <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-stone-900">Add Harvest</h3>
                <button onClick={() => setShowAddHarvest(false)} className="p-2 hover:bg-stone-100 rounded-full">
                  <X size={20}/>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Bean Type</label>
                  <select 
                    value={harvestForm.beanType}
                    onChange={(e) => setHarvestForm({...harvestForm, beanType: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="Wet Beans">Wet Beans</option>
                    <option value="Dried Beans">Dried Beans</option>
                    <option value="Fermented">Fermented</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Quantity (kg)</label>
                  <input 
                    type="number"
                    value={harvestForm.quantity}
                    onChange={(e) => setHarvestForm({...harvestForm, quantity: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-bold"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Plot/Section</label>
                  <select 
                    value={harvestForm.plot}
                    onChange={(e) => setHarvestForm({...harvestForm, plot: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="Plot A">Plot A</option>
                    <option value="Plot B">Plot B</option>
                    <option value="Plot C">Plot C</option>
                    <option value="Hillside">Hillside</option>
                    <option value="Riverside">Riverside</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Quality Grade</label>
                  <div className="flex space-x-2">
                    {['A', 'B', 'C'].map(grade => (
                      <button
                        key={grade}
                        onClick={() => setHarvestForm({...harvestForm, qualityGrade: grade})}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm ${
                          harvestForm.qualityGrade === grade 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        Grade {grade}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Notes (optional)</label>
                  <textarea 
                    value={harvestForm.notes}
                    onChange={(e) => setHarvestForm({...harvestForm, notes: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl h-20 resize-none"
                    placeholder="Quality observations, weather conditions..."
                  />
                </div>
                
                <button 
                  onClick={handleAddHarvest}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:scale-95"
                >
                  Save Harvest
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-6 left-4 right-4 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex justify-around items-center z-30">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <ShoppingBag size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('stock')} className={`flex flex-col items-center ${activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <Package size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('insights')} className={`flex flex-col items-center ${activeTab === 'insights' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <Activity size={24} />
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500'}`}>
            <History size={24} />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: Home View ---
  return (
    <div className="h-full bg-stone-50 flex flex-col animate-fade-in relative">
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
        <h1 className="text-3xl font-bold leading-tight relative z-10">Maayong<br/>{period}! {greetingIcon}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 -mt-8 relative z-20 pb-24">
        {weatherData && (
          <div className="bg-white p-4 rounded-2xl shadow-md mb-4 border border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <CloudRain className="text-indigo-500 w-8 h-8 mr-3" />
                <div>
                  <p className="font-bold text-stone-800">{weatherData.current.condition}</p>
                  <p className="text-xs text-stone-500">{weatherData.current.humidity}% humidity</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-stone-800">{weatherData.current.temp}°</span>
            </div>
            {weatherData.alerts?.length > 0 && (
              <div className="bg-amber-50 text-amber-700 p-2 rounded-lg text-xs flex items-center">
                <AlertTriangle size={12} className="mr-2"/>
                {weatherData.alerts[0].message}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-4 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-400 uppercase font-bold">My Stock</p>
            <p className="text-2xl font-bold text-emerald-600">{analytics.currentStock}<span className="text-sm text-stone-400 ml-1">kg</span></p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-400 uppercase font-bold">Pending Pay</p>
            <p className="text-2xl font-bold text-amber-600">₱{(analytics.pendingEarnings / 1000).toFixed(1)}k</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-400 uppercase font-bold">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{analytics.pendingCount}</p>
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

      <div className="absolute bottom-6 left-4 right-4 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex justify-around items-center z-30">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-400' : 'text-stone-500'}`}>
          <ShoppingBag size={24} />
        </button>
        <div className="w-px h-6 bg-stone-700"></div>
        <button onClick={() => setActiveTab('stock')} className={`flex flex-col items-center ${activeTab === 'stock' ? 'text-emerald-400' : 'text-stone-500'}`}>
          <Package size={24} />
        </button>
        <div className="w-px h-6 bg-stone-700"></div>
        <button onClick={() => setActiveTab('insights')} className={`flex flex-col items-center ${activeTab === 'insights' ? 'text-emerald-400' : 'text-stone-500'}`}>
          <Activity size={24} />
        </button>
        <div className="w-px h-6 bg-stone-700"></div>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500'}`}>
          <History size={24} />
        </button>
      </div>
    </div>
  );
};

export default FarmerApp;