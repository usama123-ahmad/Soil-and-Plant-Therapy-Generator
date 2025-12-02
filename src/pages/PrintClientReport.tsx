import React, { useEffect, useState } from 'react';
import ClientReportExport from '../components/ClientReportExport';

const PrintClientReport: React.FC = () => {
  const [reportData, setReportData] = useState<any | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('clientReportData');
    if (data) {
      setReportData(JSON.parse(data));
      setTimeout(() => window.print(), 500); // Give time for render
    }
  }, []);

  if (!reportData) {
    return <div style={{ padding: 40, fontSize: 18 }}>No report data found. Please export a report from the main app.</div>;
  }

  // If paddockReports is present, render all as separate pages
  if (Array.isArray(reportData.paddockReports) && reportData.paddockReports.length > 0) {
    return (
      <div id="client-report">
        {reportData.paddockReports.map((paddock: any, i: number) => {
          // Determine if this is a soil report based on data structure
          const paddockData = paddock.data || paddock;
          const isSoilReport = paddockData.paddockName?.toLowerCase().includes('soil') || 
                              paddockData.paddockName?.toLowerCase().includes('analysis') ||
                              paddockData.summary?.toLowerCase().includes('soil') ||
                              paddockData.somCecText?.toLowerCase().includes('soil');
          
          return (
            <div key={i} style={{ pageBreakBefore: i > 0 ? 'always' : undefined }}>
              <ClientReportExport {...paddockData} isFirstPage={i === 0} isSoilReport={isSoilReport} />
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: render single report
  const isSoilReport = reportData.paddockName?.toLowerCase().includes('soil') || 
                      reportData.paddockName?.toLowerCase().includes('analysis') ||
                      reportData.summary?.toLowerCase().includes('soil') ||
                      reportData.somCecText?.toLowerCase().includes('soil');
  
  return (
    <div id="client-report">
      <ClientReportExport {...reportData} isSoilReport={isSoilReport} />
    </div>
  );
};

export default PrintClientReport; 