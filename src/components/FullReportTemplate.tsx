import React, { useState } from 'react';
import ReportTemplateHeader from './ReportTemplateHeader';
import ReportPaddockSection from './ReportPaddockSection';
import ReportFooter from './ReportFooter';

// Types for paddock and report data
interface Product {
  name: string;
  rate: string;
  unit: string;
}
interface NutrientBreakdown {
  Nutrient: string;
  'kg/ha': number;
  ppm: number;
}
interface ProductBreakdown {
  product: string;
  nutrients: NutrientBreakdown[];
}
interface PaddockData {
  paddockName: string;
  description?: string;
  fertigationProducts: Product[];
  fertigationBreakdown?: NutrientBreakdown[];
  fertigationBreakdownPerProduct?: ProductBreakdown[];
  fertigationTotalCost?: number;
  foliarProducts: Product[];
  foliarBreakdown?: NutrientBreakdown[];
  foliarBreakdownPerProduct?: ProductBreakdown[];
  foliarTotalCost?: number;
  mixingTableHtml?: string;
}
interface FullReportTemplateProps {
  paddocks: PaddockData[];
}

const FullReportTemplate: React.FC<FullReportTemplateProps> = ({ paddocks }) => {
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showMixingTable, setShowMixingTable] = useState(true);

  return (
    <div className="bg-white">
      <ReportTemplateHeader />
      <div className="container mt-4">
        <div className="row mb-3">
          <div className="col-md-6 mb-2">
            <label style={{ marginRight: 20, width: '80%' }}>Include nutrients breakdown and cost in the report.</label>
            <input type="checkbox" checked={showBreakdown} onChange={e => setShowBreakdown(e.target.checked)} />
          </div>
          <div className="col-md-6 mb-2">
            <label style={{ marginRight: 20, width: '80%' }}>Include tank mixing sequence instruction table in the report.</label>
            <input type="checkbox" checked={showMixingTable} onChange={e => setShowMixingTable(e.target.checked)} />
          </div>
        </div>
        {paddocks.map((paddock, idx) => (
          <React.Fragment key={idx}>
            <ReportPaddockSection
              paddockName={paddock.paddockName}
              description={paddock.description}
              fertigationProducts={paddock.fertigationProducts}
              fertigationBreakdown={paddock.fertigationBreakdown}
              fertigationBreakdownPerProduct={paddock.fertigationBreakdownPerProduct}
              fertigationTotalCost={paddock.fertigationTotalCost}
              foliarProducts={paddock.foliarProducts}
              foliarBreakdown={paddock.foliarBreakdown}
              foliarBreakdownPerProduct={paddock.foliarBreakdownPerProduct}
              foliarTotalCost={paddock.foliarTotalCost}
              showBreakdown={showBreakdown}
              mixingTableHtml={paddock.mixingTableHtml}
              showMixingTable={showMixingTable}
            />
            {/* Page break after every paddock for PDF/print */}
            <div style={{ pageBreakAfter: 'always' }} />
          </React.Fragment>
        ))}
        <ReportFooter />
      </div>
    </div>
  );
};

export default FullReportTemplate; 