import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import { FileText, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_logs')
        .select('id,timestamp,log_level,component,message')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!cancelled) {
        if (error) {
          console.error('Failed to load logs:', error.message);
          setLogs([]);
        } else {
          setLogs(data ?? []);
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
    {
      header: 'Time',
      accessor: 'timestamp',
      render: (timestamp) => <span className="text-blue-400 font-medium text-sm">{new Date(timestamp).toLocaleString()}</span>,
    },
    {
      header: 'Level',
      accessor: 'log_level',
      render: (level) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          level === 'INFO' ? 'bg-blue-500/20 text-blue-400' :
          level === 'ERROR' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>{level}</span>
      ),
    },
    { header: 'Component', accessor: 'component' },
    { header: 'Message', accessor: 'message' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6 flex-col lg:flex-row">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 flex items-center gap-3">
            <FileText size={32} className="text-blue-400" />
            System Logs
          </h1>
          <p className="text-slate-400">Monitor system events and activities directly from your database.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-300">
          <Filter size={16} className="text-blue-400" />
          <select className="bg-transparent outline-none text-sm">
            <option>All Levels</option>
            <option>INFO</option>
            <option>ERROR</option>
            <option>WARNING</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-300">
          <select className="bg-transparent outline-none text-sm w-full">
            <option>All Components</option>
            <option>startup</option>
            <option>traffic_calculator</option>
            <option>shutdown</option>
          </select>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={logs} loading={loading} />
      </Card>
    </div>
  );
}