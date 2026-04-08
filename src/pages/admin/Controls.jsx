import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Save, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Controls() {
  const [config, setConfig] = useState({
    totalCycleTime: '',
    lane1GreenTime: '',
    lane2GreenTime: '',
    lane3GreenTime: '',
    lane4GreenTime: '',
  });
  const [stats, setStats] = useState({
    totalJunctions: 0,
    totalScanners: 0,
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadControlData() {
      setLoading(true);
      const [{ data: cycles }, { data: junctions }, { data: scanners }] = await Promise.all([
        supabase
          .from('traffic_cycles')
          .select('id,total_cycle_time,lane_1_green_time,lane_2_green_time,lane_3_green_time,lane_4_green_time,cycle_start_time')
          .order('id', { ascending: false })
          .limit(1),
        supabase.from('traffic_junctions').select('id'),
        supabase.from('rfid_scanners').select('id'),
      ]);

      if (cancelled) return;

      const latestCycle = cycles?.[0] ?? null;
      setConfig({
        totalCycleTime: latestCycle?.total_cycle_time ?? '',
        lane1GreenTime: latestCycle?.lane_1_green_time ?? '',
        lane2GreenTime: latestCycle?.lane_2_green_time ?? '',
        lane3GreenTime: latestCycle?.lane_3_green_time ?? '',
        lane4GreenTime: latestCycle?.lane_4_green_time ?? '',
      });
      setStats({
        totalJunctions: junctions?.length ?? 0,
        totalScanners: scanners?.length ?? 0,
        lastUpdated: latestCycle?.cycle_start_time ?? null,
      });
      setLoading(false);
    }

    loadControlData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInput = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const lanes = [
    { name: 'North Lane', field: 'lane1GreenTime', icon: '↑' },
    { name: 'South Lane', field: 'lane2GreenTime', icon: '↓' },
    { name: 'East Lane', field: 'lane3GreenTime', icon: '→' },
    { name: 'West Lane', field: 'lane4GreenTime', icon: '←' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
          Global Traffic Controls
        </h1>
        <p className="text-slate-400">Configure system-wide traffic signal parameters and timing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Cycle Time Configuration" className="flex flex-col">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Global Cycle Time</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={config.totalCycleTime}
                    onChange={(e) => handleInput('totalCycleTime', e.target.value)}
                    className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                  <div className="flex items-center text-slate-400 bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-700/50">
                    <span className="text-sm font-medium">seconds</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Latest cycle time loaded from traffic_cycles.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">North Green Time</label>
                  <input
                    type="number"
                    value={config.lane1GreenTime}
                    onChange={(e) => handleInput('lane1GreenTime', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">South Green Time</label>
                  <input
                    type="number"
                    value={config.lane2GreenTime}
                    onChange={(e) => handleInput('lane2GreenTime', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Lane Timing Configuration">
            <div className="space-y-6">
              {lanes.map((lane) => (
                <div key={lane.name} className="pb-6 border-b border-slate-700/50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                      {lane.icon}
                    </div>
                    <span className="text-sm font-semibold text-white">{lane.name}</span>
                  </div>
                  <input
                    type="number"
                    value={config[lane.field]}
                    onChange={(e) => handleInput(lane.field, e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Actions" className="flex flex-col gap-4">
            <Button disabled={loading} className="w-full flex items-center justify-center gap-2">
              <Save size={18} />
              Save Configuration
            </Button>
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
              <RotateCcw size={18} />
              Reset to Default
            </Button>
          </Card>

          <Card title="System Info">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Last Updated</p>
                <p className="text-white font-medium">{stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Loading...'}</p>
              </div>
              <div className="border-t border-slate-700/50 pt-3">
                <p className="text-slate-400 mb-1">Total Junctions</p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{loading ? '...' : stats.totalJunctions}</p>
              </div>
              <div className="border-t border-slate-700/50 pt-3">
                <p className="text-slate-400 mb-1">Connected Scanners</p>
                <p className="text-white font-medium">{loading ? '...' : stats.totalScanners}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
