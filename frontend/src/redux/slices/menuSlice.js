import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMenuItems = createAsyncThunk('menu/fetchMenuItems', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/products');
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

const menuSlice = createSlice({
    name: 'menu',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMenuItems.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchMenuItems.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchMenuItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Failed to fetch menu items';
            });
    }
});

export default menuSlice.reducer;
