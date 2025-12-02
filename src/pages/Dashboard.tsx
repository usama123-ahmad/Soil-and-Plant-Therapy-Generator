import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-[#8cb43a]">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="flex flex-col items-start p-6 shadow-lg border border-[#e5e7eb]">
            <h2 className="text-xl font-semibold mb-2">Plant Report Generator</h2>
            <p className="mb-4 text-muted-foreground">Generate detailed plant nutrition reports, export PDFs, and manage paddock data.</p>
            <Button asChild className="bg-[#8cb43a] hover:bg-[#7aa32e] text-white font-semibold">
              <Link to="/plant-report">Go to Plant Report Generator</Link>
            </Button>
          </Card>
          <Card className="flex flex-col items-start p-6 shadow-lg border border-[#e5e7eb]">
            <h2 className="text-xl font-semibold mb-2">Soil Report Generator</h2>
            <p className="mb-4 text-muted-foreground">Generate comprehensive soil analysis reports, recommendations, and export PDFs.</p>
            <Button asChild className="bg-[#8cb43a] hover:bg-[#7aa32e] text-white font-semibold">
              <Link to="/soil-report">Go to Soil Report Generator</Link>
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard; 