import React from 'react';
import AppLayout from '@/components/AppLayout';
import SoilTherapyReportGenerator from '../components/SoilTherapyReportGenerator';

const SoilReportGeneratorPage: React.FC = () => {
  return (
    <AppLayout>
      <SoilTherapyReportGenerator />
    </AppLayout>
  );
};

export default SoilReportGeneratorPage; 