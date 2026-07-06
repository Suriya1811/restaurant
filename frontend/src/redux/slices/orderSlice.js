import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/orders');
        return response.data;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const createOrder = createAsyncThunk('orders/createOrder', async (orderData, { rejectWithValue }) => {
    try {
        const response = await api.post('/orders', orderData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const updateOrder = createAsyncThunk('orders/updateOrder', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/orders/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const generateBillFromOrder = createAsyncThunk('orders/generateBill', async (id, { rejectWithValue }) => {
    try {
        const response = await api.post(`/orders/${id}/bill`);
        return response.data; // This is a new bill object
    } catch (error) {
        return rejectWithValue(error);
    }
});

const initialState = {
    items: [],
    status: 'idle',
    error: null,
};

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrders.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Failed to fetch orders';
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(updateOrder.fulfilled, (state, action) => {
                const index = state.items.findIndex(o => o._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(generateBillFromOrder.fulfilled, (state, action) => {
                // The API returned a Bill. Let's update the Order status locally too
                const orderId = action.meta.arg;
                const index = state.items.findIndex(o => o._id === orderId);
                if (index !== -1) {
                    state.items[index].status = 'BILLED';
                    state.items[index].bill_id = action.payload._id;
                }
            });
    }
});

export default orderSlice.reducer;
