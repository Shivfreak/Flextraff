import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import { FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function UserLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_logs')
        .select('timestamp,log_level,component,message')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (!cancelled) {
        if (error) {
          console.error('Failed to load user logs:', error.message);
          setLogs([]);
        } else {
          setLogs((data ?? []).map((item) => ({
            time: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown',
            event: item.component,
            details: item.message,
          })));
        }
        setLoading(false);
      }
    }

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = [
    { header: 'Timestamp', accessor: 'time', render: (time) => <span className="text-blue-400 font-medium text-sm">{time}</span> },
    { header: 'Event', accessor: 'event', render: (event) => <span className="font-medium text-white">{event}</span> },
    { header: 'Details', accessor: 'details' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 flex items-center gap-3">
          <FileText size={32} className="text-blue-400" />
          Activity Logs
        </h1>
        <p className="text-slate-400">Monitor all events and changes for your junction.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-slate-400 text-sm mb-1">Recent Events</p>
          <p className="text-3xl font-bold text-white">{logs.length}</p>
          <p className="text-xs text-slate-400 mt-2">Loaded from system_logs</p>
        </Card>
        <Card>
          <p className="text-slate-400 text-sm mb-1">Latest Event</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{logs[0]?.event ?? 'N/A'}</p>
          <p className="text-xs text-slate-400 mt-2">Most recent log entry</p>
        </Card>
        <Card>
          <p className="text-slate-400 text-sm mb-1">Last Logged</p>
          <p className="text-3xl font-bold text-white">{logs[0]?.time ?? 'N/A'}</p>
          <p className="text-xs text-slate-400 mt-2">Time of latest entry</p>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={logs} loading={loading} />
      </Card>
    </div>
  );
}