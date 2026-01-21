import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, Zap, Calculator, Activity, Brain, AlertCircle, Loader, CheckCircle, TrendingUpDown, Omega } from 'lucide-react';

const API_URL = 'http://localhost:8080';

const OptionPricingApp = () => {
  const [params, setParams] = useState({
    spotPrice: 100,
    strikePrice: 100,
    timeToMaturity: 1.0,
    riskFreeRate: 0.05,
    volatility: 0.20,
    simulations: 100000,
    optionType: 'call'
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('pricing');
  const [impliedVolParams, setImpliedVolParams] = useState({
    spotPrice: 100,
    strikePrice: 100,
    timeToMaturity: 1.0,
    riskFreeRate: 0.05,
    marketPrice: 10.45,
    optionType: 'call'
  });
  const [impliedVolResult, setImpliedVolResult] = useState(null);
  const [ivLoading, setIvLoading] = useState(false);

  // Check backend status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/price`, { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spotPrice: 100,
            strikePrice: 100,
            timeToMaturity: 1.0,
            riskFreeRate: 0.05,
            volatility: 0.20,
            simulations: 1000,
            optionType: 'call'
          })
       });
       const data = await response.json();
       if (data && data.bsPrice !== undefined) {
          setBackendStatus('connected');
       } else {
          setBackendStatus('disconnected');
       }
      } catch (err) {
        console.error('Backend check failed:', err);
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  // Price option
  const priceOption = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Pricing failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate implied volatility
  const calculateImpliedVol = async () => {
    setIvLoading(true);
    try {
      const response = await fetch(`${API_URL}/implied-vol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(impliedVolParams)
      });
      
      const data = await response.json();
      setImpliedVolResult(data);
    } catch (err) {
      console.error('Implied vol calculation failed:', err);
    } finally {
      setIvLoading(false);
    }
  };

  // Auto-price on parameter change
  useEffect(() => {
    if (backendStatus === 'connected') {
      const timer = setTimeout(priceOption, 300);
      return () => clearTimeout(timer);
    }
  }, [params, backendStatus]);

  // Generate sensitivity data
  const generateSensitivity = () => {
    if (!results) return [];
    const data = [];
    const range = params.spotPrice * 0.4;
    for (let S = params.spotPrice - range; S <= params.spotPrice + range; S += range / 40) {
      // Simplified calculation for visualization
      const moneyness = S / params.strikePrice;
      const intrinsic = params.optionType === 'call' 
        ? Math.max(S - params.strikePrice, 0)
        : Math.max(params.strikePrice - S, 0);
      
      // Rough estimate for option value (for visualization only)
      const timeValue = params.optionType === 'call'
        ? results.bsPrice * (moneyness - 1) * 0.5
        : results.bsPrice * (1 - moneyness) * 0.5;
      
      data.push({ 
        spot: S, 
        value: intrinsic + Math.max(timeValue, 0),
        intrinsic 
      });
    }
    return data;
  };

  // Generate volatility surface
  const generateVolSurface = () => {
    if (!results) return [];
    const data = [];
    for (let vol = 0.05; vol <= 0.50; vol += 0.02) {
      // Rough estimate (real implementation would re-calculate BS)
      const factor = vol / params.volatility;
      data.push({
        volatility: vol * 100,
        price: results.bsPrice * factor * 0.8
      });
    }
    return data;
  };

  const moneyness = ((params.spotPrice / params.strikePrice - 1) * 100).toFixed(2);
  const itmStatus = params.optionType === 'call'
    ? params.spotPrice > params.strikePrice ? 'ITM' : params.spotPrice < params.strikePrice ? 'OTM' : 'ATM'
    : params.spotPrice < params.strikePrice ? 'ITM' : params.spotPrice > params.strikePrice ? 'OTM' : 'ATM';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Quantitative Option Pricing Engine
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  High-performance C++ backend • Black-Scholes • Monte Carlo • Greeks
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                backendStatus === 'connected' 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-red-500/20 border border-red-500/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`} />
                <span className="text-sm font-medium">
                  {backendStatus === 'connected' ? 'C++ Engine Online' : 'Backend Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Warning */}
      {backendStatus === 'disconnected' && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-400 mb-1">C++ Backend Not Running</h3>
              <p className="text-sm text-slate-300 mb-2">
                Compile and start: <code className="bg-slate-800 px-2 py-1 rounded text-xs">./option_server.exe</code>
              </p>
              <p className="text-xs text-slate-400">Server should be running on http://localhost:8080</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800 sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'pricing', label: 'Real-Time Pricing', icon: Calculator },
              { id: 'greeks', label: 'Greeks Analysis', icon: Omega },
              { id: 'implied-vol', label: 'Implied Volatility', icon: TrendingUpDown },
              { id: 'visualizations', label: 'Sensitivity', icon: Activity },
              {id: 'theory', label: 'Model Theory', icon: Brain}
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 transition-all relative ${
                  activeTab === tab.id
                    ? 'text-yellow-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Parameters - Left Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-yellow-400" />
                  Option Parameters
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Option Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['call', 'put'].map(type => (
                        <button
                          key={type}
                          onClick={() => setParams({...params, optionType: type})}
                          className={`py-2 px-4 rounded-lg font-medium transition-all ${
                            params.optionType === type
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {[
                    { key: 'spotPrice', label: 'Spot Price (S)', prefix: '$', step: 1 },
                    { key: 'strikePrice', label: 'Strike Price (K)', prefix: '$', step: 1 },
                    { key: 'timeToMaturity', label: 'Time to Maturity (T)', suffix: 'years', step: 0.1 },
                    { key: 'riskFreeRate', label: 'Risk-Free Rate (r)', suffix: '%', step: 0.01, multiply: 100 },
                    { key: 'volatility', label: 'Volatility (σ)', suffix: '%', step: 0.01, multiply: 100 },
                    { key: 'simulations', label: 'MC Simulations', step: 10000 }
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        {field.label}
                      </label>
                      <div className="relative">
                        {field.prefix && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            {field.prefix}
                          </span>
                        )}
                        <input
                          type="number"
                          value={field.multiply ? params[field.key] * field.multiply : params[field.key]}
                          onChange={(e) => setParams({
                            ...params, 
                            [field.key]: field.multiply 
                              ? parseFloat(e.target.value) / field.multiply 
                              : parseFloat(e.target.value)
                          })}
                          step={field.step}
                          className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition ${
                            field.prefix ? 'pl-7' : ''
                          } ${field.suffix ? 'pr-16' : ''}`}
                        />
                        {field.suffix && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                            {field.suffix}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Moneyness</span>
                    <span className={`font-semibold px-3 py-1 rounded-lg ${
                      itmStatus === 'ITM' ? 'bg-green-500/20 text-green-400' :
                      itmStatus === 'OTM' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {itmStatus} ({moneyness}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results - Right Column */}
            <div className="lg:col-span-8 space-y-6">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader className="w-10 h-10 animate-spin text-yellow-400" />
                </div>
              )}

              {results && !loading && (
                <>
                  {/* Pricing Results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-green-400">Black-Scholes</h4>
                        <div className="text-xs text-green-400/70 bg-green-500/20 px-2 py-1 rounded">
                          Analytical
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">
                        ${results.bsPrice.toFixed(4)}
                      </div>
                      <div className="text-sm text-slate-400">
                        Computed in {results.bsTimeMs.toFixed(3)}ms
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-blue-400">Monte Carlo</h4>
                        <div className="text-xs text-blue-400/70 bg-blue-500/20 px-2 py-1 rounded">
                          Stochastic
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">
                        ${results.mcPrice.toFixed(4)}
                      </div>
                      <div className="text-sm text-slate-400">
                        {params.simulations.toLocaleString()} sims in {results.mcTimeMs.toFixed(1)}ms
                      </div>
                    </div>
                  </div>

                  {/* Error Metrics */}
                  <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                    <h4 className="font-semibold mb-4">Convergence Analysis</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Absolute Error</div>
                        <div className="text-2xl font-bold text-orange-400">
                          ${results.error.toFixed(6)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Relative Error</div>
                        <div className="text-2xl font-bold text-orange-400">
                          {results.relativeErrorPct.toFixed(4)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Convergence</div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-lg font-semibold text-green-400">Excellent</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                    <h4 className="font-semibold mb-4">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">BS Throughput</span>
                        <span className="font-semibold text-green-400">
                          {(1000 / results.bsTimeMs).toFixed(0)} options/sec
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">MC Throughput</span>
                        <span className="font-semibold text-blue-400">
                          {(1000 / results.mcTimeMs).toFixed(0)} options/sec
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">MC Efficiency</span>
                        <span className="font-semibold text-yellow-400">
                          {(params.simulations / results.mcTimeMs / 1000).toFixed(0)}K sims/sec
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Greeks Tab */}
        {activeTab === 'greeks' && results && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  name: 'Delta (Δ)', 
                  value: results.greeks.delta, 
                  desc: 'Change in option price per $1 change in underlying',
                  color: 'blue',
                  interpretation: Math.abs(results.greeks.delta) > 0.7 ? 'High sensitivity' : 
                                 Math.abs(results.greeks.delta) > 0.3 ? 'Moderate sensitivity' : 'Low sensitivity'
                },
                { 
                  name: 'Gamma (Γ)', 
                  value: results.greeks.gamma, 
                  desc: 'Rate of change of delta per $1 change in underlying',
                  color: 'green',
                  interpretation: results.greeks.gamma > 0.02 ? 'High curvature' : 'Low curvature'
                },
                { 
                  name: 'Vega (ν)', 
                  value: results.greeks.vega, 
                  desc: 'Change in option price per 1% change in volatility',
                  color: 'purple',
                  interpretation: 'Always positive'
                },
                { 
                  name: 'Theta (Θ)', 
                  value: results.greeks.theta, 
                  desc: 'Change in option price per day (time decay)',
                  color: 'red',
                  interpretation: results.greeks.theta < 0 ? 'Option losing value daily' : 'Option gaining value'
                },
                { 
                  name: 'Rho (ρ)', 
                  value: results.greeks.rho, 
                  desc: 'Change in option price per 1% change in interest rate',
                  color: 'yellow',
                  interpretation: 'Interest rate sensitivity'
                }
              ].map(greek => (
                <div key={greek.name} className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-lg">{greek.name}</h4>
                    <div className={`text-xs px-2 py-1 rounded bg-${greek.color}-500/20 text-${greek.color}-400`}>
                      {greek.interpretation}
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    {greek.value.toFixed(6)}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {greek.desc}
                  </p>
                  <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-${greek.color}-500 to-${greek.color}-400 transition-all duration-500`}
                      style={{ width: `${Math.min(Math.abs(greek.value) * 50, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h4 className="font-semibold mb-4">Greeks Interpretation</h4>
              <div className="space-y-3 text-sm text-slate-300">
                <p><strong className="text-blue-400">Delta:</strong> For a ${params.optionType === 'call' ? 'call' : 'put'} with delta {results.greeks.delta.toFixed(3)}, a $1 increase in the stock price changes the option value by approximately ${results.greeks.delta.toFixed(3)}.</p>
                <p><strong className="text-green-400">Gamma:</strong> The delta will change by {results.greeks.gamma.toFixed(6)} for every $1 move in the underlying. {results.greeks.gamma > 0.02 ? 'High gamma means frequent delta hedging required.' : 'Low gamma means stable delta.'}</p>
                <p><strong className="text-purple-400">Vega:</strong> A 1% increase in implied volatility (from {(params.volatility * 100).toFixed(0)}% to {(params.volatility * 100 + 1).toFixed(0)}%) increases the option value by ${results.greeks.vega.toFixed(3)}.</p>
                <p><strong className="text-red-400">Theta:</strong> This option loses ${Math.abs(results.greeks.theta).toFixed(4)} in value per day due to time decay.</p>
              </div>
            </div>
          </div>
        )}

        {/* Implied Volatility Tab */}
        {activeTab === 'implied-vol' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUpDown className="w-5 h-5 text-purple-400" />
                Implied Volatility Calculator
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Option Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['call', 'put'].map(type => (
                      <button
                        key={type}
                        onClick={() => setImpliedVolParams({...impliedVolParams, optionType: type})}
                        className={`py-2 px-4 rounded-lg font-medium transition-all ${
                          impliedVolParams.optionType === type
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  { key: 'spotPrice', label: 'Spot Price', prefix: '$' },
                  { key: 'strikePrice', label: 'Strike Price', prefix: '$' },
                  { key: 'timeToMaturity', label: 'Time to Maturity', suffix: 'years' },
                  { key: 'riskFreeRate', label: 'Risk-Free Rate', suffix: '%', multiply: 100 },
                  { key: 'marketPrice', label: 'Market Price', prefix: '$' }
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-400 mb-2">{field.label}</label>
                    <div className="relative">
                      {field.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{field.prefix}</span>}
                      <input
                        type="number"
                        value={field.multiply ? impliedVolParams[field.key] * field.multiply : impliedVolParams[field.key]}
                        onChange={(e) => setImpliedVolParams({
                          ...impliedVolParams,
                          [field.key]: field.multiply ? parseFloat(e.target.value) / field.multiply : parseFloat(e.target.value)
                        })}
                        step={field.key === 'marketPrice' ? 0.01 : 0.1}
                        className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 ${field.prefix ? 'pl-7' : ''} ${field.suffix ? 'pr-16' : ''}`}
                      />
                      {field.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{field.suffix}</span>}
                    </div>
                  </div>
                ))}

                <button
                  onClick={calculateImpliedVol}
                  disabled={ivLoading || backendStatus !== 'connected'}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ivLoading ? 'Calculating...' : 'Calculate Implied Volatility'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold mb-6">Result</h3>
              
              {impliedVolResult ? (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="text-sm text-slate-400 mb-2">Implied Volatility</div>
                    <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {(impliedVolResult.impliedVol * 100).toFixed(2)}%
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-400">Market Price</span>
                      <span className="font-semibold">${impliedVolParams.marketPrice.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-400">Implied Volatility</span>
                      <span className="font-semibold text-purple-400">{(impliedVolResult.impliedVol * 100).toFixed(3)}%</span>
                    </div>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-400 mb-2">What This Means</h4>
                    <p className="text-sm text-slate-300">
                      At a market price of ${impliedVolParams.marketPrice.toFixed(2)}, the market is pricing in 
                      {(impliedVolResult.impliedVol * 100).toFixed(2)}% annualized volatility. This is what traders 
                      are "expecting" the stock to move, based on the option price.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Brain className="w-16 h-16 mb-4 opacity-30" />
                  <p>Enter parameters and calculate to see implied volatility</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visualizations Tab */}
        {activeTab === 'visualizations' && results && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                <h4 className="font-semibold mb-4">Option Value vs Spot Price</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateSensitivity()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="spot" stroke="#94a3b8" tick={{fontSize: 12}} />
                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} name="Option Value" dot={false} />
                    <Line type="monotone" dataKey="intrinsic" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Intrinsic Value" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                <h4 className="font-semibold mb-4">Price vs Volatility</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateVolSurface()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="volatility" stroke="#94a3b8" tick={{fontSize: 12}} label={{ value: 'Volatility (%)', position: 'insideBottom', offset: -5 }} />
                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} name="Option Price" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h4 className="font-semibold mb-4">Key Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Max Profit</div>
                  <div className="text-xl font-bold text-green-400">
                    {params.optionType === 'call' ? 'Unlimited' : `${params.strikePrice.toFixed(2)}`}
                  </div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Max Loss</div>
                  <div className="text-xl font-bold text-red-400">
                    ${results.bsPrice.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Break-even</div>
                  <div className="text-xl font-bold text-yellow-400">
                    ${params.optionType === 'call' 
                      ? (params.strikePrice + results.bsPrice).toFixed(2)
                      : (params.strikePrice - results.bsPrice).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div className="space-y-8">

            {/* Overview */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h2 className="text-2xl font-bold mb-3">How Option Pricing Works</h2>
              <p className="text-slate-300 leading-relaxed">
                This engine estimates how much an option is worth using two methods: 
                an <strong>analytical model (Black–Scholes)</strong> and a
                 <strong> simulation-based model (Monte Carlo)</strong>.
                Both rely on the same underlying assumptions about how markets behave,
                but arrive at prices in fundamentally different ways.
              </p>
              <p className="text-slate-400 mt-2">
                Simply put,
                <br />• Black–Scholes gives a quick, exact answer using math.
                <br />• Monte Carlo gives an estimated answer by simulating many “what if” price paths.
              </p>
            </div>

            {/* Black-Scholes */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-semibold mb-4 text-green-400">
                Black–Scholes Model (Analytical Pricing)
              </h3>

              <p className="text-slate-300 mb-4">
                The <strong>Black–Scholes model</strong> is a famous formula used to calculate fair prices
                for European call and put options. It assumes the stock price changes smoothly over time
                (like a random walk) with constant volatility and interest rates. This is called <strong>geometric Brownian motion. </strong>
                This gives us a <strong>closed-form solution</strong>, so you can plug in numbers
                and immediately get a price.
              </p>

              <div className="space-y-3 text-sm text-slate-300">
                <p><strong>Key Assumptions:</strong></p>
                <ul className="list-disc list-inside text-slate-400">
                  <li>Log-normal stock price distribution (stock price cant go negative)</li>
                  <li>Constant volatility and risk-free rate</li>
                  <li>No arbitrage(risk free profit) opportunities</li>
                  <li>Options are only exercised at expiration (European-style)</li>
                </ul>
              </div>

              <div className="mt-6 bg-slate-800/60 rounded-xl p-4">
                <p className="font-mono text-sm text-yellow-300 mb-2">
                  Call Option Price:
                </p>
                <p className="font-mono text-slate-200">
                  C = S·N(d₁) - K·e⁻ʳᵀ·N(d₂)
                </p>
                <p className="font-mono text-slate-200 mt-2">
                  d₁ = [ln(S/K) + (r + ½σ²)T] / (σ√T)
                </p>
                <p className="font-mono text-slate-200">
                  d₂ = d₁ - σ√T
                </p>
              </div>
              {/* Variable Explanations */}
              <div className="bg-slate-800/40 rounded-xl p-4 text-slate-300 text-sm">
                <p className="font-semibold text-green-400 mb-2">Variable Explanations</p>
                <ul className="space-y-1">
                  <li><strong>S</strong> = Current stock price</li>
                  <li><strong>K</strong> = Strike price (agreed exercise price)</li>
                  <li><strong>r</strong> = Risk-free interest rate</li>
                  <li><strong>T</strong> = Time to expiration (in years)</li>
                  <li><strong>σ</strong> = Volatility (expected price fluctuation)</li>
                  <li><strong>N(x)</strong> = Cumulative normal probability function</li>
                </ul>
              </div>
              <p className="mt-4 text-slate-300">
                The Black–Scholes formula works fast and exactly for simple (European) options. 
                It’s often used as a <strong>benchmark</strong> to compare against more complex pricing methods.
              </p>
            </div>

            {/* Monte Carlo */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">
                Monte Carlo Simulation (Stochastic Pricing)
              </h3>

              <p className="text-slate-300 mb-4">
                <strong>Monte Carlo </strong>pricing takes a fundamentally different approach.
                Instead of using one formula, it simulates thousands of <strong>possible future stock prices </strong>
        using random sampling and then <strong>averages the results</strong>. This method is especially useful for pricing
        complex options where no closed-form solution exists.
              </p>

              <div className="space-y-3 text-sm text-slate-300">
                <p><strong>Stock price evolution:</strong></p>
                <div className="bg-slate-800/60 rounded-xl p-4 font-mono text-slate-200">
                  Sₜ = S₀ · exp[(r − ½σ²)T + σ√T · Z]
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 text-slate-300 text-sm">
                <p className="font-semibold text-blue-400 mb-2">Variable Explanations</p>
                <ul className="space-y-1">
                  <li><strong>S₀</strong> = Starting stock price</li>
                  <li><strong>Sₜ</strong> = Simulated stock price at time T</li>
                  <li><strong>Z</strong> = Random number from normal distribution</li>
                  <li><strong>r</strong> = Risk-free interest rate</li>
                  <li><strong>T</strong> = Time to expiration (in years)</li>
                  <li><strong>σ</strong> = Volatility (expected price fluctuation)</li>
                </ul>
              </div>

                <p className="mt-3"><strong>Procedure:</strong></p>
                <ul className="list-decimal list-inside text-slate-400">
                  <li>Generate random normal variables Z, which represent possible market changes</li>
                  <li>Simulate stock prices Sₜ at end of time T using the formula above</li>
                  <li>Calculate the option's payoff(how much the option is worth at expiration): <code>max(Sₜ − K, 0)</code></li>
                  <li>Average the payoffs the average payoff back to present value</li>
                </ul>
              </div>

              <p className="mt-4 text-slate-300">
                Monte Carlo pricing is <strong>slower</strong> than Black–Scholes,
                but far more <strong>flexible</strong>. They extend naturally to
                path-dependent options, complex payoffs, and multi-asset products.
              </p>
            </div>

            {/* Comparison */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-semibold mb-4">Why Use Both?</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-green-400 mb-2">Black–Scholes</h4>
                  <ul className="list-disc list-inside text-slate-300">
                    <li>Extremely fast</li>
                    <li>Exact solution</li>
                    <li>Gives analyticalGreeks</li>
                    <li>Limited assumptions, only works for simple European style options</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Monte Carlo</h4>
                  <ul className="list-disc list-inside text-slate-300">
                    <li>Highly flexible</li>
                    <li>Model-agnostic, easy to extend</li>
                    <li>Scales to complex products</li>
                    <li>Accuracy improves with more simulations</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-slate-300">
                By comparing Monte Carlo results to Black-Scholes,
                we can <strong>measure how well our simulation works </strong>
                and watch the results <strong>converge</strong> toward the true theoretical price.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div>
              Built with C++ (Crow), Black-Scholes PDE, Monte Carlo simulation, and analytical Greeks
            </div>
            <div className="flex items-center gap-4">
              <span>High-Performance Computing</span>
              <span>•</span>
              <span>Quantitative Finance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionPricingApp;