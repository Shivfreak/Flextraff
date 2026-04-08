import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import { ScanLine, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Scanners() {
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadScanners() {
      setLoading(true);
      const { data, error } = await supabase
        .from('rfid_scanners')
        .select('id,scanner_mac_address,scanner_position,last_heartbeat,status')
        .order('id', { ascending: false });

      if (!cancelled) {
        if (error) {
          console.error('Failed to load scanners:', error.message);
          setScanners([]);
        } else {
          setScanners(data ?? []);
        }
        setLoading(false);
      }
    }

    loadScanners();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'MAC Address', accessor: 'scanner_mac_address' },
    { header: 'Position/Lane', accessor: 'scanner_position' },
    { header: 'Last Heartbeat', accessor: 'last_heartbeat' },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'online' ? 'bg-green-500 animate-pulse' :
            status === 'offline' ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`}></div>
          <span className="capitalize text-sm font-medium">{status ?? 'unknown'}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      render: () => (
        <Button variant="secondary" className="px-3 py-1 text-xs">Configure</Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 flex items-center gap-3">
            <ScanLine size={32} className="text-blue-400" />
            Traffic Scanners
          </h1>
          <p className="text-slate-400">Manage and monitor all vehicle detection sensors.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={18} />
          Add Scanner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-slate-400 text-sm mb-1">Total Scanners</p>
          <p className="text-3xl font-bold text-white">{scanners.length}</p>
          <p className="text-xs text-slate-400 mt-2">Loaded from rfid_scanners</p>
        </Card>
        <Card>
          <p className="text-slate-400 text-sm mb-1">Online</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{scanners.filter((item) => item.status === 'online').length}</p>
          <p className="text-xs text-slate-400 mt-2">Currently active</p>
        </Card>
        <Card>
          <p className="text-slate-400 text-sm mb-1">Last Heartbeat</p>
          <p className="text-3xl font-bold text-white">{scanners[0]?.last_heartbeat ? new Date(scanners[0].last_heartbeat).toLocaleString() : 'N/A'}</p>
          <p className="text-xs text-slate-400 mt-2">Most recent connection</p>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={scanners} loading={loading} />
      </Card>
    </div>
  );
}