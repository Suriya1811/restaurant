import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const accountingSlice = createSlice({
    name: 'accounting',
    initialState: {
        ledgers: [],
        vouchers: [],
        transactions: [],
        loading: false,
        error: null,
    },
    reducers: {
        setLedgers: (state, action) => {
            state.ledgers = action.payload;
        },
        addVoucher: (state, action) => {
            state.vouchers.unshift(action.payload);
        }
    },
});

export const { setLedgers, addVoucher } = accountingSlice.actions;
export default accountingSlice.reducer;
