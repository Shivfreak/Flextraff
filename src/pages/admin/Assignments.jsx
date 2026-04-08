import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Table from '../../components/Table';
import { MapPin, Users, Link as LinkIcon, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Assignments() {
  const [users, setUsers] = useState([]);
  const [junctions, setJunctions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: '', junctionId: '' });
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: usersData, error: usersError },
        { data: junctionsData, error: junctionsError },
        { data: assignmentsData, error: assignmentsError },
      ] = await Promise.all([
        supabase
          .from('people')
          .select('id,username,role')
          .eq('role', 'user'),
        supabase
          .from('traffic_junctions')
          .select('id,junction_name,location'),
        supabase
          .from('junction_assignments')
          .select(
            'id,person_id,junction_id,assigned_by,assigned_at,person:people!junction_assignments_person_id_fkey(username),assigned_by_user:people!junction_assignments_assigned_by_fkey(username),traffic_junctions(junction_name)'
          )
          .order('assigned_at', { ascending: false }),
      ]);

      if (usersError || junctionsError || assignmentsError) {
        const combined = [usersError, junctionsError, assignmentsError].filter(Boolean).map((e) => e.message).join(' | ');
        setMessage({ type: 'error', text: combined || 'Failed to load data' });
      }

      setUsers(usersData ?? []);
      setJunctions(junctionsData ?? []);
      setAssignments(assignmentsData ?? []);
    } catch (error) {
      console.error('Failed to load data:', error.message);
      setMessage({ type: 'error', text: 'Failed to load data' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.userId || !form.junctionId) {
      setMessage({ type: 'error', text: 'Please select both a user and a junction.' });
      return;
    }

    setSaving(true);

    const userId = parseInt(form.userId);
    const junctionId = parseInt(form.junctionId);

    // Schema in db_setup.sql is 1 user ↔ 1 junction (unique person_id and junction_id).
    // Always delete existing rows in DB (don't rely on local state which can be stale).
    const { error: deleteError } = await supabase
      .from('junction_assignments')
      .delete()
      .or(`person_id.eq.${userId},junction_id.eq.${junctionId}`);

    if (deleteError) {
      setMessage({ type: 'error', text: `Error clearing existing assignment: ${deleteError.message}` });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('junction_assignments').insert([
      {
        person_id: userId,
        junction_id: junctionId,
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: `Unable to assign junction: ${error.message}` });
      console.error('Assign error:', error);
    } else {
      setMessage({ type: 'success', text: 'Junction assigned successfully.' });
      setForm({ userId: '', junctionId: '' });
      await loadData();
    }

    setSaving(false);
  };

  const handleUnassign = async (assignmentId) => {
    const confirmed = window.confirm('Remove this junction assignment?');
    if (!confirmed) return;

    setSaving(true);
    const { error } = await supabase
      .from('junction_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      setMessage({ type: 'error', text: `Unable to remove assignment: ${error.message}` });
      console.error('Delete error:', error);
    } else {
      setMessage({ type: 'success', text: 'Assignment removed successfully.' });
      await loadData();
    }

    setSaving(false);
  };

  const columns = [
    { header: 'User', accessor: 'person', render: (value) => value?.username || 'N/A' },
    { header: 'Junction', accessor: 'traffic_junctions', render: (value) => value?.junction_name || 'N/A' },
    {
      header: 'Actions',
      accessor: 'id',
      render: (value) => (
        <button
          onClick={() => handleUnassign(value)}
          className="text-red-400 hover:text-red-300 transition"
          title="Remove assignment"
        >
          <Trash2 size={18} />
        </button>
      ),
    },
  ];

  const getUserJunction = (userId) => {
    const assignment = assignments.find((a) => a.person_id === userId);
    return assignment?.traffic_junctions?.junction_name || 'Not assigned';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 flex items-center gap-3">
          <LinkIcon size={32} />
          Junction Assignments
        </h1>
        <p className="text-slate-400">Assign individual junctions to users for monitoring and control.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <LinkIcon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Assign a junction to a user. Each user can have one junction, and each junction can be assigned to one user.</p>
            </div>
          </div>

          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select User</label>
              <select
                value={form.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
              >
                <option value="">-- Choose a user --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Junction</label>
              <select
                value={form.junctionId}
                onChange={(e) => handleChange('junctionId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
              >
                <option value="">-- Choose a junction --</option>
                {junctions.map((junction) => (
                  <option key={junction.id} value={junction.id}>
                    {junction.junction_name} ({junction.location})
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div className={`rounded-3xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-rose-300'}`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Assigning...' : 'Assign Junction'}
            </Button>
          </form>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Current Assignments</h2>
              <p className="text-sm text-slate-400">All active junction assignments.</p>
            </div>
            <span className="text-sm px-3 py-1 rounded-full bg-slate-800/50 text-slate-300">
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Table columns={columns} data={assignments} loading={loading} />
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">User Junction Overview</h2>
            <p className="text-sm text-slate-400">Quick reference of which junction each user is assigned to.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-slate-400">Loading user assignments...</p>
          ) : users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} className="text-blue-400" />
                  <p className="text-sm font-medium text-white">{user.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-400" />
                  <p className="text-sm text-slate-300">{getUserJunction(user.id)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No regular users available.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
