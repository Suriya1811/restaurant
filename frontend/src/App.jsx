import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { AuthProvider, useAuth } from './context/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const RegisterRestaurant = lazy(() => import('./pages/RegisterRestaurant.jsx'));
const CompanySelection = lazy(() => import('./pages/CompanySelection.jsx'));
const SelfServiceDashboard = lazy(() => import('./pages/dashboard/SelfServiceDashboard.jsx'));
const ProductMaster = lazy(() => import('./pages/dashboard/ProductMaster.jsx'));
const CategoryMaster = lazy(() => import('./pages/dashboard/CategoryMaster.jsx'));
const FunctionMaster = lazy(() => import('./pages/dashboard/FunctionMaster.jsx'));
const BrandMaster = lazy(() => import('./pages/dashboard/BrandMaster.jsx'));
const UnitMaster = lazy(() => import('./pages/dashboard/UnitMaster.jsx'));
const TaxMaster = lazy(() => import('./pages/dashboard/TaxMaster.jsx'));
const TableMaster = lazy(() => import('./pages/dashboard/TableMaster.jsx'));
const TableTypeMaster = lazy(() => import('./pages/dashboard/TableTypeMaster.jsx'));
const StaffMaster = lazy(() => import('./pages/dashboard/StaffMaster.jsx'));
const SupplierMaster = lazy(() => import('./pages/dashboard/SupplierMaster.jsx'));
const CustomerMaster = lazy(() => import('./pages/dashboard/CustomerMaster.jsx'));
const GroupMaster = lazy(() => import('./pages/dashboard/GroupMaster.jsx'));
const PurchaseBillManagement = lazy(() => import('./pages/dashboard/PurchaseBillManagement.jsx'));
const PurchaseInvoices = lazy(() => import('./pages/dashboard/PurchaseInvoices.jsx'));
const PurchaseEntryForm = lazy(() => import('./pages/dashboard/PurchaseEntryForm.jsx'));
const AdvancedReports = lazy(() => import('./pages/dashboard/AdvancedReports.jsx'));
const LedgerStatement = lazy(() => import('./pages/dashboard/LedgerStatement.jsx'));
const VoucherManagement = lazy(() => import('./pages/dashboard/VoucherManagement.jsx'));
const LedgerMaster = lazy(() => import('./pages/dashboard/LedgerMaster.jsx'));
const CounterMaster = lazy(() => import('./pages/dashboard/CounterMaster.jsx'));
const BillingPage = lazy(() => import('./pages/dashboard/BillingPage.jsx'));
const TableSelectionPage = lazy(() => import('./pages/dashboard/TableSelectionPage.jsx'));
const HoldBillsPage = lazy(() => import('./pages/dashboard/HoldBillsPage.jsx'));
const BillsAndSalesPage = lazy(() => import('./pages/dashboard/BillsAndSalesPage.jsx'));
const PartyMasterHub = lazy(() => import('./pages/dashboard/PartyMasterHub.jsx'));
const DisplayPage = lazy(() => import('./pages/dashboard/DisplayPage.jsx'));
const StockPage = lazy(() => import('./pages/StockPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const AccessControlPage = lazy(() => import('./pages/AccessControlPage.jsx'));
const GenericSummaryReport = lazy(() => import('./pages/dashboard/GenericSummaryReport.jsx'));
const DayWiseSales = lazy(() => import('./pages/dashboard/DayWiseSales.jsx'));
const MonthWiseSales = lazy(() => import('./pages/dashboard/MonthWiseSales.jsx'));
const ItemWiseSales = lazy(() => import('./pages/dashboard/ItemWiseSales.jsx'));
const CategoryWiseSales = lazy(() => import('./pages/dashboard/CategoryWiseSales.jsx'));
const TransactionWiseSales = lazy(() => import('./pages/dashboard/TransactionWiseSales.jsx'));
const DayWisePurchase = lazy(() => import('./pages/dashboard/DayWisePurchase.jsx'));
const SupplierWisePurchase = lazy(() => import('./pages/dashboard/SupplierWisePurchase.jsx'));
const CustomerOutstanding = lazy(() => import('./pages/dashboard/CustomerOutstanding.jsx'));
const SupplierOutstanding = lazy(() => import('./pages/dashboard/SupplierOutstanding.jsx'));
const AccountsReceivable = lazy(() => import('./pages/dashboard/AccountsReceivable.jsx'));
const AccountsPayable = lazy(() => import('./pages/dashboard/AccountsPayable.jsx'));
const Daybook = lazy(() => import('./pages/dashboard/Daybook.jsx'));
const TrialBalance = lazy(() => import('./pages/dashboard/TrialBalance.jsx'));
const BalanceSheet = lazy(() => import('./pages/dashboard/BalanceSheet.jsx'));
const ProfitLoss = lazy(() => import('./pages/dashboard/ProfitLoss.jsx'));
const CashBalance = lazy(() => import('./pages/dashboard/CashBalance.jsx'));
const BankBalance = lazy(() => import('./pages/dashboard/BankBalance.jsx'));
const CashAndBank = lazy(() => import('./pages/dashboard/CashAndBank.jsx'));
const KitchenPrinterManagement = lazy(() => import('./pages/dashboard/KitchenPrinterManagement.jsx'));
const KitchenDisplay = lazy(() => import('./pages/dashboard/KitchenDisplay.jsx').then(module => ({ default: module.default })));
const KitchenDisplayList = lazy(() => import('./pages/dashboard/KitchenDisplay.jsx').then(module => ({ default: module.KitchenDisplayList })));
const PrinterDisplayList = lazy(() => import('./pages/dashboard/PrinterDisplay.jsx').then(module => ({ default: module.PrinterDisplayList })));
const PrinterDisplay = lazy(() => import('./pages/dashboard/PrinterDisplay.jsx').then(module => ({ default: module.default })));
const OrderIntegrationSettings = lazy(() => import('./pages/dashboard/OrderIntegrationSettings.jsx'));
const SalesProfit = lazy(() => import('./pages/dashboard/SalesProfit.jsx'));
const ExtraModules = lazy(() => import('./pages/dashboard/ExtraModules.jsx'));

const ProtectedRoute = ({ children, adminOnly }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    // If admin-only route, check if user is admin
    if (adminOnly && !isAdmin()) {
        return <Navigate to="/dashboard/self-service/home" />;
    }

    return children;
};

// Route guard that checks page-level permission
const PermissionRoute = ({ children, pageKey, module }) => {
    const { user, loading, hasPageAccess, hasModuleAccess, getLandingPage } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    // 1. Check global module visibility first
    if (module && !hasModuleAccess(module)) {
        return <Navigate to={getLandingPage()} replace />;
    }

    // 2. Check user-level page access
    if (pageKey && !hasPageAccess(pageKey)) {
        return <Navigate to={getLandingPage()} replace />;
    }

    return children;
};

function AppRoutes() {
    const { user, getLandingPage } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<CompanySelection />} />
            <Route
                path="/register"
                element={user ? <Navigate to={getLandingPage()} /> : <RegisterRestaurant />}
            />
            <Route
                path="/login"
                element={user ? <Navigate to={getLandingPage()} /> : <LandingPage />}
            />

            {/* Self Service Dashboard Nested Routes */}
            <Route
                path="/dashboard/self-service/*"
                element={
                    <ProtectedRoute>
                        <Routes>
                            <Route path="home" element={
                                <PermissionRoute pageKey="dashboard"><SelfServiceDashboard /></PermissionRoute>
                            } />
                            <Route path="products" element={
                                <PermissionRoute pageKey="products"><ProductMaster /></PermissionRoute>
                            } />
                            <Route path="categories" element={
                                <PermissionRoute pageKey="categories"><CategoryMaster /></PermissionRoute>
                            } />
                            <Route path="function-master" element={
                                <PermissionRoute pageKey="function_type"><FunctionMaster /></PermissionRoute>
                            } />
                            <Route path="brands" element={
                                <PermissionRoute pageKey="brands"><BrandMaster /></PermissionRoute>
                            } />
                            <Route path="units" element={
                                <PermissionRoute pageKey="units"><UnitMaster /></PermissionRoute>
                            } />
                            <Route path="taxes" element={
                                <PermissionRoute pageKey="taxes"><TaxMaster /></PermissionRoute>
                            } />
                            <Route path="tables" element={
                                <PermissionRoute pageKey="tables" module="table"><TableMaster /></PermissionRoute>
                            } />
                            <Route path="table-types" element={
                                <PermissionRoute pageKey="table_types" module="table"><TableTypeMaster /></PermissionRoute>
                            } />
                            <Route path="captains" element={
                                <PermissionRoute pageKey="staff" module="staff"><StaffMaster /></PermissionRoute>
                            } />
                            <Route path="waiters" element={
                                <PermissionRoute pageKey="staff" module="staff"><StaffMaster /></PermissionRoute>
                            } />
                            <Route path="staff" element={
                                <PermissionRoute pageKey="staff" module="staff"><StaffMaster /></PermissionRoute>
                            } />
                            <Route path="suppliers" element={
                                <PermissionRoute pageKey="suppliers"><SupplierMaster /></PermissionRoute>
                            } />
                            <Route path="customers" element={
                                <PermissionRoute pageKey="customers"><CustomerMaster /></PermissionRoute>
                            } />
                            <Route path="ledgers" element={
                                <PermissionRoute pageKey="ledgers"><LedgerMaster /></PermissionRoute>
                            } />
                            <Route path="ledgers/create" element={
                                <PermissionRoute pageKey="ledgers"><LedgerMaster defaultOpenCreate={true} /></PermissionRoute>
                            } />
                            <Route path="group-master" element={
                                <PermissionRoute pageKey="ledger_groups"><GroupMaster /></PermissionRoute>
                            } />
                            <Route path="purchase" element={
                                <PermissionRoute pageKey="purchase"><PurchaseEntryForm /></PermissionRoute>
                            } />
                            <Route path="purchase-history" element={
                                <PermissionRoute pageKey="purchase_history"><PurchaseBillManagement /></PermissionRoute>
                            } />
                            <Route path="purchase-invoices" element={
                                <PermissionRoute pageKey="purchase_history"><PurchaseInvoices /></PermissionRoute>
                            } />
                            <Route path="advanced-reports" element={
                                <PermissionRoute pageKey="advanced_reports"><AdvancedReports /></PermissionRoute>
                            } />
                            <Route path="ledger-statement" element={
                                <PermissionRoute pageKey="ledger_statement"><LedgerStatement /></PermissionRoute>
                            } />
                            <Route path="vouchers" element={
                                <PermissionRoute pageKey="vouchers"><VoucherManagement /></PermissionRoute>
                            } />
                            <Route path="counters" element={
                                <PermissionRoute pageKey="counters" module="counter"><CounterMaster /></PermissionRoute>
                            } />
                            <Route path="table-select" element={
                                <PermissionRoute pageKey="kot"><TableSelectionPage /></PermissionRoute>
                            } />
                            <Route path="billing" element={
                                <PermissionRoute pageKey="sales_bill"><BillingPage /></PermissionRoute>
                            } />
                            <Route path="hold" element={
                                <PermissionRoute pageKey="sales_bill"><HoldBillsPage /></PermissionRoute>
                            } />
                            <Route path="bills-sales" element={
                                <PermissionRoute pageKey="party_master"><PartyMasterHub /></PermissionRoute>
                            } />
                            <Route path="display" element={
                                <PermissionRoute pageKey="display"><DisplayPage /></PermissionRoute>
                            } />
                            <Route path="stock" element={
                                <PermissionRoute pageKey="stock"><StockPage /></PermissionRoute>
                            } />
                            <Route path="reports" element={
                                <PermissionRoute pageKey="reports" module="reports"><ReportsPage /></PermissionRoute>
                            } />
                            <Route path="profile" element={
                                <PermissionRoute pageKey="settings_general"><ProfilePage /></PermissionRoute>
                            } />
                            <Route path="settings" element={
                                <PermissionRoute pageKey="settings_general"><SettingsPage /></PermissionRoute>
                            } />
                            <Route path="access-control" element={
                                <PermissionRoute pageKey="user_rights"><AccessControlPage /></PermissionRoute>
                            } />
                            <Route path="extra-modules" element={
                                <PermissionRoute pageKey="system_modules"><ExtraModules /></PermissionRoute>
                            } />

                            {/* Enterprise Extended Routes */}
                            {/* Sales Summary */}
                            <Route path="reports/sales/day" element={<PermissionRoute pageKey="sales_summary"><DayWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/month" element={<PermissionRoute pageKey="sales_summary"><MonthWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/item" element={<PermissionRoute pageKey="sales_summary"><ItemWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/category" element={<PermissionRoute pageKey="sales_summary"><CategoryWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/transaction" element={<PermissionRoute pageKey="sales_summary"><TransactionWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/profit" element={<PermissionRoute pageKey="sales_summary"><SalesProfit /></PermissionRoute>} />
                            <Route path="reports/sales/brand" element={<PermissionRoute pageKey="sales_summary"><GenericSummaryReport title="Brand Wise Sales" subtitle="Sales breakdown by brand." endpoint="/reports/sales-by-brand" /></PermissionRoute>} />
                            <Route path="reports/sales/captain" element={<PermissionRoute pageKey="sales_summary"><GenericSummaryReport title="Captain Wise Sales" subtitle="Sales breakdown by captain." endpoint="/reports/sales-by-captain" /></PermissionRoute>} />
                            <Route path="reports/sales/agent" element={<PermissionRoute pageKey="sales_summary"><GenericSummaryReport title="Agent Wise Sales" subtitle="Sales breakdown by agent." endpoint="/reports/sales-by-captain" /></PermissionRoute>} />

                            {/* Purchase Summary */}
                            <Route path="reports/purchase/day" element={<PermissionRoute pageKey="purchase_summary"><DayWisePurchase /></PermissionRoute>} />
                            <Route path="reports/purchase/month" element={<PermissionRoute pageKey="purchase_summary"><GenericSummaryReport title="Month Wise Purchase" subtitle="Monthly purchase breakdown." endpoint="/reports/purchase/summary" groupBy="MONTH" /></PermissionRoute>} />
                            <Route path="reports/purchase/item" element={<PermissionRoute pageKey="purchase_summary"><GenericSummaryReport title="Item Wise Purchase" subtitle="Purchase breakdown by item." endpoint="/reports/purchase/summary" groupBy="ITEM" /></PermissionRoute>} />
                            <Route path="reports/purchase/category" element={<PermissionRoute pageKey="purchase_summary"><GenericSummaryReport title="Group Wise Purchase" subtitle="Purchase breakdown by group/category." endpoint="/reports/purchase/summary" groupBy="CATEGORY" /></PermissionRoute>} />
                            <Route path="reports/purchase/brand" element={<PermissionRoute pageKey="purchase_summary"><GenericSummaryReport title="Brand Wise Purchase" subtitle="Purchase breakdown by brand." endpoint="/reports/purchase/summary" groupBy="BRAND" /></PermissionRoute>} />
                            <Route path="reports/purchase/supplier" element={<PermissionRoute pageKey="purchase_summary"><SupplierWisePurchase /></PermissionRoute>} />

                            {/* Outstanding */}
                            <Route path="outstanding/customers" element={<PermissionRoute pageKey="outstanding"><CustomerOutstanding /></PermissionRoute>} />
                            <Route path="outstanding/suppliers" element={<PermissionRoute pageKey="outstanding"><SupplierOutstanding /></PermissionRoute>} />
                            <Route path="outstanding/receivable" element={<PermissionRoute pageKey="outstanding"><AccountsReceivable /></PermissionRoute>} />
                            <Route path="outstanding/payable" element={<PermissionRoute pageKey="outstanding"><AccountsPayable /></PermissionRoute>} />

                            {/* Accounts */}
                            <Route path="accounts/daybook" element={<PermissionRoute pageKey="daybook"><Daybook /></PermissionRoute>} />
                            <Route path="accounts/trial-balance" element={<PermissionRoute pageKey="trial_balance"><TrialBalance /></PermissionRoute>} />
                            <Route path="accounts/balance-sheet" element={<PermissionRoute pageKey="balance_sheet"><BalanceSheet /></PermissionRoute>} />
                            <Route path="accounts/profit-loss" element={<PermissionRoute pageKey="profit_loss"><ProfitLoss /></PermissionRoute>} />
                             <Route path="accounts/cash" element={<PermissionRoute pageKey="cash_bank"><CashBalance /></PermissionRoute>} />
                             <Route path="accounts/bank" element={<PermissionRoute pageKey="cash_bank"><BankBalance /></PermissionRoute>} />
                             <Route path="accounts/cash-bank" element={<PermissionRoute pageKey="cash_bank"><CashAndBank /></PermissionRoute>} />

                            {/* Settings Extensions */}
                            <Route path="settings/integration" element={<PermissionRoute pageKey="order_integration"><OrderIntegrationSettings /></PermissionRoute>} />

                            {/* Kitchen & Printer Management (Combined) */}
                            <Route path="kitchen-management" element={<PermissionRoute pageKey="kitchen_printers"><KitchenPrinterManagement /></PermissionRoute>} />
                            <Route path="printer-management" element={<PermissionRoute pageKey="kitchen_printers"><KitchenPrinterManagement /></PermissionRoute>} />
                            <Route path="kitchen-display" element={<PermissionRoute pageKey="kitchen_printers"><KitchenDisplayList /></PermissionRoute>} />
                            <Route path="kitchen-display/:kitchenId" element={<PermissionRoute pageKey="kitchen_printers"><KitchenDisplay /></PermissionRoute>} />
                            <Route path="printer-display" element={<PermissionRoute pageKey="kitchen_printers"><PrinterDisplayList /></PermissionRoute>} />
                            <Route path="printer-display/:id" element={<PermissionRoute pageKey="kitchen_printers"><PrinterDisplay /></PermissionRoute>} />

                            <Route path="*" element={<Navigate to={getLandingPage()} replace />} />
                        </Routes>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard/dining/*"
                element={
                    <ProtectedRoute>
                        <div className="p-10">
                            <h1 className="text-3xl font-bold mb-4">Dining Dashboard</h1>
                            <p className="text-slate-600">Welcome to your POS system! Module implementation coming soon.</p>
                        </div>
                    </ProtectedRoute>
                }
            />

            {/* Redirect /dashboard to the default module */}
            <Route path="/dashboard" element={<Navigate to="/dashboard/self-service/home" replace />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Provider store={store}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                    <Suspense fallback={
                        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing System...</p>
                        </div>
                    }>
                        <AppRoutes />
                    </Suspense>
                </AuthProvider>
            </Router>
        </Provider>
    );
}

export default App;
