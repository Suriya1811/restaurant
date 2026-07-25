import React from 'react';
import PurchaseSummaryHub from './PurchaseSummaryHub';

const DayWisePurchase = ({ isEmbedded = false }) => {
    return <PurchaseSummaryHub defaultTab="day" isEmbedded={isEmbedded} />;
};

export default DayWisePurchase;
