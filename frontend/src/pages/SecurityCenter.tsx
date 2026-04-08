import React from 'react';
import {
  Shield, AlertTriangle, Lock, Target, Settings, Eye, Search, X,
  BarChart, Calendar, Hash, Info, ListFilter
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { create } from 'zustand';
import toast from 'react-hot-toast';

// 1. STATE MANAGEMENT (Zustand Store)
// ============================================================================
// Centralizes state logic, making it scalable and easier to manage across components.
// Avoids prop drilling and provides a single source of truth.

interface SecurityThreat {
  id: string;
  timestamp: string;
  threat_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  source_ip: string;
  target_ip: string;
  description: string;
  status: 'ACTIVE' | 'MITIGATED' | 'INVESTIGATING';
  confidence_score: number;
  mitigation_action: string;
  protocol: string;
  payload_size: number;
}

interface SecurityMetrics {
  total_threats: number;
  active_threats: number;
  blocked_attacks: number;
  security_score: number;
  vulnerability_score: number;
  firewall_rules: number;
  ids_alerts: number;
  suspicious_ips: number;
}

interface SecurityState {
  threats: SecurityThreat[];
  metrics: SecurityMetrics | null;
  loading: boolean;
  error: string | null;
  selectedThreat: SecurityThreat | null;
  actionLoading: boolean;
  filters: {
    severity: string;
    status: string;
    searchTerm: string;
  };
  fetchSecurityData: () => Promise<void>;
  selectThreat: (threat: SecurityThreat | null) => void;
  setFilter: (filterName: keyof SecurityState['filters'], value: string) => void;
  takeActionOnThreat: (threatId: string) => Promise<void>;
  addNewThreat: () => void;
  autoMitigateThreat: () => void;
  updateMetrics: () => void;
}

// Dynamic threat generation helpers
const THREAT_TYPES = [
  { type: 'DDoS Attack', severity: 'HIGH' as const, protocol: 'UDP', description: 'Distributed denial of service attack detected.' },
  { type: 'Port Scan', severity: 'MEDIUM' as const, protocol: 'TCP', description: 'Network port scanning activity detected.' },
  { type: 'SQL Injection Attempt', severity: 'HIGH' as const, protocol: 'HTTP', description: 'SQL injection attack on web endpoint.' },
  { type: 'Malware Beaconing', severity: 'MEDIUM' as const, protocol: 'DNS', description: 'Suspicious outbound connection to known C2 server.' },
  { type: 'Brute Force Attack', severity: 'HIGH' as const, protocol: 'SSH', description: 'Multiple failed authentication attempts detected.' },
  { type: 'XSS Attempt', severity: 'MEDIUM' as const, protocol: 'HTTP', description: 'Cross-site scripting attempt blocked.' },
  { type: 'Anomalous Login', severity: 'LOW' as const, protocol: 'HTTPS', description: 'Login from unusual location or device.' },
  { type: 'Data Exfiltration', severity: 'HIGH' as const, protocol: 'HTTPS', description: 'Large data transfer to external IP detected.' },
  { type: 'Ransomware Activity', severity: 'HIGH' as const, protocol: 'SMB', description: 'File encryption behavior detected on network share.' },
  { type: 'Privilege Escalation', severity: 'HIGH' as const, protocol: 'RPC', description: 'Unauthorized privilege elevation attempt.' },
  { type: 'DNS Tunneling', severity: 'MEDIUM' as const, protocol: 'DNS', description: 'Suspicious DNS query patterns detected.' },
  { type: 'Cryptomining', severity: 'LOW' as const, protocol: 'TCP', description: 'Cryptocurrency mining activity detected.' },
];

const generateRandomIP = () => `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
const generateInternalIP = () => `10.0.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`;

let threatCounter = 100;

const generateNewThreat = (): SecurityThreat => {
  const threatTemplate = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
  threatCounter++;
  return {
    id: `TH-${threatCounter.toString().padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    threat_type: threatTemplate.type,
    severity: threatTemplate.severity,
    source_ip: generateRandomIP(),
    target_ip: generateInternalIP(),
    description: threatTemplate.description,
    status: 'ACTIVE',
    confidence_score: Math.floor(Math.random() * 25) + 75,
    mitigation_action: 'Analyzing threat pattern. Automated response pending.',
    protocol: threatTemplate.protocol,
    payload_size: Math.floor(Math.random() * 2000) + 64,
  };
};

const useSecurityStore = create<SecurityState>((set, get) => ({
  threats: [],
  metrics: null,
  loading: true,
  error: null,
  selectedThreat: null,
  actionLoading: false,
  filters: {
    severity: 'all',
    status: 'all',
    searchTerm: '',
  },
  fetchSecurityData: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(res => setTimeout(res, 800));

      // Start with dynamic metrics based on random trend
      const baseThreats = Math.floor(Math.random() * 50) + 10;
      const metricsData: SecurityMetrics = {
        total_threats: baseThreats + Math.floor(Math.random() * 100),
        active_threats: Math.floor(Math.random() * 15) + 3,
        blocked_attacks: Math.floor(Math.random() * 80) + 40,
        security_score: Math.floor(Math.random() * 15) + 80,
        vulnerability_score: Math.floor(Math.random() * 30) + 60,
        firewall_rules: 2540 + Math.floor(Math.random() * 100),
        ids_alerts: Math.floor(Math.random() * 200) + 100,
        suspicious_ips: Math.floor(Math.random() * 40) + 20
      };

      // Generate initial dynamic threats
      const initialThreats: SecurityThreat[] = [];
      const numInitialThreats = Math.floor(Math.random() * 4) + 3;
      for (let i = 0; i < numInitialThreats; i++) {
        const threat = generateNewThreat();
        threat.timestamp = new Date(Date.now() - Math.random() * 3600000).toISOString();
        threat.status = ['ACTIVE', 'MITIGATED', 'INVESTIGATING'][Math.floor(Math.random() * 3)] as any;
        initialThreats.push(threat);
      }

      set({ metrics: metricsData, threats: initialThreats, loading: false });
    } catch (error) {
      const err = error as Error;
      console.error('Failed to fetch security data:', err);
      set({ error: err.message, loading: false });
    }
  },
  selectThreat: (threat) => set({ selectedThreat: threat }),
  setFilter: (filterName, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [filterName]: value,
      },
    }));
  },
  takeActionOnThreat: async (threatId: string) => {
    const state = get();
    const target = state.threats.find((t) => t.id === threatId) ?? state.selectedThreat;
    if (!target) return;
    if (target.status === 'MITIGATED') {
      toast('Threat already mitigated');
      return;
    }

    set({ actionLoading: true });
    try {
      // UI-only mitigation for demo data.
      // When backend supports it, replace with an API call and then refresh.
      await new Promise((res) => setTimeout(res, 400));

      set((s) => {
        const updatedThreats = s.threats.map((t) =>
          t.id === threatId
            ? {
                ...t,
                status: 'MITIGATED' as const,
                mitigation_action:
                  t.mitigation_action || 'Mitigation action executed successfully.',
              }
            : t
        );

        const updatedSelected =
          s.selectedThreat?.id === threatId
            ? {
                ...s.selectedThreat,
                status: 'MITIGATED' as const,
                mitigation_action:
                  s.selectedThreat.mitigation_action ||
                  'Mitigation action executed successfully.',
              }
            : s.selectedThreat;

        return {
          threats: updatedThreats,
          selectedThreat: updatedSelected,
        };
      });

      toast.success('Mitigation action executed');
    } catch (e) {
      toast.error('Failed to execute mitigation action');
    } finally {
      set({ actionLoading: false });
    }
  },
  // Add a new threat dynamically
  addNewThreat: () => {
    const newThreat = generateNewThreat();
    set((state) => {
      const updatedThreats = [newThreat, ...state.threats].slice(0, 20);
      const metrics = state.metrics;
      if (metrics) {
        return {
          threats: updatedThreats,
          metrics: {
            ...metrics,
            total_threats: metrics.total_threats + 1,
            active_threats: metrics.active_threats + 1,
            ids_alerts: metrics.ids_alerts + 1,
          }
        };
      }
      return { threats: updatedThreats };
    });
  },
  // Auto-mitigate a random active threat
  autoMitigateThreat: () => {
    set((state) => {
      const activeThreats = state.threats.filter(t => t.status === 'ACTIVE');
      if (activeThreats.length === 0) return state;
      
      const threatToMitigate = activeThreats[Math.floor(Math.random() * activeThreats.length)];
      const updatedThreats = state.threats.map(t => 
        t.id === threatToMitigate.id 
          ? { ...t, status: 'MITIGATED' as const, mitigation_action: 'Automatically mitigated by FL-IDS model.' }
          : t
      );
      
      const metrics = state.metrics;
      if (metrics) {
        return {
          threats: updatedThreats,
          metrics: {
            ...metrics,
            active_threats: Math.max(0, metrics.active_threats - 1),
            blocked_attacks: metrics.blocked_attacks + 1,
            security_score: Math.min(100, metrics.security_score + 1),
          }
        };
      }
      return { threats: updatedThreats };
    });
  },
  // Update metrics with random fluctuation
  updateMetrics: () => {
    set((state) => {
      if (!state.metrics) return state;
      
      const trend = Math.random() > 0.5 ? 1 : -1;
      return {
        metrics: {
          ...state.metrics,
          security_score: Math.max(70, Math.min(99, state.metrics.security_score + trend * Math.floor(Math.random() * 3))),
          vulnerability_score: Math.max(50, Math.min(90, state.metrics.vulnerability_score + trend * Math.floor(Math.random() * 2))),
          suspicious_ips: Math.max(5, state.metrics.suspicious_ips + trend * Math.floor(Math.random() * 5)),
        }
      };
    });
  },
}));

// 2. REUSABLE UI COMPONENTS
// ============================================================================
// Breaking the UI into smaller, focused components improves readability,
// reusability, and makes the codebase easier to maintain.

const MetricCard = ({ icon: Icon, title, value, colorClass }: { icon: React.ComponentType<{ className?: string }>, title: string, value: string | number, colorClass: string }) => (
  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/80 hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300 shadow-lg">
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-lg bg-gray-700/50 ${colorClass}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const Badge = ({ text, colorClasses }: { text: string, colorClasses: string }) => (
  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colorClasses}`}>
    {text}
  </span>
);

const getSeverityBadge = (severity: SecurityThreat['severity']) => {
  switch (severity) {
    case 'HIGH': return 'bg-red-600/20 text-red-400 border-red-500/30';
    case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
    case 'LOW': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
    default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusBadge = (status: SecurityThreat['status']) => {
  switch (status) {
    case 'ACTIVE': return 'bg-red-600/20 text-red-400 border-red-500/30 animate-pulse';
    case 'MITIGATED': return 'bg-green-600/20 text-green-400 border-green-500/30';
    case 'INVESTIGATING': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
  }
};

const SkeletonLoader = () => (
    <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-24 bg-gray-800 rounded-xl"></div>
            <div className="h-24 bg-gray-800 rounded-xl"></div>
            <div className="h-24 bg-gray-800 rounded-xl"></div>
            <div className="h-24 bg-gray-800 rounded-xl"></div>
        </div>
        <div className="h-40 bg-gray-800 rounded-xl"></div>
        <div className="h-96 bg-gray-800 rounded-xl"></div>
    </div>
);


// 3. COMPONENT SECTIONS
// ============================================================================
// Each major part of the page is its own component for clarity.

const SecurityMetricsOverview = () => {
  const metrics = useSecurityStore((state) => state.metrics);
  if (!metrics) return null;

  const metricCards = [
    { icon: Shield, title: 'Security Score', value: `${metrics.security_score}%`, colorClass: 'text-blue-400' },
    { icon: AlertTriangle, title: 'Active Threats', value: metrics.active_threats, colorClass: 'text-red-400' },
    { icon: Lock, title: 'Blocked Attacks', value: metrics.blocked_attacks, colorClass: 'text-green-400' },
    { icon: Target, title: 'Vulnerability Score', value: `${metrics.vulnerability_score}%`, colorClass: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map(card => <MetricCard key={card.title} {...card} />)}
    </div>
  );
};

const ThreatDistributionChart = () => {
    const threats = useSecurityStore((state) => state.threats);
    const data = [
        { name: 'High', count: threats.filter(t => t.severity === 'HIGH').length, fill: '#F87171' },
        { name: 'Medium', count: threats.filter(t => t.severity === 'MEDIUM').length, fill: '#FBBF24' },
        { name: 'Low', count: threats.filter(t => t.severity === 'LOW').length, fill: '#60A5FA' },
    ];

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/80">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><BarChart className="w-5 h-5 mr-2 text-gray-400"/>Threat Distribution by Severity</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="name" stroke="#A0AEC0" />
                        <YAxis stroke="#A0AEC0" />
                        <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const ThreatFilters = () => {
  const { filters, setFilter } = useSecurityStore();

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/80">
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        <div className="flex-grow w-full md:w-auto">
          <label className="relative text-gray-400 focus-within:text-gray-200 block">
            <Search className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3" />
            <input
              type="text"
              placeholder="Search by IP, type, or description..."
              value={filters.searchTerm}
              onChange={(e) => setFilter('searchTerm', e.target.value)}
              className="bg-gray-700/50 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </label>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mr-2">Severity:</label>
          <select value={filters.severity} onChange={(e) => setFilter('severity', e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mr-2">Status:</label>
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="ACTIVE">Active</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="INVESTIGATING">Investigating</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const ThreatsTable = () => {
  const { threats, filters, selectThreat } = useSecurityStore();

  const filteredThreats = threats.filter(threat => {
    const searchTermLower = filters.searchTerm.toLowerCase();
    return (
      (filters.severity === 'all' || threat.severity === filters.severity) &&
      (filters.status === 'all' || threat.status === filters.status) &&
      (filters.searchTerm === '' ||
        threat.threat_type.toLowerCase().includes(searchTermLower) ||
        threat.source_ip.toLowerCase().includes(searchTermLower) ||
        threat.description.toLowerCase().includes(searchTermLower))
    );
  });
  
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/80 overflow-hidden">
        <div className="px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center"><ListFilter className="w-5 h-5 mr-2 text-gray-400"/>Live Threat Feed</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-700/50">
                    <tr>
                        {['Timestamp', 'Threat Type', 'Severity', 'Source IP', 'Status', 'Confidence', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {filteredThreats.length > 0 ? filteredThreats.map((threat) => (
                        <tr key={threat.id} className="hover:bg-gray-700/30 transition-colors" onClick={() => selectThreat(threat)} style={{cursor: 'pointer'}}>
                            <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{new Date(threat.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-white font-medium">{threat.threat_type}</td>
                            <td className="px-6 py-4"><Badge text={threat.severity} colorClasses={getSeverityBadge(threat.severity)} /></td>
                            <td className="px-6 py-4 text-sm text-white font-mono">{threat.source_ip}</td>
                            <td className="px-6 py-4"><Badge text={threat.status} colorClasses={getStatusBadge(threat.status)} /></td>
                            <td className="px-6 py-4 text-sm text-gray-300">{threat.confidence_score}%</td>
                            <td className="px-6 py-4">
                                <button onClick={(e) => { e.stopPropagation(); selectThreat(threat); }} className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg" title="View Details">
                                    <Eye className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={7} className="text-center py-12 text-gray-400">
                                <p>No threats match the current filters.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

const ThreatDetailModal = () => {
    const { selectedThreat, selectThreat, takeActionOnThreat, actionLoading } = useSecurityStore();
    if (!selectedThreat) return null;

    const canTakeAction = selectedThreat.status !== 'MITIGATED' && !actionLoading;

    const detailItems = [
        { label: 'Threat ID', value: selectedThreat.id, icon: Hash },
        { label: 'Timestamp', value: new Date(selectedThreat.timestamp).toLocaleString(), icon: Calendar },
        { label: 'Threat Type', value: selectedThreat.threat_type, icon: AlertTriangle },
        { label: 'Severity', value: <Badge text={selectedThreat.severity} colorClasses={getSeverityBadge(selectedThreat.severity)} />, icon: Shield },
        { label: 'Source IP', value: selectedThreat.source_ip, icon: Target, mono: true },
        { label: 'Target IP', value: selectedThreat.target_ip, icon: Target, mono: true },
        { label: 'Status', value: <Badge text={selectedThreat.status} colorClasses={getStatusBadge(selectedThreat.status)} />, icon: Info },
        { label: 'Confidence Score', value: `${selectedThreat.confidence_score}%`, icon: Target },
        { label: 'Protocol', value: selectedThreat.protocol, icon: Info },
        { label: 'Payload Size', value: `${selectedThreat.payload_size} bytes`, icon: Info },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => selectThreat(null)}>
            <div className="bg-gray-800 rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <h3 className="text-2xl font-bold text-white flex items-center"><Info className="w-6 h-6 mr-3 text-blue-400"/>Threat Details</h3>
                    <button onClick={() => selectThreat(null)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"><X /></button>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {detailItems.map(item => (
                            <div key={item.label} className="flex items-start">
                                <item.icon className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0"/>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">{item.label}</label>
                                    <div className={`text-white text-base ${item.mono ? 'font-mono' : ''}`}>{item.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <p className="text-white bg-gray-700/50 p-3 rounded-lg">{selectedThreat.description}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mitigation Action</label>
                        <p className="text-white bg-gray-700/50 p-3 rounded-lg">{selectedThreat.mitigation_action}</p>
                    </div>
                    
                    <div className="flex space-x-4 pt-6">
                        <button
                          className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors ${
                            canTakeAction
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-blue-900/40 cursor-not-allowed'
                          }`}
                          disabled={!canTakeAction}
                          onClick={async () => {
                            await takeActionOnThreat(selectedThreat.id);
                          }}
                        >
                          {actionLoading ? 'Working…' : selectedThreat.status === 'MITIGATED' ? 'Mitigated' : 'Take Action'}
                        </button>
                        <button onClick={() => selectThreat(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// 4. MAIN PAGE COMPONENT
// ============================================================================
// This component now acts as a layout container, assembling the smaller
// pieces. The core logic is handled by the Zustand store.

const SecurityCenter: React.FC = () => {
  const { loading, error, fetchSecurityData, addNewThreat, autoMitigateThreat, updateMetrics } = useSecurityStore();
  const [isLive, setIsLive] = React.useState(true);

  React.useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  // Real-time threat simulation
  React.useEffect(() => {
    if (!isLive || loading) return;

    // Add new threats randomly (every 5-15 seconds)
    const threatInterval = setInterval(() => {
      if (Math.random() > 0.4) { // 60% chance to add a new threat
        addNewThreat();
      }
    }, Math.random() * 10000 + 5000);

    // Auto-mitigate threats randomly (every 8-20 seconds)
    const mitigateInterval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to mitigate
        autoMitigateThreat();
      }
    }, Math.random() * 12000 + 8000);

    // Update metrics (every 3-6 seconds)
    const metricsInterval = setInterval(() => {
      updateMetrics();
    }, Math.random() * 3000 + 3000);

    return () => {
      clearInterval(threatInterval);
      clearInterval(mitigateInterval);
      clearInterval(metricsInterval);
    };
  }, [isLive, loading, addNewThreat, autoMitigateThreat, updateMetrics]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-6">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to Load Security Data</h2>
        <p className="text-gray-400">{error}</p>
        <button onClick={fetchSecurityData} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen font-sans">
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-700/50">
              <div>
                <h1 className="text-3xl font-bold text-white">Security Center</h1>
                <p className="text-gray-400 mt-1">Central hub for threat intelligence, monitoring, and response.</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                  <span className="text-sm text-gray-400">{isLive ? 'Live Monitoring' : 'Paused'}</span>
                </div>
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`px-4 py-2 rounded-lg transition-colors ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                >
                  {isLive ? 'Pause' : 'Resume'}
                </button>
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg">
                  <Settings className="w-5 h-5" />
                  <span>Manage Settings</span>
                </button>
              </div>
            </div>
            <SecurityMetricsOverview />
            <ThreatDistributionChart />
            <ThreatFilters />
            <ThreatsTable />
        </div>
        <ThreatDetailModal />
    </div>
  );
};

export default SecurityCenter;
