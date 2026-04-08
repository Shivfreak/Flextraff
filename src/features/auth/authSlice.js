import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';

export const loginAsync = createAsyncThunk(
  'auth/loginAsync',
  async ({ username, password, selectedRole }, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .or(`username.eq.${username},user_id.eq.${username}`)
      .maybeSingle();

    if (error || !data) {
      const message = error?.message || 'Invalid credentials. Check username and password.';
      return rejectWithValue(message);
    }

    if (data.is_active === false) {
      return rejectWithValue('This account is not active. Contact your administrator.');
    }

    const storedPassword = data.password ?? data.password_hash ?? '';
    if (!storedPassword || storedPassword !== password) {
      return rejectWithValue('Invalid credentials. Check username and password.');
    }

    if (selectedRole && data.role !== selectedRole) {
      return rejectWithValue(`This account is registered as "${data.role}". Please select the correct panel.`);
    }

    let assignedJunctionId = null;
    let assignedJunction = null;

    if (data.role === 'user') {
      const { data: assignment, error: assignmentError } = await supabase
        .from('junction_assignments')
        .select('junction_id,traffic_junctions(id,junction_name,location,status,latitude,longitude)')
        .eq('person_id', data.id)
        .maybeSingle();

      if (!assignmentError && assignment) {
        assignedJunctionId = assignment.junction_id;
        assignedJunction = assignment.traffic_junctions ?? null;
      }
    }

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
      assignedJunctionId,
      assignedJunction,
    };
  }
);

const initialState = {
  isAuthenticated: false,
  role: null,
  user: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.role = action.payload.role;
        state.user = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.role = null;
        state.user = null;
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;