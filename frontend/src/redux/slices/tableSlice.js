import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTables = createAsyncThunk('tables/fetchTables', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/tables');
        return response.data;
    } catch (error) {
        return rejectWithValue(error);
    }
});

const initialState = {
    items: [],
    status: 'idle',
    error: null,
};

const tableSlice = createSlice({
    name: 'tables',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTables.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchTables.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchTables.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Failed to fetch tables';
            });
    }
});

export default tableSlice.reducer;
