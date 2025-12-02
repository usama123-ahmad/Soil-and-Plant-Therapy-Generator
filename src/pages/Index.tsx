
import React, { useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import ClientReportExport from '../components/ClientReportExport';
import PDFExportButton from '../components/PDFExportButton';
import { PDFExportOptions } from '../utils/pdfExport';
// import SoilReportGenerator from '../components/SoilReportGenerator';
import PlantReportGenerator from '../components/PlantReportGenerator';

// Example: Replace this with real data from your app when exporting
const mockData = {
  client: 'Bredhauer Orchard',
  crop: 'Turf',
  date: '2025-07-12',
  summary: `<b>1. Neil Bredhauer</b><br>The plant's nutrient analysis indicates optimal levels of <b>Phosphorus (P), Sulphur (S), Calcium (Ca), Magnesium (Mg), and Copper (Cu)</b>, with no deficiencies or excesses detected. However, there are excess levels of <b>Nitrogen (N), Potassium (K), Zinc (Zn), Iron (Fe), Boron (B), and Molybdenum (Mo)</b> present in the plant. Overall, the plant's nutritional status is well-balanced with room for adjustment in managing excess nutrients. We have found that it is remarkably productive to try to maintain "luxury levels" of 4 minerals on a leaf test (The Big four). "Luxury", refers to the top end of the acceptable range. The Big Four include <b>Calcium (Ca), Magnesium (Mg), Phosphorus (P), and Boron (B)</b>. Here, you are deficient in 0 of the nutrients of the big four. Your excess of <b>Nitrogen (N), Potassium (K), Zinc (Zn), Iron (Fe), Boron (B)</b> can shut down several nutrients. Your nutrient antagonism is summarized as following: Nitrogen (N) can shut down <b>Potassium (K), Copper (Cu), Boron (B)</b> Potassium (K) can shut down <b>Magnesium (Mg), Calcium (Ca), Boron (B), Nitrogen (N), Phosphorus (P)</b> Zinc (Zn) can shut down <b>Iron (Fe), Copper (Cu), Phosphorus (P)</b> Iron (Fe) can shut down <b>Manganese (Mn), Zinc (Zn), Copper (Cu), Phosphorus (P), Calcium (Ca)</b> Boron (B) can shut down <b>Nitrogen (N), Potassium (K), Calcium (Ca)</b> Balanced nutrition is key to optimal plant health—addressing these nutrient imbalances will help your crop reach its full potential.`,
  fertigationProducts: [
    { name: 'Calcium Fulvate™', rate: '1', unit: 'L/Ha' },
    { name: 'Citrus-Tech Triple Ten™', rate: '1', unit: 'L/Ha' },
  ],
  preFloweringFoliarProducts: [
    { name: 'Citrus-Tech Triple Ten™', rate: '1', unit: 'L/Ha' },
  ],
  nutritionalFoliarProducts: [
    { name: 'Nutri-Key Cobalt Shuttle™', rate: '1', unit: 'L/Ha' },
    { name: 'Nutri-Key Hydro-Shuttle™', rate: '1', unit: 'L/Ha' },
  ],
  foliarProducts: [
    { name: 'Citrus-Tech Triple Ten™', rate: '1', unit: 'L/Ha' },
    { name: 'Nutri-Key Cobalt Shuttle™', rate: '1', unit: 'L/Ha' },
    { name: 'Nutri-Key Hydro-Shuttle™', rate: '1', unit: 'L/Ha' },
  ],
  tankMixing: [
    { sequence: 1, description: 'Least soluble solids', products: 'Calcium Fulvate™, Citrus-Tech Triple Ten™', notes: 'Requires good agitation for several minutes. Do not attempt to dissolve more than 1g SCP per 100 L water, less if adding other inputs as well.' },
    { sequence: 2, description: 'More soluble solids', products: '', notes: 'May make previous inputs more difficult to dissolve. May be diluted before adding.' },
    { sequence: 3, description: 'Liquid solutions', products: '', notes: 'May make previous inputs more difficult to dissolve. May be diluted before adding.' },
    { sequence: 4, description: 'MMS (micronized mineral solutions)', products: '', notes: 'Pre-mix well before adding. Mix with good agitation to ensure even dispersion.' },
    { sequence: 5, description: 'Microbial products', products: '', notes: 'Always add microbial products last after the other chemicals, and allow tanks to be free of residues if possible before spraying microbes.' },
    { sequence: 6, description: 'Spray oil', products: '', notes: 'Essential for success of foliar sprays.' },
  ],
  agronomist: {
    name: 'Dr. Franz Hentze',
    role: 'Senior Agronomist',
    email: 'franz.hentze@nutri-tech.com.au'
  },
  reportFooterText: 'This report is generated using advanced plant nutrition analysis techniques. All recommendations are based on current best practices in sustainable agriculture. For questions or additional support, please contact your agronomist.',
  plantHealthScore: 85
};

const Index: React.FC = () => {
  const [paddockReports, setPaddockReports] = React.useState<any[]>([]);

  return (
    <AppProvider>
      <AppLayout>
        <PlantReportGenerator paddockReports={paddockReports} setPaddockReports={setPaddockReports} />
      </AppLayout>
    </AppProvider>
  );
};

export default Index;
