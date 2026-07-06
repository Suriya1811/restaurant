import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/customers');
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

const customerSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomers.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Failed to fetch customers';
            });
    }
});

export default customerSlice.reducer;
