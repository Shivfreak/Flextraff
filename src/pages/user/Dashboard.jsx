import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/Card';
import { AlertCircle, Activity, Clock, Navigation, Gauge } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function UserDashboard() {
  const [junction, setJunction] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    let cancelled = false;

    async function loadUserDashboard() {
      setLoading(true);

      if (!user?.assignedJunctionId) {
        setJunction(null);
        setCycle(null);
        setLoading(false);
        return;
      }

      const [{ data: junction, error: junctionError }, { data: cycles, error: cycleError }] = await Promise.all([
        supabase
          .from('traffic_junctions')
          .select('id,junction_name,location,status')
          .eq('id', user.assignedJunctionId)
          .single(),
        supabase
          .from('traffic_cycles')
          .select('cycle_start_time,total_cycle_time,lane_1_green_time,lane_2_green_time,lane_3_green_time,lane_4_green_time,lane_1_vehicle_count,lane_2_vehicle_count,lane_3_vehicle_count,lane_4_vehicle_count,status')
          .eq('junction_id', user.assignedJunctionId)
          .order('cycle_start_time', { ascending: false })
          .limit(1),
      ]);

      if (cancelled) return;
      if (junctionError || cycleError) {
        console.error('Failed to load user dashboard:', junctionError ?? cycleError);
      }

      setJunction(junction ?? null);
      setCycle(cycles?.[0] ?? null);
      setLoading(false);
    }

    loadUserDashboard();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const laneMetrics = cycle ? [
    { lane: 'North', vehicles: cycle.lane_1_vehicle_count ?? 0, greenTime: cycle.lane_1_green_time ?? 0 },
    { lane: 'South', vehicles: cycle.lane_2_vehicle_count ?? 0, greenTime: cycle.lane_2_green_time ?? 0 },
    { lane: 'East', vehicles: cycle.lane_3_vehicle_count ?? 0, greenTime: cycle.lane_3_green_time ?? 0 },
    { lane: 'West', vehicles: cycle.lane_4_vehicle_count ?? 0, greenTime: cycle.lane_4_green_time ?? 0 },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">Junction Dashboard</h1>
        <p className="text-slate-400">Real-time traffic monitoring for your assigned junction.</p>
      </div>

      <Card className="border-l-4 border-l-blue-500">
        {loading ? (
          <p className="text-slate-400">Loading dashboard data...</p>
        ) : junction ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Junction Name</p>
              <p className="text-2xl font-bold text-white">{junction.junction_name}</p>
              <p className="text-xs text-slate-500 mt-1">{junction.location ?? 'Location unavailable'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Current Status</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                {junction.status ?? 'Unknown'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Live junction status</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Current Cycle</p>
              <p className="text-2xl font-bold text-white">{cycle?.total_cycle_time ? `${cycle.total_cycle_time}s` : 'N/A'}</p>
              <p className="text-xs text-slate-500 mt-1">Total cycle duration</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Phase</p>
              <p className="text-2xl font-bold text-white">{cycle?.status ?? 'Unknown'}</p>
              <p className="text-xs text-slate-500 mt-1">Current traffic phase</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400">No junction data available.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Traffic Flow by Lane">
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-400">Loading lane flow...</p>
            ) : laneMetrics.length ? (
              laneMetrics.map((lane) => (
                <div key={lane.lane} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Navigation size={18} className="text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{lane.lane} Lane</p>
                      <p className="text-xs text-slate-400">Green time: {lane.greenTime}s</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{lane.vehicles}</p>
                    <p className="text-xs text-slate-400">vehicles</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No lane data found.</p>
            )}
          </div>
        </Card>

        <Card title="Signal Status">
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-400">Loading signal status...</p>
            ) : [
              { label: 'Next Cycle', value: cycle?.total_cycle_time ? `${cycle.total_cycle_time}s` : 'N/A' },
              { label: 'Current Phase', value: cycle?.status ?? 'Unknown' },
              { label: 'Last Updated', value: cycle?.cycle_start_time ? new Date(cycle.cycle_start_time).toLocaleTimeString() : 'Unknown' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-lg font-bold text-white">{item.value}</p>
                </div>
                <Gauge size={24} className="text-slate-500/50" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}