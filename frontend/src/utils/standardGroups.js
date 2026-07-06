export const ACCOUNT_NATURES = ['ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'];

export const STANDARD_GROUPS = {
  ASSETS: [
    "Current Assets",
    "Bank Accounts",
    "Cash-in-Hand",
    "Deposits (Asset)",
    "Loans & Advances (Asset)",
    "Stock-in-Hand",
    "Sundry Debtors",
    "Fixed Assets",
    "Investments",
    "Misc. Expenses (ASSET)"
  ],
  LIABILITIES: [
    "Branch / Divisions",
    "Capital Account",
    "Reserves & Surplus",
    "Current Liabilities",
    "Duties & Taxes",
    "Provisions",
    "Sundry Creditors",
    "Loans (Liability)",
    "Bank OD A/c",
    "Secured Loans",
    "Unsecured Loans",
    "Suspense A/c",
    "Profit & Loss A/c"
  ],
  EXPENSES: [
    "Direct Expenses",
    "Indirect Expenses",
    "Purchase Accounts"
  ],
  INCOME: [
    "Direct Incomes",
    "Indirect Incomes",
    "Sales Accounts"
  ]
};

export const getAllStandardGroups = () => {
    return Object.values(STANDARD_GROUPS).flat();
};

export const getNatureForGroup = (groupName) => {
    for (const [nature, groups] of Object.entries(STANDARD_GROUPS)) {
        if (groups.includes(groupName)) {
            return nature;
        }
    }
    return 'ASSETS'; // Default fallback
};
