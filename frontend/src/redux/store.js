import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';
import accountingReducer from './slices/accountingSlice';
import orderReducer from './slices/orderSlice';
import tableReducer from './slices/tableSlice';
import menuReducer from './slices/menuSlice';
import customerReducer from './slices/customerSlice';

export const store = configureStore({
    reducer: {
        dashboard: dashboardReducer,
        accounting: accountingReducer,
        orders: orderReducer,
        tables: tableReducer,
        menu: menuReducer,
        customers: customerReducer,
    },
});
