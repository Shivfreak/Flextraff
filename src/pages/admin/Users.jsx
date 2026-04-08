import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Table from '../../components/Table';
import { UserPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [message, setMessage] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('people')
      .select('id,user_id,username,email,role,is_active,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load users:', error.message);
      setUsers([]);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setMessage({ type: 'error', text: 'Username, email, and password are required.' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('people').insert([
      {
        user_id: form.username.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        is_active: true,
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: `Unable to add user: ${error.message}` });
      console.error('Create user error:', error);
    } else {
      setMessage({ type: 'success', text: 'User added successfully.' });
      setForm({ username: '', email: '', password: '', role: 'user' });
      await loadUsers();
    }

    setSaving(false);
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Active', accessor: 'is_active', render: (value) => (value ? 'Yes' : 'No') },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (value) => (value ? new Date(value).toLocaleString() : '-'),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 flex items-center gap-3">
            <UserPlus size={32} />
            Manage Users
          </h1>
          <p className="text-slate-400">Add new users and view user records stored in the database.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Admin can create users with assigned roles and passwords.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                placeholder="example_user"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                placeholder="Set a password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
              <select
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {message && (
              <div className={`rounded-3xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-rose-300'}`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Creating user...' : 'Create User'}
            </Button>
          </form>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Current Users</h2>
              <p className="text-sm text-slate-400">Loaded from your database's users table.</p>
            </div>
          </div>
          <Table columns={columns} data={users} loading={loading} />
        </Card>
      </div>
    </div>
  );
}
