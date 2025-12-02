import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Leaf, Bean, Droplets, Sprout, Info, Beaker, Loader2 } from 'lucide-react';
import { Settings } from 'lucide-react';
import SoilUpload from './SoilUpload';
import { productList } from '../fertilizerProducts';
import NutrientSummary from './NutrientSummary';
import GeneralCommentsSoil from './GeneralCommentsSoil';
import SeedTreatment, { PlantingBlend } from './SeedTreatment';
import SoilDrench from './SoilDrench';
import FoliarSpray from './FoliarSpray';
import TankMixingSequence from './TankMixingSequence';
import PdfAttachments from './PdfAttachments';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { seedTreatmentProducts as seedTreatmentDefs, soilDrenchProducts as soilDrenchDefs, foliarSprayProducts as foliarSprayDefs } from '../fertilizerProducts';
import NutritionalRatios from './NutritionalRatios';
import * as pdfjsLib from 'pdfjs-dist';
// import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'; // Not available in this version
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import ReportSection from './ReportSection';
import DeviationBarChart from './DeviationBarChart';
import { DeviationBarChart as DeviationBarChartComponent, AbsoluteValueBarChart } from './DeviationBarChart';
import { ReferenceArea, Legend } from 'recharts';
import SoilAnalysisChart from './SoilAnalysisChart';
import SoilCorrections from './SoilCorrections';
import PRODUCT_INFO from './ClientReportExport';
import { generateCustomPDF } from '../lib/pdfReportGenerator';
// import { display } from 'html2canvas/dist/types/css/property-descriptors/display';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';


declare global {
  interface Window {
    generateProductDescriptionAI: (data: any) => Promise<string>;
  }
}
// Add this at the top of the file, before mockNutrients
function isString(val: any): val is string {
  return typeof val === 'string';
}

// Helper to assign status
function getStatus(current: number, ideal: number, ideal_range?: [number, number]): 'low' | 'optimal' | 'high' {
  if (ideal_range && Array.isArray(ideal_range) && ideal_range.length === 2) {
    if (current < ideal_range[0]) return 'low';
    else if (current > ideal_range[1]) return 'high';
    else return 'optimal';
  } else if (typeof ideal === 'number' && isFinite(ideal) && ideal !== 0) {
    if (current < 0.9 * ideal) return 'low';
    else if (current > 1.1 * ideal) return 'high';
    else return 'optimal';
  }
  return 'optimal';
}

// Mock data for demonstration (updated to match the soil report image)
let mockNutrients = [
  // Albrecht Category
  { name: 'CEC', current: 6.35, ideal: 6.35, unit: '', category: 'albrecht' },
  { name: 'TEC', current: 6.35, ideal: 6.35, unit: '', category: 'albrecht' },
  { name: 'Paramagnetism', current: 170, ideal: 600, unit: 'cgs', category: 'albrecht' },
  { name: 'pH-level (1:5 water)', current: 7.10, ideal: 6.7, unit: '', category: 'albrecht' },
  { name: 'Organic Matter (Calc)', current: 2.26, ideal: 6, ideal_range: [5.6, 8.4], unit: '%', category: 'albrecht' },
  { name: 'Organic Carbon (LECO)', current: 1.29, ideal: 3.5, unit: '%', category: 'albrecht' },
  { name: 'Conductivity (1:5 water)', current: 0.06, ideal: 0.15, unit: 'mS/cm', category: 'albrecht' },
  { name: 'Ca/Mg Ratio', current: 5.11, ideal: 4, unit: ':1', category: 'albrecht' },
  { name: 'Nitrate-N (KCl)', current: 9.70, ideal: 15, unit: 'ppm', category: 'albrecht' },
  { name: 'Ammonium-N (KCl)', current: 0.60, ideal: 15, unit: 'ppm', category: 'albrecht' },
  { name: 'Phosphorus (Mehlich III)', current: 89, ideal: 60, ideal_range: [45, 75], unit: 'ppm', category: 'albrecht' },
  { name: 'Calcium (Mehlich III)', current: 1030, ideal: 1317, ideal_range: [1200, 1500], unit: 'ppm', category: 'albrecht' },
  { name: 'Magnesium (Mehlich III)', current: 121, ideal: 122, ideal_range: [100, 150], unit: 'ppm', category: 'albrecht' },
  { name: 'Potassium (Mehlich III)', current: 66.8, ideal: 111.5, ideal_range: [90, 130], unit: 'ppm', category: 'albrecht' },
  { name: 'Sodium (Mehlich III)', current: 0, ideal: 14.5, unit: 'ppm', category: 'albrecht' },
  { name: 'Sulfur (KCl)', current: 1, ideal: 40, unit: 'ppm', category: 'albrecht' },
  { name: 'Aluminium', current: 2.2, ideal: 1.5, unit: 'ppm', category: 'albrecht' },
  { name: 'Silicon (CaCl2)', current: 9, ideal: 550, unit: 'ppm', category: 'albrecht' },
  { name: 'Boron (Hot CaCl2)', current: 0.1, ideal: 2, unit: 'ppm', category: 'albrecht' },
  { name: 'Iron (DTPA)', current: 68.8, ideal: 120, unit: 'ppm', category: 'albrecht' },
  { name: 'Manganese (DTPA)', current: 4.9, ideal: 20, unit: 'ppm', category: 'albrecht' },
  { name: 'Copper (DTPA)', current: 3.2, ideal: 4.5, unit: 'ppm', category: 'albrecht' },
  { name: 'Zinc (DTPA)', current: 6.3, ideal: 7.5, unit: 'ppm', category: 'albrecht' },
  // Base Saturation
  { name: 'Base Saturation Calcium', current: 81.05, ideal: 64, unit: '%', category: 'base_saturation' },
  { name: 'Base Saturation Magnesium', current: 15.87, ideal: 16, unit: '%', category: 'base_saturation' },
  { name: 'Base Saturation Potassium', current: 2.7, ideal: 4.25, unit: '%', category: 'base_saturation' },
  { name: 'Base Saturation Sodium', current: 0, ideal: 1, unit: '%', category: 'base_saturation' },
  { name: 'Base Saturation Aluminium', current: 0.38, ideal: 0.5, unit: '%', category: 'base_saturation' },
  { name: 'Base Saturation Hydrogen', current: 0, ideal: 10, unit: '%', category: 'base_saturation' },
  { name: 'Base Saturation Other Bases', current: 0, ideal: 5, unit: '%', category: 'base_saturation' },
  // LaMotte/Reams Category
  { name: 'LaMotte Calcium', current: 1040, ideal: 1500, unit: 'ppm', category: 'lamotte' },
  { name: 'LaMotte Magnesium', current: 113, ideal: 212.5, unit: 'ppm', category: 'lamotte' },
  { name: 'LaMotte Phosphorus', current: 16, ideal: 18.5, unit: 'ppm', category: 'lamotte' },
  { name: 'LaMotte Potassium', current: 62, ideal: 90, unit: 'ppm', category: 'lamotte' },
].map(n => {
  const currentIsString = typeof n.current === 'string';
  const idealIsString = typeof n.ideal === 'string';
  const current = currentIsString && (n.current as unknown as string).trim().startsWith('<') ? 0 : Number(n.current);
  const ideal = idealIsString && (n.ideal as unknown as string).trim().startsWith('<') ? 0 : Number(n.ideal);
  return {
    ...n,
    current,
    ideal,
    status: getStatus(current, ideal, n.ideal_range as [number, number] | undefined)
  };
});
// Removed debug logging

// Add aliases for SoilAmendments (so it finds the right nutrients)
const soilAmendmentNames = [
  { alias: 'Calcium', match: 'Calcium (Mehlich III)' },
  { alias: 'Magnesium', match: 'Magnesium (Mehlich III)' },
  { alias: 'Potassium', match: 'Potassium (Mehlich III)' },
  { alias: 'Phosphorus', match: 'Phosphorus (Mehlich III)' },
  { alias: 'Sulphur', match: 'Sulfur (KCl)' },
  // Add Nitrate and Ammonium aliases
  { alias: 'Nitrate', match: 'Nitrate-N (KCl)' },
  { alias: 'Ammonium', match: 'Ammonium-N (KCl)' }
];
soilAmendmentNames.forEach(({ alias, match }) => {
  const found = mockNutrients.find(n => n.name === match);
  if (found && !mockNutrients.some(n => n.name === alias)) {
    mockNutrients.push({ ...found, name: alias });
  }
});

// Move allowedNutrients to the top level
const allowedNutrients = [
  'Organic Matter (Calc)', 'pH-level (1:5 water)', 'CEC',
  'Nitrate', 'Ammonium', 'Phosphorus', 'Potassium', 'Calcium', 'Magnesium', 'Sodium', 'Sulphur',
  'Iron', 'Copper', 'Manganese', 'Boron', 'Zinc', 'Cobalt', 'Molybdenum', 'Silica', 'Aluminium', 'Aluminum',
  'Ca/Mg Ratio',
  // LaMotte nutrients
  'LaMotte Calcium', 'LaMotte Magnesium', 'LaMotte Phosphorus', 'LaMotte Potassium',
  // TAE nutrients
  'Sodium TAE', 'Potassium TAE', 'Calcium TAE', 'Magnesium TAE', 'Phosphorus TAE', 'Aluminium TAE',
  'Copper TAE', 'Iron TAE', 'Manganese TAE', 'Selenium TAE', 'Zinc TAE', 'Boron TAE', 'Silicon TAE',
  'Cobalt TAE', 'Molybdenum TAE', 'Sulfur TAE'
];

const nutrientNameMap = {
  'Nitrate-N (KCl)': 'Nitrate',
  'Nitrate_N_KCl': 'Nitrate',
  'Ammonium-N (KCl)': 'Ammonium',
  'Ammonium_N_KCl': 'Ammonium',
  'Phosphorus (Mehlich III)': 'Phosphorus',
  'Phosphorus_Mehlich_III': 'Phosphorus',
  'Calcium (Mehlich III)': 'Calcium',
  'Calcium_Mehlich_III': 'Calcium',
  'Magnesium (Mehlich III)': 'Magnesium',
  'Magnesium_Mehlich_III': 'Magnesium',
  'Potassium (Mehlich III)': 'Potassium',
  'Potassium_Mehlich_III': 'Potassium',
  'Sodium (Mehlich III)': 'Sodium',
  'Sodium_Mehlich_III': 'Sodium',
  'Sulfur (KCl)': 'Sulphur',
  'Sulfur_KCl': 'Sulphur',
  'Aluminium': 'Aluminium',
  'Silicon (CaCl2)': 'Silicon',
  'Silicon_CaCl2': 'Silicon',
  'Boron (Hot CaCl2)': 'Boron',
  'Boron_Hot_CaCl2': 'Boron',
  'Iron (DTPA)': 'Iron',
  'Iron_DTPA': 'Iron',
  'Manganese (DTPA)': 'Manganese',
  'Manganese_DTPA': 'Manganese',
  'Copper (DTPA)': 'Copper',
  'Copper_DTPA': 'Copper',
  'Zinc (DTPA)': 'Zinc',
  'Zinc_DTPA': 'Zinc',
  // Base Saturation
  'Calcium': 'Calcium',
  'Magnesium': 'Magnesium',
  'Potassium': 'Potassium',
  'Sodium': 'Sodium',
  'Aluminum': 'Aluminium',
  'Hydrogen': 'Hydrogen',
  'Other Bases': 'Other_Bases',
  // Lamotte/Reams
  'LaMotte Calcium': 'Calcium',
  'LaMotte Magnesium': 'Magnesium',
  'LaMotte Phosphorus': 'Phosphorus',
  'LaMotte Potassium': 'Potassium',
  // TAE
  'Sodium_TAE': 'Sodium',
  'Potassium_TAE': 'Potassium',
  'Calcium_TAE': 'Calcium',
  'Magnesium_TAE': 'Magnesium',
  'Phosphorus_TAE': 'Phosphorus',
  'Aluminium_TAE': 'Aluminium',
  'Copper_TAE': 'Copper',
  'Iron_TAE': 'Iron',
  'Manganese_TAE': 'Manganese',
  'Selenium_TAE': 'Selenium',
  'Zinc_TAE': 'Zinc',
  'Boron_TAE': 'Boron',
  'Silicon_TAE': 'Silicon',
  'Cobalt_TAE': 'Cobalt',
  'Molybdenum_TAE': 'Molybdenum',
  'Sulfur_TAE': 'Sulphur',
};

// Add this mapping at the top, after allowedNutrients
const fertilizerDescriptions: Record<string, string> = {
  'Agricultural Limestone (CaCO₃)': 'Raises soil pH and supplies calcium to improve soil structure and nutrient availability.',
  'Gypsum (Calcium Sulfate)': 'Provides calcium and sulfur without affecting soil pH; improves soil structure and drainage.',
  'Calcium Nitrate': 'Supplies readily available calcium and nitrate nitrogen for rapid plant uptake.',
  'Dolomitic Lime': 'Raises soil pH and supplies both calcium and magnesium for balanced nutrition.',
  'Kieserite (Magnesium Sulfate Monohydrate)': 'Provides fast-acting magnesium and sulfur for correcting deficiencies.',
  'Epsom Salt (Magnesium Sulfate Heptahydrate)': 'Quickly corrects magnesium and sulfur deficiencies in soil.',
  'Muriate of Potash (Potassium Chloride)': 'Delivers high levels of potassium for improved crop yield and quality.',
  'Sulfate of Potash (Potassium Sulfate)': 'Supplies potassium and sulfur with low chloride content, ideal for sensitive crops.',
  'Potassium Nitrate': 'Provides both potassium and nitrate nitrogen for balanced plant growth.',
  'Triple Superphosphate': 'Delivers concentrated phosphorus for strong root development and early growth.',
  'Monoammonium Phosphate (MAP)': 'Supplies phosphorus and ammonium nitrogen for early root and shoot growth.',
  'Diammonium Phosphate (DAP)': 'Provides phosphorus and ammonium nitrogen for vigorous early plant development.',
  'Rock Phosphate': 'Slow-release source of phosphorus for long-term soil fertility.',
  'Elemental Sulfur': 'Lowers soil pH and supplies sulfur for protein synthesis and enzyme function.',
  'Ammonium Sulfate': 'Provides ammonium nitrogen and sulfur for rapid green-up and protein formation.',
  'Potassium Sulfate': 'Supplies potassium and sulfur for improved crop quality and disease resistance.',
  'Sodium Sulfate': 'Supplies sodium and sulfur, used for specific soil or crop needs.',
  'Iron Sulfate (FeSO₄)': 'Corrects iron deficiency and supplies sulfur for healthy plant growth.',
  'Chelated Iron (Fe-EDTA)': 'Highly available iron source for correcting chlorosis in alkaline soils.',
  'Copper Sulfate (CuSO₄)': 'Supplies copper and sulfur to correct deficiencies and promote enzyme activity.',
  'Chelated Copper (Cu-EDTA)': 'Provides plant-available copper for enzyme function and disease resistance.',
  'Manganese Sulfate (MnSO₄)': 'Corrects manganese deficiency and supports photosynthesis.',
  'Chelated Manganese (Mn-EDTA)': 'Highly available manganese source for correcting deficiency symptoms.',
  'Borax': 'Supplies boron for cell wall formation and reproductive growth.',
  'Solubor': 'Highly soluble boron source for rapid correction of deficiency.',
  'Zinc Sulfate (ZnSO₄)': 'Supplies zinc and sulfur for enzyme activation and growth regulation.',
  'Chelated Zinc (Zn-EDTA)': 'Provides plant-available zinc for healthy growth and development.',
  'Cobalt Sulfate (CoSO₄)': 'Supplies cobalt, essential for nitrogen fixation in legumes.',
  'Sodium Molybdate (Na₂MoO₄)': 'Provides molybdenum for nitrogen metabolism and enzyme activity.',
  'Potassium Silicate': 'Supplies potassium and silicon to strengthen cell walls and improve stress tolerance.'
};

// At the top of the component, build a unified nutrient list from the provided JSON structure
const unifiedNutrientKeys = [
  // soil_analysis
  'CEC', 'TEC', 'Paramagnetism', 'pH_level_1_5_water', 'Organic_Matter_Calc', 'Organic_Carbon_LECO', 'Conductivity_1_5_water', 'Ca_Mg_Ratio',
  'Nitrate_N_KCl', 'Ammonium_N_KCl', 'Phosphorus_Mehlich_III', 'Calcium_Mehlich_III', 'Magnesium_Mehlich_III', 'Potassium_Mehlich_III',
  'Sodium_Mehlich_III', 'Sulfur_KCl', 'Aluminium', 'Silicon_CaCl2', 'Boron_Hot_CaCl2', 'Iron_DTPA', 'Manganese_DTPA', 'Copper_DTPA', 'Zinc_DTPA',
  // base_saturation
  'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other_Bases',
  // lamotte_reams
  'Calcium_Lamotte', 'Magnesium_Lamotte', 'Phosphorus_Lamotte', 'Potassium_Lamotte'
];
// Map lamotte_reams keys to match the JSON
const lamotteMap = {
  'Calcium_Lamotte': 'Calcium',
  'Magnesium_Lamotte': 'Magnesium',
  'Phosphorus_Lamotte': 'Phosphorus',
  'Potassium_Lamotte': 'Potassium',
};

// 1. Replace the fixedNutrientData object
const fixedNutrientData = {
  "albrecht_mehlich_kcl": {
    "CEC": 8,
    "TEC": 8,
    "Paramagnetism": { "value": 170, "ideal_range": [200, 1000], "target": 600.0 },
    "pH_level_1_5_water": { "value": 7.2, "ideal_range": [6.0, 6.8], "target": 6.4 },
    "Organic_Matter_Calc": { "value": 1.63, "unit": "%", "ideal_range": [4, 10], "target": 7.0 },
    "Organic_Carbon_LECO": { "value": 0.93, "unit": "%", "ideal_range": [2, 5], "target": 3.5 },
    "Conductivity_1_5_water": { "value": 0.03, "unit": "mS/cm", "ideal_range": [0.1, 0.2], "target": 0.15000000000000002 },
    "Ca_Mg_Ratio": { "value": 1.75, "unit": ":1", "ideal_range": [4.3, 4.3], "target": 4.3 },
    "Nitrate_N_KCl": { "value": 2.1, "unit": "ppm", "ideal_range": [10, 20], "target": 15.0 },
    "Ammonium_N_KCl": { "value": 4.8, "unit": "ppm", "ideal_range": [10, 20], "target": 15.0 },
    "Phosphorus_Mehlich_III": { "value": 21.6, "unit": "ppm", "ideal_range": [35, 50], "target": 42.5 },
    "Calcium_Mehlich_III": { "value": 949, "unit": "ppm", "ideal_range": [1041, 2000], "target": 1520.5 },
    "Magnesium_Mehlich_III": { "value": 326, "unit": "ppm", "ideal_range": [144, 285], "target": 214.5 },
    "Potassium_Mehlich_III": { "value": 155, "unit": "ppm", "ideal_range": [109, 156], "target": 132.5 },
    "Sodium_Mehlich_III": { "value": 26, "unit": "ppm", "ideal_range": [9, 28], "target": 18.5 },
    "Sulfur_KCl": { "value": 4.5, "unit": "ppm", "ideal_range": [30, 50], "target": 40.0 },
    "Aluminium": { "value": 2.7, "unit": "ppm", "ideal_range": [0, 4], "target": 2.0 },
    "Silicon_CaCl2": { "value": 48.0, "unit": "ppm", "ideal_range": [100, 1000], "target": 550.0 },
    "Boron_Hot_CaCl2": { "value": 0.28, "unit": "ppm", "ideal_range": [1, 3], "target": 2.0 },
    "Iron_DTPA": { "value": 17.9, "unit": "ppm", "ideal_range": [40, 200], "target": 120.0 },
    "Manganese_DTPA": { "value": 7.9, "unit": "ppm", "ideal_range": [30, 100], "target": 65.0 },
    "Copper_DTPA": { "value": 1.1, "unit": "ppm", "ideal_range": [2, 7], "target": 4.5 },
    "Zinc_DTPA": { "value": 3.7, "unit": "ppm", "ideal_range": [3, 10], "target": 6.5 }
  },
  "base_saturation": {
    "Calcium": { "value": 59.3, "unit": "%", "target": 65.0 },
    "Magnesium": { "value": 33.95, "unit": "%", "target": 15.0 },
    "Potassium": { "value": 4.97, "unit": "%", "target": 6.0 },
    "Sodium": { "value": 1.41, "unit": "%", "target": 1 },
    "Aluminum": { "value": 0.37, "unit": "%", "target": 0.5 },
    "Hydrogen": { "value": 0.0, "unit": "%", "target": 0.0 },
    "Other_Bases": { "value": 0.0, "unit": "%", "target": 0.0 }
  },
  "lamotte_reams": {
    "Calcium_LaMotte": { "value": 934, "unit": "ppm", "ideal_range": [1000, 2000], "target": 1500.0 },
    "Magnesium_LaMotte": { "value": 286, "unit": "ppm", "ideal_range": [140, 285], "target": 212.5 },
    "Phosphorus_LaMotte": { "value": 7.7, "unit": "ppm", "ideal_range": [7, 30], "target": 18.5 },
    "Potassium_LaMotte": { "value": 165, "unit": "ppm", "ideal_range": [80, 100], "target": 90.0 }
  },
  "tae": {
    "Sodium_TAE": { "value": "<50", "unit": "ppm", "ideal_range": [100, 500], "target": 300.0 },
    "Potassium_TAE": { "value": 609, "unit": "ppm", "ideal_range": [200, 2000], "target": 1100.0 },
    "Calcium_TAE": { "value": 1230, "unit": "ppm", "ideal_range": [1000, 10000], "target": 5500.0 },
    "Magnesium_TAE": { "value": 895, "unit": "ppm", "ideal_range": [500, 5000], "target": 2750.0 },
    "Phosphorus_TAE": { "value": 239, "unit": "ppm", "ideal_range": [400, 1500], "target": 950.0 },
    "Aluminium_TAE": { "value": 7370, "unit": "ppm", "ideal_range": [2000, 50000], "target": 26000.0 },
    "Copper_TAE": { "value": 14, "unit": "ppm", "ideal_range": [20, 50], "target": 35.0 },
    "Iron_TAE": { "value": 16500, "unit": "ppm", "ideal_range": [1000, 50000], "target": 25500.0 },
    "Manganese_TAE": { "value": 267, "unit": "ppm", "ideal_range": [200, 2000], "target": 1100.0 },
    "Selenium_TAE": { "value": "<0.5", "unit": "ppm", "ideal_range": [0.6, 2], "target": 1.3 },
    "Zinc_TAE": { "value": 27, "unit": "ppm", "ideal_range": [20, 50], "target": 35.0 },
    "Boron_TAE": { "value": "<2.0", "unit": "ppm", "ideal_range": [2, 50], "target": 26.0 },
    "Silicon_TAE": { "value": 708, "unit": "ppm", "ideal_range": [1000, 3000], "target": 2000.0 },
    "Cobalt_TAE": { "value": 7.1, "unit": "ppm", "ideal_range": [2, 40], "target": 21.0 },
    "Molybdenum_TAE": { "value": 0.4, "unit": "ppm", "ideal_range": [0.5, 2], "target": 1.25 },
    "Sulfur_TAE": { "value": 104, "unit": "ppm", "ideal_range": [100, 1000], "target": 550.0 }
  }
};

// 2. Update getUnifiedNutrients to process the new 'albrecht_mehlich_kcl' section as well as the others
function getUnifiedNutrients(data, includeAllSections = true) {
  const result = [];
  const safeNum = v => (typeof v === 'string' && v.includes('<')) ? 0 : Number(v);
  // Process sections based on parameter
  const sections = includeAllSections
    ? ['albrecht_mehlich_kcl', 'base_saturation', 'lamotte_reams', 'tae']
    : ['albrecht_mehlich_kcl']; // Only Albrecht section for soil corrections
  sections.forEach(section => {
    if (data[section]) {
      for (const [key, val] of Object.entries(data[section])) {
        if (typeof val === 'object' && val !== null && typeof (val as any).value !== 'undefined') {
          const v = val as any;
          result.push({
            name: key,
            current: safeNum(v.value),
            ideal: (typeof v.target !== 'undefined' && !isNaN(safeNum(v.target)) && safeNum(v.target) > 0) ? safeNum(v.target) : undefined,
            unit: v.unit || '',
            ideal_range: v.ideal_range,
            category: section
          });
        } else if (typeof val === 'number') {
          // For numeric values (e.g., CEC, TEC)
          result.push({
            name: key,
            current: val,
            ideal: undefined, // skip in deviation chart
            unit: '',
            ideal_range: undefined,
            category: section
          });
        }
      }
    }
  });
  return result;
}

// 3. Add a shared renderYAxisTick function and use it for the YAxis tick prop in both charts
const renderYAxisTick = ({ x, y, payload }) => {
  const name = payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} fontSize={10} fontWeight={400} textAnchor="end">
        <title>{name}</title>
        {name}
      </text>
    </g>
  );
};

// 4. Remove all PDF/mock/upload logic and state
// ...
// 5. Ensure all nutrient-related UI is now driven by unifiedNutrients for full consistency
// ... existing code ...

// Move unifiedToGeneric to the top of the file, before the component
const unifiedToGeneric = {
  'Nitrate-N (KCl)': 'Nitrate',
  'Nitrate_N_KCl': 'Nitrate',
  'Ammonium-N (KCl)': 'Ammonium',
  'Ammonium_N_KCl': 'Ammonium',
  'Phosphorus (Mehlich III)': 'Phosphorus',
  'Phosphorus_Mehlich_III': 'Phosphorus',
  'Calcium (Mehlich III)': 'Calcium',
  'Calcium_Mehlich_III': 'Calcium',
  'Magnesium (Mehlich III)': 'Magnesium',
  'Magnesium_Mehlich_III': 'Magnesium',
  'Potassium (Mehlich III)': 'Potassium',
  'Potassium_Mehlich_III': 'Potassium',
  'Sodium (Mehlich III)': 'Sodium',
  'Sodium_Mehlich_III': 'Sodium',
  'Sulfur (KCl)': 'Sulphur',
  'Sulfur_KCl': 'Sulphur',
  'Aluminium': 'Aluminium',
  'Silicon (CaCl2)': 'Silicon',
  'Silicon_CaCl2': 'Silicon',
  'Boron (Hot CaCl2)': 'Boron',
  'Boron_Hot_CaCl2': 'Boron',
  'Iron (DTPA)': 'Iron',
  'Iron_DTPA': 'Iron',
  'Manganese (DTPA)': 'Manganese',
  'Manganese_DTPA': 'Manganese',
  'Copper (DTPA)': 'Copper',
  'Copper_DTPA': 'Copper',
  'Zinc (DTPA)': 'Zinc',
  'Zinc_DTPA': 'Zinc',
  // Base Saturation
  'Calcium': 'Calcium',
  'Magnesium': 'Magnesium',
  'Potassium': 'Potassium',
  'Sodium': 'Sodium',
  'Aluminum': 'Aluminium',
  'Hydrogen': 'Hydrogen',
  'Other_Bases': 'Other_Bases',
  // Lamotte/Reams
  'Calcium_LaMotte': 'Calcium',
  'Magnesium_LaMotte': 'Magnesium',
  'Phosphorus_LaMotte': 'Phosphorus',
  'Potassium_LaMotte': 'Potassium',
  // TAE
  'Sodium_TAE': 'Sodium',
  'Potassium_TAE': 'Potassium',
  'Calcium_TAE': 'Calcium',
  'Magnesium_TAE': 'Magnesium',
  'Phosphorus_TAE': 'Phosphorus',
  'Aluminium_TAE': 'Aluminium',
  'Copper_TAE': 'Copper',
  'Iron_TAE': 'Iron',
  'Manganese_TAE': 'Manganese',
  'Selenium_TAE': 'Selenium',
  'Zinc_TAE': 'Zinc',
  'Boron_TAE': 'Boron',
  'Silicon_TAE': 'Silicon',
  'Cobalt_TAE': 'Cobalt',
  'Molybdenum_TAE': 'Molybdenum',
  'Sulfur_TAE': 'Sulphur',
};

const SoilReportGenerator: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedPaddocks, setSelectedPaddocks] = useState<string[]>([]);
  const [selectedFoliarProducts, setSelectedFoliarProducts] = useState<string[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const exportSummaryRef = useRef<HTMLDivElement>(null);
  const [howToOpen, setHowToOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [reportRefId,setReportRefId] = useState<string|null>(null);
  // Add multi-paddock state variables
  const [paddockReports, setPaddockReports] = useState<any[]>([]);
  const [selectedPaddockIndex, setSelectedPaddockIndex] = useState(0);
  const [availableAnalyses, setAvailableAnalyses] = useState<any[]>([]);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(-1);

  // Current paddock data for form fields
  const currentPaddockData = useMemo(() => {
    return paddockReports.length > 0 && paddockReports[selectedPaddockIndex]
      ? paddockReports[selectedPaddockIndex].data || {}
      : {};
  }, [paddockReports, selectedPaddockIndex]);

  // Ensure tank mixing data is always properly initialized for all paddocks
  useEffect(() => {
    if (paddockReports.length > 0) {
      const needsInitialization = paddockReports.some((paddock, idx) => {
        return !paddock.data.tankMixingItems ||
          !Array.isArray(paddock.data.tankMixingItems) ||
          paddock.data.tankMixingItems.length === 0;
      });

      if (needsInitialization) {
        console.log('Initializing tank mixing data for all paddocks');
        setPaddockReports(prev => prev.map((paddock, idx) => {
          if (!paddock.data.tankMixingItems ||
            !Array.isArray(paddock.data.tankMixingItems) ||
            paddock.data.tankMixingItems.length === 0) {
            return {
              ...paddock,
              data: {
                ...paddock.data,
                tankMixingItems: getDefaultTankMixingItemsCopy()
              }
            };
          }
          return paddock;
        }));
      }
    }
  }, [paddockReports.length, selectedPaddockIndex]);



  const [somCecText, setSomCecText] = useState('Soil organic matter and CEC analysis will be generated based on your uploaded data.');
  const [baseSaturationText, setBaseSaturationText] = useState('Base saturation analysis will be generated based on your uploaded data.');
  const [phText, setPhText] = useState('Soil pH analysis will be generated based on your uploaded data.');
  const [availableNutrientsText, setAvailableNutrientsText] = useState('Available nutrients analysis will be generated based on your uploaded data.');
  const [soilReservesText, setSoilReservesText] = useState('Soil reserves analysis will be generated based on your uploaded data.');
  const [lamotteReamsText, setLamotteReamsText] = useState('LaMotte/Reams analysis will be generated based on your uploaded data.');
  const [taeText, setTaeText] = useState('Total Available Elements (TAE) analysis will be generated based on your uploaded data.');
  const [phosphorusMonitoringText, setPhosphorusMonitoringText] = useState('');
  const [seedTreatmentProducts, setSeedTreatmentProducts] = useState([
    {
      id: '1',
      product: 'Root & Shoot™',
      rate: '3-4',
      unit: 'L/tonne of seed'
    },
    {
      id: '2',
      product: 'Nutri-Life BAM',
      rate: '5',
      unit: 'L/tonne of seed'
    },
    {
      id: '3',
      product: 'Nutri-Life Platform',
      rate: '1.3',
      unit: 'kg/tonne of seed'
    }
  ]); // Start with none selected
  const [soilDrenchProducts, setSoilDrenchProducts] = useState([]);
  const [foliarSprayProducts, setFoliarSprayProducts] = useState([]);
  const [selectedFertilizers, setSelectedFertilizers] = useState({});
  const [fertilizerRates, setFertilizerRates] = useState({});
  const [allowedExcessPercent, setAllowedExcessPercent] = useState(25);
  // Per-nutrient thresholds: { [nutrientName]: { greenLow, greenHigh, red, blue } }
  const [nutrientThresholds, setNutrientThresholds] = useState({
    'CEC': { red: -50, blue: 50, greenLow: -49, greenHigh: 49 },
    'Paramagnetism': { red: -50, blue: 50, greenLow: -49, greenHigh: 49 },
    'pH-level (1:5 water)': { red: -35, blue: 35, greenLow: -34, greenHigh: 34 },
    'Organic Matter (Calc)': { red: -25, blue: 15, greenLow: -24, greenHigh: 14 },
    'Organic Carbon (LECO)': { red: -14, blue: 72, greenLow: -13, greenHigh: 71 },
    'Conductivity (1:5 water)': { red: -49, blue: 150, greenLow: -48, greenHigh: 149 },
    'Ca / Mg Ratio': { red: -50, blue: 50, greenLow: -49, greenHigh: 49 },
    'Nitrate-N (KCl)': { red: -50, blue: 50, greenLow: -49, greenHigh: 49 },
    'Ammonium-N (KCl)': { red: -50, blue: 50, greenLow: -49, greenHigh: 49 },
    'Phosphorus (Mehlich III)': { red: -30, blue: 100, greenLow: -29, greenHigh: 99 },
    'Calcium (Mehlich III)': { red: -35, blue: 70, greenLow: -34, greenHigh: 69 },
    'Magnesium (Mehlich III)': { red: -35, blue: 70, greenLow: -34, greenHigh: 69 },
    'Potassium (Mehlich III)': { red: -35, blue: 70, greenLow: -34, greenHigh: 69 },
    'Sodium (Mehlich III)': { red: -35, blue: 100, greenLow: -34, greenHigh: 99 },
    'Sulphur (KCl)': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'Chloride': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'Aluminium': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'Silicon (CaCl2)': { red: -60, blue: 100, greenLow: -59, greenHigh: 99 },
    'Boron (Hot CaCl2)': { red: -30, blue: 150, greenLow: -29, greenHigh: 149 },
    'Iron (DTPA)': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'Manganese (DTPA)': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'Copper (DTPA)': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'Zinc (DTPA)': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    // Base Saturation
    'Base Saturation Calcium': { red: -35, blue: 70, greenLow: -34, greenHigh: 69 },
    'Base Saturation Magnesium': { red: -35, blue: 70, greenLow: -34, greenHigh: 69 },
    'Base Saturation Potassium': { red: -35, blue: 70, greenLow: -34, greenHigh: 69 },
    'Base Saturation Sodium': { red: -35, blue: 100, greenLow: -34, greenHigh: 99 },
    'Base Saturation Aluminium': { red: -35, blue: 100, greenLow: -34, greenHigh: 99 },
    'Base Saturation Hydrogen': { red: -35, blue: 70, greenLow: -34, greenHigh: 69 },
    'Base Saturation Other Bases': { red: -35, blue: 100, greenLow: -34, greenHigh: 99 },
    // LaMotte/Reams
    'LaMotte Calcium': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'LaMotte Magnesium': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'LaMotte Phosphorus': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
    'LaMotte Potassium': { red: -50, blue: 100, greenLow: -49, greenHigh: 99 },
  });
  const getThresholds = (name) => {
    return nutrientThresholds[name] || { greenLow: -50, greenHigh: 50, red: -50, blue: 50 };
  };
  const setThresholdFor = (name, newVals) => {
    setNutrientThresholds((prev) => ({ ...prev, [name]: { ...getThresholds(name), ...newVals } }));
  };
  const [soilAmendmentsSummary, setSoilAmendmentsSummary] = useState([]);
  const [tankMixingItems, setTankMixingItems] = useState(() => {
    const productDescriptions = [
      'More soluble Solids',
      'Liquid Solutions',
      'MMS (Micronized Mineral Solutions)',
      'Spray Oil',
      'Microbial Products'
    ];
    const productNotes = [
      'May require several minutes of good agitation',
      'Make sure previous inputs are fully dissolved before adding.',
      'Pre-mix well before adding slowly to the tank under constant agitation. Maintain constant agitation to prevent settling.',
      'Spreader/sticker/penetrant. Essential for success of foliar sprays.',
      'Always add microbes to the spray tank last after the other ingredients have been diluted.'
    ];
    return productDescriptions.map((desc, idx) => ({
      id: (Date.now() + idx).toString(),
      sequence: idx + 1,
      productDescription: desc,
      products: [],
      notes: productNotes[idx]
    }));
  });
  const [pdfAttachments, setPdfAttachments] = useState([]);
  const [frontAttachments, setFrontAttachments] = useState([]);
  const [backAttachments, setBackAttachments] = useState([]);
  const [selectedAgronomist, setSelectedAgronomist] = useState({ name: 'Marco Giorgio', role: 'Agronomist', email: 'marco@nutri-tech.com.au' });
  const [nutrients, setNutrients] = useState<any[]>([]);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [plantingBlendProducts, setPlantingBlendProducts] = useState([]);
  const [sectionNotes, setSectionNotes] = useState({
    nutritionalStatus: '',
    generalComments: '',
    productRecommendation: '',
    productRecommendationSummary: '',
    totalNutrientSummary: '',
    pdfAttachments: '',
    selectAgronomist: '',
    reportFooter: '',
    saveExport: '',
  });
  const [editingSectionNote, setEditingSectionNote] = useState('');
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [showSectionNotes, setShowSectionNotes] = useState({
    soilAmendments: false,
    seedTreatment: false,
    plantingBlend: false,
    biologicalFertigation: false,
    preFloweringFoliar: false,
    preFloweringFoliar2: false,
    nutritionalFoliar: false,
    nutritionalFoliar2: false,
  });
  const [generalNotes, setGeneralNotes] = useState('');
  const [preFloweringFoliarProducts, setPreFloweringFoliarProducts] = useState([]);
  const [preFloweringFoliarProducts2, setPreFloweringFoliarProducts2] = useState([]);
  const [nutritionalFoliarProducts, setNutritionalFoliarProducts] = useState([]);
  const [nutritionalFoliarProducts2, setNutritionalFoliarProducts2] = useState([]);
  const [showSecondPreFloweringFoliar, setShowSecondPreFloweringFoliar] = useState(false);
  const [showSecondFoliar, setShowSecondFoliar] = useState(false);
  // Add state for collapse
  const [showSection1, setShowSection1] = useState(true);
  const [showSection2, setShowSection2] = useState(true);
  const [showSection3, setShowSection3] = useState(true);
  const [showSection4, setShowSection4] = useState(true);
  const [showSection5, setShowSection5] = useState(true);
  const [showSection6, setShowSection6] = useState(true);
  const [showSection7, setShowSection7] = useState(true);
  const [showSection8, setShowSection8] = useState(true);
  const [showSection9, setShowSection9] = useState(true);
  const [reportFooterText, setReportFooterText] = useState(`Disclaimer: Any recommendations provided by Nutri-Tech Solutions Pty Ltd are advice only. As no control can be exercised over storage; handling; mixing application or use; weather; plant or soil conditions before, during or after application (all of which may affect the performance of our program); no responsibility for, or liability for any failure in performance, losses, damages, or injuries (consequential or otherwise), arising from such storage, mixing, application, or use will be accepted under any circumstances whatsoever. The buyer assumes all responsibility for the use of any of our products.`);

  // Add state for color logic popup
  const [showThresholdsPopup, setShowThresholdsPopup] = useState(false);
  const [showSensitivityPopup, setShowSensitivityPopup] = useState(false);

  // Declare canonicalNutrients only once here
  const canonicalNutrients = [
    // albrecht_mehlich_kcl
    'CEC', 'TEC', 'Paramagnetism', 'pH_level_1_5_water', 'Organic_Matter_Calc', 'Organic_Carbon_LECO', 'Conductivity_1_5_water', 'Ca_Mg_Ratio',
    'Nitrate_N_KCl', 'Ammonium_N_KCl', 'Phosphorus_Mehlich_III', 'Calcium_Mehlich_III', 'Magnesium_Mehlich_III', 'Potassium_Mehlich_III',
    'Sodium_Mehlich_III', 'Sulfur_KCl', 'Aluminium', 'Silicon_CaCl2', 'Boron_Hot_CaCl2', 'Iron_DTPA', 'Manganese_DTPA', 'Copper_DTPA', 'Zinc_DTPA',
    // base_saturation
    'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other_Bases',
    // lamotte_reams
    'Calcium_LaMotte', 'Magnesium_LaMotte', 'Phosphorus_LaMotte', 'Potassium_LaMotte',
    // tae
    'Sodium_TAE', 'Potassium_TAE', 'Calcium_TAE', 'Magnesium_TAE', 'Phosphorus_TAE', 'Aluminium_TAE', 'Copper_TAE', 'Iron_TAE', 'Manganese_TAE',
    'Selenium_TAE', 'Zinc_TAE', 'Boron_TAE', 'Silicon_TAE', 'Cobalt_TAE', 'Molybdenum_TAE', 'Sulfur_TAE'
  ];
  const sourceNutrients = useMemo(() => {
    if (paddockReports.length > 0 && paddockReports[selectedPaddockIndex]) {
      return paddockReports[selectedPaddockIndex].data.nutrients || [];
    }
    return uploadedFile ? [] : mockNutrients;
  }, [paddockReports, selectedPaddockIndex, uploadedFile]);
  const unifiedNutrientRows = getUnifiedNutrientsFromParsed(sourceNutrients, canonicalNutrients, fixedNutrientData);

  // ... then declare sourceNutrients and unifiedNutrientRows ...

  // Per-nutrient sensitivity: { [nutrientName]: { min, max } } (for bar scaling, not color)
  // Remove old nutrientSensitivity state
  // Remove this:
  // const [nutrientSensitivity, setNutrientSensitivity] = useState({ ... });
  // ... existing code ...
  // Remove old NutrientSensitivityPopup and related code
  // Remove lines 1429-1447
  // ... existing code ...
  // Remove duplicate/incorrect zoneSensitivity declarations
  // Remove this:
  // const zoneSensitivity = { ... } // line 2114
  // Remove this:
  // const [zoneSensitivity, setZoneSensitivity] = useState(zoneSensitivity); // line 2139
  // Only keep:
  // ... existing code ...

  // Soil Amendment fertilizer definitions (from SoilAmendments)
  const soilAmendmentFerts: Record<string, any> = {};
  try {
    // Inline the fertilizer definitions from SoilAmendments here for lookup
    soilAmendmentFerts['Agricultural Limestone (CaCO₃)'] = { nutrientContent: { Calcium: 38 } };
    soilAmendmentFerts['Gypsum (Calcium Sulfate)'] = { nutrientContent: { Calcium: 23, Sulphur: 18 } };
    // Nitrate and Ammonium variants (declare once at the top of try block)
    const nitrateFerts = { Calcium: 19, Nitrate: 12 };
    const ammoniumFerts = { Ammonium: 21, Sulphur: 24 };
    soilAmendmentFerts['Calcium Nitrate'] = { nutrientContent: nitrateFerts };
    soilAmendmentFerts['Nitrate'] = { nutrientContent: nitrateFerts };
    soilAmendmentFerts['Nitrate-N (KCl)'] = { nutrientContent: nitrateFerts };
    soilAmendmentFerts['Potassium Nitrate'] = { nutrientContent: { Potassium: 44, Nitrate: 13 } };
    soilAmendmentFerts['Sodium Nitrate'] = { nutrientContent: { Sodium: 16, Nitrate: 16 } };
    soilAmendmentFerts['Ammonium Sulfate'] = { nutrientContent: ammoniumFerts };
    soilAmendmentFerts['Ammonium'] = { nutrientContent: ammoniumFerts };
    soilAmendmentFerts['Ammonium-N (KCl)'] = { nutrientContent: ammoniumFerts };
    soilAmendmentFerts['Ammonium Nitrate'] = { nutrientContent: { Ammonium: 17, Nitrate: 17 } };
    soilAmendmentFerts['Diammonium Phosphate (DAP)'] = { nutrientContent: { Ammonium: 18, Phosphorus: 20 } };
    soilAmendmentFerts['Monoammonium Phosphate (MAP)'] = { nutrientContent: { Ammonium: 11, Phosphorus: 22 } };
    soilAmendmentFerts['Urea'] = { nutrientContent: { Ammonium: 46 } };
    soilAmendmentFerts['Anhydrous Ammonia'] = { nutrientContent: { Ammonium: 82 } };
    // Add all common variants for Nitrate and Ammonium as keys
    soilAmendmentFerts['Nitrate-N'] = { nutrientContent: nitrateFerts };
    soilAmendmentFerts['Nitrate Nitrogen'] = { nutrientContent: nitrateFerts };
    soilAmendmentFerts['NO3'] = { nutrientContent: nitrateFerts };
    soilAmendmentFerts['NO3-N'] = { nutrientContent: nitrateFerts };
    soilAmendmentFerts['Ammonium-N'] = { nutrientContent: ammoniumFerts };
    soilAmendmentFerts['Ammonium Nitrogen'] = { nutrientContent: ammoniumFerts };
    soilAmendmentFerts['NH4'] = { nutrientContent: ammoniumFerts };
    soilAmendmentFerts['NH4-N'] = { nutrientContent: ammoniumFerts };
    // ... rest of fertilizer definitions ...
  } catch (e) { }

  // Deduplicate mainNutrients by canonical name with proper prioritization


  // Deduplicate mainNutrients by canonical name
  const canonicalName = (name) => {
    // Remove parenthesis and trim
    return name.split('(')[0].trim().toLowerCase();
  };
  const dedupedMainNutrientsMap = new Map();
  sourceNutrients.forEach(n => {
    const key = canonicalName(n.name);
    // Prefer the first occurrence of the more specific name (e.g., 'Calcium (Mehlich III)')
    if (!dedupedMainNutrientsMap.has(key) || /mehlich|dtpa|kcl|hot|lamotte|ca|mg|iii|ii|i|tae|saturation|base|sulfur|sulphur|phosphorus|potassium|magnesium|calcium|sodium|aluminium|aluminum|hydrogen|other/i.test(n.name)) {
      dedupedMainNutrientsMap.set(key, n);
    }
  });
  const dedupedMainNutrients = Array.from(dedupedMainNutrientsMap.values()).filter(n => {
    const match = allowedNutrients.some(an => n.name.toLowerCase().includes(an.toLowerCase()));
    return match;
  }).map(n => {
    const mainName = n.name.split('(')[0].trim();
    function safeNum(val) {
      if (typeof val === 'string' && val.includes('<')) return 0;
      if (typeof val === 'string') return parseFloat(val) || 0;
      if (typeof val === 'number') return val;
      return 0;
    }
    const current = safeNum(n.current);
    const ideal = safeNum(n.ideal);
    let deviation = 0;
    if (ideal > 0) {
      deviation = ((current - ideal) / ideal) * 100;
    }
    let status = 'optimal';
    if (deviation < -25) status = 'low';
    else if (deviation > 25) status = 'high';
    return { ...n, name: mainName, current, ideal, status };
  });

  // Deduplicate unifiedNutrientRows by canonical name, but for base saturation nutrients, always keep the '%' version if present
  const baseSaturationNames = [
    'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other Bases', 'Other_Bases'
  ];
  const dedupedUnifiedNutrientRowsMap = new Map();
  unifiedNutrientRows.forEach(n => {
    const key = canonicalName(n.name);
    if (baseSaturationNames.includes(n.name)) {
      // Always overwrite with the % version if found
      if (n.unit === '%') {
        dedupedUnifiedNutrientRowsMap.set(key, n);
      } else if (!dedupedUnifiedNutrientRowsMap.has(key)) {
        dedupedUnifiedNutrientRowsMap.set(key, n);
      }
    } else {
      if (!dedupedUnifiedNutrientRowsMap.has(key)) {
        dedupedUnifiedNutrientRowsMap.set(key, n);
      }
    }
  });

  const dedupedUnifiedNutrientRows = Array.from(dedupedUnifiedNutrientRowsMap.values());

  // Use dedupedMainNutrients and dedupedUnifiedNutrientRows in tables
  // In TotalNutrientApplicationTable and ComprehensiveNutrientTable, use .map((n, idx) => <tr key={n.name + '_' + idx} ...>)

  // Add SoilReportExportSummary component
  const SoilReportExportSummary = React.forwardRef<HTMLDivElement, {
    nutrients: typeof mockNutrients,
    paddocks: string[],
    generalComments: string,
    soilAmendments?: any,
    seedTreatment?: any,
    soilDrench?: any,
    foliarSpray?: any,
    tankMixing?: any,
    pdfAttachments?: any,
    agronomist?: { name: string; email: string }
  }>((props, ref) => {
    return (
      <div ref={ref} className="p-10 bg-white text-black w-full min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold" style={{ color: '#8cb33a', letterSpacing: '-2px' }}>NTS</span>
            <span className="text-xs font-medium text-gray-600 -mt-1">Nutri-Tech Solutions<sup>®</sup></span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-700">Soil Therapy<sup>™</sup></span>
            <span className="text-3xl font-bold text-gray-700 -mt-2">Report</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: '#8cb33a', letterSpacing: '-1px' }}>Nutrition</span>
            <span className="text-2xl font-bold" style={{ color: '#8cb33a', letterSpacing: '-1px', marginTop: '-0.5rem' }}>Farming<sup>®</sup></span>
          </div>
        </div>
        <div style={{ height: '4px', background: '#8cb33a', width: '100%', marginBottom: '1.5rem' }} />
        <div className="mb-4 text-2xl font-bold text-black">Paddock: {props.paddocks && props.paddocks[0]}</div>
        {/* Nutrient Summary and General Comments grouped on first page */}
        <div className="mb-8">
          <NutrientSummary nutrients={dedupedMainNutrients} />
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#8cb33a' }}>General Comments</h2>
          <div className="text-base whitespace-pre-line bg-gray-50 rounded-lg p-4 border border-gray-200">{props.generalComments}</div>
        </div>
        <div className="mb-36" />
        {/* Page break for Product Recommendation and following sections */}
        <div style={{ pageBreakBefore: 'always' }} />
        {/* Product Recommendation title */}
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#8cb33a' }}>Product Recommendation</h2>
        {/* Soil Amendments Summary */}
        {props.soilAmendments && (
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#8cb33a' }}>Soil Amendments</h2>
            <ul className="list-disc ml-6 text-base">
              {props.soilAmendments.map((item: any, idx: number) => (
                <li key={idx} className="mb-1">
                  <span className="font-semibold">{item.fertilizer}</span> at a rate of {item.rate} {item.unit}
                  {item.contains && item.contains.length > 0 && (
                    <span className="text-gray-600"> (Contains: {item.contains.join(', ')})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Seed Treatment, Soil Drench, Foliar Spray (bulleted lists) */}
        {props.seedTreatment && (
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#8cb33a' }}>Seed Treatment</h2>
            <ul className="list-disc ml-6 text-base">
              {props.seedTreatment.map((product: any) => (
                <li key={product.id} className="mb-1">
                  <span className="font-semibold">{product.product}</span> at a rate of {product.rate} {product.unit}
                </li>
              ))}
            </ul>
          </div>
        )}
        {props.soilDrench && (
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#8cb33a' }}>Soil Drench</h2>
            <ul className="list-disc ml-6 text-base">
              {props.soilDrench.map((product: any) => (
                <li key={product.id} className="mb-1">
                  <span className="font-semibold">{product.product}</span> at a rate of {product.rate} {product.unit}
                </li>
              ))}
            </ul>
          </div>
        )}
        {props.foliarSpray && (
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#8cb33a' }}>Foliar Spray</h2>
            <ul className="list-disc ml-6 text-base">
              {props.foliarSpray.map((product: any) => (
                <li key={product.id} className="mb-1">
                  <span className="font-semibold">{product.product}</span> at a rate of {product.rate} {product.unit}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Tank Mixing Sequence */}
        {props.tankMixing && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#8cb33a' }}>General Tank Mixing Sequence</h2>
            <table className="w-full text-sm border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-b">Order</th>
                  <th className="p-2 border-b">Product Description</th>
                  <th className="p-2 border-b">Products</th>
                  <th className="p-2 border-b">Notes</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(props.tankMixing) ? props.tankMixing : []).map((item: any) => (
                  <tr key={item.id}>
                    <td className="p-2 border-b text-center">{item.sequence}</td>
                    <td className="p-2 border-b">{item.productDescription}</td>
                    <td className="p-2 border-b">{item.products && item.products.length > 0 ? item.products.join(', ') : '-'}</td>
                    <td className="p-2 border-b">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Move the signature info before the footer */}
        <div className="mt-8">
          <div className="text-base font-semibold mt-4">
            {props.agronomist?.name}<br />
            Agronomist<br />
            {props.agronomist?.email}
          </div>
        </div>
      </div>
    );
  });

  // --- Add this utility function (copied from SoilAmendments) ---
  function calculateTotalNewValue(nutrient, selectedFertilizers, fertilizerRates, fertilizerDefs, nutrients) {
    let totalAdded = 0;
    Object.entries(selectedFertilizers).forEach(([selectedFor, fertList]) => {
      if (!Array.isArray(fertList)) return;
      fertList.forEach(fertName => {
        const fert = (fertilizerDefs[selectedFor] || []).find(f => f.name === fertName);
        if (fert && fert.contains && fert.contains.includes(nutrient.name)) {
          const percent = fert.nutrientContent[nutrient.name] || 0;
          let rate = fertilizerRates[fertName];
          if (rate === undefined) {
            // Use capped value if not set
            const nObj = nutrients.find(nu => nu.name === selectedFor) || { name: '', current: 0, ideal: 0, unit: '', status: 'low' };
            // Use SoilAmendments' calculateRequirement logic if needed (not shown here for brevity)
            rate = 0;
          }
          totalAdded += (rate * percent) / 100;
        }
      });
    });
    return nutrient.current + totalAdded;
  }

  // Extracted TotalNutrientApplicationTable component
  function TotalNutrientApplicationTable({
    mainNutrients,
    nutrients,
    soilAmendmentsSummary,
    seedTreatmentProducts,
    soilDrenchProducts,
    foliarSprayProducts,
    soilAmendmentFerts,
    seedTreatmentDefs,
    soilDrenchDefs,
    foliarSprayDefs,
    heading,
    showSourceBreakdown = true,
    newNutrientLevels = {},
  }) {
    // Helper: get nutrient percent from product definition (never assume 100% unless only one nutrient and no percent specified)
    function getNutrientPercentFromDef(productDef, nutrient) {
      if (!productDef) return 0;
      if (productDef.nutrientPercents && Array.isArray(productDef.nutrientPercents)) {
        for (const np of productDef.nutrientPercents) {
          if (typeof np === 'string' && np.includes(nutrient)) {
            const match = np.match(/([0-9.]+)%/);
            if (match) return parseFloat(match[1]);
          }
        }
      }
      if (productDef.nutrientContent && typeof productDef.nutrientContent[nutrient] === 'number') {
        return productDef.nutrientContent[nutrient];
      }
      // Only assume 100% if only one nutrient and no percent specified
      if (productDef.contains && productDef.contains.length === 1) {
        return 100;
      }
      return 0;
    }

    // Helper to find product definition by label
    function findProductDef(label, defs) {
      return defs.find(p => p.label === label);
    }

    // Helper: convert rate to kg/ha if possible
    function getKgHa(rate, unit) {
      if (!rate || !unit) return 0;
      if (unit === 'kg/ha') return parseFloat(rate);
      if (unit === 'g/ha') return parseFloat(rate) / 1000;
      if (unit === 'L/ha') return parseFloat(rate); // Assume 1 L = 1 kg
      if (unit === 'ml/ha') return parseFloat(rate) / 1000; // 1 ml = 0.001 kg
      return 0;
    }

    // Helper: get section/source name for a product
    function getSource(product) {
      // Robustly determine the section for each product
      if (product.fertilizer) return 'Soil Amendment';
      if (product.unit && product.unit.includes('tonne of seed')) return 'Seed Treatment';
      if (product.unit && (product.unit.includes('ml/ha') || product.unit.includes('L/ha'))) return 'Soil Drench';
      if (product.unit && (product.unit.includes('g/ha') || product.unit.includes('kg/ha'))) {
        if (product.product && typeof product.product === 'string') {
          if (findProductDef(product.product, seedTreatmentDefs)) return 'Seed Treatment';
          if (findProductDef(product.product, soilDrenchDefs)) return 'Soil Drench';
          if (findProductDef(product.product, foliarSprayDefs)) return 'Foliar Spray';
        }
        // If product was passed in from a specific section, use a fallback
        if (product.section) return product.section;
        if (product.source) return product.source;
        return 'Other';
      }
      // Fallback: check for explicit section/source property
      if (product.section) return product.section;
      if (product.source) return product.source;
      return 'Other';
    }

    // Helper: get required amount for each nutrient (in kg/ha)
    function getRequiredKgHa(nutrient: string): number {
      const nutrientObj = nutrients.find((nu: any) => nu.name === nutrient);
      if (!nutrientObj) return 0;
      // ppm to kg/ha conversion (same as in SoilAmendments)
      const ppmToKgHa = (ppm: number): number => parseFloat(String(ppm)) * 2.4;
      const ideal = Number(nutrientObj.ideal);
      const current = Number(nutrientObj.current);
      const idealKgHa = Number(ppmToKgHa(ideal));
      const currentKgHa = Number(ppmToKgHa(current));
      const diff = Number(idealKgHa) - Number(currentKgHa);
      return Math.max(diff, 0);
    }

    // Helper: get requirement status and color
    function getRequirementStatus(nutrient, totalApplied, required) {
      if (required === 0) return { status: 'No Requirement', color: 'text-gray-400' };
      let deviation = 0;
      if (required > 0) {
        deviation = ((totalApplied - required) / required) * 100;
      }
      if (deviation >= -25 && deviation <= 25) return { status: 'Requirement Fulfilled', color: 'text-green-700 font-semibold' };
      if (deviation < -25 && deviation >= -1000) return { status: 'Requirement not Fulfilled', color: 'text-red-600 font-semibold' };
      if (deviation > 25 && deviation <= 1000) return { status: 'Requirement Exceeded more than 25%', color: 'text-blue-700 font-bold' };
      return { status: 'No Requirement', color: 'text-gray-400' };
    }

    // Collect all products from all sections
    const allProducts = [];
    if (soilAmendmentsSummary) allProducts.push(...soilAmendmentsSummary);
    if (seedTreatmentProducts) allProducts.push(...seedTreatmentProducts);
    if (soilDrenchProducts) allProducts.push(...soilDrenchProducts);
    if (foliarSprayProducts) allProducts.push(...foliarSprayProducts);

    // Map of nutrient -> { total, sources: { [source]: amount } }
    const nutrientTotals = {};
    allProducts.forEach(product => {
      // If product has explicit nutrientContent, always add to sources
      if (product.nutrientContent && typeof product.nutrientContent === 'object') {
        Object.entries(product.nutrientContent).forEach(([nutrient, percent]) => {
          if (typeof percent !== 'number' || percent <= 0) return;
          const source = getSource(product);
          let rateKgHa = getKgHa(product.rate, product.unit);
          if (!nutrientTotals[nutrient]) nutrientTotals[nutrient] = { total: 0, sources: {} };
          if (rateKgHa > 0) {
            const actualNutrientApplied = (rateKgHa * percent) / 100;
            nutrientTotals[nutrient].total = (nutrientTotals[nutrient].total || 0) + actualNutrientApplied;
            nutrientTotals[nutrient].sources[source] = (nutrientTotals[nutrient].sources[source] || 0) + actualNutrientApplied;
          } else {
            // For non-kg/ha units, just show the rate/unit in the breakdown
            const label = `${source}: ${product.rate} ${product.unit}`;
            nutrientTotals[nutrient].sources[label] = 'shown';
          }
        });
        return;
      }
      // Soil Amendments summary direct value
      if (product.nutrient && typeof product.actualNutrientApplied === 'number') {
        const nutrient = product.nutrient;
        const actualNutrientApplied = product.actualNutrientApplied;
        const source = getSource(product);
        if (!nutrientTotals[nutrient]) nutrientTotals[nutrient] = { total: 0, sources: {} };
        nutrientTotals[nutrient].total = (nutrientTotals[nutrient].total || 0) + actualNutrientApplied;
        nutrientTotals[nutrient].sources[source] = (nutrientTotals[nutrient].sources[source] || 0) + actualNutrientApplied;
        return;
      }
      // Fallback: try to use productDef if available
      let productDef = null;
      let isSoilAmendment = false;
      let rateKgHa = getKgHa(product.rate, product.unit);
      if (product.fertilizer) {
        productDef = soilAmendmentFerts[product.fertilizer];
        isSoilAmendment = true;
      } else if (product.product && typeof product.product === 'string') {
        productDef = findProductDef(product.product, seedTreatmentDefs) || findProductDef(product.product, soilDrenchDefs) || findProductDef(product.product, foliarSprayDefs);
      }
      const source = getSource(product);
      if (isSoilAmendment && productDef && productDef.nutrientContent) {
        Object.entries(productDef.nutrientContent).forEach(([nutrient, percent]) => {
          if (typeof percent !== 'number' || percent <= 0) return;
          if (!nutrientTotals[nutrient]) nutrientTotals[nutrient] = { total: 0, sources: {} };
          if (rateKgHa > 0) {
            const actualNutrientApplied = (rateKgHa * percent) / 100;
            nutrientTotals[nutrient].total = (nutrientTotals[nutrient].total || 0) + actualNutrientApplied;
            nutrientTotals[nutrient].sources[source] = (nutrientTotals[nutrient].sources[source] || 0) + actualNutrientApplied;
          } else {
            const label = `${source}: ${product.rate} ${product.unit}`;
            nutrientTotals[nutrient].sources[label] = 'shown';
          }
        });
      } else if (productDef) {
        const contains = productDef.contains || product.contains || [];
        contains.forEach(nutrient => {
          let percent = getNutrientPercentFromDef(productDef, nutrient);
          if (!percent && productDef && productDef.contains && productDef.contains.length === 1) percent = 100;
          if (!percent && product.nutrientContent && typeof product.nutrientContent[nutrient] === 'number') {
            percent = product.nutrientContent[nutrient];
          }
          if (!percent && product.nutrientPercents && Array.isArray(product.nutrientPercents)) {
            for (const np of product.nutrientPercents) {
              if (typeof np === 'string' && np.includes(nutrient)) {
                const match = np.match(/([0-9.]+)%/);
                if (match) percent = parseFloat(match[1]);
              }
            }
          }
          if (!nutrientTotals[nutrient]) nutrientTotals[nutrient] = { total: 0, sources: {} };
          if (percent > 0 && rateKgHa > 0) {
            const actualNutrientApplied = (rateKgHa * percent) / 100;
            nutrientTotals[nutrient].total = (nutrientTotals[nutrient].total || 0) + actualNutrientApplied;
            nutrientTotals[nutrient].sources[source] = (nutrientTotals[nutrient].sources[source] || 0) + actualNutrientApplied;
          } else if (percent > 0) {
            const label = `${source}: ${product.rate} ${product.unit}`;
            nutrientTotals[nutrient].sources[label] = 'shown';
          }
        });
      }
    });
    // Define the desired nutrient order
    const nutrientOrder = [
      'CEC', 'pH-level (1:5 water)', 'Organic Matter (Calc)',
      'Calcium', 'Magnesium', 'Potassium', 'Phosphorus', 'Sulphur', 'Nitrate', 'Ammonium',
      'Boron', 'Iron', 'Copper', 'Manganese', 'Zinc', 'Aluminium', 'Sodium'
    ];
    // Build a map for quick lookup
    const mainNutrientMap = {};
    nutrientOrder.forEach(name => {
      const n = findNutrientByName(mainNutrients, name);
      if (n) mainNutrientMap[name.toLowerCase()] = n;
    });
    const isNutritionalSituation = heading === 'Nutritional Situation';
    const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
    const sortedNutrients = React.useMemo(() => {
      // Calculate all derived values for each nutrient before sorting
      const nutrientsWithDerived = mainNutrients.map(n => {
        const nutrient = n.name;
        const data = nutrientTotals[nutrient] || { total: 0, sources: {} };
        const totalApplied = Number(data.total) || 0; // kg/ha from all sources
        const requiredPpm = Math.max(n.ideal - n.current, 0);
        const required = getRequiredKgHa(nutrient);
        const originalPpm = n.current;
        const targetPpm = n.ideal;
        const totalAppliedPpm = totalApplied / 2.4;
        const newPpm = originalPpm + totalAppliedPpm;
        const stillRequired = Math.max(requiredPpm - totalAppliedPpm, 0);
        let deviation = 0;
        if (targetPpm > 0) {
          deviation = ((newPpm - targetPpm) / targetPpm) * 100;
        }
        let nutritionalStatus = 'Optimal';
        if (deviation < -25) nutritionalStatus = 'Deficient';
        else if (deviation > 25) nutritionalStatus = 'Excessive';
        return {
          ...n,
          newPpm,
          deviation,
          nutritionalStatus,
          requiredPpm, // for Total Required (ppm)
          totalAppliedPpm, // for Total Recommended (ppm)
          stillRequired,
        };
      });
      if (!sortConfig.key) return nutrientsWithDerived;
      const sorted = [...nutrientsWithDerived].sort((a, b) => {
        if (a[sortConfig.key] == null) return 1;
        if (b[sortConfig.key] == null) return -1;
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }, [mainNutrients, sortConfig, nutrientTotals]);
    return (
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <table className="w-full text-sm border border-gray-300 rounded-lg overflow-hidden text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b text-left cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'name', direction: s.key === 'name' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Nutrient {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'current', direction: s.key === 'current' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Original Level (ppm) {sortConfig.key === 'current' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'ideal', direction: s.key === 'ideal' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Target Level (ppm) {sortConfig.key === 'ideal' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              {!isNutritionalSituation && <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'totalApplied', direction: s.key === 'totalApplied' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Total Required (ppm) {sortConfig.key === 'totalApplied' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>}
              {!isNutritionalSituation && <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'totalRecommended', direction: s.key === 'totalRecommended' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Total Recommended (ppm) {sortConfig.key === 'totalRecommended' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>}
              <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'newPpm', direction: s.key === 'newPpm' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                New Level (ppm) {sortConfig.key === 'newPpm' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              {!isNutritionalSituation && <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'stillRequired', direction: s.key === 'stillRequired' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Still Required (ppm) {sortConfig.key === 'stillRequired' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>}
              <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'deviation', direction: s.key === 'deviation' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Deviation ({sortConfig.key === 'deviation' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}%)
              </th>
              <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'nutritionalStatus', direction: s.key === 'nutritionalStatus' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Nutritional Status {sortConfig.key === 'nutritionalStatus' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="p-2 border-b text-right">Nutritional Score</th>
              {showSourceBreakdown && !isNutritionalSituation && <th className="p-2 border-b text-right cursor-pointer" onClick={() => setSortConfig(s => ({ key: 'sourceBreakdown', direction: s.key === 'sourceBreakdown' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                Source Breakdown ({sortConfig.key === 'sourceBreakdown' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}%)
              </th>}
            </tr>
          </thead>
          <tbody>
            {sortedNutrients.map((n, idx) => {
              const nutrient = n.name;
              const data = nutrientTotals[nutrient] || { total: 0, sources: {} };
              const totalApplied = Number(data.total) || 0; // kg/ha from all sources
              const requiredPpm = Math.max(n.ideal - n.current, 0);
              const required = getRequiredKgHa(nutrient);
              const { status, color } = getRequirementStatus(nutrient, totalApplied, required);
              const originalPpm = n.current;
              const targetPpm = n.ideal;
              // Calculate total applied in ppm (not kg/ha)
              const totalAppliedPpm = totalApplied / 2.4;
              // New Level (ppm) = from newNutrientLevels if available, else original + total applied
              const newPpm = (newNutrientLevels && typeof newNutrientLevels[nutrient] === 'number') ? newNutrientLevels[nutrient] : (originalPpm + totalAppliedPpm);
              let deviation = 0;
              if (targetPpm > 0) {
                deviation = ((newPpm - targetPpm) / targetPpm) * 100;
              }
              let deviationColor = 'text-green-700 font-semibold';
              if (deviation < -25) deviationColor = 'text-red-600 font-semibold';
              else if (deviation > 25) deviationColor = 'text-blue-700 font-bold';
              // Row color logic
              let rowBg = '';
              if (deviation >= -25 && deviation <= 25) rowBg = 'bg-green-50';
              else if (deviation < -25 && deviation >= -1000) rowBg = 'bg-red-50';
              else if (deviation > 25 && deviation <= 1000) rowBg = 'bg-blue-50';
              // Nutritional Status logic
              let nutritionalStatus = 'Optimal';
              if (deviation < -25) nutritionalStatus = 'Deficient';
              else if (deviation > 25) nutritionalStatus = 'Excessive';
              // Nutritional Score calculation (use smoothScore)
              let devFrac = 0;
              let nutritionalScore = NaN;
              if (typeof newPpm === 'number' && typeof targetPpm === 'number' && targetPpm !== 0) {
                devFrac = (newPpm - targetPpm) / targetPpm;
                nutritionalScore = smoothScore(devFrac);
              }
              return (
                <tr key={nutrient + '_' + (n.category || idx)} className={rowBg}>
                  <td className="p-2 border-b align-middle font-medium">{nutrient}</td>
                  <td className="p-2 border-b align-middle text-right">{typeof originalPpm === 'number' && !isNaN(originalPpm) ? originalPpm.toFixed(1) : '-'}</td>
                  <td className="p-2 border-b align-middle text-right">{typeof targetPpm === 'number' && !isNaN(targetPpm) ? targetPpm.toFixed(1) : '-'}</td>
                  {!isNutritionalSituation && <td className="p-2 border-b align-middle text-right">{typeof requiredPpm === 'number' && !isNaN(requiredPpm) ? requiredPpm.toFixed(1) : '-'}</td>}
                  {!isNutritionalSituation && <td className="p-2 border-b align-middle text-right">{typeof totalAppliedPpm === 'number' && !isNaN(totalAppliedPpm) ? totalAppliedPpm.toFixed(2) : '-'}</td>}
                  <td className="p-2 border-b align-middle text-right">{typeof newPpm === 'number' && !isNaN(newPpm) ? newPpm.toFixed(1) : '-'}</td>
                  {!isNutritionalSituation && <td className="p-2 border-b align-middle text-right">{typeof (requiredPpm - totalAppliedPpm) === 'number' && !isNaN(requiredPpm - totalAppliedPpm) ? Math.max(requiredPpm - totalAppliedPpm, 0).toFixed(1) : '-'}</td>}
                  <td className={"p-2 border-b align-middle text-right " + deviationColor}>{typeof deviation === 'number' && !isNaN(deviation) ? deviation.toFixed(1) + '%' : '-'}</td>
                  <td className="p-2 border-b align-middle text-right">{nutritionalStatus}</td>
                  <td className="p-2 border-b align-middle text-right">{isNaN(nutritionalScore) ? 'NaN' : nutritionalScore.toFixed(1)}</td>
                  {showSourceBreakdown && !isNutritionalSituation && (
                    <td className="p-2 border-b align-middle text-right">
                      <div className="text-xs text-gray-700 text-left">
                        {Object.entries(data.sources).length > 0 ? (
                          Object.entries(data.sources).map(([source, amount]) => {
                            if (amount === 'shown') {
                              // Show the label as is (for non-kg/ha units)
                              return <div key={source}>{source}</div>;
                            }
                            const percent = (typeof amount === 'number' && typeof totalApplied === 'number' && totalApplied > 0)
                              ? (amount / totalApplied) * 100
                              : 0;
                            return (
                              <div key={source}>{source}: {percent.toFixed(1)}%</div>
                            );
                          })
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // --- PDF parsing logic ---
  const handleFileUpload = async (file: File) => {
    if (isUploading) return; // Prevent multiple uploads

    setIsUploading(true);
    try {
      // Removed debug logging
      debugger
      setUploadedFile(file);
      try {
        let filename = file.name
        let filename_parts = filename.split("..")
        setReportRefId(null)
        console.log("FILENAME", filename_parts)
        let ref = ""
        if (filename_parts.length > 0) {
          // UUID v1-v5 regex
          const uuidRegex: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

          const uuids: string[] = filename_parts.filter((str: string) => uuidRegex.test(str));
          console.log(uuids);
          if (uuids.length > 0) {
            ref = uuids[0]
          }
        }
        setReportRefId(ref)

      } catch (e) {
          console.error(e);
          
      }
      // Send file to backend for parsing
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/extract-soil-report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // Removed debug logging for backend response

      if (result.error) {
        throw new Error(result.error);
      }
      if (result.lamotte) {
        setLamotteFromBackend(result.lamotte);
        console.log('DEBUG - lamotteFromBackend:', result.lamotte);
      } else {
        setLamotteFromBackend(null);
      }
      let nutrient_overview = result?.nutrient_overview

      // Handle multiple analyses like plant report generator
      if (result.analyses && Array.isArray(result.analyses) && result.analyses.length > 0) {
        // Removed debug logging for analyses count

        setAvailableAnalyses(result.analyses);
        setSelectedAnalysisIndex(0);

        // Group analyses by paddock name to combine nutrients from the same paddock across pages
        const paddockGroups = {};
        result.analyses.forEach((analysis, index) => {
          // Removed debug logging for analysis processing
          if (analysis && (analysis.nutrients || analysis.info?.paddock || analysis.name)) {
            // Use the real paddock name from the backend, fallback to analysis name if paddock is not available
            const realPaddockName = analysis.info?.paddock || analysis.paddock || analysis.name || `Analysis ${index + 1}`;
            // Removed debug logging for analysis mapping

            if (!paddockGroups[realPaddockName]) {
              paddockGroups[realPaddockName] = {
                analysisId: `paddock-${index + 1}`,
                name: realPaddockName,
                paddock: realPaddockName,
                nutrients: [],
                analyses: []
              };
              // Removed debug logging for paddock group creation
            }

            // Add nutrients from this analysis to the paddock group
            if (analysis.nutrients && Array.isArray(analysis.nutrients)) {
              // Removed debug logging for nutrient addition

              // Add nutrients to the group
              paddockGroups[realPaddockName].nutrients.push(...analysis.nutrients);
            } else {
              // Removed debug logging for missing nutrients
            }
            paddockGroups[realPaddockName].analyses.push(analysis);
          } else {
            // Removed debug logging for skipped analysis
          }
        });

        // Removed debug logging for final paddock groups

        // Create paddock reports from the grouped data, with priority for main testing methods
        const newPaddockReports = Object.values(paddockGroups).map((group, index) => {
          // Removed debug logging for paddock report creation

          // Prioritize main testing methods over TAE values
          const prioritizedNutrients = [];
          const nutrientMap = new Map();

          // First pass: collect all nutrients
          (group as any).nutrients.forEach(nutrient => {
            const name = nutrient.name;
            if (!nutrientMap.has(name)) {
              nutrientMap.set(name, []);
            }
            nutrientMap.get(name).push(nutrient);
          });

          // Second pass: prioritize main testing methods
          nutrientMap.forEach((nutrients, name) => {
            // Removed debug logging

            if (nutrients.length === 1) {
              // Only one version, use it
              // Removed debug logging
              prioritizedNutrients.push(nutrients[0]);
            } else {
              // Multiple versions - prioritize main testing methods and exclude LaMotte/TAE for main nutrients
              const taeNutrients = nutrients.filter(n => n.category === 'tae');
              const nonTaeNutrients = nutrients.filter(n => n.category !== 'tae');

              // Removed debug logging

              // For non-TAE nutrients, prioritize main testing methods
              if (nonTaeNutrients.length > 0) {
                const mainMethods = [
                  ' (Mehlich III)',
                  ' (KCl)',
                  ' (DTPA)',
                  ' (Hot CaCl2)',
                  ' (CaCl2)',
                  ' (LECO)',
                  ' (Calc)',
                  ' (1:5 water)'
                ];

                // Find the nutrient with the highest priority method
                let bestNutrient = nonTaeNutrients[0];
                let bestPriority = -1;

                nonTaeNutrients.forEach(nutrient => {
                  const method = nutrient.name.replace(name, '');
                  const priority = mainMethods.findIndex(m => method.includes(m));
                  // Removed debug logging
                  if (priority > bestPriority) {
                    bestPriority = priority;
                    bestNutrient = nutrient;
                    // Removed debug logging
                  }
                });

                // Removed debug logging
                prioritizedNutrients.push(bestNutrient);
              }

              // Always preserve TAE nutrients

              taeNutrients.forEach(taeNutrient => {

                prioritizedNutrients.push(taeNutrient);

              });
            }
          });
          let current_nutrient_overview = {}
          if (nutrient_overview) {

            current_nutrient_overview = nutrient_overview[(group as any).paddock]
          }
          const safeNutrientOverview = current_nutrient_overview ?? {};
          // Removed debug logging for paddock nutrients
          console.log('current_nutrient_overview', current_nutrient_overview);
          let phosphorusMonitoringText = current_nutrient_overview?.['Phosphorus Monitoring']
          return {
            analysisId: (group as any).analysisId,
            name: (group as any).name,
            paddock: (group as any).paddock,
            data: {
              nutrients: prioritizedNutrients,
              somCecText: current_nutrient_overview?.['CEC'] ?? 'Soil organic matter and CEC analysis will be generated based on your uploaded data.',
              cecText: current_nutrient_overview?.['CEC'] ?? 'Soil organic matter and CEC analysis will be generated based on your uploaded data.',
              baseSaturationText: current_nutrient_overview?.['Base Saturation'] ?? 'Base saturation analysis will be generated based on your uploaded data.',
              phText: current_nutrient_overview?.['Soil pH'] ?? 'Soil pH analysis will be generated based on your uploaded data.',
              availableNutrientsText: current_nutrient_overview?.['Available Nutrients'] ?? 'Available nutrients analysis will be generated based on your uploaded data.',
              soilReservesText: current_nutrient_overview?.['Organic Matter'] ?? 'Soil reserves analysis will be generated based on your uploaded data.',
              lamotteReamsText: current_nutrient_overview?.['Lamotte Reams'] ?? 'LaMotte/Reams analysis will be generated based on your uploaded data.',
              taeText: current_nutrient_overview?.['TAE'] ?? 'Total Available Elements (TAE) analysis will be generated based on your uploaded data.',
              phosphorusMonitoringText: current_nutrient_overview?.['Phosphorus Monitoring'] ?? 'Phosphorus Monitoring analysis will be generated based on your uploaded data.',
              organicMatterText: current_nutrient_overview?.['Organic Matter'] ?? '',

              generalComments: {
                organicMatter: '',
                cec: '',
                soilPh: '',
                baseSaturation: '',
                availableNutrients: '',
                lamotteReams: '',
                tae: '',
              },
              soilDrenchProducts: [],
              soilDrenchProgramProducts: [],
              seedTreatmentProducts: [],
              plantingBlendProducts: [],
              preFloweringFoliarProducts: [],
              preFloweringFoliarProducts2: [],
              nutritionalFoliarProducts: [],
              nutritionalFoliarProducts2: [],
              tankMixingItems: getDefaultTankMixingItemsCopy(),
              soilAmendmentsSummary: [],
              selectedAgronomist: { name: 'Marco Giorgio', role: 'Agronomist', email: 'marco@nutri-tech.com.au' },
              reportFooterText: `Disclaimer: Any recommendations provided by Nutri-Tech Solutions Pty Ltd are advice only. As no control can be exercised over storage; handling; mixing application or use; weather; plant or soil conditions before, during or after application (all of which may affect the performance of our program); no responsibility for, or liability for any failure in performance, losses, damages, or injuries (consequential or otherwise), arising from such storage, mixing, application, or use will be accepted under any circumstances whatsoever. The buyer assumes all responsibility for the use of any of our products.`
            },
            complete: false
          };
        });

        // Removed debug logging for created paddock reports
        console.log("newPaddockReports", newPaddockReports)
        setPaddockReports(newPaddockReports);
        setSelectedPaddockIndex(0);

        // Set nutrients for the first analysis
        const firstPaddock = newPaddockReports[0];
        if (firstPaddock && firstPaddock.data.nutrients && Array.isArray(firstPaddock.data.nutrients)) {
          // Removed debug logging for first paddock nutrients
          setNutrients(firstPaddock.data.nutrients);
        }
      } else if (Array.isArray(result.nutrients)) {
        // Single analysis fallback
        setNutrients(result.nutrients);
        setAvailableAnalyses([{ id: 'single', name: 'Single Analysis', nutrients: result.nutrients }]);
        setSelectedAnalysisIndex(0);
        setPaddockReports([{
          analysisId: 'single',
          name: 'Single Analysis',
          paddock: 'Single Analysis',
          data: {
            nutrients: result.nutrients,
            somCecText: 'Soil organic matter and CEC analysis will be generated based on your uploaded data.',
            baseSaturationText: 'Base saturation analysis will be generated based on your uploaded data.',
            phText: 'Soil pH analysis will be generated based on your uploaded data.',
            availableNutrientsText: 'Available nutrients analysis will be generated based on your uploaded data.',
            soilReservesText: 'Soil reserves analysis will be generated based on your uploaded data.',
            lamotteReamsText: 'LaMotte/Reams analysis will be generated based on your uploaded data.',
            taeText: 'Total Available Elements (TAE) analysis will be generated based on your uploaded data.',
            generalComments: {
              organicMatter: '',
              cec: '',
              soilPh: '',
              baseSaturation: '',
              availableNutrients: '',
              lamotteReams: '',
              tae: '',
            },
            soilDrenchProducts: [],
            soilDrenchProgramProducts: [],
            seedTreatmentProducts: [],
            plantingBlendProducts: [],
            preFloweringFoliarProducts: [],
            preFloweringFoliarProducts2: [],
            nutritionalFoliarProducts: [],
            nutritionalFoliarProducts2: [],
            tankMixingItems: getDefaultTankMixingItemsCopy(),
            soilAmendmentsSummary: [],
            selectedAgronomist: { name: 'Marco Giorgio', role: 'Agronomist', email: 'marco@nutri-tech.com.au' },
            reportFooterText: `Disclaimer: Any recommendations provided by Nutri-Tech Solutions Pty Ltd are advice only. As no control can be exercised over storage; handling; mixing application or use; weather; plant or soil conditions before, during or after application (all of which may affect the performance of our program); no responsibility for, or liability for any failure in performance, losses, damages, or injuries (consequential or otherwise), arising from such storage, mixing, application, or use will be accepted under any circumstances whatsoever. The buyer assumes all responsibility for the use of any of our products.`
          },
          complete: false
        }]);
        setSelectedPaddockIndex(0);
      } else {
        setNutrients([]);
        setAvailableAnalyses([]);
        setPaddockReports([]);
      }

      // Removed debug logging for file upload completion
    } catch (err) {
      console.error('Error parsing PDF:', err);
      alert('Failed to parse PDF. Please check your file or try a different one.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (isGeneratingReport) return; // Prevent multiple clicks

    setIsGeneratingReport(true);
    try {
      // Simulate report generation time (you can adjust this or remove it)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowReport(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Removed handleSaveReport function - no longer needed

  const handleExportPDF = async () => {
    if (isExporting) return; // Prevent multiple exports

    setIsExporting(true);
    try {
      // Save the current paddock's data before exporting
      saveCurrentPaddockReport(currentPaddockData);

      if (!paddockReports || paddockReports.length === 0) {
        console.error('No paddock reports available for export');
        alert('No paddock reports available for export. Please upload a file first.');
        return;
      }

      // Calculate soil amendments for all paddocks before export (only if no manual fertilizers added)
      const calculateSoilAmendmentsForAllPaddocks = () => {
        paddockReports.forEach((paddock, idx) => {
          // Check if user has manually added fertilizers for this paddock
          const hasManualFertilizers = paddock.data.soilAmendmentsSummary &&
            paddock.data.soilAmendmentsSummary.length > 0;

          // Only calculate automatic amendments if no manual fertilizers were added
          if (!hasManualFertilizers) {
            // Define fertilizer definitions inline (copied from SoilCorrections.tsx)
            const fertilizerDefs = [
              { label: 'Calcium Nitrate', nutrientContent: { Calcium: 19, Nitrate: 12 } },
              { label: 'Potassium Nitrate', nutrientContent: { Potassium: 44, Nitrate: 13 } },
              { label: 'Ammonium Sulfate', nutrientContent: { Ammonium: 21, Sulphur: 24 } },
              { label: 'Monoammonium Phosphate (MAP)', nutrientContent: { Phosphorus: 22, Ammonium: 11 } },
              { label: 'Diammonium Phosphate (DAP)', nutrientContent: { Phosphorus: 20, Ammonium: 18 } },
              { label: 'Potassium Magnesium Sulfate', nutrientContent: { Potassium: 22, Magnesium: 11, Sulphur: 22 } },
              { label: 'Calcium Sulfate (Gypsum)', nutrientContent: { Calcium: 23, Sulphur: 18 } },
              { label: 'Magnesium Sulfate (Epsom Salt)', nutrientContent: { Magnesium: 10, Sulphur: 13 } },
              { label: 'Potassium Sulfate', nutrientContent: { Potassium: 44, Sulphur: 18 } },
              { label: 'Calcium Carbonate (Lime)', nutrientContent: { Calcium: 40 } },
              { label: 'Dolomite Lime', nutrientContent: { Calcium: 22, Magnesium: 13 } },
              { label: 'Boron', nutrientContent: { Boron: 17 } },
              { label: 'Copper Sulfate', nutrientContent: { Copper: 25, Sulphur: 13 } },
              { label: 'Iron Sulfate', nutrientContent: { Iron: 20, Sulphur: 11 } },
              { label: 'Manganese Sulfate', nutrientContent: { Manganese: 23, Sulphur: 13 } },
              { label: 'Zinc Sulfate', nutrientContent: { Zinc: 23, Sulphur: 11 } },
              { label: 'Molybdenum', nutrientContent: { Molybdenum: 54 } }
            ];

            const nutrients = paddock.data.nutrients || [];
            const deficientNutrients = nutrients.filter(n => {
              const isNumber = v => typeof v === 'number' && !isNaN(v);
              const needsCorrection = isNumber(n.current) && isNumber(n.ideal) && n.current < n.ideal;
              const isRelevant = n.category !== 'lamotte_reams' && n.category !== 'tae' && n.category !== 'base_saturation';
              return needsCorrection && isRelevant;
            });

            // Calculate soil amendments for this paddock
            const soilAmendments = [];
            deficientNutrients.forEach(nutrient => {
              // Find the best fertilizer for this nutrient
              const bestFertilizer = fertilizerDefs.find(fert =>
                fert.nutrientContent && fert.nutrientContent[nutrient.genericName || nutrient.name] > 0
              );

              if (bestFertilizer) {
                const nutrientName = nutrient.genericName || nutrient.name;
                const percent = bestFertilizer.nutrientContent[nutrientName] || 0;
                const required = Math.max(nutrient.ideal - nutrient.current, 0);
                const rate = (required * 2.4 * 100) / percent; // Convert ppm to kg/ha

                if (rate > 0) {
                  soilAmendments.push({
                    fertilizer: bestFertilizer.label,
                    nutrient: nutrientName,
                    rate: rate.toFixed(1),
                    unit: 'kg/ha',
                    contains: [nutrientName]
                  });
                }
              }
            });

            // Update the paddock data with soil amendments
            paddock.data.soilAmendmentsSummary = soilAmendments;
          }
        });
      };

      // Disabled automatic soil amendments calculation - only use manually added fertilizers
      // calculateSoilAmendmentsForAllPaddocks();

      // Create an array of paddock data for multi-paddock export
      const paddockDataArray = paddockReports.map((paddock, idx) => {
        const data = paddock.data;

        // Combine summary texts for this paddock
        const combinedSummary = [
          data.somCecText,
          data.baseSaturationText,
          data.phText,
          data.availableNutrientsText,
          data.soilReservesText,
          data.lamotteReamsText,
          data.taeText
        ].filter(text => text && text.trim()).join('\n\n');

        // Debug: Log what data is being used for PDF export
        console.log(`PDF Export DEBUG - Paddock ${idx} data:`, {
          somCecText: data.somCecText,
          baseSaturationText: data.baseSaturationText,
          phText: data.phText,
          availableNutrientsText: data.availableNutrientsText,
          lamotteReamsText: data.lamotteReamsText,
          taeText: data.taeText,
          organicMatterText: data.organicMatterText,
          cecText: data.cecText
        });

        const paddockData = {
          // Map soil report data to match plant report format
          paddockName: paddockReports[idx]?.paddock || paddockReports[idx]?.name || availableAnalyses[idx]?.info?.paddock || availableAnalyses[idx]?.paddock || availableAnalyses[idx]?.name || `Paddock ${idx + 1}`,
          summary: combinedSummary,

          // Product Recommendation Sections - Include all sections
          // 1. Seed Treatment
          seedTreatmentProducts: data.seedTreatmentProducts || seedTreatmentProducts || [],

          // 2. Planting Blend (from SeedTreatment component)
          plantingBlendProducts: data.plantingBlendProducts || [],

          // 3. Soil Amendments - Only include if manually added
          soilAmendments: (data.soilAmendmentsSummary && data.soilAmendmentsSummary.length > 0) ?
            data.soilAmendmentsSummary.map(item => ({
              ...item,
              description: getFertilizerDescription(item.fertilizer) || ''
            })) : [],

          // 4. Soil Drench (Fertigation)
          fertigationProducts: data.soilDrenchProducts || soilDrenchProducts || [],
          soilDrenchProducts: data.soilDrenchProducts || soilDrenchProducts || [],
          soilDrenchProgramProducts: data.soilDrenchProgramProducts || [],

          // 5. Pre-Flowering Foliar Spray
          preFloweringFoliarProducts: data.preFloweringFoliarProducts || [],

          // 6. Nutritional Foliar Spray
          nutritionalFoliarProducts: data.nutritionalFoliarProducts || nutritionalFoliarProducts || [],
          foliarSprayProducts: data.foliarSprayProducts || foliarSprayProducts || [],

          // 7. Tank Mixing Sequence
          tankMixing: (() => {
            const tankMixingData = data.tankMixingItems || tankMixingItems || getDefaultTankMixingItemsCopy();
            console.log('PDF DEBUG: Original tankMixingItems for paddock:', data.tankMixingItems);
            console.log('PDF DEBUG: Fallback tankMixingItems:', tankMixingItems);
            console.log('PDF DEBUG: Final tankMixingData:', tankMixingData);
            return tankMixingData.map(item => ({
              sequence: item.sequence,
              description: item.productDescription || '',
              products: Array.isArray(item.products) ? item.products.join(', ') : (item.products || ''),
              notes: item.notes || ''
            }));
          })(),

          // Additional data
          plantHealthScore: calculateSoilHealthScore(data.nutrients || dedupedMainNutrients),
          agronomist: data.selectedAgronomist || selectedAgronomist,
          reportFooterText: data.reportFooterText || reportFooterText,
          nutrients: data.nutrients || dedupedMainNutrients,
          // Soil-only comment fields for PDF export (no use of generalComments here)
          somCecText: data.somCecText || '',
          baseSaturationText: data.baseSaturationText || '',
          phText: data.phText || '',
          availableNutrientsText: data.availableNutrientsText || '',
          lamotteReamsText: data.lamotteReamsText || '',
          taeText: data.taeText || '',
          phosphorusMonitoringText: data.phosphorusMonitoringText || '',
          organicMatterText: data.organicMatterText || '',
          cecText: data.cecText || '',

          // Client info
          client: data.client || 'Soil Therapy Report',
          crop: data.crop || 'Soil Analysis',
          date: data.date || new Date().toISOString().slice(0, 10)
        };

        return paddockData;
      });

      // Use the actual paddock data instead of test data
      const result = await generateCustomPDF(
        paddockDataArray,
        {
          frontAttachments: frontAttachments || [],
          backAttachments: backAttachments || [],
          uploadedFile: uploadedFile
        }
      );
    } catch (error) {
      console.error('PDF Export error:', error);
      alert(`PDF Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate plant health score based on nutrient status
  function calculateSoilHealthScore(nutrients: any[]): number {
    if (!nutrients || nutrients.length === 0) return 0;

    // Use the same calculation as in ComprehensiveNutrientTable
    const scores = nutrients.map(n => {
      const value = n.current;
      const ideal = n.ideal;
      if (typeof ideal !== 'number' || ideal === 0 || ideal == null) {
        return NaN;
      }
      let devFrac = 0;
      if (typeof value === 'number' && typeof ideal === 'number' && ideal !== 0) {
        devFrac = (value - ideal) / ideal;
      }
      return smoothScore(devFrac);
    });
    const validScores = scores.filter(s => !isNaN(s));
    return validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  }

  const deficientNutrients = dedupedMainNutrients.filter(n => n.status === 'low').map(n => n.name);

  // Add this new component below NutritionalRatios
  const NutrientBarChart = ({ nutrients, onEditColorLogic, showXAxisRegions, getThresholds, sensitivity }) => {
    const [selectedBar, setSelectedBar] = useState(null); // index of selected bar
    const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
    const chartRef = useRef<HTMLDivElement>(null);
    // Prepare data for recharts
    const data = nutrients.map(n => {
      const t = getThresholds(n.name);
      const deviation = n.ideal !== 0 ? ((n.current - n.ideal) / n.ideal) * 100 : 0;
      let color = '#d1d5db';
      if (deviation >= t.greenLow && deviation <= t.greenHigh) color = '#22c55e'; // green
      else if (deviation < t.red) color = '#ef4444'; // red
      else if (deviation > t.blue) color = '#2563eb'; // blue
      return {
        name: n.name,
        deviation,
        color,
        current: n.current,
        ideal: n.ideal,
        unit: n.unit,
        thresholds: t
      };
    });
    // X axis domain: use sensitivity if available
    const minVal = Math.min(...data.map(d => sensitivity[d.name]?.min ?? -100));
    const maxVal = Math.max(...data.map(d => sensitivity[d.name]?.max ?? 100));
    const chartHeight = Math.max(data.length * 40, 400);
    // Handle click outside popover to close
    React.useEffect(() => {
      function handleClick(e) {
        if (!chartRef.current) return;
        if (e.target.closest('.nutrient-bar-popover')) return;
        if (e.target.closest('.recharts-bar-rectangle')) return;
        setSelectedBar(null);
      }
      if (selectedBar !== null) {
        document.addEventListener('mousedown', handleClick);
      } else {
        document.removeEventListener('mousedown', handleClick);
      }
      return () => document.removeEventListener('mousedown', handleClick);
    }, [selectedBar]);
    if (data.length === 0) return null;
    return (
      <Card className="bg-white mt-8">
        <CardContent>
          <div style={{ width: '100%', height: chartHeight, position: 'relative', background: '#fff' }} ref={chartRef}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[minVal, maxVal]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Deviation (%)', position: 'insideBottomRight', offset: 0 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={180}
                  tick={renderYAxisTick}
                />
                <Tooltip formatter={(value, name, props) => [`${Number(value).toFixed(2)}%`, 'Deviation']} />
                <ReferenceLine x={0} stroke="#2563eb" strokeWidth={2} />
                <Bar
                  dataKey="deviation"
                  isAnimationActive={false}
                  radius={[6, 6, 6, 6]}
                  barSize={24}
                  label={({ x, y, width, height, value, index }) => {
                    const d = data[index];
                    return (
                      <g>
                        <text x={x + width + 8} y={y + height / 2 + 4} fontSize="12" fontWeight="bold" fill="#222">
                          {d.deviation > 0 ? '+' : ''}{d.deviation.toFixed(1)}%
                        </text>
                      </g>
                    );
                  }}
                  onClick={(_, idx, e) => {
                    if (e && chartRef.current) {
                      const rect = chartRef.current.getBoundingClientRect();
                      setPopoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                    setSelectedBar(idx === selectedBar ? null : idx);
                  }}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Popover for selected bar */}
            {selectedBar !== null && data[selectedBar] && (
              <div
                className="nutrient-bar-popover bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm z-50"
                style={{
                  position: 'absolute',
                  left: Math.max(0, Math.min(popoverPos.x, 400)),
                  top: popoverPos.y,
                  minWidth: 200,
                  pointerEvents: 'auto',
                }}
              >
                <div className="font-semibold text-black mb-1">{data[selectedBar].name}</div>
                <div>Deviation: <span className="font-bold">{data[selectedBar].deviation > 0 ? '+' : ''}{data[selectedBar].deviation.toFixed(1)}%</span></div>
                <div>Value: <span className="font-bold">{data[selectedBar].current} {data[selectedBar].unit}</span></div>
                <div>Target: <span className="font-bold">{data[selectedBar].ideal} {data[selectedBar].unit}</span></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Patch: Ensure all nutrients have default thresholds and sensitivity before opening popups
  function ensureNutrientConfig(nutrients, thresholds, sensitivity) {
    const defaultThreshold = { greenLow: -25, greenHigh: 25, red: -50, blue: 50 };
    const defaultSensitivity = { min: -50, max: 50 };
    const newThresholds = { ...thresholds };
    const newSensitivity = { ...sensitivity };
    nutrients.forEach(n => {
      if (!newThresholds[n]) newThresholds[n] = { ...defaultThreshold };
      if (!newSensitivity[n]) newSensitivity[n] = { ...defaultSensitivity };
    });
    return { newThresholds, newSensitivity };
  }

  // Patch NutrientThresholdsPopup
  const NutrientThresholdsPopup = ({ nutrients, colorThresholds, setColorThresholds, zoneSensitivity, setZoneSensitivity, onClose }) => {
    // Use color_thresholds for default values (user-provided mapping)
    const color_thresholds = {
      "CEC": { deficient_threshold: 50, excessive_threshold: 100 },
      "TEC": { deficient_threshold: 50, excessive_threshold: 100 },
      "Paramagnetism": { deficient_threshold: 50, excessive_threshold: 100 },
      "pH_level_1_5_water": { deficient_threshold: 50, excessive_threshold: 115 },
      "Organic_Matter_Calc": { deficient_threshold: 50, excessive_threshold: 150 },
      "Organic_Carbon_LECO": { deficient_threshold: 50, excessive_threshold: 100 },
      "Conductivity_1_5_water": { deficient_threshold: 50, excessive_threshold: 100 },
      "Ca_Mg_Ratio": { deficient_threshold: 50, excessive_threshold: 100 },
      "Nitrate_N_KCl": { deficient_threshold: 50, excessive_threshold: 100 },
      "Ammonium_N_KCl": { deficient_threshold: 50, excessive_threshold: 100 },
      "Phosphorus_Mehlich_III": { deficient_threshold: 30, excessive_threshold: 60 },
      "Calcium_Mehlich_III": { deficient_threshold: 35, excessive_threshold: 70 },
      "Magnesium_Mehlich_III": { deficient_threshold: 35, excessive_threshold: 70 },
      "Potassium_Mehlich_III": { deficient_threshold: 35, excessive_threshold: 70 },
      "Sodium_Mehlich_III": { deficient_threshold: 35, excessive_threshold: 100 },
      "Sulfur_KCl": { deficient_threshold: 50, excessive_threshold: 100 },
      "Chloride": { deficient_threshold: 35, excessive_threshold: 50 },
      "Aluminium": { deficient_threshold: 50, excessive_threshold: 100 },
      "Silicon_CaCl2": { deficient_threshold: 35, excessive_threshold: 70 },
      "Boron_Hot_CaCl2": { deficient_threshold: 30, excessive_threshold: 150 },
      "Iron_DTPA": { deficient_threshold: 50, excessive_threshold: 100 },
      "Manganese_DTPA": { deficient_threshold: 50, excessive_threshold: 100 },
      "Copper_DTPA": { deficient_threshold: 50, excessive_threshold: 100 },
      "Zinc_DTPA": { deficient_threshold: 50, excessive_threshold: 100 },
      "Calcium": { deficient_threshold: 35, excessive_threshold: 70 },
      "Magnesium": { deficient_threshold: 35, excessive_threshold: 70 },
      "Potassium": { deficient_threshold: 35, excessive_threshold: 70 },
      "Sodium": { deficient_threshold: 35, excessive_threshold: 70 },
      "Aluminum": { deficient_threshold: 35, excessive_threshold: 70 },
      "Hydrogen": { deficient_threshold: 35, excessive_threshold: 70 },
      "Other_Bases": { deficient_threshold: 35, excessive_threshold: 70 },
      "Calcium_LaMotte": { deficient_threshold: 35, excessive_threshold: 70 },
      "Magnesium_LaMotte": { deficient_threshold: 35, excessive_threshold: 70 },
      "Phosphorus_LaMotte": { deficient_threshold: 35, excessive_threshold: 70 },
      "Potassium_LaMotte": { deficient_threshold: 35, excessive_threshold: 70 },
      "Sodium_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Potassium_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Calcium_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Magnesium_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Phosphorus_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Aluminium_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Copper_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Iron_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Manganese_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Selenium_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Zinc_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Boron_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Silicon_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Cobalt_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Molybdenum_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
      "Sulfur_TAE": { deficient_threshold: 35, excessive_threshold: 70 },
    };
    const [localThresholds, setLocalThresholds] = useState(() => {
      const obj = {};
      // Alias mapping for common nutrient name variants
      const aliasMap = {
        'Aluminum': 'Aluminium',
        'Aluminium': 'Aluminum',
        'Other_Bases': 'Other Bases',
        'Other Bases': 'Other_Bases',
        // Add more aliases as needed
      };
      nutrients.forEach(n => {
        // 1. Try exact key
        let th = (colorThresholds && typeof colorThresholds[n] === 'object' && colorThresholds[n] !== null)
          ? colorThresholds[n]
          : color_thresholds[n];
        // 2. Try case-insensitive match
        if (!th) {
          const lowerKey = Object.keys(color_thresholds).find(k => k.toLowerCase() === n.toLowerCase());
          if (lowerKey) th = color_thresholds[lowerKey];
        }
        // 3. Try alias mapping
        if (!th && aliasMap[n]) {
          th = color_thresholds[aliasMap[n]];
        }
        // 4. Fallback to default
        if (!th) th = color_thresholds['default'];
        obj[n] = (typeof th === 'object' && th !== null) ? th : {};
      });
      return obj;
    });
    const [localSensitivity, setLocalSensitivity] = useState(() => {
      const obj = {};
      nutrients.forEach(n => {
        const sens = zoneSensitivity && typeof zoneSensitivity[n] === 'object' && zoneSensitivity[n] !== null ? zoneSensitivity[n] : { deficient: 1.0, optimal: 1.0, excessive: 1.0 };
        obj[n] = (typeof sens === 'object' && sens !== null) ? sens : {};
      });
      return obj;
    });
    const handleThresholdChange = (n, field, value) => {
      setLocalThresholds(l => ({
        ...l,
        [n]: { ...(typeof l[n] === 'object' && l[n] !== null ? l[n] : {}), [field]: Number(value) }
      }));
    };
    const handleSensitivityChange = (n, field, value) => {
      setLocalSensitivity(l => ({
        ...l,
        [n]: { ...(typeof l[n] === 'object' && l[n] !== null ? l[n] : {}), [field]: Number(value) }
      }));
    };
    const handleSave = () => {
      setColorThresholds(prev => {
        const updated = { ...prev };
        Object.entries(localThresholds).forEach(([n, vals]) => {
          updated[n] = vals;
        });
        return updated;
      });
      setZoneSensitivity(prev => {
        const updated = { ...prev };
        Object.entries(localSensitivity).forEach(([n, vals]) => {
          updated[n] = vals;
        });
        return updated;
      });
      onClose();
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Nutrient Color Logic</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Color Thresholds</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {nutrients.map(n => (
                  <div key={n} className="border rounded p-3">
                    <div className="font-medium mb-2">{n}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm text-gray-600">Red (Deficient)</label>
                        <input
                          type="number"
                          value={localThresholds[n]?.deficient_threshold || ''}
                          onChange={(e) => handleThresholdChange(n, 'deficient_threshold', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Blue (Excessive)</label>
                        <input
                          type="number"
                          value={localThresholds[n]?.excessive_threshold || ''}
                          onChange={(e) => handleThresholdChange(n, 'excessive_threshold', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Zone Sensitivity</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {nutrients.map(n => (
                  <div key={n} className="border rounded p-3">
                    <div className="font-medium mb-2">{n}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-sm text-gray-600">Deficient</label>
                        <input
                          type="number"
                          step="0.1"
                          value={localSensitivity[n]?.deficient || ''}
                          onChange={(e) => handleSensitivityChange(n, 'deficient', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Optimal</label>
                        <input
                          type="number"
                          step="0.1"
                          value={localSensitivity[n]?.optimal || ''}
                          onChange={(e) => handleSensitivityChange(n, 'optimal', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Excessive</label>
                        <input
                          type="number"
                          step="0.1"
                          value={localSensitivity[n]?.excessive || ''}
                          onChange={(e) => handleSensitivityChange(n, 'excessive', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Patch NutrientSensitivityPopup
  const NutrientSensitivityPopup = ({ nutrients, nutrientSensitivity, setNutrientSensitivity, onClose }) => {
    // Patch: ensure all nutrients have config
    const defaultSensitivity = { min: -50, max: 50 };
    const newSensitivity = { ...nutrientSensitivity };
    nutrients.forEach(n => {
      if (!newSensitivity[n]) newSensitivity[n] = { ...defaultSensitivity };
    });
    const [local, setLocal] = React.useState(() => {
      const obj = {};
      nutrients.forEach(n => { obj[n] = { ...(newSensitivity[n] || defaultSensitivity) }; });
      return obj;
    });
    const handleChange = (n, field, value) => {
      setLocal(l => ({ ...l, [n]: { ...l[n], [field]: Number(value) } }));
    };
    const handleSave = () => {
      Object.entries(local).forEach(([n, vals]) =>
        setNutrientSensitivity(prev => {
          if (!prev || typeof prev !== 'object') return { [n]: (typeof vals === 'object' && vals !== null) ? { ...vals } : {} };
          const prevN = (prev[n] && typeof prev[n] === 'object') ? prev[n] : {};
          const safeVals = (typeof vals === 'object' && vals !== null) ? vals : {};
          return { ...prev, [n]: { ...prevN, ...safeVals } };
        })
      );
      onClose();
    };
    return (
      <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold">Edit Sensitivity for All Nutrients</div>
            <button className="text-xs px-2 py-1 rounded bg-gray-200" onClick={onClose}>Close</button>
          </div>
          <table className="w-full text-xs border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border-b text-left">Nutrient</th>
                <th className="p-2 border-b text-center">Sensitivity Min (%)</th>
                <th className="p-2 border-b text-center">Sensitivity Max (%)</th>
              </tr>
            </thead>
            <tbody>
              {nutrients.map(n => (
                <tr key={n}>
                  <td className="p-2 border-b font-semibold text-left">{n}</td>
                  <td className="p-2 border-b text-center"><input type="number" className="border rounded px-1 py-0.5 w-14 text-xs" value={local[n].min} onChange={e => handleChange(n, 'min', e.target.value)} /></td>
                  <td className="p-2 border-b text-center"><input type="number" className="border rounded px-1 py-0.5 w-14 text-xs" value={local[n].max} onChange={e => handleChange(n, 'max', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 mt-4 justify-end">
            <button className="text-xs px-3 py-1 rounded bg-blue-600 text-white" onClick={handleSave}>Save</button>
            <button className="text-xs px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const mainNutrientSubstrings = ['calcium', 'magnesium', 'potassium', 'phosphorus', 'sulphur', 'sodium', 'nitrate', 'ammonium'];
  // Helper to normalize nutrient names for deduplication
  function normalizeNutrientName(name) {
    const lower = name.toLowerCase();
    if (lower.startsWith('ammonium')) return 'ammonium';
    if (lower.startsWith('nitrate')) return 'nitrate';
    if (lower.startsWith('calcium')) return 'calcium';
    if (lower.startsWith('magnesium')) return 'magnesium';
    if (lower.startsWith('potassium')) return 'potassium';
    if (lower.startsWith('phosphorus')) return 'phosphorus';
    if (lower.startsWith('sulphur') || lower.startsWith('sulfur')) return 'sulphur';
    if (lower.startsWith('sodium')) return 'sodium';
    return lower;
  }
  const mainRadarNutrients = Array.from(
    new Map(
      dedupedMainNutrients
        .filter(n => mainNutrientSubstrings.some(sub => n.name.toLowerCase().includes(sub)))
        .map(n => [normalizeNutrientName(n.name), n])
    ).values()
  );
  const secondaryRadarNutrients = dedupedMainNutrients.filter(n =>
    !mainNutrientSubstrings.some(sub => n.name.toLowerCase().includes(sub))
  );

  // For both TotalNutrientApplicationTable usages, only pass foliarSprayProducts once, as the combined array
  const allFoliarSprayProducts = [
    ...(currentPaddockData.foliarSprayProducts || []),
    ...(currentPaddockData.preFloweringFoliarProducts || []),
    ...(currentPaddockData.preFloweringFoliarProducts2 || []),
    ...(currentPaddockData.nutritionalFoliarProducts || []),
    ...(currentPaddockData.nutritionalFoliarProducts2 || []),
    ...(currentPaddockData.plantingBlendProducts || [])
  ];

  // Debug logging
  // Removed debug logging for allFoliarSprayProducts

  // Extract product names more robustly
  const extractProductNames = (products) => {
    return products.map(p => {
      if (typeof p === 'string') return p;
      if (p && typeof p === 'object') {
        return p.product || p.label || p.name || p.fertilizer || JSON.stringify(p);
      }
      return String(p);
    }).filter(name => name && name.trim() !== '');
  };

  const foliarSprayProductNames = extractProductNames(allFoliarSprayProducts);
  // Removed debug logging for foliarSprayProductNames

  // Restore Nutrient Values Bar Chart (actual values)
  const NutrientValuesBarChart = ({ nutrients, onEditColorLogic, getThresholds, sensitivity }) => {
    const [selectedBar, setSelectedBar] = useState(null); // index of selected bar
    const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
    const chartRef = useRef<HTMLDivElement>(null);
    // Prepare data for recharts
    const data = nutrients.map(n => {
      const t = getThresholds(n.name);
      let color = '#d1d5db';
      const deviation = n.ideal !== 0 ? ((n.current - n.ideal) / n.ideal) * 100 : 0;
      if (deviation >= t.greenLow && deviation <= t.greenHigh) color = '#22c55e'; // green
      else if (deviation < t.red) color = '#ef4444'; // red
      else if (deviation > t.blue) color = '#2563eb'; // blue
      return {
        name: n.name,
        value: n.current,
        color,
        current: n.current,
        ideal: n.ideal,
        unit: n.unit,
        thresholds: t
      };
    });
    // X axis domain: use sensitivity if available
    const minVal = Math.min(...data.map(d => Math.max(d.current, d.ideal ?? 0)));
    const maxVal = Math.max(...data.map(d => Math.max(d.current, d.ideal ?? 0)));
    const chartHeight = Math.max(data.length * 40, 400);
    // Handle click outside popover to close
    React.useEffect(() => {
      function handleClick(e) {
        if (!chartRef.current) return;
        if (e.target.closest('.nutrient-bar-popover')) return;
        if (e.target.closest('.recharts-bar-rectangle')) return;
        setSelectedBar(null);
      }
      if (selectedBar !== null) {
        document.addEventListener('mousedown', handleClick);
      } else {
        document.removeEventListener('mousedown', handleClick);
      }
      return () => document.removeEventListener('mousedown', handleClick);
    }, [selectedBar]);
    if (data.length === 0) return null;
    return (
      <Card className="bg-white mt-8">
        <CardContent>
          <div style={{ width: '100%', height: chartHeight, position: 'relative', background: '#fff' }} ref={chartRef}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[minVal, maxVal]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Deviation (%)', position: 'insideBottomRight', offset: 0 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={180}
                  tick={renderYAxisTick}
                />
                <Tooltip formatter={(value, name, props) => [`${Number(value).toFixed(2)}%`, 'Deviation']} />
                <ReferenceLine x={0} stroke="#2563eb" strokeWidth={2} />
                <Bar
                  dataKey="value"
                  isAnimationActive={false}
                  radius={[6, 6, 6, 6]}
                  barSize={24}
                  label={({ x, y, width, height, value, index }) => {
                    const d = data[index];
                    return (
                      <g>
                        <text x={x + width + 8} y={y + height / 2 + 4} fontSize="12" fontWeight="bold" fill="#222">
                          {d.current} {d.unit}
                        </text>
                      </g>
                    );
                  }}
                  onClick={(_, idx, e) => {
                    if (e && chartRef.current) {
                      const rect = chartRef.current.getBoundingClientRect();
                      setPopoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                    setSelectedBar(idx === selectedBar ? null : idx);
                  }}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Popover for selected bar */}
            {selectedBar !== null && data[selectedBar] && (
              <div
                className="nutrient-bar-popover bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm z-50"
                style={{
                  position: 'absolute',
                  left: Math.max(0, Math.min(popoverPos.x, 400)),
                  top: popoverPos.y,
                  minWidth: 200,
                  pointerEvents: 'auto',
                }}
              >
                <div className="font-semibold text-black mb-1">{data[selectedBar].name}</div>
                <div>Value: <span className="font-bold">{data[selectedBar].current} {data[selectedBar].unit}</span></div>
                <div>Target: <span className="font-bold">{data[selectedBar].ideal} {data[selectedBar].unit}</span></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Spider chart popover logic
  function useRadarPopover() {
    const [popover, setPopover] = useState({ open: false, x: 0, y: 0, nutrient: null });
    const handlePointClick = (e, nutrient) => {
      if (e && e.activePayload && e.activePayload.length > 0) {
        const { name, deviation, current, ideal, unit } = e.activePayload[0].payload;
        setPopover({ open: true, x: e.chartX, y: e.chartY, nutrient: { name, deviation, current, ideal, unit } });
      }
    };
    const closePopover = () => setPopover({ open: false, x: 0, y: 0, nutrient: null });
    return [popover, handlePointClick, closePopover];
  }

  // Helper for radar data (add current, ideal, unit for popover)
  function getRadarDeviationData(nutrients, mainNutrientSubstrings, filterByMain) {
    return nutrients
      .filter(n => filterByMain ? mainNutrientSubstrings.some(sub => n.name.toLowerCase().includes(sub)) : true)
      .map(n => {
        const deviation = n.ideal !== 0 ? ((n.current - n.ideal) / n.ideal) * 100 : 0;
        return {
          name: n.name,
          deviation,
          current: n.current,
          ideal: n.ideal,
          unit: n.unit
        };
      });
  }

  // Spider chart with popover
  const SpiderChartWithPopover = ({ data, title }) => {
    const radarPopover = useRadarPopover() as [
      { open: boolean; x: number; y: number; nutrient: any },
      (e: any) => void,
      () => void
    ];
    const popover = radarPopover[0];
    const handlePointClick = radarPopover[1];
    const closePopover = radarPopover[2];
    // Info content based on title
    let infoTitle = title;
    let infoText = '';
    if (/main nutrients/i.test(title)) {
      infoText = 'Shows the deviation of main nutrients (Ca, Mg, K, P, S, etc.) from their target values as a percentage. Helps you quickly assess which primary nutrients are deficient or excessive.';
    } else if (/secondary nutrients/i.test(title)) {
      infoText = 'Shows the deviation of secondary and trace nutrients from their target values as a percentage. Use this to identify imbalances in micronutrients and trace elements.';
    } else {
      infoText = 'Shows the deviation of nutrients from their target values as a percentage.';
    }
    return (
      <Card className="flex-1 bg-white">
        <CardContent style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={data} outerRadius={120} onClick={handlePointClick}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 13, fill: '#222' }} />
              <PolarRadiusAxis angle={30} domain={[-100, 100]} tick={{ fontSize: 12 }} />
              {/* Perfect sample polygon (gray, 0% deviation) */}
              <Radar name="Perfect" dataKey={() => 0} stroke="#888" fill="#888" fillOpacity={0.15} />
              {/* Actual deviation polygon */}
              <Radar name="Deviation" dataKey="deviation" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
          {popover.open && popover.nutrient && (
            <div
              className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm z-50"
              style={{ left: popover.x, top: popover.y, minWidth: 200, pointerEvents: 'auto' }}
              onClick={closePopover}
            >
              <div className="font-semibold text-black mb-1">{popover.nutrient.name}</div>
              <div>Deviation: <span className="font-bold">{popover.nutrient.deviation > 0 ? '+' : ''}{popover.nutrient.deviation.toFixed(1)}%</span></div>
              <div>Value: <span className="font-bold">{popover.nutrient.current} {popover.nutrient.unit}</span></div>
              <div>Target: <span className="font-bold">{popover.nutrient.ideal} {popover.nutrient.unit}</span></div>
              <div className="text-xs text-gray-500 mt-2">Click to close</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Helper for robust nutrient lookup
  function findNutrientByName(nutrients, name) {
    // Try exact match
    let n = nutrients.find(n => n.name.toLowerCase() === name.toLowerCase());
    if (n) return n;
    // Try startsWith
    n = nutrients.find(n => n.name.toLowerCase().startsWith(name.toLowerCase()));
    if (n) return n;
    // Try includes
    n = nutrients.find(n => n.name.toLowerCase().includes(name.toLowerCase()));
    if (n) return n;
    // Try removing parenthesis and matching
    const baseName = name.split('(')[0].trim().toLowerCase();
    n = nutrients.find(n => n.name.split('(')[0].trim().toLowerCase() === baseName);
    if (n) return n;
    return null;
  }

  // Only show sections 1-8 after paddock is selected
  // ... existing code ...
  // In the main render, after file upload and analysisComplete:
  // Only show paddock selection until a paddock is selected
  const paddockSelected = selectedPaddocks && selectedPaddocks.length === 1 && selectedPaddocks[0];
  // ... existing code ...

  // Add state for showSection0:
  const [showSection0, setShowSection0] = useState(true);

  // --- New NutrientDeviationScoreChart ---
  const NutrientDeviationScoreChart = ({ nutrients }) => {
    // Popover state for bar click
    const [selectedBar, setSelectedBar] = React.useState<number | null>(null);
    const [popoverPos, setPopoverPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const chartRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (!chartRef.current) return;
        if (e.target && (e.target as HTMLElement).closest('.nutrient-bar-popover')) return;
        setSelectedBar(null);
      }
      if (selectedBar !== null) {
        document.addEventListener('mousedown', handleClick);
      } else {
        document.removeEventListener('mousedown', handleClick);
      }
      return () => document.removeEventListener('mousedown', handleClick);
    }, [selectedBar]);
    // Define ideal ranges for each nutrient (as in your Python example)
    const idealRanges: Record<string, [number, number]> = {
      'Calcium': [1000, 2000],
      'Magnesium': [140, 285],
      'Phosphorus': [7, 30],
      'Potassium': [80, 100],
      'Sodium': [7, 22],
      'Sulfur': [10, 20],
      'Aluminium': [0, 3],
      'Silicon': [100, 1000],
      'Boron': [1, 3],
      'Iron': [40, 200],
      'Manganese': [30, 100],
      'Copper': [2, 7],
      'Zinc': [3, 10],
      'Nitrate-N': [10, 20],
      'Ammonium-N': [10, 20],
      // Add all unified keys with a default range if not present
      ...Object.fromEntries(unifiedNutrientKeys.map(k => [k, [0, 1]])),
    };
    // Prepare data
    const chartData = nutrients
      .filter(n => typeof n.ideal === 'number' && n.ideal > 0)
      .map(n => {
        // Normalize name for lookup
        const key = n.name in idealRanges ? n.name : unifiedNutrientKeys.find(k => k.toLowerCase() === n.name.toLowerCase()) || n.name;
        const [low, high] = idealRanges[key] || [0, 1];
        const val = Number(n.current);
        const lowNum = Number(low);
        const highNum = Number(high);
        const midpoint = (lowNum + highNum) / 2;
        let deviation_pct = 0;
        if (midpoint > 0) {
          deviation_pct = ((val - midpoint) / midpoint) * 100;
        } else {
          deviation_pct = 0; // Prevent division by zero
        }
        // Use per-nutrient thresholds if set
        const thresholds = colorThresholds[n.name] || { low: -50, high: 50 };
        let color = '#22c55e'; // green
        if (deviation_pct < thresholds.low) color = '#ef4444'; // red for < low
        else if (deviation_pct > thresholds.high) color = '#2563eb'; // blue for > high
        // Normalize score: 0 (far below) to 100 (far above), 50 = ideal
        const score = Math.max(0, Math.min(100, 50 + deviation_pct / 2));
        // Label logic
        let statusLabel = 'Optimal';
        if (deviation_pct < thresholds.low) statusLabel = 'Deficient';
        else if (deviation_pct > thresholds.high) statusLabel = 'Excessive';
        return {
          name: n.name,
          value: score,
          rawDeviation: deviation_pct,
          color,
          ideal: lowNum,
          target: highNum,
          midpoint,
          current: val,
          statusLabel,
        };
      });
    // Set a fixed X axis domain of 100%
    const maxDeviation = 100;
    const barHeight = 24;
    const chartHeight = Math.max(chartData.length * 32, 600);
    // Custom legend
    const renderLegend = () => (
      <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 18, height: 12, background: '#ffe6e6', display: 'inline-block', borderRadius: 2 }} /> Deficient (0–25%)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 18, height: 12, background: '#e6ffe6', display: 'inline-block', borderRadius: 2 }} /> Optimal (25–50%)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 18, height: 12, background: '#fff0cc', display: 'inline-block', borderRadius: 2 }} /> Excessive (50–100%)</span>
      </div>
    );
    return (
      <Card className="bg-white mt-8">
        <CardContent>
          {renderLegend()}
          <div style={{ width: '100%', height: chartHeight, position: 'relative', background: '#fff' }}>
            {/* Vertical section lines at 33.33% and 66.66% of the chart area (not over Y-axis) */}
            <div style={{
              position: 'absolute',
              left: 140, // Y-axis width
              top: 0,
              height: '100%',
              width: 'calc(100% - 140px)',
              pointerEvents: 'none',
              zIndex: 2,
            }}>
              <div style={{
                position: 'absolute',
                left: '33.33%',
                top: 0,
                width: '2px',
                height: '100%',
                background: '#bbb',
                opacity: 0.7,
              }} />
              <div style={{
                position: 'absolute',
                left: '66.66%',
                top: 0,
                width: '2px',
                height: '100%',
                background: '#bbb',
                opacity: 0.7,
              }} />
            </div>
            <div style={{ width: '100%', height: chartHeight, position: 'relative' }} ref={chartRef}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  barCategoryGap={0}
                  style={{ position: 'relative', zIndex: 2 }}
                >
                  <XAxis type="number" domain={[0, maxDeviation]} tickFormatter={v => `${v}%`} label={{ value: 'Deviation from Ideal Midpoint (%) — Normalized', position: 'insideBottom', offset: -10 }} />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip formatter={() => ''} />
                  <Bar dataKey="value" isAnimationActive={false} barSize={barHeight} radius={[6, 6, 6, 6]}
                    onClick={(_, idx, e) => {
                      if (e && chartRef.current) {
                        const rect = chartRef.current.getBoundingClientRect();
                        setPopoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }
                      setSelectedBar(idx === selectedBar ? null : idx);
                    }}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                    ))}
                    <LabelList
                      dataKey="current"
                      position="right"
                      content={({ x, y, width, height, value, index }) => {
                        const xNum = typeof x === 'number' ? x : parseFloat(x) || 0;
                        const widthNum = typeof width === 'number' ? width : parseFloat(width) || 0;
                        const yNum = typeof y === 'number' ? y : parseFloat(y) || 0;
                        const heightNum = typeof height === 'number' ? height : parseFloat(height) || 0;
                        const d = chartData[index];
                        return (
                          <text x={xNum + widthNum + 8} y={yNum + heightNum / 2 + 4} fontSize="12" fontWeight="bold" fill="#222">
                            {d.statusLabel} ({typeof d.current === 'number' ? d.current.toFixed(1) + ' ppm' : ''})
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Popover for selected bar */}
              {selectedBar !== null && chartData[selectedBar] && (
                <div
                  className="nutrient-bar-popover bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm z-50"
                  style={{
                    position: 'absolute',
                    left: Math.max(0, Math.min(popoverPos.x, 400)),
                    top: popoverPos.y,
                    minWidth: 200,
                    pointerEvents: 'auto',
                  }}
                >
                  <div className="font-semibold text-black mb-1">{chartData[selectedBar].name}</div>
                  <div>Current value: <span className="font-bold">{typeof chartData[selectedBar].current === 'number' ? chartData[selectedBar].current : ''}</span></div>
                  <div>Target: <span className="font-bold">{chartData[selectedBar].ideal}</span></div>
                  <div>Deviation: <span className="font-bold">{chartData[selectedBar].rawDeviation > 0 ? '+' : ''}{chartData[selectedBar].rawDeviation.toFixed(1)}%</span></div>
                  <div className="text-xs text-gray-500 mt-2">Click outside to close</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Add state for per-nutrient color thresholds at the top of the component
  const [colorThresholds, setColorThresholds] = React.useState(() => {
    // Default: { [nutrient]: { low: -50, high: 50 } }
    const thresholds = {};
    unifiedNutrientKeys.forEach(n => { thresholds[n] = { low: -50, high: 50 }; });
    return thresholds;
  });
  const [showColorPopup, setShowColorPopup] = React.useState(false);

  // Always set genericName using this mapping
  // Removed debug logging
  const unifiedNutrients = (currentPaddockData.nutrients || mockNutrients).map(n => {
    const genericName = unifiedToGeneric[n.name] || n.name;
    let status = 'optimal';
    if (n.ideal_range && Array.isArray(n.ideal_range) && n.ideal_range.length === 2) {
      if (n.current < n.ideal_range[0]) status = 'low';
      else if (n.current > n.ideal_range[1]) status = 'high';
      else status = 'optimal';
    } else if (typeof n.ideal === 'number' && isFinite(n.ideal) && n.ideal !== 0) {
      if (n.current < 0.9 * n.ideal) status = 'low';
      else if (n.current > 1.1 * n.ideal) status = 'high';
    }
    return { ...n, genericName, status };
  });

  // Create filtered nutrients for soil corrections - only Albrecht section (Mehlich III and KCl nutrients)
  // Filter nutrients to only include Albrecht section (Mehlich III, KCl, DTPA, etc.)
  const albrechtNutrients = (currentPaddockData.nutrients || mockNutrients).filter(n => {
    // Only include nutrients that are from Albrecht methods (Mehlich III, KCl, DTPA, etc.)
    // Exclude TAE, LaMotte, and base saturation nutrients
    const nameLower = (n.name || '').toLowerCase();
    const categoryLower = (n.category || '').toLowerCase();

    // Exclude TAE and LaMotte nutrients by name or category (case-insensitive)
    if (nameLower.includes('tae') || nameLower.includes('lamotte') || categoryLower === 'tae' || categoryLower === 'lamotte_reams') {
      return false;
    }

    // Exclude base saturation nutrients
    if (categoryLower === 'base_saturation') {
      return false;
    }

    // Include only Albrecht section nutrients (Mehlich III, KCl, DTPA, etc.)
    return true;
  });

  const soilCorrectionsNutrients = albrechtNutrients.map(n => {
    const genericName = unifiedToGeneric[n.name] || n.name;
    let status = 'optimal';
    if (n.ideal_range && Array.isArray(n.ideal_range) && n.ideal_range.length === 2) {
      if (n.current < n.ideal_range[0]) status = 'low';
      else if (n.current > n.ideal_range[1]) status = 'high';
      else status = 'optimal';
    } else if (typeof n.ideal === 'number' && isFinite(n.ideal) && n.ideal !== 0) {
      if (n.current < 0.9 * n.ideal) status = 'low';
      else if (n.current > 1.1 * n.ideal) status = 'high';
    }
    return { ...n, genericName, status };
  });


  // Add a new clean deviation bar chart component
  const CleanNutrientDeviationBarChart = ({ nutrients }) => {
    // Popover state for bar click
    const [selectedBar, setSelectedBar] = React.useState<number | null>(null);
    const [popoverPos, setPopoverPos] = React.useState({ x: 0, y: 0 });
    const chartRef = React.useRef<HTMLDivElement>(null);
    // Prepare data (robust, clean mapping)
    const chartData = nutrients
      .filter(n => typeof n.ideal === 'number' && n.ideal > 0)
      .map(n => {
        // Use only current and ideal, no legacy/fallback
        const val = Number(n.current);
        const ideal = Number(n.ideal);
        let deviation_pct = 0;
        if (ideal > 0) {
          deviation_pct = ((val - ideal) / ideal) * 100;
        }
        // Color and status logic
        let color = '#22c55e';
        if (deviation_pct < -25) color = '#ef4444';
        else if (deviation_pct > 25) color = '#2563eb';
        let statusLabel = 'Optimal';
        if (deviation_pct < -25) statusLabel = 'Deficient';
        else if (deviation_pct > 25) statusLabel = 'Excessive';
        return {
          name: n.name,
          value: Math.max(0, Math.min(100, 50 + deviation_pct / 2)), // original normalization
          rawDeviation: deviation_pct,
          color,
          current: val,
          ideal,
          unit: n.unit,
          statusLabel,
        };
      });
    const maxDeviation = 100;
    const barHeight = 24;
    const chartHeight = Math.max(chartData.length * 32, 600);
    // Custom legend
    const renderLegend = () => (
      <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 18, height: 12, background: '#ffe6e6', display: 'inline-block', borderRadius: 2 }} /> Deficient (0–25%)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 18, height: 12, background: '#e6ffe6', display: 'inline-block', borderRadius: 2 }} /> Optimal (25–50%)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 18, height: 12, background: '#fff0cc', display: 'inline-block', borderRadius: 2 }} /> Excessive (50–100%)</span>
      </div>
    );
    if (chartData.length === 0) return null;
    return (
      <Card className="bg-white mt-8">
        <CardContent>
          {renderLegend()}
          <div style={{ width: '100%', height: chartHeight, position: 'relative', background: '#fff' }}>
            {/* Vertical section lines at 33.33% and 66.66% of the chart area (not over Y-axis) */}
            <div style={{
              position: 'absolute',
              left: 140, // Y-axis width
              top: 0,
              height: '100%',
              width: 'calc(100% - 140px)',
              pointerEvents: 'none',
              zIndex: 2,
            }}>
              <div style={{
                position: 'absolute',
                left: '40.91%', // 50% - 18.18% = 31.82% from left, but as a percent of the chart area, 40.91% is correct for the first line
                top: 0,
                width: '2px',
                height: '100%',
                background: '#bbb',
                opacity: 0.7,
              }} />
              <div style={{
                position: 'absolute',
                left: '66.66%',
                top: 0,
                width: '2px',
                height: '100%',
                background: '#bbb',
                opacity: 0.7,
              }} />
            </div>
            <div style={{ width: '100%', height: chartHeight, position: 'relative' }} ref={chartRef}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  barCategoryGap={0}
                  style={{ position: 'relative', zIndex: 2 }}
                >
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} label={{ value: 'Deviation from Target (%) — Normalized', position: 'insideBottom', offset: -10 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={renderYAxisTick} />
                  <Tooltip formatter={() => ''} />
                  <Bar dataKey="value" isAnimationActive={false} barSize={barHeight} radius={[6, 6, 6, 6]}
                    onClick={(_, idx, e) => {
                      if (e && chartRef.current) {
                        const rect = chartRef.current.getBoundingClientRect();
                        setPopoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }
                      setSelectedBar(idx === selectedBar ? null : idx);
                    }}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                    ))}
                    <LabelList
                      dataKey="current"
                      position="right"
                      content={({ x, y, width, height, value, index }) => {
                        const xNum = typeof x === 'number' ? x : parseFloat(x) || 0;
                        const widthNum = typeof width === 'number' ? width : parseFloat(width) || 0;
                        const yNum = typeof y === 'number' ? y : parseFloat(y) || 0;
                        const heightNum = typeof height === 'number' ? height : parseFloat(height) || 0;
                        const d = chartData[index];
                        return (
                          <text x={xNum + widthNum + 8} y={yNum + heightNum / 2 + 4} fontSize="12" fontWeight="bold" fill="#222">
                            {d.statusLabel} ({typeof d.current === 'number' ? d.current.toFixed(1) + ' ' + d.unit : ''})
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Popover for selected bar */}
              {selectedBar !== null && chartData[selectedBar] && (
                <div
                  className="nutrient-bar-popover bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm z-50"
                  style={{
                    position: 'absolute',
                    left: Math.max(0, Math.min(popoverPos.x, 400)),
                    top: popoverPos.y,
                    minWidth: 200,
                    pointerEvents: 'auto',
                  }}
                >
                  <div className="font-semibold text-black mb-1">{chartData[selectedBar].name}</div>
                  <div>Current value: <span className="font-bold">{typeof chartData[selectedBar].current === 'number' ? chartData[selectedBar].current : ''}</span></div>
                  <div>Target: <span className="font-bold">{typeof chartData[selectedBar].ideal === 'number' && chartData[selectedBar].ideal > 0 ? chartData[selectedBar].ideal : ''}</span></div>
                  <div>Deviation: <span className="font-bold">{chartData[selectedBar].rawDeviation > 0 ? '+' : ''}{chartData[selectedBar].rawDeviation.toFixed(1)}%</span></div>
                  <div className="text-xs text-gray-500 mt-2">Click outside to close</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // --- Sensitivity and threshold data (from Python) ---
  const defaultZoneSensitivity = {
    // Mehlich / Albrecht / KCl
    "Paramagnetism": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "pH-level (1:5 water)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Organic Matter (Calc)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Organic Carbon (LECO)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Conductivity (1:5 water)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Ca/Mg Ratio": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Nitrate-N (KCl)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Ammonium-N (KCl)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Phosphorus (Mehlich III)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Calcium (Mehlich III)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Magnesium (Mehlich III)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Potassium (Mehlich III)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Sodium (Mehlich III)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Sulfur (KCl)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Aluminium": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Silicon (CaCl2)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Boron (Hot CaCl2)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Iron (DTPA)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Manganese (DTPA)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Copper (DTPA)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Zinc (DTPA)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    // Base Saturation
    "Calcium (Base Saturation)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Magnesium (Base Saturation)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Potassium (Base Saturation)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Sodium (Base Saturation)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Aluminum (Base Saturation)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Hydrogen (Base Saturation)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Other Bases (Base Saturation)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    // LaMotte/Reams
    "Calcium (LaMotte)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Magnesium (LaMotte)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Phosphorus (LaMotte)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Potassium (LaMotte)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    // TAE
    "Sodium (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Potassium (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Calcium (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Magnesium (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Phosphorus (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Aluminium (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Copper (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Iron (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Manganese (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Selenium (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Zinc (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Boron (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Silicon (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Cobalt (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Molybdenum (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
    "Sulfur (TAE)": { deficient: 1.0, optimal: 1.0, excessive: 1.0 },
  };

  const [zoneSensitivity, setZoneSensitivity] = useState(defaultZoneSensitivity);

  // --- Comprehensive Nutrient Table Component ---
  const ComprehensiveNutrientTable = ({ nutrients }) => {
    // List of base saturation nutrients
    const baseSaturationNames = [
      'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other Bases', 'Other_Bases'
    ];

    // List of nutrients to exclude (LaMotte and TAE)
    const excludedNutrients = [
      // LaMotte nutrients
      'LaMotte Calcium', 'LaMotte Magnesium', 'LaMotte Phosphorus', 'LaMotte Potassium',
      'Calcium_LaMotte', 'Magnesium_LaMotte', 'Phosphorus_LaMotte', 'Potassium_LaMotte',
      // TAE nutrients
      'Sodium TAE', 'Potassium TAE', 'Calcium TAE', 'Magnesium TAE', 'Phosphorus TAE', 'Aluminium TAE',
      'Copper TAE', 'Iron TAE', 'Manganese TAE', 'Selenium TAE', 'Zinc TAE', 'Boron TAE', 'Silicon TAE',
      'Cobalt TAE', 'Molybdenum TAE', 'Sulfur TAE',
      'Sodium_TAE', 'Potassium_TAE', 'Calcium_TAE', 'Magnesium_TAE', 'Phosphorus_TAE', 'Aluminium_TAE',
      'Copper_TAE', 'Iron_TAE', 'Manganese_TAE', 'Selenium_TAE', 'Zinc_TAE', 'Boron_TAE', 'Silicon_TAE',
      'Cobalt_TAE', 'Molybdenum_TAE', 'Sulfur_TAE'
    ];

    // Filter nutrients: exclude LaMotte/TAE and for base saturation, only show the '%' unit row
    const filteredNutrients = nutrients.filter((n) => {
      // First, exclude LaMotte and TAE nutrients
      if (excludedNutrients.includes(n.name)) {
        return false;
      }

      // Then apply base saturation filter
      if (baseSaturationNames.includes(n.name)) {
        return n.unit === '%';
      }
      return true;
    });
    function getBarData(n) {
      const name = n.name;
      const value = n.current;
      const low = n.ideal_range ? n.ideal_range[0] : n.ideal * 0.8;
      const high = n.ideal_range ? n.ideal_range[1] : n.ideal * 1.2;
      const unit = n.unit;
      const sensitivity = zoneSensitivity[name] || { deficient: 1.0, optimal: 1.0, excessive: 1.0 };
      // Use colorThresholds state, fallback to default
      const thresholds = (colorThresholds && colorThresholds[name]) || colorThresholds['default'] || { deficient_threshold: -25, excessive_threshold: 25 };
      let bar = 0, color = 'green', status = 'Optimal', deviation = 0;
      if (value <= low) {
        const ratio = low > 0 ? value / low : 0.0;
        bar = ratio * 0.333 * sensitivity.deficient;
        deviation = low > 0 ? ((low - value) / low * 100) : 100;
        color = deviation <= thresholds.deficient_threshold ? 'green' : 'red';
        status = deviation <= thresholds.deficient_threshold ? 'Deficient (Acceptable)' : 'Deficient (Critical)';
      } else if (value <= high) {
        const rel_pos = (value - low) / (high - low);
        bar = 0.333 + rel_pos * 0.333 * sensitivity.optimal;
        color = 'green';
        status = 'Optimal';
      } else {
        const excess_ratio = (value - high) / high;
        bar = 0.666 + Math.min(excess_ratio, 1.0) * 0.334 * sensitivity.excessive;
        deviation = (value - high) / high * 100;
        color = deviation <= thresholds.excessive_threshold ? 'green' : 'blue';
        status = deviation <= thresholds.excessive_threshold ? 'Excessive (Acceptable)' : 'Excessive (Critical)';
      }
      // Calculate nutritional score for this nutrient
      const ideal = n.ideal;
      let devFrac = 0;
      if (typeof value === 'number' && typeof ideal === 'number' && ideal !== 0) {
        devFrac = (value - ideal) / ideal;
      }
      const score = smoothScore(devFrac);
      return { bar, color, status, low, high, value, unit, score };
    }
    // Calculate overall soil health score (mean of all nutrient scores)
    const scores = nutrients.map(n => {
      const value = n.current;
      const ideal = n.ideal;
      if (typeof ideal !== 'number' || ideal === 0 || ideal == null) {
        return NaN;
      }
      let devFrac = 0;
      if (typeof value === 'number' && typeof ideal === 'number' && ideal !== 0) {
        devFrac = (value - ideal) / ideal;
      }
      return smoothScore(devFrac);
    });
    const validScores = scores.filter(s => !isNaN(s));
    const overallScore = calculateSoilHealthScore(currentPaddockData.nutrients);
    // Star rating logic
    let stars = 1;
    if (overallScore >= 80) stars = 5;
    else if (overallScore >= 60) stars = 4;
    else if (overallScore >= 40) stars = 3;
    else if (overallScore >= 20) stars = 2;
    // Render stars
    const starDisplay = Array.from({ length: 5 }, (_, i) => i < stars ? '★' : '☆').join(' ');
    // Show comprehensive nutrient table for soil
    return (
      <Card className="bg-white mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-black">Comprehensive Nutrient Table (Sensitivity & Deviation)</CardTitle>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none align-middle"
            aria-label="Edit thresholds and sensitivity"
            onClick={() => setShowThresholdsPopup(true)}
          >
            <Settings size={20} />
          </button>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex flex-col items-center justify-center">
            <div className="text-3xl mb-1" style={{ letterSpacing: '2px', color: '#fbbf24' }}>{starDisplay}</div>
            <div className="mb-4 text-2xl font-bold text-blue-700 text-center">Overall Soil Health Score: {overallScore.toFixed(1)} / 100</div>
          </div>

        </CardContent>
      </Card>
    );
  };

  // Add the smooth_score function from Python
  function smoothScore(deviation, D = 50, n = 2, cutoff = 250) {
    const x = Math.abs(deviation) * 100; // Convert fraction to percentage
    if (x >= cutoff) return 0;
    const score = 100 / (1 + Math.pow(x / D, n));
    return Math.max(Math.min(score, 100), 0);
  }

  const [newNutrientLevels, setNewNutrientLevels] = useState({});


  // Build a lookup from parsed nutrients to canonical names
  function mapParsedToCanonical(parsedNutrients) {
    const lookup = {};
    parsedNutrients.forEach(n => {
      // Try exact match
      let canonical = nutrientNameMap[n.name];
      if (!canonical) {
        // Try removing extra spaces, case-insensitive
        const cleaned = n.name.replace(/\s+/g, ' ').trim().toLowerCase();
        for (const [raw, canon] of Object.entries(nutrientNameMap)) {
          if (raw.toLowerCase() === cleaned) {
            canonical = canon;
            break;
          }
        }
      }
      if (canonical) {
        lookup[canonical] = n;
      }
    });
    return lookup;
  }

  // Robust merging logic for canonical nutrients (like plant generator)
  function getUnifiedNutrientsFromParsed(parsedNutrients, canonicalList, canonicalData) {
    // Build a lookup of parsed nutrients by canonical name
    const nameMap = {
      'pH-level (1:5 water)': 'pH_level_1_5_water',
      'Organic Matter (Calc)': 'Organic_Matter_Calc',
      'Organic Carbon (LECO)': 'Organic_Carbon_LECO',
      'Conductivity (1:5 water)': 'Conductivity_1_5_water',
      'Ca/Mg Ratio': 'Ca_Mg_Ratio',
      'Nitrate-N (KCl)': 'Nitrate_N_KCl',
      'Ammonium-N (KCl)': 'Ammonium_N_KCl',
      'Phosphorus (Mehlich III)': 'Phosphorus_Mehlich_III',
      'Calcium (Mehlich III)': 'Calcium_Mehlich_III',
      'Magnesium (Mehlich III)': 'Magnesium_Mehlich_III',
      'Potassium (Mehlich III)': 'Potassium_Mehlich_III',
      'Sodium (Mehlich III)': 'Sodium_Mehlich_III',
      'Sulfur (KCl)': 'Sulfur_KCl',
      'Aluminium': 'Aluminium',
      'Silicon (CaCl2)': 'Silicon_CaCl2',
      'Boron (Hot CaCl2)': 'Boron_Hot_CaCl2',
      'Iron (DTPA)': 'Iron_DTPA',
      'Manganese (DTPA)': 'Manganese_DTPA',
      'Copper (DTPA)': 'Copper_DTPA',
      'Zinc (DTPA)': 'Zinc_DTPA',
      // base_saturation (removed conflicting mappings for Calcium, Magnesium, Potassium, Sodium)
      'Aluminum': 'Aluminum',
      'Hydrogen': 'Hydrogen',
      'Other Bases': 'Other_Bases',
      // lamotte_reams
      'Calcium LaMotte': 'Calcium_LaMotte',
      'Magnesium LaMotte': 'Magnesium_LaMotte',
      'Phosphorus LaMotte': 'Phosphorus_LaMotte',
      'Potassium LaMotte': 'Potassium_LaMotte',
      // tae (simple names from backend - only add unique ones not already mapped)
      'Selenium': 'Selenium_TAE',
      'Cobalt': 'Cobalt_TAE',
      'Molybdenum': 'Molybdenum_TAE',
      // tae (with TAE suffix)
      'Sodium TAE': 'Sodium_TAE',
      'Potassium TAE': 'Potassium_TAE',
      'Calcium TAE': 'Calcium_TAE',
      'Magnesium TAE': 'Magnesium_TAE',
      'Phosphorus TAE': 'Phosphorus_TAE',
      'Aluminium TAE': 'Aluminium_TAE',
      'Copper TAE': 'Copper_TAE',
      'Iron TAE': 'Iron_TAE',
      'Manganese TAE': 'Manganese_TAE',
      'Selenium TAE': 'Selenium_TAE',
      'Zinc TAE': 'Zinc_TAE',
      'Boron TAE': 'Boron_TAE',
      'Silicon TAE': 'Silicon_TAE',
      'Cobalt TAE': 'Cobalt_TAE',
      'Molybdenum TAE': 'Molybdenum_TAE',
      'Sulfur TAE': 'Sulfur_TAE',
    };
    // Build lookup from parsed
    const parsedLookup = {};


    // Debug: Check for specific missing TAE nutrients
    const missingTaeNutrients = ['Sodium', 'Potassium', 'Calcium', 'Magnesium'];
    missingTaeNutrients.forEach(name => {
      const taeNutrients = parsedNutrients.filter(n => n.name === name && n.category === 'tae');

    });

    parsedNutrients.forEach(n => {

      let canonical = nameMap[n.name] || n.name;

      // Special handling for TAE nutrients - use category field from backend
      if (n.category === 'tae') {
        // Map TAE nutrients to their canonical TAE names
        const taeKey = n.name + '_TAE';
        if (canonicalList.includes(taeKey)) {
          parsedLookup[taeKey] = n;

          return;
        } else {

        }
      }

      // Fallback: Check if this is a TAE nutrient by name and unit (for nutrients that might not have category set)
      const taeNutrientNames = ['Sodium', 'Potassium', 'Calcium', 'Magnesium', 'Phosphorus', 'Aluminium', 'Copper', 'Iron', 'Manganese', 'Zinc', 'Boron', 'Silicon', 'Sulfur', 'Selenium', 'Cobalt', 'Molybdenum'];
      if (taeNutrientNames.includes(n.name) && (n.unit === '' || (n.unit && n.unit.toLowerCase() === 'ppm'))) {
        const taeKey = n.name + '_TAE';
        if (canonicalList.includes(taeKey) && !parsedLookup[taeKey]) {
          parsedLookup[taeKey] = n;

          return;
        } else {

        }
      }

      if (canonicalList.includes(canonical)) {
        parsedLookup[canonical] = n;

      } else {

      }
    });

    // Always use % version for base saturation canonical keys if present
    const baseSaturationNames = ['Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other_Bases'];
    baseSaturationNames.forEach(element => {
      // Find % version in parsedNutrients
      const percentRow = parsedNutrients.find(n => (n.name === element || n.name === element.replace('_', ' ')) && n.unit === '%');
      if (percentRow && canonicalList.includes(element)) {
        parsedLookup[element] = percentRow;

      }
    });

    // PATCH: Map LaMotte/Reams values if present as 'Calcium', 'Magnesium', 'Phosphorus', 'Potassium' with unit 'ppm'
    ['Calcium', 'Magnesium', 'Phosphorus', 'Potassium'].forEach(element => {
      const lamotteKey = element + '_LaMotte';
      let ppmRow;
      if (element === 'Phosphorus') {
        // For Phosphorus, pick LaMotte candidate by name, category, or LaMotte ideal window (7–30 ppm)
        const candidates = parsedNutrients.filter(n => {
          const name = (n.name || '').toString();
          const unitOk = n.unit && n.unit.toLowerCase() === 'ppm';
          const isLamotteName = /phosphorus.*lamotte/i.test(name) || name === 'Phosphorus_LaMotte';
          const isLamotteCategory = (n as any).category === 'lamotte_reams';
          const idealOk = (typeof n.ideal === 'number' && n.ideal >= 7 && n.ideal <= 30) ||
            (Array.isArray((n as any).ideal_range) && (n as any).ideal_range[0] >= 7 && (n as any).ideal_range[1] <= 30);
          return unitOk && (isLamotteName || isLamotteCategory || idealOk) && /phosphorus/i.test(name);
        });
        if (candidates.length > 0) {
          ppmRow = candidates[0];
        }
      } else {
        ppmRow = parsedNutrients.find(n => {
          const name = (n.name || '').toString();
          const unitOk = n.unit && n.unit.toLowerCase() === 'ppm';
          const notTAE = (n as any).category !== 'tae';
          const notMehlich = !/Mehlich/i.test(name);
          const reasonable = typeof n.current === 'number' ? n.current <= 1000 : true;
          return unitOk && notTAE && notMehlich && (name === element || name === element.replace('_', ' ')) && reasonable;
        });
      }
      if (!parsedLookup[lamotteKey] && ppmRow) {
        parsedLookup[lamotteKey] = { ...ppmRow, name: lamotteKey, current: ppmRow.current };
      }
      // If missing, set to 0 for Phosphorus
      if (!ppmRow && element === 'Phosphorus') {
        parsedLookup[lamotteKey] = { name: lamotteKey, current: 0, unit: 'ppm' };

      }
    });
    // Build unified array
    return canonicalList.map(key => {
      let parsed = parsedLookup[key];
      // Always use real parsed value and ideal if present
      let value = parsed && typeof parsed.current !== 'undefined' ? parsed.current : '';
      let ideal = parsed && typeof parsed.ideal !== 'undefined' ? parsed.ideal : undefined;
      let unit = parsed && parsed.unit ? parsed.unit : (canonicalData && canonicalData[key] && canonicalData[key].unit ? canonicalData[key].unit : '');
      let ideal_range = canonicalData && canonicalData[key] && canonicalData[key].ideal_range ? canonicalData[key].ideal_range : undefined;
      return {
        name: key,
        current: value,
        ideal,
        unit,
        ideal_range,
        // Tag lamotte keys so downstream filters can pick them reliably
        category: /_LaMotte$/.test(key) ? 'lamotte_reams' : ((canonicalData && canonicalData[key] && (canonicalData as any)[key].category) || undefined)
      };
    });
  }

  // Calculate unifiedNutrientRows before return

  // Add this state at the top of the component (after useState hooks):
  const [generalComments, setGeneralComments] = useState({
    organicMatter: '',
    cec: '',
    soilPh: '',
    baseSaturation: '',
    availableNutrients: '',
    lamotteReams: '',
    tae: '',
  });
  const [loadingGeneralComments, setLoadingGeneralComments] = useState(false);
  const [errorGeneralComments, setErrorGeneralComments] = useState<string | null>(null);
  const [lamotteFromBackend, setLamotteFromBackend] = useState<{ candidates: any[]; selected: any[] } | null>(null);

  async function handleGenerateAI() {
    // Removed debug logging
    setLoadingGeneralComments(true);
    setErrorGeneralComments(null);
    const errors: string[] = [];
    try {

      debugger 
      console.log("Ref",reportRefId)

    
      // Define nutrient groups for each section
      const sectionNutrientMap = {
        // Only analyze Organic Matter for this section to avoid conflicting signals with Organic Carbon
        organicMatter: ['Organic Matter (Calc)'],
        cec: ['CEC', 'TEC'],
        soilPh: ['pH-level (1:5 water)'],
        baseSaturation: [
          'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other_Bases'
        ],
        availableNutrients: [
          'Nitrate-N (KCl)', 'Ammonium-N (KCl)', 'Phosphorus (Mehlich III)', 'Calcium (Mehlich III)',
          'Magnesium (Mehlich III)', 'Potassium (Mehlich III)', 'Sodium (Mehlich III)', 'Sulfur (KCl)',
          'Aluminium', 'Silicon (CaCl2)', 'Boron (Hot CaCl2)', 'Iron (DTPA)', 'Manganese (DTPA)', 'Copper (DTPA)', 'Zinc (DTPA)'
        ],
        lamotteReams: [
          'Calcium_LaMotte', 'Magnesium_LaMotte', 'Phosphorus_LaMotte', 'Potassium_LaMotte'
        ],
        tae: [
          'Sodium TAE', 'Potassium TAE', 'Calcium TAE', 'Magnesium TAE', 'Phosphorus TAE',
          'Aluminium TAE', 'Copper TAE', 'Iron TAE', 'Manganese TAE', 'Selenium TAE',
          'Zinc TAE', 'Boron TAE', 'Silicon TAE', 'Cobalt TAE', 'Molybdenum TAE', 'Sulfur TAE'
        ],
        phosphorusMonitoring: [

        ]
      };
      const newComments = {};
      let wasFetchSuccessfull = false
      if(reportRefId ){
        const requestOptions = {
          method: "GET",
        };
        let currentPaddock =  paddockReports[selectedPaddockIndex]
        let key = currentPaddock?.paddock
        console.log('currentPaddockData',currentPaddockData,paddockReports, selectedPaddockIndex,currentPaddock)
        // Use proxy endpoint to avoid CORS issues
        let response = await fetch(`/api/proxy/get-ai-comments/${reportRefId}?key=${encodeURIComponent(key)}`, requestOptions);
        
        console.log('get_ai_comments',response)
        if (response.status == 200){
            let data  = await response.json();
            console.log('get_ai_comments',data)
            let combined_nutrients_explanation = data?.ai_comments?.combined_nutrients_explanation
            console.log('get_ai_comments',combined_nutrients_explanation)
            newComments['availableNutrients'] = combined_nutrients_explanation["Available Nutrients"]
            newComments['baseSaturation'] =combined_nutrients_explanation["Base Saturation"]
            newComments['cec'] =combined_nutrients_explanation["CEC"]
            newComments['lamotteReams'] =combined_nutrients_explanation["Lamotte Reams"]
            newComments['organicMatter'] =combined_nutrients_explanation["Organic Matter"]
            newComments['phosphorusMonitoring'] =combined_nutrients_explanation["Phosphorus Monitoring"]
            newComments['soilPh'] =combined_nutrients_explanation["Soil pH"]
            newComments['tae'] =combined_nutrients_explanation["TAE"]
            wasFetchSuccessfull =true
        }

      }
      if(!wasFetchSuccessfull){
      for (const [section, names] of Object.entries(sectionNutrientMap)) {
        const sectionNutrients = section === 'lamotteReams'
          ? (() => {
            // Use backend-selected LaMotte entries when available
            if (lamotteFromBackend && Array.isArray(lamotteFromBackend.selected) && lamotteFromBackend.selected.filter(Boolean).length > 0) {
              const selected = lamotteFromBackend.selected.filter(Boolean).map((n: any) => ({
                name: n.name || n.raw_name || 'Unknown',
                current: n.current,
                ideal: n.ideal,
                unit: n.unit || 'ppm',
                category: 'lamotte_reams',
              }));
              console.log('DEBUG - lamotteReams using backend.selected:', selected);
              return selected;
            }
            // Aggregate ALL analyses and sources
            const allPaddockNutrients = (paddockReports && paddockReports.length)
              ? paddockReports.flatMap((pr: any) => (pr && pr.data && pr.data.nutrients) ? pr.data.nutrients : [])
              : [];
            const candidates = [...allPaddockNutrients, ...sourceNutrients, ...unifiedNutrientRows];
            const allMatches = candidates.filter((n: any) => /calcium|magnesium|potassium|phosphorus/i.test((n.name || '').toString()));
            console.log('DEBUG - lamotteReams candidates snapshot (Ca/Mg/K/P any):', allMatches.map((n: any) => ({ name: n.name, current: n.current, ideal: n.ideal, unit: n.unit, category: (n as any).category })));

            const normalizeNumber = (val: any): number => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string') {
                const cleaned = val.replace(/,/g, '');
                const m = cleaned.match(/-?\d*\.?\d+/);
                return m ? parseFloat(m[0]) : NaN;
              }
              return NaN;
            };
            const approxEq = (a: any, b: number, tol = 0.6) => {
              const aNum = normalizeNumber(a);
              return typeof aNum === 'number' && !Number.isNaN(aNum) && Math.abs(aNum - b) <= tol;
            };
            const selectByIdeal = (label: string, idealTarget: number) => {
              const hits = allMatches.filter((n: any) => approxEq(n.ideal, idealTarget, 1.0));
              if (hits.length === 0) {
                console.log(`DEBUG - lamotteReams NOT FOUND for ${label} ideal≈${idealTarget}. Showing all ${label} candidates:`, allMatches.filter((n: any) => new RegExp(label, 'i').test(n.name || '')));
                return null;
              }
              if (hits.length > 1) {
                console.log(`DEBUG - lamotteReams MULTIPLE hits for ${label} ideal≈${idealTarget}:`, hits);
              }
              return hits[0];
            };
            const pickP = selectByIdeal('Phosphorus', 18.5);
            const pickCa = selectByIdeal('Calcium', 1500);
            const pickMg = selectByIdeal('Magnesium', 212.5);
            const pickK = selectByIdeal('Potassium', 90);
            const chosen = [pickP, pickCa, pickMg, pickK].filter(Boolean) as any[];
            console.log('DEBUG - lamotteReams selected by ideal:', chosen.map(n => ({ name: n.name, current: n.current, ideal: n.ideal, unit: n.unit, category: (n as any).category })));
            // Fallback: if any missing, return all matches so backend can still preselect by ordinal
            return chosen.length === 4 ? chosen : allMatches;
          })()
          : section === 'tae'
            ? (() => {
              const allowedTAE = new Set(['Sodium', 'Potassium', 'Calcium', 'Magnesium', 'Phosphorus', 'Aluminium', 'Aluminum', 'Copper', 'Iron', 'Manganese', 'Selenium', 'Zinc', 'Boron', 'Silicon', 'Cobalt', 'Molybdenum', 'Sulfur', 'Sulphur']);
              return sourceNutrients.filter(n => {
                const isTae = n.category === 'tae' || String(n.name || '').includes('TAE');
                if (!isTae) return false;
                const baseName = String(n.name || '').replace(/_TAE$/, '').replace(/\s*TAE$/, '');
                return allowedTAE.has(baseName);
              });
            })()
            : section === 'availableNutrients'
              ? sourceNutrients.filter(n => {
                // STRICT matching for available nutrients - only exact matches
                const name = n.name.toLowerCase();
                const exactMatches = [
                  'nitrate-n (kcl)', 'ammonium-n (kcl)', 'phosphorus (mehlich iii)',
                  'calcium (mehlich iii)', 'magnesium (mehlich iii)', 'potassium (mehlich iii)',
                  'sodium (mehlich iii)', 'sulfur (kcl)', 'aluminium', 'silicon (cacl2)',
                  'boron (hot cacl2)', 'iron (dtpa)', 'manganese (dtpa)', 'copper (dtpa)', 'zinc (dtpa)'
                ];

                return exactMatches.includes(name);
              })
              : sourceNutrients.filter(n => names.includes(n.name));

        // Debug logging for organicMatter section
        if (section === 'organicMatter') {
          console.log('DEBUG - organicMatter sectionNutrients:', sectionNutrients);
        }
        // Debug logging and sanitization for baseSaturation section
        if (section === 'baseSaturation') {
          console.log('DEBUG - baseSaturation sectionNutrients:', sectionNutrients);
          console.log('DEBUG - All unifiedNutrientRows for baseSaturation:', unifiedNutrientRows.filter(n =>
            ['Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other_Bases'].includes(n.name)
          ));
        }

        // Debug logging for lamotteReams section
        if (section === 'lamotteReams') {
          console.log('DEBUG - lamotteReams sectionNutrients:', sectionNutrients);
          console.log('DEBUG - All sourceNutrients for lamotteReams:', sourceNutrients.filter(n =>
            n.name.includes('LaMotte') || n.name.includes('_LaMotte') ||
            (['Calcium', 'Magnesium', 'Phosphorus', 'Potassium'].includes(n.name) && n.unit === 'ppm')
          ));
        }

        // Debug logging for tae section + sanitize entries to true nutrients only
        if (section === 'tae') {
          console.log('DEBUG - tae sectionNutrients:', sectionNutrients);
          console.log('DEBUG - All sourceNutrients for tae:', sourceNutrients.filter(n =>
            n.name.includes('TAE') || n.category === 'tae'
          ));
          const allowedTAE = new Set(['Sodium', 'Potassium', 'Calcium', 'Magnesium', 'Phosphorus', 'Aluminium', 'Aluminum', 'Copper', 'Iron', 'Manganese', 'Selenium', 'Zinc', 'Boron', 'Silicon', 'Cobalt', 'Molybdenum', 'Sulfur', 'Sulphur']);
          const sanitizedTae = sectionNutrients.filter((n: any) => allowedTAE.has(String(n.name || '').replace(/_TAE$/, '')));
          console.log('DEBUG - tae sectionNutrients (sanitized):', sanitizedTae);
        }

        const nutrientsWithStatus = sectionNutrients.map(n => {
          let status = 'optimal';
          let classificationMethod = 'none';
          let deviation = null;

          if (n.ideal_range && Array.isArray(n.ideal_range) && n.ideal_range.length === 2) {
            classificationMethod = 'ideal_range';
            const range = n.ideal_range[1] - n.ideal_range[0];
            const lowerMargin = n.ideal_range[0] - (range * 0.15);
            const upperMargin = n.ideal_range[1] + (range * 0.3);

            if (n.current < lowerMargin) status = 'low';
            else if (n.current < n.ideal_range[0]) status = 'marginally_low';
            else if (n.current > upperMargin) status = 'high';
            else if (n.current > n.ideal_range[1]) status = 'marginally_high';
            else status = 'optimal';
          } else if (n.ideal !== undefined && n.current !== undefined) {
            classificationMethod = 'percentage_deviation';
            deviation = (n.current - n.ideal) / n.ideal;
            if (deviation < -0.35) status = 'low';
            else if (deviation < -0.15) status = 'marginally_low';
            else if (deviation > 0.7) status = 'high';
            else if (deviation > 0.3) status = 'marginally_high';
            else status = 'optimal';
          }

          return { ...n, status, classificationMethod, deviation };
        });

        let deficient = nutrientsWithStatus.filter(n => n.status === 'low').map(n => n.name);
        let marginallyDeficient = nutrientsWithStatus.filter(n => n.status === 'marginally_low').map(n => n.name);
        let optimal = nutrientsWithStatus.filter(n => n.status === 'optimal').map(n => n.name);
        let marginallyExcessive = nutrientsWithStatus.filter(n => n.status === 'marginally_high').map(n => n.name);
        let excess = nutrientsWithStatus.filter(n => n.status === 'high').map(n => n.name);

        // For base saturation, filter out Hydrogen, Aluminum, and Other Bases unless they are excessive
        if (section === 'baseSaturation') {
          const problematicNutrients = ['Hydrogen', 'Aluminum', 'Other_Bases'];

          // Remove from deficient and marginally deficient unless excessive
          deficient = deficient.filter(n => !problematicNutrients.includes(n) || excess.includes(n));
          marginallyDeficient = marginallyDeficient.filter(n => !problematicNutrients.includes(n) || excess.includes(n));
          optimal = optimal.filter(n => !problematicNutrients.includes(n) || excess.includes(n));
          marginallyExcessive = marginallyExcessive.filter(n => !problematicNutrients.includes(n) || excess.includes(n));
          // Keep excess as is - these are the only ones we want to mention
        }

        // Debug logging for organicMatter section status
        if (section === 'organicMatter') {
          console.log('DEBUG - organicMatter status categories:', {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess
          });
        }

        // Debug logging for lamotteReams section status
        if (section === 'lamotteReams') {
          console.log('DEBUG - lamotteReams status categories:', {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess
          });
        }

        // Debug logging for tae section status
        if (section === 'tae') {
          console.log('DEBUG - tae status categories:', {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess
          });
        }
        // Debug logging for baseSaturation section status + enforce allowed set for AI
        if (section === 'baseSaturation') {
          const allowed = new Set(['Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminium', 'Aluminum', 'Hydrogen', 'Other_Bases', 'Other Bases']);
          const normalizeName = (nm: string) => {
            if (!nm) return nm;
            if (nm === 'Aluminum') return 'Aluminium';
            if (nm === 'Other_Bases') return 'Other Bases';
            return nm;
          };
          deficient = deficient.filter(n => allowed.has(n)).map(normalizeName);
          marginallyDeficient = marginallyDeficient.filter(n => allowed.has(n)).map(normalizeName);
          optimal = optimal.filter(n => allowed.has(n)).map(normalizeName);
          marginallyExcessive = marginallyExcessive.filter(n => allowed.has(n)).map(normalizeName);
          excess = excess.filter(n => allowed.has(n)).map(normalizeName);

          // Enforce single-category assignment with precedence
          const precedence: Array<{ key: 'excess' | 'marginallyExcessive' | 'optimal' | 'marginallyDeficient' | 'deficient', label: string }> = [
            { key: 'excess' as any, label: 'Excessive' },
            { key: 'marginallyExcessive' as any, label: 'Marginally excessive' },
            { key: 'optimal' as any, label: 'Optimal' },
            { key: 'marginallyDeficient' as any, label: 'Marginally deficient' },
            { key: 'deficient' as any, label: 'Deficient' },
          ];
          const currentCats: Record<'deficient' | 'marginallyDeficient' | 'optimal' | 'marginallyExcessive' | 'excess', string[]> = {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess,
          };
          const assigned: Record<string, keyof typeof currentCats> = {};
          for (const p of precedence) {
            for (const nm of (currentCats[p.key] || [])) {
              if (!(nm in assigned)) {
                assigned[nm] = p.key;
              }
            }
          }
          // Rebuild categories
          const rebuilt: Record<keyof typeof currentCats, string[]> = {
            deficient: [],
            marginallyDeficient: [],
            optimal: [],
            marginallyExcessive: [],
            excess: [],
          } as any;
          Object.entries(assigned).forEach(([nm, cat]) => {
            rebuilt[cat].push(nm);
          });
          // For base saturation, only mention Aluminium/Hydrogen/Other Bases when in Excessive
          const special = new Set(['Aluminium', 'Hydrogen', 'Other Bases']);
          (['deficient', 'marginallyDeficient', 'optimal', 'marginallyExcessive'] as const).forEach(cat => {
            rebuilt[cat] = rebuilt[cat].filter(nm => !special.has(nm));
          });
          // Sort alphabetically
          (Object.keys(rebuilt) as Array<keyof typeof rebuilt>).forEach(cat => {
            rebuilt[cat] = rebuilt[cat].sort((a, b) => a.localeCompare(b));
          });
          deficient = rebuilt.deficient;
          marginallyDeficient = rebuilt.marginallyDeficient;
          optimal = rebuilt.optimal;
          marginallyExcessive = rebuilt.marginallyExcessive;
          excess = rebuilt.excess;

          console.log('DEBUG - baseSaturation status categories (sanitized):', {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess
          });
          console.log('DEBUG - Full nutrientsWithStatus for baseSaturation:', nutrientsWithStatus);
        }

        // Debug logging for lamotteReams section status
        if (section === 'lamotteReams') {
          console.log('DEBUG - lamotteReams status categories:', {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess
          });
          console.log('DEBUG - lamotteReams sectionNutrients:', sectionNutrients);
          console.log('DEBUG - All sourceNutrients for lamotteReams:', sourceNutrients.filter(n =>
            n.name.includes('LaMotte') || n.name.includes('_LaMotte')
          ));
        }

        // Debug logging for tae section status
        if (section === 'tae') {
          console.log('DEBUG - tae status categories:', {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess
          });
          console.log('DEBUG - tae sectionNutrients:', sectionNutrients);
          console.log('DEBUG - All sourceNutrients for tae:', sourceNutrients.filter(n =>
            n.category === 'tae'
          ));
        }

        // Debug logging for availableNutrients section status
        if (section === 'availableNutrients') {
          console.log('DEBUG - availableNutrients status categories:', {
            deficient,
            marginallyDeficient,
            optimal,
            marginallyExcessive,
            excess
          });
          console.log('DEBUG - availableNutrients sectionNutrients:', sectionNutrients);
          console.log('DEBUG - All sourceNutrients for availableNutrients:', sourceNutrients.filter(n => {
            const name = n.name.toLowerCase();
            return name.includes('nitrate') || name.includes('ammonium') || name.includes('phosphorus') ||
              name.includes('calcium') || name.includes('magnesium') || name.includes('potassium') ||
              name.includes('sodium') || name.includes('sulfur') || name.includes('aluminium') ||
              name.includes('silicon') || name.includes('boron') || name.includes('iron') ||
              name.includes('manganese') || name.includes('copper') || name.includes('zinc');
          }));
          console.log('DEBUG - Full nutrientsWithStatus for availableNutrients:', nutrientsWithStatus);
          console.log('DEBUG - Expected available nutrients names:', names);
          console.log('DEBUG - All sourceNutrients names:', sourceNutrients.map(n => n.name));

          // Detailed classification analysis
          console.log('DEBUG - Detailed classification analysis:');
          nutrientsWithStatus.forEach(n => {
            console.log(`  ${n.name}: current=${n.current}, ideal=${n.ideal}, ideal_range=${n.ideal_range}, method=${n.classificationMethod}, deviation=${n.deviation}, status=${n.status}`);
          });

          // Check if any nutrients are missing from the classification
          const expectedNutrients = ['Nitrate-N (KCl)', 'Ammonium-N (KCl)', 'Phosphorus (Mehlich III)', 'Calcium (Mehlich III)', 'Magnesium (Mehlich III)', 'Potassium (Mehlich III)', 'Sodium (Mehlich III)', 'Sulfur (KCl)', 'Aluminium', 'Silicon (CaCl2)', 'Boron (Hot CaCl2)', 'Iron (DTPA)', 'Manganese (DTPA)', 'Copper (DTPA)', 'Zinc (DTPA)'];
          const foundNutrients = nutrientsWithStatus.map(n => n.name);
          const missingNutrients = expectedNutrients.filter(n => !foundNutrients.includes(n));
          if (missingNutrients.length > 0) {
            console.log('DEBUG - Missing nutrients:', missingNutrients);
          }
        }

        // Use the new soil-specific endpoint with section data
        // Removed debug logging
        function generateFallbackContent(section: string, statusCategories: any): string {
          const { deficient, excess, optimal } = statusCategories;

          if (section === 'organicMatter') {
            return `Organic matter analysis shows ${deficient.length > 0 ? 'deficiencies in ' + deficient.join(', ') : 'good levels'}. ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
          } else if (section === 'cec') {
            return `Cation Exchange Capacity (CEC) analysis indicates ${deficient.length > 0 ? 'deficiencies in ' + deficient.join(', ') : 'good levels'}. ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
          } else if (section === 'soilPh') {
            return `Soil pH analysis shows ${deficient.length > 0 ? 'deficiencies in ' + deficient.join(', ') : 'good levels'}. ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
          } else if (section === 'baseSaturation') {
            return `Base saturation analysis reveals ${deficient.length > 0 ? 'deficiencies in ' + deficient.join(', ') : 'good levels'}. ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
          } else if (section === 'availableNutrients') {
            return `Available nutrients analysis reveals plant-accessible nutrient levels. ${deficient.length > 0 ? 'Deficiencies detected in ' + deficient.join(', ') : ''} ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
          } else if (section === 'lamotteReams') {
            return `LaMotte/Reams analysis provides specific nutrient availability assessment. ${deficient.length > 0 ? 'Deficiencies detected in ' + deficient.join(', ') : ''} ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
          } else if (section === 'tae') {
            return `Total Available Elements (TAE) analysis shows comprehensive nutrient availability. ${deficient.length > 0 ? 'Deficiencies detected in ' + deficient.join(', ') : ''} ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
          }

          return `Analysis shows ${deficient.length > 0 ? 'deficiencies in ' + deficient.join(', ') : 'good levels'}. ${excess.length > 0 ? 'Excessive levels in ' + excess.join(', ') : ''} ${optimal.length > 0 ? 'Optimal levels in ' + optimal.join(', ') : ''}`;
        }

        let data = null;
        try {
          // Debug logging for what's being sent to AI
          if (section === 'availableNutrients') {
            console.log('DEBUG - Data being sent to AI for availableNutrients:', {
              section,
              nutrientsCount: sectionNutrients.length,
              statusCategories: {
                deficient,
                marginallyDeficient,
                optimal,
                marginallyExcessive,
                excess
              }
            });
          }

          // Debug logging for what's being sent to AI for lamotteReams
          if (section === 'lamotteReams') {
            console.log('DEBUG - Data being sent to AI for lamotteReams:', {
              section,
              nutrientsCount: sectionNutrients.length,
              statusCategories: {
                deficient,
                marginallyDeficient,
                optimal,
                marginallyExcessive,
                excess
              }
            });
          }

          // Debug logging for what's being sent to AI for tae
          if (section === 'tae') {
            console.log('DEBUG - Data being sent to AI for tae:', {
              section,
              nutrientsCount: sectionNutrients.length,
              statusCategories: {
                deficient,
                marginallyDeficient,
                optimal,
                marginallyExcessive,
                excess
              }
            });
          }

          const response = await fetch('/generate-soil-comments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              section: section,
              nutrients: sectionNutrients,
              statusCategories: {
                deficient,
                excess,
                optimal,
                marginallyDeficient,
                marginallyExcessive
              }
            })
          });

          if (!response.ok) {
            console.error(`AI endpoint failed for ${section}: ${response.status} ${response.statusText}`);
            // Try to get error message from response
            let errorMessage = '';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || '';
            } catch (e) {
              // Response might not be JSON, try text
              try {
                errorMessage = await response.text();
              } catch (e2) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
              }
            }
            console.error(`Error details for ${section}:`, errorMessage);
            errors.push(`${section}: ${errorMessage || response.statusText || 'Server error'}`);
            // Use fallback content instead of throwing error
            const fallbackContent = generateFallbackContent(section, {
              deficient,
              excess,
              optimal,
              marginallyDeficient,
              marginallyExcessive
            });
            newComments[section] = fallbackContent;
            continue; // Skip to next section
          }

          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            console.error(`Failed to parse JSON response for ${section}:`, parseError);
            const fallbackContent = generateFallbackContent(section, {
              deficient,
              excess,
              optimal,
              marginallyDeficient,
              marginallyExcessive
            });
            newComments[section] = fallbackContent;
            continue; // Skip to next section
          }

          if (data && data.summary) {
            newComments[section] = data.summary;
          } else if (data && data.error) {
            console.error(`AI endpoint returned error for ${section}:`, data.error);
            const fallbackContent = generateFallbackContent(section, {
              deficient,
              excess,
              optimal,
              marginallyDeficient,
              marginallyExcessive
            });
            newComments[section] = fallbackContent;
          } else {
            const fallbackContent = generateFallbackContent(section, {
              deficient,
              excess,
              optimal,
              marginallyDeficient,
              marginallyExcessive
            });
            newComments[section] = fallbackContent;
          }
        } catch (error) {
          console.error(`AI call failed for ${section}:`, error);
          // Use fallback content instead of throwing error
          const fallbackContent = generateFallbackContent(section, {
            deficient,
            excess,
            optimal,
            marginallyDeficient,
            marginallyExcessive
          });
          newComments[section] = fallbackContent;
        }
      }
    }
      // Update the current paddock's general comments with AI-generated content
      updateCurrentPaddockData('generalComments', {
        ...currentPaddockData.generalComments,
        ...newComments
      });

      // Show warning if some sections failed but fallback content was used
      if (errors.length > 0) {
        const errorMessage = `AI generation partially failed for ${errors.length} section(s). Fallback content was generated. ${errors.length <= 3 ? 'Errors: ' + errors.join('; ') : 'Check console for details.'}`;
        setErrorGeneralComments(errorMessage);
        console.warn('AI generation errors:', errors);
      }

      
      // Also update the individual text fields for PDF export compatibility
      // Always populate somCecText with any available Organic Matter and/or CEC comments
      {
        const parts: string[] = [];
        if ((newComments as any).organicMatter) parts.push((newComments as any).organicMatter);
        if ((newComments as any).cec) parts.push((newComments as any).cec);
        if (parts.length > 0) {
          updateCurrentPaddockData('somCecText', parts.join('\n\n'));
        }
      }
      if ((newComments as any).baseSaturation) {
        // Removed debug logging
        updateCurrentPaddockData('baseSaturationText', (newComments as any).baseSaturation);
      }
      if ((newComments as any).soilPh) {
        // Removed debug logging
        updateCurrentPaddockData('phText', (newComments as any).soilPh);
      }
      // Store individual OM and CEC texts as well for PDF export flexibility
      if ((newComments as any).organicMatter) {
        updateCurrentPaddockData('organicMatterText', (newComments as any).organicMatter);
      }
      if ((newComments as any).cec) {
        updateCurrentPaddockData('cecText', (newComments as any).cec);
      }
      if ((newComments as any).availableNutrients) {
        // Removed debug logging
        updateCurrentPaddockData('availableNutrientsText', (newComments as any).availableNutrients);
      }
      if ((newComments as any).lamotteReams) {
        // Removed debug logging
        updateCurrentPaddockData('lamotteReamsText', (newComments as any).lamotteReams);
      }
      if ((newComments as any).tae) {
        // Removed debug logging
        updateCurrentPaddockData('taeText', (newComments as any).tae);
      }

      if((newComments as any).phosphorusMonitoring){
        updateCurrentPaddockData('phosphorusMonitoringText', (newComments as any).phosphorusMonitoring);

      }
    } catch (err) {
      console.error('AI generation error:', err);
      setErrorGeneralComments(`Failed to generate comments: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingGeneralComments(false);
    }
  }

  // Helper to get or generate a product description
  function hasAIGenerator(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).generateProductDescriptionAI === 'function';
  }

  // Custom hook to manage async description fetching
  function useProductDescription(prod, info) {
    const [desc, setDesc] = React.useState(info?.description || prod?.description || "");
    React.useEffect(() => {
      let mounted = true;
      if (!desc) {
        getProductDescription(prod, info).then(d => { if (mounted) setDesc(d); });
      }
      return () => { mounted = false; };
    }, [prod, info]);
    return desc;
  }

  // Add state for all product descriptions
  const [productDescriptions, setProductDescriptions] = React.useState({});

  // Helper to get or generate a product description (async)
  async function getProductDescription(prod, info) {
    if (info && info.description) return info.description;
    if (prod && prod.description) return prod.description;
    if (typeof window !== 'undefined' && typeof (window).generateProductDescriptionAI === 'function') {
      return await (window).generateProductDescriptionAI({
        name: prod.label,
        contains: (prod as any).contains,
        nutrientPercents: (prod as any).nutrientPercents,
        nutrientBreakdown: prod.nutrientBreakdown
      });
    }
    return "A high-quality product designed to support plant health and growth.";
  }

  // Precompute all product descriptions for all selected products
  React.useEffect(() => {
    let mounted = true;
    async function fetchAllDescriptions() {
      const all = {};
      const allSelected = [
        ...(seedTreatmentProducts || []),
        ...(plantingBlendProducts || []),
        ...(soilDrenchProducts || []),
        ...(currentPaddockData?.soilDrenchProgramProducts || []),
        ...(preFloweringFoliarProducts || []),
        ...(preFloweringFoliarProducts2 || []),
        ...(nutritionalFoliarProducts || []),
        ...(nutritionalFoliarProducts2 || [])
      ];
      for (const selected of allSelected) {
        let prod = seedTreatmentDefs.find(p => p.label === selected.product)
          || soilDrenchDefs.find(p => p.label === selected.product)
          || foliarSprayDefs.find(p => p.label === selected.product);
        const info = (typeof PRODUCT_INFO !== 'undefined' && prod && PRODUCT_INFO[prod.label]) ? PRODUCT_INFO[prod.label] : {};
        all[selected.id] = await getProductDescription(prod, info);
      }
      if (mounted) setProductDescriptions(all);
    }
    fetchAllDescriptions();
    return () => { mounted = false; };
  }, [seedTreatmentProducts, plantingBlendProducts, soilDrenchProducts, currentPaddockData?.soilDrenchProgramProducts, preFloweringFoliarProducts, preFloweringFoliarProducts2, nutritionalFoliarProducts, nutritionalFoliarProducts2]);

  // In each product section, render using productDescriptions[selected.id]
  // Example for Seed Treatment:
  {
    seedTreatmentProducts.map((selected, idx) => {
      const prod = productList.find(p => p.label === selected.product);
      const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
      return (
        <li key={selected.id} className="mb-1">
          <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
            {selected.product}
          </a>
          {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
          {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
          {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
          <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
        </li>
      );
    })
  }
  // Repeat for other product sections.

  // Add this near the top of the file, after imports:
  const soilAmendmentDescriptions: Record<string, string> = {
    'Monoammonium Phosphate (MAP)': 'A fast-acting phosphorus and ammonium fertilizer for rapid correction of P and N deficiencies.',
    'Calcium Nitrate': 'Supplies fast-acting nitrate nitrogen and calcium. Used in fertigation and hydroponics.',
    'Elemental Sulfur': 'Provides elemental sulfur for acidifying soil and correcting sulfur deficiencies.',
    'Triple Superphosphate': 'A concentrated phosphorus fertilizer with added calcium for strong root development.',
    'Muriate of Potash (Potassium Chloride)': 'A highly soluble potassium fertilizer for rapid correction of K deficiency.',
    'Thermophosphate': 'A slow-release phosphate fertilizer containing calcium, magnesium, and phosphorus.',
    'Gypsum (Calcium Sulfate)': 'Improves soil structure and supplies calcium and sulfur without affecting pH.',
    // Add more as needed
  };

  // Build a unified fertilizerDescriptions object at the top, including all soil correction fertilizers:
  const fertilizerDescriptions: Record<string, string> = {
    'Calcium Nitrate': 'Supplies readily available calcium and nitrate nitrogen for rapid plant uptake.',
    'Potassium Nitrate': 'Provides both potassium and nitrate nitrogen for balanced plant growth.',
    'Sodium Nitrate (Chile Nitrate)': 'Fast-acting source of nitrate nitrogen and sodium for specific crop needs.',
    'Ammonium Nitrate': 'Balanced source of ammonium and nitrate nitrogen for vigorous growth.',
    'UAN Solution (Urea Ammonium Nitrate)': 'Liquid blend of urea and ammonium nitrate for flexible nitrogen application.',
    'Calcium Ammonium Nitrate (CAN)': 'Supplies calcium, ammonium, and nitrate nitrogen for improved yield.',
    'Magnesium Nitrate': 'Provides magnesium and nitrate nitrogen for healthy growth.',
    'Zinc Nitrate': 'Supplies zinc and nitrate nitrogen for correcting deficiencies.',
    'Iron Nitrate': 'Provides iron and nitrate nitrogen for chlorophyll production.',
    'Copper Nitrate': 'Supplies copper and nitrate nitrogen for enzyme activation.',
    'Ammonium Sulfate': 'Provides ammonium nitrogen and sulfur for rapid green-up and protein formation.',
    'Monoammonium Phosphate (MAP)': 'Supplies phosphorus and ammonium nitrogen for early root and shoot growth.',
    'Diammonium Phosphate (DAP)': 'Provides phosphorus and ammonium nitrogen for vigorous early plant development.',
    'Ammonium Thiosulfate': 'Liquid source of ammonium nitrogen and sulfur for fertigation.',
    'Ammonium Polyphosphate (APP)': 'Liquid phosphorus and ammonium nitrogen for starter and fertigation.',
    'Ammonium Chloride': 'Supplies ammonium nitrogen and chloride for specific crop needs.',
    'Ammonium Acetate': 'Source of ammonium nitrogen for specialty applications.',
    'Triple Superphosphate (TSP)': 'Delivers concentrated phosphorus and calcium for strong root development.',
    'Rock Phosphate': 'Slow-release source of phosphorus for long-term soil fertility.',
    'Soft Rock Phosphate': 'Natural source of phosphorus and calcium for organic systems.',
    'Thermophosphate': 'Slow-release phosphate with calcium and magnesium.',
    'Bone Meal': 'Organic source of phosphorus and calcium for soil health.',
    'Fish Bone Meal': 'Organic phosphorus, calcium, and nitrogen for soil fertility.',
    'Chicken Manure': 'Organic fertilizer providing N, P, K, and organic matter.',
    'Agricultural Limestone (CaCO₃)': 'Raises soil pH and supplies calcium to improve soil structure and nutrient availability.',
    'Dolomitic Lime': 'Raises soil pH and supplies both calcium and magnesium for balanced nutrition.',
    'Gypsum (Calcium Sulfate)': 'Provides calcium and sulfur without affecting soil pH; improves soil structure and drainage.',
    'Calcium Chloride': 'Supplies fast-acting calcium for correcting deficiencies.',
    'Muriate of Potash (Potassium Chloride)': 'Delivers high levels of potassium for improved crop yield and quality.',
    'Langbeinite': 'Supplies potassium, magnesium, and sulfur for balanced nutrition.',
    'Potassium Magnesium Sulfate': 'Provides potassium, magnesium, and sulfur for soil fertility.',
    'Potassium Thiosulfate': 'Liquid potassium and sulfur for fertigation.',
    'Potassium Carbonate': 'Highly soluble potassium source for rapid correction.',
    'Potassium Acetate': 'Potassium source for specialty applications.',
    'Wood Ash': 'Supplies potassium, calcium, magnesium, and phosphorus for soil amendment.',
    'Sulfur-Rich Compost': 'Organic source of sulfur, calcium, magnesium, potassium, phosphorus, and nitrogen.',
    'Elemental Sulfur': 'Lowers soil pH and supplies sulfur for protein synthesis and enzyme function.',
    'Potassium Sulfate (Sulfate of Potash)': 'Supplies potassium and sulfur for improved crop quality and disease resistance.',
    // Add more as needed
  };

  // Helper for robust description lookup
  function getFertilizerDescription(label: string): string | undefined {
    if (fertilizerDescriptions[label]) return fertilizerDescriptions[label];
    // Try case-insensitive match
    const foundKey = Object.keys(fertilizerDescriptions).find(k => k.toLowerCase() === label.toLowerCase());
    if (foundKey) return fertilizerDescriptions[foundKey];
    return undefined;
  }

  // Add paddock management functions
  const saveCurrentPaddockReport = (updatedData) => {
    setPaddockReports((prev) =>
      prev.map((r, idx) =>
        idx === selectedPaddockIndex ? { ...r, data: { ...r.data, ...updatedData }, complete: true } : r
      )
    );
  };

  const handleSelectPaddock = (idx) => {
    setSelectedPaddockIndex(idx);
  };

  const updateCurrentPaddockData = (field, value) => {
    setPaddockReports(prev => prev.map((r, idx) => {
      if (idx === selectedPaddockIndex) {
        // Ensure tankMixingItems is always properly initialized
        const updatedData = { ...r.data, [field]: value };

        // If this is tankMixingItems and it's empty or undefined, initialize it with default values
        if (field === 'tankMixingItems' && (!value || !Array.isArray(value) || value.length === 0)) {
          console.log('Initializing tankMixingItems with default values for paddock', idx);
          updatedData.tankMixingItems = getDefaultTankMixingItemsCopy();
        }
        
        // Ensure soilAmendmentsSummary is always an array
        if (field === 'soilAmendmentsSummary') {
          updatedData.soilAmendmentsSummary = Array.isArray(value) ? value : [];
        }

        return { ...r, data: updatedData };
      }
      return r;
    }));
  };

  // Helper function to get default tank mixing items copy
  function getDefaultTankMixingItemsCopy() {
    const productDescriptions = [
      'More soluble Solids',
      'Liquid Solutions',
      'MMS (Micronized Mineral Solutions)',
      'Spray Oil',
      'Microbial Products'
    ];
    const productNotes = [
      'May require several minutes of good agitation',
      'Make sure previous inputs are fully dissolved before adding.',
      'Pre-mix well before adding slowly to the tank under constant agitation. Maintain constant agitation to prevent settling.',
      'Spreader/sticker/penetrant. Essential for success of foliar sprays.',
      'Always add microbes to the spray tank last after the other ingredients have been diluted.'
    ];
    return productDescriptions.map((desc, idx) => ({
      id: (Date.now() + idx).toString(),
      sequence: idx + 1,
      productDescription: desc,
      products: [],
      notes: productNotes[idx]
    }));
  }


  return (
    <div className="w-full max-w-screen-2xl mx-auto">
      {/* TEMP: Render SoilAnalysisChart at the top for testing */}
      {/* <SoilAnalysisChart nutrients={soilCorrectionsNutrients} /> */}
      <div className="space-y-6 px-2 sm:px-4 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-row items-center justify-between gap-4 min-h-[56px]">
            <h1 className="text-3xl font-extrabold text-black">Soil Report Generator</h1>
          </div>
          <p className="text-base text-gray-600 mt-2">Analyze your soil and generate professional recommendations.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <Card className="bg-white flex-1">
            <CardHeader>
              <CardTitle className="text-black">How To Use This Tool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-800 text-base space-y-2">
                <p><strong>This tool helps you analyze your soil, visualize nutrient status, and generate precise fertilizer recommendations for optimal crop nutrition.</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li><strong>Upload your soil therapy charts:</strong> First, export the soil therapy charts PDF from the NTS admin platform. Then click the upload area or drag and drop that PDF file here to generate recommendations.</li>
                  <li><strong>Review your soil nutrient status:</strong> The app reads your data and shows which nutrients are deficient, optimal, or excessive, with color-coded charts and tables.</li>
                  <li><strong>Get recommendations:</strong> For each deficient nutrient, select recommended fertilizers. The app calculates the required rates and ensures no nutrient exceeds safe levels.</li>
                  <li><strong>Track all applications:</strong> Add seed treatments, soil drenches, and foliar sprays. The app tracks all sources and shows a complete nutrient application summary.</li>
                  <li><strong>Export your report:</strong> Download or share a professional PDF report with all recommendations, charts, and supporting documents.</li>
                </ol>
                <p>Hover the <span className="inline-block align-middle"><Info size={16} className="inline text-blue-600" /></span> info icon in any section for detailed explanations.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-black">Soil Analysis Upload</CardTitle>
              <button type="button" className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none align-middle">
                <Info size={18} />
              </button>
            </CardHeader>
            <CardContent>
              <SoilUpload onFileUpload={handleFileUpload} isLoading={isUploading} />
              {uploadedFile && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => {
                    setUploadedFile(null);
                    setShowReport(false);
                  }}>
                    Upload New Soil Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Show Generate Report button after upload, before report */}
        {uploadedFile && !showReport && (
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-black">Generate Soil Report</h3>
                  <p className="text-sm text-gray-600">
                    Analysis complete. Generate comprehensive soil management report.
                  </p>
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating Report...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {showReport && (
          <>
            <div className="space-y-6">
              {/* 1. Nutritional Status Summary */}
              <ReportSection
                title={<span className="flex items-center">1. Nutritional Status Summary</span>}
                collapsible
                expanded={showSection1}
                onToggle={() => setShowSection1(v => !v)}
                useHideButton={true}
                infoContent={"This section provides an overview of your soil's nutritional status, including charts and tables that show nutrient levels, deviations from targets, and overall soil health. Use this to quickly identify deficiencies or excesses."}
              >
                {showSection1 && (
                  <>
                    {/* Paddock selection UI */}
                    {(() => {
                      const paddocksWithData = paddockReports.filter(report =>
                        report && report.data && (report.data.nutrients?.length > 0 || report.name || report.paddock)
                      );
                      // Removed debug logging
                      return paddocksWithData.length > 1 ? (
                        <div className="flex gap-2 mb-6">
                          {paddocksWithData.map((report, idx) => {
                            // Removed debug logging
                            return (
                              <button
                                key={report.analysisId}
                                className={`px-4 py-2 rounded-t font-semibold border-b-2 ${selectedPaddockIndex === idx ? 'bg-[#8cb43a] text-white border-[#8cb43a]' : 'bg-gray-100 text-gray-700 border-transparent'} ${report.complete ? 'ring-2 ring-green-400' : ''}`}
                                onClick={() => handleSelectPaddock(idx)}
                                type="button"
                              >
                                {report.paddock && report.paddock !== 'Unknown'
                                  ? report.paddock
                                  : report.name || `Paddock ${idx + 1}`}
                                {report.complete && <span className="ml-2 text-green-500">●</span>}
                              </button>
                            );
                          })}
                        </div>
                      ) : null;
                    })()}
                    {/* a. Nutrient Deviation Charts */}
                    {/* <div className="mb-4">
                      <h3 className="font-semibold text-lg text-black mb-2">a. Nutrient Deviation Charts</h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex-1 min-w-0">
                          <Card className="bg-white h-full">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <CardTitle className="text-black">Soil Therapy Chart</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <CleanNutrientDeviationBarChart nutrients={soilCorrectionsNutrients} />
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div> */}
                    {/* --- New Soil Analysis Chart Section --- */}
                    {/* <div className="mb-4">
                      <ReportSection
                        title={<span className="flex items-center">Soil Analysis Chart</span>}
                        collapsible
                        expanded={true}
                        useHideButton={true}
                        infoContent={"This chart visualizes each nutrient's status using sensitivity and deviation coloring, following the same logic as the comprehensive Python chart. Bars are colored and sized according to how deficient, optimal, or excessive each nutrient is."}
                      >
                        <SoilAnalysisChart nutrients={soilCorrectionsNutrients} />
                      </ReportSection>
                    </div> */}
                    {/* --- Comprehensive Nutrient Table Section --- */}
                    <div className="mb-4">
                      <ComprehensiveNutrientTable nutrients={unifiedNutrientRows} />
                      {showThresholdsPopup && (
                        <NutrientThresholdsPopup
                          nutrients={unifiedNutrients.map(n => n.name)}
                          colorThresholds={colorThresholds}
                          setColorThresholds={setColorThresholds}
                          zoneSensitivity={zoneSensitivity}
                          setZoneSensitivity={setZoneSensitivity}
                          onClose={() => setShowThresholdsPopup(false)}
                        />
                      )}
                    </div>
                    {/* b. Nutritional Ratios */}
                    {/* <div className="mb-4">
                      <h3 className="font-semibold text-lg text-black mb-2">b. Nutritional Ratios</h3>
                      <Card className="bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-black">Nutritional Ratios</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <NutritionalRatios nutrients={sourceNutrients} />
                        </CardContent>
                      </Card>
                    </div> */}
                    {/* c. Nutrient Deviation Radar Charts */}
                    {/* <div className="mb-4">
                      <h3 className="font-semibold text-lg text-black mb-2">c. Nutrient Deviation Radar Charts</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* i. Main Nutrients Deviation % */}
                    {/* <div className="flex-1 min-w-0">
                          <Card className="bg-white">
                            <CardHeader><CardTitle className="text-black">i. Main Nutrients Deviation (%)</CardTitle></CardHeader>
                            <CardContent>
                              <SpiderChartWithPopover
                                data={getRadarDeviationData(mainNutrients, [], false)}
                                title="Main Nutrients Deviation (%)"
                              />
                            </CardContent>
                          </Card>
                        </div>
                        {/* ii. Secondary Nutrients Deviation % */}
                    {/* <div className="flex-1 min-w-0">
                          <Card className="bg-white">
                            <CardHeader><CardTitle className="text-black">Secondary Nutrients Deviation (%)</CardTitle></CardHeader>
                            <CardContent>
                              <SpiderChartWithPopover
                                data={getRadarDeviationData(mainNutrients, [], false)}
                                title="Secondary Nutrients Deviation (%)"
                              />
                            </CardContent>
                          </Card>
                        </div>
                        {/* iii. Base Saturation Nutrients Deviation */}
                    {/* <div className="flex-1 min-w-0">
                          <Card className="bg-white">
                            <CardHeader><CardTitle className="text-black">Base Saturation Nutrients Deviation</CardTitle></CardHeader>
                            <CardContent>
                              <SpiderChartWithPopover
                                data={getRadarDeviationData(
                                  unifiedNutrients.filter(n => [
                                    'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other_Bases'
                                  ].includes(n.name)
                                ), [], false)}
                                title="Base Saturation Nutrients Deviation"
                              />
                            </CardContent>
                          </Card>
                        </div>
                        {/* iv. Lamotte Reams Nutrients Deviation */}
                    {/* <div className="flex-1 min-w-0">
                          <Card className="bg-white">
                            <CardHeader><CardTitle className="text-black">Lamotte Reams Nutrients Deviation</CardTitle></CardHeader>
                            <CardContent>
                              <SpiderChartWithPopover
                                data={getRadarDeviationData(
                                  unifiedNutrients.filter(n => [
                                    'Calcium_LaMotte', 'Magnesium_LaMotte', 'Phosphorus_LaMotte', 'Potassium_LaMotte'
                                  ].includes(n.name)
                                ), [], false)}
                                title="Lamotte Reams Nutrients Deviation"
                              />
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div> */}
                    {/* d. 
                     */}
                    {false && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg text-black mb-2">c. Nutritional Status Table</h3>
                        <Card className="bg-white">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-black">Nutritional Status Table</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <TotalNutrientApplicationTable
                              mainNutrients={dedupedMainNutrients}
                              nutrients={dedupedMainNutrients}
                              soilAmendmentsSummary={currentPaddockData.soilAmendmentsSummary || []}
                              seedTreatmentProducts={currentPaddockData.seedTreatmentProducts || []}
                              soilDrenchProducts={currentPaddockData.soilDrenchProducts || []}
                              foliarSprayProducts={allFoliarSprayProducts}
                              soilAmendmentFerts={soilAmendmentFerts}
                              seedTreatmentDefs={seedTreatmentDefs}
                              soilDrenchDefs={soilDrenchDefs}
                              foliarSprayDefs={foliarSprayDefs}
                              heading="Nutritional Situation"
                              showSourceBreakdown={false}
                              newNutrientLevels={newNutrientLevels}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </>
                )}
              </ReportSection>

              {/* 2. General Comments */}
              <ReportSection title="2. General Comments" collapsible expanded={showSection2} onToggle={() => setShowSection2(v => !v)} useHideButton={true} infoContent={"This section contains general comments and interpretations about your soil analysis, including organic matter, CEC, base saturation, pH, available nutrients, and reserves."}>
                {showSection2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-medium mb-1">Organic Matter</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.organicMatterText || ''}
                        onChange={e => updateCurrentPaddockData('organicMatterText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">CEC</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.cecText || ''}
                        onChange={e => updateCurrentPaddockData('cecText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Soil pH</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.phText || ''}
                        onChange={e => updateCurrentPaddockData('phText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Base Saturation</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.baseSaturationText || ''}
                        onChange={e => updateCurrentPaddockData('baseSaturationText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Available Nutrients</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.availableNutrientsText || ''}
                        onChange={e => updateCurrentPaddockData('availableNutrientsText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Lamotte Reams</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.lamotteReamsText || ''}
                        onChange={e => updateCurrentPaddockData('lamotteReamsText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">TAE</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.taeText || ''}
                        onChange={e => updateCurrentPaddockData('taeText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Phosphorus Monitoring</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[60px]"
                        value={currentPaddockData.phosphorusMonitoringText}
                        onChange={e => updateCurrentPaddockData('phosphorusMonitoringText', e.target.value)}
                        placeholder="Enter manual notes about phosphorus monitoring..."
                      />
                    </div>
                    <div className="mt-4 flex gap-2 items-center">
                      <Button onClick={handleGenerateAI} disabled={loadingGeneralComments} type="button">
                        {loadingGeneralComments ? 'Generating...' : 'Generate with AI'}
                      </Button>
                      <Button
                        onClick={() => {
                          // Get current text values from the UI textareas
                          const currentTexts = {
                            organicMatterText: currentPaddockData.organicMatterText || '',
                            cecText: currentPaddockData.cecText || '',
                            baseSaturationText: currentPaddockData.baseSaturationText || '',
                            phText: currentPaddockData.phText || '',
                            availableNutrientsText: currentPaddockData.availableNutrientsText || '',
                            lamotteReamsText: currentPaddockData.lamotteReamsText || '',
                            taeText: currentPaddockData.taeText || '',
                            phosphorusMonitoringText: currentPaddockData.phosphorusMonitoringText || ''
                          };

                          console.log('Current text values before saving:', currentTexts);

                          // Save to generalComments
                          const updatedComments = {
                            ...currentPaddockData.generalComments,
                            organicMatter: currentTexts.organicMatterText,
                            cec: currentTexts.cecText,
                            baseSaturation: currentTexts.baseSaturationText,
                            soilPh: currentTexts.phText,
                            availableNutrients: currentTexts.availableNutrientsText,
                            lamotteReams: currentTexts.lamotteReamsText,
                            tae: currentTexts.taeText,
                            phosphorusMonitoring: currentTexts.phosphorusMonitoringText
                          };

                          console.log('Saving comments to generalComments:', updatedComments);

                          // Update the fields that the PDF export actually reads from
                          const updatedData = {
                            ...currentPaddockData,
                            generalComments: updatedComments,
                            // These are the fields that PDF export reads from
                            somCecText: currentTexts.organicMatterText + '\n\n' + currentTexts.cecText,
                            baseSaturationText: currentTexts.baseSaturationText,
                            phText: currentTexts.phText,
                            availableNutrientsText: currentTexts.availableNutrientsText,
                            lamotteReamsText: currentTexts.lamotteReamsText,
                            taeText: currentTexts.taeText,
                            phosphorusMonitoringText: currentTexts.phosphorusMonitoringText,
                            // Also update the individual fields for consistency
                            organicMatterText: currentTexts.organicMatterText,
                            cecText: currentTexts.cecText
                          };

                          console.log('Updated data for PDF export:', {
                            somCecText: updatedData.somCecText,
                            baseSaturationText: updatedData.baseSaturationText,
                            phText: updatedData.phText,
                            availableNutrientsText: updatedData.availableNutrientsText,
                            lamotteReamsText: updatedData.lamotteReamsText,
                            taeText: updatedData.taeText
                          });

                          // Use a single update call to ensure all data is updated together
                          setPaddockReports(prev => prev.map((r, idx) => {
                            if (idx === selectedPaddockIndex) {
                              return { ...r, data: updatedData };
                            }
                            return r;
                          }));

                          console.log('Comments saved successfully! All fields updated.');
                          alert('Comments saved successfully!');
                        }}
                        variant="outline"
                        type="button"
                      >
                        Save Comments
                      </Button>
                      {errorGeneralComments && <span className="text-red-600 text-sm">{errorGeneralComments}</span>}
                    </div>
                  </div>
                )}
              </ReportSection>

              {/* 3. Product Recommendation */}
              <ReportSection title="3. Product Recommendation" collapsible expanded={showSection3} onToggle={() => setShowSection3(v => !v)} useHideButton={true} infoContent={"Select and review recommended products for soil amendments, seed treatment, planting blends, biological fertigation, and foliar sprays. Adjust rates and options as needed."}>
                {showSection3 && (
                  <div className="space-y-6">
                    {/* Soil Corrections (new, always in sync) */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Soil Corrections</CardTitle></CardHeader>
                      <CardContent>
                        {(() => {
                          // Removed debug logging
                          return (
                            <SoilCorrections
                              key={`soil-corrections-${selectedPaddockIndex}`}
                              nutrients={soilCorrectionsNutrients}
                              soilAmendmentsSummary={currentPaddockData.soilAmendmentsSummary || []}
                              setSoilAmendmentsSummary={val => updateCurrentPaddockData('soilAmendmentsSummary', val)}
                              onNutrientLevelsChange={setNewNutrientLevels}
                            />
                          );
                        })()}
                      </CardContent>
                    </Card>
                    {/* a. Soil Amendments */}
                    {/* <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Soil Amendments</CardTitle></CardHeader>
                      <CardContent>
                        <SoilAmendments
                          nutrients={soilCorrectionsNutrients}
                          selectedFertilizers={selectedFertilizers}
                          setSelectedFertilizers={setSelectedFertilizers}
                          fertilizerRates={fertilizerRates}
                          setFertilizerRates={setFertilizerRates}
                          allowedExcessPercent={allowedExcessPercent}
                          setAllowedExcessPercent={setAllowedExcessPercent}
                          onSummaryChange={setSoilAmendmentsSummary}
                        />
                      </CardContent>
                    </Card> */}
                    {/* b. Seed Treatment */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Seed Treatment</CardTitle></CardHeader>
                      <CardContent>
                        <SeedTreatment
                          selectedProducts={currentPaddockData.seedTreatmentProducts || []}
                          setSelectedProducts={val => updateCurrentPaddockData('seedTreatmentProducts', val)}
                          productOptions={soilDrenchDefs} // Use Biological Fertigation Program products for dropdown
                        />
                      </CardContent>
                    </Card>
                    {/* c. Planting Blend */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Planting Blend</CardTitle></CardHeader>
                      <CardContent>
                        <PlantingBlend
                          selectedProducts={currentPaddockData.plantingBlendProducts || []}
                          setSelectedProducts={val => updateCurrentPaddockData('plantingBlendProducts', val)}
                          productOptions={soilDrenchDefs} // Use Biological Fertigation Program products for dropdown
                        />
                      </CardContent>
                    </Card>
                    {/* d. Biological Fertigation Program */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Biological Fertigation Program</CardTitle></CardHeader>
                      <CardContent>
                        <SoilDrench
                          selectedProducts={currentPaddockData.soilDrenchProducts || []}
                          setSelectedProducts={val => updateCurrentPaddockData('soilDrenchProducts', val)}
                          deficientNutrients={dedupedMainNutrients.filter(n => n.status === 'low').map(n => n.name)}
                        />
                      </CardContent>
                    </Card>
                    {/* d2. Soil Drench Program */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Soil Drench Program</CardTitle></CardHeader>
                      <CardContent>
                        <SoilDrench
                          selectedProducts={currentPaddockData.soilDrenchProgramProducts || []}
                          setSelectedProducts={val => updateCurrentPaddockData('soilDrenchProgramProducts', val)}
                          deficientNutrients={dedupedMainNutrients.filter(n => n.status === 'low').map(n => n.name)}
                          title="Soil Drench Program"
                          description="Soil drench programs deliver nutrients and beneficial compounds directly to the root zone, improving nutrient uptake and soil biology activation."
                          placeholder="Choose soil drench product"
                        />
                      </CardContent>
                    </Card>
                    {/* e. Pre-Flowering Foliar Spray */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Pre-Flowering Foliar Spray</CardTitle></CardHeader>
                      <CardContent>
                        <FoliarSpray
                          selectedProducts={currentPaddockData.preFloweringFoliarProducts || []}
                          setSelectedProducts={val => updateCurrentPaddockData('preFloweringFoliarProducts', val)}
                          deficientNutrients={dedupedMainNutrients.filter(n => n.status === 'low').map(n => n.name)}
                        />
                        {!showSecondPreFloweringFoliar ? (
                          <Button variant="outline" className="mt-2" onClick={() => setShowSecondPreFloweringFoliar(true)}>
                            Add Second Application
                          </Button>
                        ) : (
                          <Button variant="destructive" className="mt-2" onClick={() => setShowSecondPreFloweringFoliar(false)}>
                            Remove Second Application
                          </Button>
                        )}
                        {showSecondPreFloweringFoliar && (
                          <FoliarSpray
                            selectedProducts={currentPaddockData.preFloweringFoliarProducts2 || []}
                            setSelectedProducts={val => updateCurrentPaddockData('preFloweringFoliarProducts2', val)}
                            deficientNutrients={dedupedMainNutrients.filter(n => n.status === 'low').map(n => n.name)}
                          />
                        )}
                      </CardContent>
                    </Card>
                    {/* f. Nutritional Foliar Spray */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">Nutritional Foliar Spray</CardTitle></CardHeader>
                      <CardContent>
                        <FoliarSpray
                          selectedProducts={currentPaddockData.nutritionalFoliarProducts || []}
                          setSelectedProducts={val => updateCurrentPaddockData('nutritionalFoliarProducts', val)}
                          deficientNutrients={dedupedMainNutrients.filter(n => n.status === 'low').map(n => n.name)}
                        />
                        {!showSecondFoliar ? (
                          <Button variant="outline" className="mt-2" onClick={() => setShowSecondFoliar(true)}>
                            Add Second Application
                          </Button>
                        ) : (
                          <Button variant="destructive" className="mt-2" onClick={() => setShowSecondFoliar(false)}>
                            Remove Second Application
                          </Button>
                        )}
                        {showSecondFoliar && (
                          <FoliarSpray
                            selectedProducts={currentPaddockData.nutritionalFoliarProducts2 || []}
                            setSelectedProducts={val => updateCurrentPaddockData('nutritionalFoliarProducts2', val)}
                            deficientNutrients={dedupedMainNutrients.filter(n => n.status === 'low').map(n => n.name)}
                          />
                        )}
                      </CardContent>
                    </Card>
                    {/* g. General Tank Mixing Sequence */}
                    <Card className="bg-white">
                      <CardHeader><CardTitle className="text-black">General Tank Mixing Sequence</CardTitle></CardHeader>
                      <CardContent>
                        <TankMixingSequence
                          key={`tank-mixing-${selectedPaddockIndex}`}
                          selectedProducts={(() => {
                            // Use the same logic as Plant Analysis - include all foliar spray products
                            const allFoliarProducts = [
                              ...(currentPaddockData.foliarSprayProducts || []),
                              ...(currentPaddockData.preFloweringFoliarProducts || []),
                              ...(currentPaddockData.preFloweringFoliarProducts2 || []),
                              ...(currentPaddockData.nutritionalFoliarProducts || []),
                              ...(currentPaddockData.nutritionalFoliarProducts2 || [])
                            ];

                            // Extract product names from the arrays
                            const productNames = allFoliarProducts.map(p =>
                              typeof p === 'string' ? p : (p.product || p.name || '')
                            ).filter(Boolean);

                            // Remove duplicates
                            return Array.from(new Set(productNames));
                          })()}
                          mixingItems={currentPaddockData.tankMixingItems || getDefaultTankMixingItemsCopy()}
                          setMixingItems={val => updateCurrentPaddockData('tankMixingItems', val)}
                          onSummaryChange={val => updateCurrentPaddockData('tankMixingItems', val)}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </ReportSection>

              {/* 4. Product Recommendation Summary */}
              <ReportSection title="4. Product Recommendation Summary" collapsible expanded={showSection4} onToggle={() => setShowSection4(v => !v)} useHideButton={true} infoContent={"A summary of all recommended products, their purposes, and application rates. Use this as a quick reference for your full nutrient program."}>
                {showSection4 && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-black">Product Recommendation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc ml-6 text-base">
                        {/* Debug info */}
                        {/* REMOVE the next two lines:
                        
                        {/* Soil Corrections FIRST */}
                        {Array.isArray(currentPaddockData.soilAmendmentsSummary) && currentPaddockData.soilAmendmentsSummary.length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Soil Corrections:</span>
                            <span className="text-gray-600 ml-2">Soil amendments and fertilizers applied to correct nutrient deficiencies and improve soil health.</span>
                            <ul className="ml-6 mt-1">
                              {currentPaddockData.soilAmendmentsSummary.map((item, idx) => {
                                const prod = productList.find(p => p.label === item.fertilizer);
                                const desc = prod?.description || getFertilizerDescription(item.fertilizer);
                                return (
                                  <li key={idx} className="mb-1">
                                    <span className="font-semibold text-blue-700">
                                      {item.fertilizer}
                                    </span>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {item.contains && item.contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {item.contains.join(', ')})</span>}
                                    <span className="font-semibold ml-2">{item.rate} {item.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {/* Seed Treatment */}
                        {currentPaddockData.seedTreatmentProducts && currentPaddockData.seedTreatmentProducts.length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Seed Treatment:</span>
                            <span className="text-gray-600 ml-2">Products applied to seeds before planting to enhance germination and early growth.</span>
                            <ul className="ml-6 mt-1">
                              {currentPaddockData.seedTreatmentProducts.map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {/* Planting Blend */}
                        {currentPaddockData.plantingBlendProducts && currentPaddockData.plantingBlendProducts.length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Planting Blend:</span>
                            <span className="text-gray-600 ml-2">Custom blends applied at planting to provide balanced nutrition for seedlings.</span>
                            <ul className="ml-6 mt-1">
                              {currentPaddockData.plantingBlendProducts.map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {/* Biological Fertigation Program (Soil Drench) */}
                        {currentPaddockData.soilDrenchProducts && currentPaddockData.soilDrenchProducts.length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Biological Fertigation Program:</span>
                            <span className="text-gray-600 ml-2">Biological products delivered through irrigation to enhance soil health and nutrient cycling.</span>
                            <ul className="ml-6 mt-1">
                              {currentPaddockData.soilDrenchProducts.map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {/* Soil Drench Program */}
                        {currentPaddockData.soilDrenchProgramProducts && currentPaddockData.soilDrenchProgramProducts.length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Soil Drench Program:</span>
                            <span className="text-gray-600 ml-2">Soil drench products delivered directly to the root zone to enhance soil health and nutrient cycling.</span>
                            <ul className="ml-6 mt-1">
                              {currentPaddockData.soilDrenchProgramProducts.map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {/* Pre-Flowering Foliar Spray (both sections) */}
                        {currentPaddockData.preFloweringFoliarProducts && currentPaddockData.preFloweringFoliarProducts.length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Pre-Flowering Foliar Spray:</span>
                            <span className="text-gray-600 ml-2">Nutrient solutions sprayed before flowering for rapid absorption and early plant support.</span>
                            <ul className="ml-6 mt-1">
                              {currentPaddockData.preFloweringFoliarProducts.map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {currentPaddockData.preFloweringFoliarProducts2 && currentPaddockData.preFloweringFoliarProducts2.length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Pre-Flowering Foliar Spray (2):</span>
                            <span className="text-gray-600 ml-2">Nutrient solutions sprayed before flowering for rapid absorption and early plant support.</span>
                            <ul className="ml-6 mt-1">
                              {currentPaddockData.preFloweringFoliarProducts2.map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {/* Nutritional Foliar Spray (both sections) */}
                        {(currentPaddockData.nutritionalFoliarProducts || nutritionalFoliarProducts) && (currentPaddockData.nutritionalFoliarProducts || nutritionalFoliarProducts).length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Nutritional Foliar Spray:</span>
                            <span className="text-gray-600 ml-2">Nutrient solutions sprayed for ongoing nutritional support and rapid correction of deficiencies.</span>
                            <ul className="ml-6 mt-1">
                              {(currentPaddockData.nutritionalFoliarProducts || nutritionalFoliarProducts).map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}
                        {(currentPaddockData.nutritionalFoliarProducts2 || nutritionalFoliarProducts2) && (currentPaddockData.nutritionalFoliarProducts2 || nutritionalFoliarProducts2).length > 0 && (
                          <li className="mb-2">
                            <span className="font-semibold">Nutritional Foliar Spray (2):</span>
                            <span className="text-gray-600 ml-2">Nutrient solutions sprayed for ongoing nutritional support and rapid correction of deficiencies.</span>
                            <ul className="ml-6 mt-1">
                              {(currentPaddockData.nutritionalFoliarProducts2 || nutritionalFoliarProducts2).map((selected, idx) => {
                                const prod = productList.find(p => p.label === selected.product);
                                const desc = prod?.description || "A high-quality product designed to support plant health and growth.";
                                return (
                                  <li key={selected.id} className="mb-1">
                                    <a href={prod ? `https://www.nutri-tech.com.au/products/${(prod as any).value}` : '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                                      {selected.product}
                                    </a>
                                    {desc && <span className="text-gray-700 ml-1"> {desc}</span>}
                                    {prod && (prod as any).contains && (prod as any).contains.length > 0 && <span className="text-gray-500 ml-1"> (Contains: {(prod as any).contains.join(', ')})</span>}
                                    {prod && (prod as any).nutrientPercents && (prod as any).nutrientPercents.length > 0 && <span className="text-gray-400 ml-1"> [{(prod as any).nutrientPercents.join(', ')}]</span>}
                                    <span className="font-semibold ml-2">{selected.rate} {selected.unit}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        )}

                        {/* Add more sections as needed */}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </ReportSection>


              {/* 6. PDF Attachments */}
              <ReportSection title="6. PDF Attachments" collapsible expanded={showSection6} onToggle={() => setShowSection6(v => !v)} useHideButton={true} infoContent={"Attach supporting PDF documents, such as lab reports or additional recommendations, to include in your final report export."}>
                {showSection6 && (
                  <PdfAttachments
                    frontAttachments={frontAttachments}
                    setFrontAttachments={setFrontAttachments}
                    backAttachments={backAttachments}
                    setBackAttachments={setBackAttachments}
                    onSummaryChange={setPdfAttachments}
                  />
                )}
              </ReportSection>

              {/* 7. Select Agronomist for Signature */}
              <ReportSection title="7. Select Agronomist for Signature" collapsible expanded={showSection7} onToggle={() => setShowSection7(v => !v)} useHideButton={true} infoContent={"Choose the agronomist who will sign off on this report. Their name and contact details will appear in the final document."}>
                {showSection7 && (
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <label className="block font-medium mb-2 text-black">Select Agronomist for Signature</label>
                    <select
                      className="border rounded px-3 py-2 w-full"
                      value={(currentPaddockData.selectedAgronomist || selectedAgronomist).email}
                      onChange={e => {
                        const found = [
                          { name: 'Marco Giorgio', role: 'Agronomist', email: 'marco@nutri-tech.com.au' },
                          { name: 'Alan Montalbetti', role: 'Agronomist', email: 'alan@nutri-tech.com.au' },
                          { name: 'Adriano De Senna', role: 'Agronomist', email: 'adriano@nutri-tech.com.au' },
                          { name: 'Graeme Sait', role: 'CEO & Founder', email: 'graeme@nutri-tech.com.au' },
                          { name: 'Franz Hentze', role: 'Agronomist', email: 'franz@nutri-tech.com.au' },
                          { name: 'Fred Ghorbani', role: 'Agronomist', email: 'fred@nutri-tech.com.au' },
                          { name: 'Adam Durey', role: 'NTS sales consultant', email: 'durey@nutri-tech.com.au' },
                        ].find(a => a.email === e.target.value);
                        if (found) {
                          setSelectedAgronomist(found);
                          // Update agronomist for ALL paddocks, not just current one
                          setPaddockReports(prev => prev.map(r => ({
                            ...r,
                            data: { ...r.data, selectedAgronomist: found }
                          })));
                        }
                      }}
                    >
                      {[
                        { name: 'Marco Giorgio', role: 'Agronomist', email: 'marco@nutri-tech.com.au' },
                        { name: 'Alan Montalbetti', role: 'Agronomist', email: 'alan@nutri-tech.com.au' },
                        { name: 'Adriano De Senna', role: 'Agronomist', email: 'adriano@nutri-tech.com.au' },
                        { name: 'Graeme Sait', role: 'CEO & Founder', email: 'graeme@nutri-tech.com.au' },
                        { name: 'Franz Hentze', role: 'Agronomist', email: 'franz@nutri-tech.com.au' },
                        { name: 'Fred Ghorbani', role: 'Agronomist', email: 'fred@nutri-tech.com.au' },
                        { name: 'Adam Durey', role: 'NTS sales consultant', email: 'durey@nutri-tech.com.au' },
                      ].map(a => (
                        <option key={a.email} value={a.email}>{a.name} - {a.role} - {a.email}</option>
                      ))}
                    </select>
                  </div>
                )}
              </ReportSection>

              {/* 8. Report Footer/Disclaimer */}
              <ReportSection title="8. Report Footer/Disclaimer" collapsible expanded={showSection8} onToggle={() => setShowSection8(v => !v)} useHideButton={true} infoContent={"Edit the disclaimer or footer text that will appear at the bottom of your exported report. This typically includes legal or advisory notes."}>
                {showSection8 && (
                  <Card className="bg-white mb-6">
                    <CardHeader>
                      <CardTitle className="text-black">Report Footer / Disclaimer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="w-full p-2 border rounded text-sm min-h-[80px]"
                        value={reportFooterText}
                        onChange={e => setReportFooterText(e.target.value)}
                      />
                      <div className="text-xs text-gray-500 mt-2">This text will appear at the bottom of the exported report. You may edit it as needed.</div>
                    </CardContent>
                  </Card>
                )}
              </ReportSection>

              {/* 9. Save & Export Report */}
              <ReportSection title="9. Export Report" collapsible expanded={showSection9} onToggle={() => setShowSection9(v => !v)} useHideButton={true} infoContent={"Save your work, download the report as a PDF, or share it. Use these options to finalize and distribute your soil analysis report."}>
                {showSection9 && (
                  <Card className="bg-white mb-6">
                    <CardHeader>
                      <CardTitle className="text-black">Export Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <Button
                          className="flex items-center gap-2 bg-[#8cb43a] hover:bg-[#7aa32f] text-white"
                          onClick={() => {
                            // Removed debug logging
                            handleExportPDF();
                          }}
                          disabled={isExporting}
                        >
                          {isExporting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating PDF...
                            </>
                          ) : (
                            <>
                              <FileDown className="h-4 w-4" />
                              Generate Custom PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </ReportSection>
            </div>
          </>
        )}
        {/* Hidden export summary for PDF */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, maxWidth: '900px', margin: '0 auto' }}>
          <SoilReportExportSummary
            ref={exportSummaryRef}
            nutrients={soilCorrectionsNutrients}
            paddocks={paddockReports.map(r => r.paddock)}
            generalComments={[
              currentPaddockData.somCecText || [currentPaddockData.organicMatterText, currentPaddockData.cecText].filter(Boolean).join('\n\n'),
              currentPaddockData.baseSaturationText || '',
              currentPaddockData.phText || '',
              currentPaddockData.availableNutrientsText || '',
              currentPaddockData.lamotteReamsText || '',
              currentPaddockData.taeText || ''
            ].filter(text => text && text.trim()).join('\n\n')}
            soilAmendments={soilAmendmentsSummary}
            seedTreatment={seedTreatmentProducts}
            soilDrench={currentPaddockData.soilDrenchProducts || soilDrenchProducts}
            foliarSpray={currentPaddockData.foliarSprayProducts || foliarSprayProducts}
            tankMixing={currentPaddockData.tankMixingItems || tankMixingItems}
            pdfAttachments={pdfAttachments}
            agronomist={currentPaddockData.selectedAgronomist || selectedAgronomist}
          />
        </div>
      </div>
    </div>
  );
};

export default SoilReportGenerator;