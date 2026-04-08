import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { TrendingUp, AlertCircle, Activity, MapPin, Database, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalJunctions: 0,
    activeScanners: 0,
    avgCycleTime: 0,
    health: 0,
  });
  const [laneData, setLaneData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    database: 'checking',
    backend: 'checking',
    scanners: 'checking',
    api: 'checking',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setSystemStatus({
        database: 'checking',
        backend: 'checking',
        scanners: 'checking',
        api: 'checking',
      });

      try {
        const [{ data: junctions, error: junctionError }, { data: scanners, error: scannerError }, { data: cycles, error: cycleError }, { data: logs, error: logError }] = await Promise.all([
          supabase.from('traffic_junctions').select('id'),
          supabase.from('rfid_scanners').select('id,status'),
          supabase.from('traffic_cycles').select('total_cycle_time,lane_1_vehicle_count,lane_2_vehicle_count,lane_3_vehicle_count,lane_4_vehicle_count').order('id', { ascending: false }).limit(10),
          supabase.from('system_logs').select('timestamp,log_level,component,message').order('timestamp', { ascending: false }).limit(5),
        ]);

        if (cancelled) return;

        // Determine system statuses based on query results
        const databaseConnected = !junctionError && !scannerError && !cycleError && !logError;
        const backendOnline = !logError && logs && logs.length > 0;
        const scannersOperational = scanners && scanners.some(s => s.status === 'online');

        setSystemStatus({
          database: databaseConnected ? 'connected' : 'disconnected',
          backend: backendOnline ? 'online' : 'offline',
          scanners: scannersOperational ? 'operational' : 'idle',
          api: databaseConnected ? 'healthy' : 'unhealthy',
        });

        const totalJunctions = junctions?.length ?? 0;
        const totalScanners = scanners?.length ?? 0;
        const activeScanners = scanners?.filter((item) => item.status === 'online').length ?? 0;
        const avgCycleTime = cycles?.length ? Math.round(cycles.reduce((sum, item) => sum + (item.total_cycle_time ?? 0), 0) / cycles.length) : 0;
        const health = totalScanners ? Math.round((activeScanners / totalScanners) * 100) : 0;

        const latestCycle = cycles?.[0];
        const laneCounts = latestCycle ? [
          { lane: 'North Lane', volume: latestCycle.lane_1_vehicle_count ?? 0, color: 'from-blue-500 to-cyan-400' },
          { lane: 'South Lane', volume: latestCycle.lane_2_vehicle_count ?? 0, color: 'from-green-500 to-emerald-400' },
          { lane: 'East Lane', volume: latestCycle.lane_3_vehicle_count ?? 0, color: 'from-purple-500 to-pink-400' },
          { lane: 'West Lane', volume: latestCycle.lane_4_vehicle_count ?? 0, color: 'from-orange-500 to-red-400' },
        ] : [];

        setStats({ totalJunctions, activeScanners, avgCycleTime, health });
        setLaneData(laneCounts);
        setRecentActivity(logs ?? []);
      } catch (error) {
        console.error('Dashboard load error:', error);
        setSystemStatus({
          database: 'disconnected',
          backend: 'offline',
          scanners: 'idle',
          api: 'unhealthy',
        });
      }

      setLoading(false);
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = [
    {
      label: 'Total Junctions',
      value: stats.totalJunctions,
      icon: MapPin,
      detail: 'Loaded from traffic_junctions',
      color: 'from-blue-500 to-cyan-400',
      trend: '+2.5%',
    },
    {
      label: 'Active Scanners',
      value: stats.activeScanners,
      icon: Activity,
      detail: `${stats.health}% online`,
      color: 'from-green-500 to-emerald-400',
      trend: '+1.2%',
    },
    {
      label: 'Avg Cycle Time',
      value: `${stats.avgCycleTime}s`,
      icon: TrendingUp,
      detail: 'Average by recent cycles',
      color: 'from-purple-500 to-pink-400',
      trend: stats.avgCycleTime ? `~${stats.avgCycleTime}s` : 'N/A',
    },
    {
      label: 'System Health',
      value: `${stats.health}%`,
      icon: AlertCircle,
      detail: 'Scanner availability',
      color: 'from-orange-500 to-red-400',
      trend: stats.health >= 90 ? 'Excellent' : 'Moderate',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's your traffic management overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="flex flex-col justify-between min-h-[180px]">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                  <Icon className="text-white" size={24} />
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700/60 text-slate-300">{stat.trend}</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-2">{stat.detail}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Traffic Distribution by Lane">
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-400">Loading lane metrics...</p>
            ) : laneData.length ? (
              laneData.map((lane) => (
                <div key={lane.lane}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300">{lane.lane}</span>
                    <span className="text-sm font-semibold text-white">{lane.volume}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div className={`h-2 rounded-full bg-gradient-to-r ${lane.color}`} style={{ width: `${Math.min(100, lane.volume)}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No lane metrics found.</p>
            )}
          </div>
        </Card>

        <Card title="System Status Overview">
          <div className="space-y-4">
            {[
              { status: 'Backend Service', state: systemStatus.backend === 'online' ? 'Online' : 'Offline', color: systemStatus.backend === 'online' ? 'green' : 'red' },
              { status: 'Database', state: systemStatus.database === 'connected' ? 'Connected' : 'Disconnected', color: systemStatus.database === 'connected' ? 'green' : 'red' },
              { status: 'Traffic Scanner', state: systemStatus.scanners === 'operational' ? 'Operational' : 'Idle', color: systemStatus.scanners === 'operational' ? 'green' : 'yellow' },
              { status: 'API Gateway', state: systemStatus.api === 'healthy' ? 'Healthy' : 'Unhealthy', color: systemStatus.api === 'healthy' ? 'green' : 'red' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{item.status}</p>
                  <p className={`text-xs ${item.color === 'green' ? 'text-green-400' : item.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>{item.state}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${item.color === 'green' ? 'bg-green-500 animate-pulse' : item.color === 'yellow' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Recent Activity">
        <div className="space-y-3">
          {loading ? (
            <p className="text-slate-400">Loading recent system events...</p>
          ) : recentActivity.length ? (
            recentActivity.map((event, idx) => (
              <div key={idx} className="flex gap-3 p-3 border-l-2 border-blue-500/50 bg-slate-800/30 rounded">
                <div className="text-xs text-slate-400 whitespace-nowrap pt-0.5">{new Date(event.timestamp).toLocaleString()}</div>
                <div>
                  <p className="text-sm text-slate-300">{event.message}</p>
                  <p className="text-xs text-slate-500">{event.component}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No recent activity found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}