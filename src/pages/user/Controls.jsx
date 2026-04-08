import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { AlertTriangle, Zap, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function UserControls() {
  const [cycle, setCycle] = useState(null);
  const [overrideCount, setOverrideCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    let cancelled = false;

    async function loadUserControls() {
      setLoading(true);

      if (!user?.assignedJunctionId) {
        setCycle(null);
        setOverrideCount(0);
        setHistory([]);
        setLoading(false);
        return;
      }

      const [{ data: cycles, error: cycleError }, { data: logs, error: logError }] = await Promise.all([
        supabase
          .from('traffic_cycles')
          .select('id,total_cycle_time,status,cycle_start_time')
          .eq('junction_id', user.assignedJunctionId)
          .order('cycle_start_time', { ascending: false })
          .limit(1),
        supabase
          .from('system_logs')
          .select('id,message,component,log_level,metadata,timestamp')
          .eq('junction_id', user.assignedJunctionId)
          .order('timestamp', { ascending: false })
          .limit(100),
      ]);

      if (cancelled) return;
      if (cycleError || logError) {
        console.error('Failed to load user controls:', cycleError ?? logError);
      }

      setCycle(cycles?.[0] ?? null);
      setHistory(logs ?? []);
      setOverrideCount(
        logs?.filter((entry) => entry.message?.toLowerCase().includes('override') || entry.metadata?.action === 'override').length ??
          0
      );
      setLoading(false);
    }

    loadUserControls();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const logAction = async (payload) => {
    if (!user?.assignedJunctionId) {
      setMessage({ type: 'error', text: 'No junction assigned to your account.' });
      return false;
    }

    setActionLoading(true);
    setMessage(null);

    const { error } = await supabase.from('system_logs').insert([
      {
        junction_id: user.assignedJunctionId,
        log_level: 'INFO',
        component: 'user_controls',
        message: payload.message,
        metadata: payload.metadata ?? null,
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setActionLoading(false);
      return false;
    }

    setMessage({ type: 'success', text: 'Action sent.' });
    await refreshLogs();
    setActionLoading(false);
    return true;
  };

  const refreshLogs = async () => {
    if (!user?.assignedJunctionId) return;
    const { data, error } = await supabase
      .from('system_logs')
      .select('id,message,component,log_level,metadata,timestamp')
      .eq('junction_id', user.assignedJunctionId)
      .order('timestamp', { ascending: false })
      .limit(100);
    if (error) {
      console.error('Failed to refresh logs:', error);
      return;
    }
    setHistory(data ?? []);
    setOverrideCount(
      data?.filter((entry) => entry.message?.toLowerCase().includes('override') || entry.metadata?.action === 'override').length ??
        0
    );
  };

  const laneLabelToNumber = (laneLabel) => {
    const normalized = laneLabel.toLowerCase();
    if (normalized.includes('north')) return 1;
    if (normalized.includes('south')) return 2;
    if (normalized.includes('east')) return 3;
    if (normalized.includes('west')) return 4;
    return null;
  };

  const getLaneLight = (laneNumber) => {
    // history is loaded newest → oldest; first relevant action wins
    for (const entry of history ?? []) {
      const action = entry?.metadata?.action;

      if (action === 'set_all_red') {
        return { label: 'Red', dotClass: 'bg-red-500', pillClass: 'bg-red-500/10 text-red-300 border-red-500/30' };
      }

      if (action === 'override' && entry?.metadata?.lane === laneNumber) {
        const mode = entry?.metadata?.mode;
        if (mode === 'force_green') {
          return { label: 'Green', dotClass: 'bg-green-500', pillClass: 'bg-green-500/10 text-green-300 border-green-500/30' };
        }
        if (mode === 'force_red') {
          return { label: 'Red', dotClass: 'bg-red-500', pillClass: 'bg-red-500/10 text-red-300 border-red-500/30' };
        }
        return { label: 'Override', dotClass: 'bg-amber-400', pillClass: 'bg-amber-400/10 text-amber-200 border-amber-400/30' };
      }

      if (action === 'reset_all' || action === 'ai_adaptive') {
        return { label: 'Adaptive', dotClass: 'bg-cyan-400', pillClass: 'bg-cyan-400/10 text-cyan-200 border-cyan-400/30' };
      }
    }

    return { label: 'Unknown', dotClass: 'bg-slate-500', pillClass: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
          Local Controls
        </h1>
        <p className="text-slate-400">Emergency overrides and manual signal control for your junction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-500/10 to-slate-900/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-400" size={28} />
                <div>
                  <h3 className="text-lg font-semibold text-white">Emergency Controls</h3>
                  <p className="text-sm text-slate-400">Only use in emergency situations.</p>
                </div>
              </div>
              <div className="text-right text-sm text-slate-400">
                <p>Latest cycle</p>
                <p className="text-white font-medium">{cycle?.total_cycle_time ? `${cycle.total_cycle_time}s` : 'Loading...'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="danger"
                className="py-4 flex items-center justify-center gap-2 text-base"
                disabled={actionLoading || loading}
                onClick={() =>
                  logAction({
                    message: 'Emergency override: set all signals RED',
                    metadata: { action: 'set_all_red' },
                  })
                }
              >
                <AlertTriangle size={20} />
                {actionLoading ? 'Sending...' : 'Set All Red'}
              </Button>
              <Button
                className="py-4 flex items-center justify-center gap-2 text-base bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
                disabled={actionLoading || loading}
                onClick={() =>
                  logAction({
                    message: 'Mode change: AI adaptive enabled',
                    metadata: { action: 'ai_adaptive' },
                  })
                }
              >
                <Zap size={20} />
                {actionLoading ? 'Sending...' : 'AI Adaptive'}
              </Button>
            </div>
          </Card>

          <Card title="Manual Lane Control">
            <p className="text-sm text-slate-400 mb-6 pb-6 border-b border-slate-700/50">
              Force green or red signals for individual lanes.
            </p>

            <div className="space-y-4">
              {['North Lane', 'South Lane', 'East Lane', 'West Lane'].map((lane) => (
                <div key={lane} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 hover:border-slate-600 transition">
                  <div>
                    <p className="text-white font-medium">{lane}</p>
                    {(() => {
                      const laneNumber = laneLabelToNumber(lane);
                      const light = laneNumber ? getLaneLight(laneNumber) : getLaneLight(null);
                      return (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${light.dotClass}`} />
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${light.pillClass}`}>{light.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="bg-green-900/50 text-green-400 border border-green-500/50 hover:bg-green-900/70 px-3 py-2 text-sm"
                      disabled={actionLoading || loading}
                      onClick={() => {
                        const laneNumber = laneLabelToNumber(lane);
                        return logAction({
                          message: `Override: force GREEN for ${lane}`,
                          metadata: { action: 'override', mode: 'force_green', lane: laneNumber, lane_label: lane },
                        });
                      }}
                    >
                      {actionLoading ? 'Sending...' : 'Force Green'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-red-900/50 text-red-400 border border-red-500/50 hover:bg-red-900/70 px-3 py-2 text-sm"
                      disabled={actionLoading || loading}
                      onClick={() => {
                        const laneNumber = laneLabelToNumber(lane);
                        return logAction({
                          message: `Override: force RED for ${lane}`,
                          metadata: { action: 'override', mode: 'force_red', lane: laneNumber, lane_label: lane },
                        });
                      }}
                    >
                      {actionLoading ? 'Sending...' : 'Force Red'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="System Status">
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Authorization</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Authorized
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Last Cycle Status</p>
                <p className="text-white font-semibold">{cycle?.status ?? 'Loading...'}</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Override Count</p>
                <p className="text-white font-semibold">{loading ? 'Loading...' : overrideCount}</p>
                <p className="text-xs text-slate-400 mt-1">Last 100 log entries</p>
              </div>
            </div>
          </Card>

          <Card title="Actions">
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
                disabled={actionLoading || loading}
                onClick={() =>
                  logAction({
                    message: 'Reset requested: clear overrides / return to normal operation',
                    metadata: { action: 'reset_all' },
                  })
                }
              >
                <RotateCcw size={16} />
                {actionLoading ? 'Sending...' : 'Reset All'}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  await refreshLogs();
                  setShowHistory(true);
                }}
              >
                View History
              </Button>
            </div>
          </Card>

          {message && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-rose-300'}`}>
              {message.text}
            </div>
          )}

          {showHistory && (
            <Card title="Recent Actions">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400">Latest 20 log entries for your junction</p>
                <button className="text-xs text-slate-300 hover:text-white" onClick={() => setShowHistory(false)}>
                  Close
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {(history ?? []).slice(0, 20).map((entry) => (
                  <div key={entry.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-sm text-white">{entry.message ?? '—'}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                      {entry.metadata?.mode ? ` • ${entry.metadata.mode}` : ''}
                      {entry.metadata?.lane ? ` • lane ${entry.metadata.lane}` : ''}
                    </p>
                  </div>
                ))}
                {(!history || history.length === 0) && <p className="text-sm text-slate-400">No log entries found.</p>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
