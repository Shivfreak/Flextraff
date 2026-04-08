import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import { Plus, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const defaultForm = {
  junction_name: '',
  location: '',
  latitude: '',
  longitude: '',
  status: 'active',
};

export default function Junctions() {
  const [junctions, setJunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedJunction, setSelectedJunction] = useState(null);
  const [message, setMessage] = useState(null);

  const loadJunctions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('traffic_junctions')
      .select('id,junction_name,location,latitude,longitude,status')
      .order('id', { ascending: false });

    if (error) {
      console.error('Failed to load junctions:', error.message);
      setJunctions([]);
    } else {
      setJunctions(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!cancelled) {
        await loadJunctions();
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setSelectedJunction(null);
    setMessage(null);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.junction_name.trim() || !form.location.trim()) {
      setMessage({ type: 'error', text: 'Name and location are required.' });
      return;
    }

    setSaving(true);

    const payload = {
      junction_name: form.junction_name.trim(),
      location: form.location.trim(),
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      status: form.status,
    };

    if (selectedJunction) {
      const { data, error } = await supabase
        .from('traffic_junctions')
        .update(payload)
        .eq('id', selectedJunction.id)
        .select();

      if (error) {
        setMessage({ type: 'error', text: `Unable to update junction: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Junction updated successfully.' });
        await loadJunctions();
        resetForm();
      }
    } else {
      const { data, error } = await supabase
        .from('traffic_junctions')
        .insert([payload])
        .select();

      if (error) {
        setMessage({ type: 'error', text: `Unable to add junction: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Junction added successfully.' });
        await loadJunctions();
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleEdit = (junction) => {
    setSelectedJunction(junction);
    setForm({
      junction_name: junction.junction_name ?? '',
      location: junction.location ?? '',
      latitude: junction.latitude ?? '',
      longitude: junction.longitude ?? '',
      status: junction.status ?? 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (junction) => {
    const confirmed = window.confirm(`Delete junction "${junction.junction_name}"?`);
    if (!confirmed) return;

    setSaving(true);
    const { error } = await supabase
      .from('traffic_junctions')
      .delete()
      .eq('id', junction.id);

    if (error) {
      setMessage({ type: 'error', text: `Unable to delete junction: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Junction deleted successfully.' });
      await loadJunctions();
      if (selectedJunction?.id === junction.id) {
        resetForm();
      }
    }
    setSaving(false);
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'junction_name' },
    { header: 'Location', accessor: 'location' },
    {
      header: 'Coordinates',
      accessor: 'coords',
      render: (_, row) => `${row.latitude ?? '-'}, ${row.longitude ?? '-'}`,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="capitalize text-sm font-medium">{status ?? 'unknown'}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button type="button" variant="danger" className="px-3 py-1 text-xs" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const activeCount = junctions.filter((j) => j.status === 'active').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 flex items-center gap-3">
            <MapPin size={32} className="text-blue-400" />
            Traffic Junctions
          </h1>
          <p className="text-slate-400">Manage all traffic intersections and signal points.</p>
        </div>
        <Button onClick={resetForm} className="flex items-center gap-2">
          <Plus size={18} />
          {selectedJunction ? 'New Junction' : 'Add Junction'}
        </Button>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr] xl:grid-cols-[1.4fr,1fr]">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">{selectedJunction ? 'Edit Junction' : 'Add Junction'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Junction Name</label>
                <input
                  value={form.junction_name}
                  onChange={(e) => handleChange('junction_name', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                  placeholder="Enter junction name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                  placeholder="City, street or area"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
                  <input
                    value={form.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                    placeholder="12.3456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
                  <input
                    value={form.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                    placeholder="-98.7654"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {message && (
                <div className={`rounded-3xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-rose-300'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? (selectedJunction ? 'Saving...' : 'Adding...') : selectedJunction ? 'Update Junction' : 'Create Junction'}
                </Button>
                {selectedJunction && (
                  <Button type="button" variant="secondary" onClick={resetForm} className="w-full sm:w-auto">
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-900/50 p-5 border border-slate-700/50">
              <p className="text-sm text-slate-400">Total Junctions</p>
              <p className="text-3xl font-bold text-white mt-2">{junctions.length}</p>
              <p className="text-xs text-slate-500 mt-2">Loaded directly from traffic_junctions.</p>
            </div>
            <div className="rounded-3xl bg-slate-900/50 p-5 border border-slate-700/50">
              <p className="text-sm text-slate-400">Active Now</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mt-2">{activeCount}</p>
              <p className="text-xs text-slate-500 mt-2">{junctions.length > 0 ? `${Math.round((activeCount / junctions.length) * 100)}% online` : 'No data available'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={junctions} loading={loading} />
      </Card>
    </div>
  );
}
