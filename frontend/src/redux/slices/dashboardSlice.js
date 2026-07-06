import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDashboardStats = createAsyncThunk(
    'dashboard/fetchStats',
    async (_, { getState }) => {
        const { auth } = getState(); // Assuming auth state is here too
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/reports/dashboard`);
        return response.data.data;
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        stats: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export default dashboardSlice.reducer;
