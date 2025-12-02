import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import ReportSection from './ReportSection';
import { CheckCircle, AlertTriangle, Settings, ShieldAlert, Gift } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// Add at the top, after imports:
interface FertilizerDef {
  label: string;
  nutrientContent: { [key: string]: number };
  phLogic?: { min_pH: number | null; max_pH: number | null };
  releaseType?: string;
  url?: string;
}

// Fertilizer definitions (should match those in SoilReportGenerator)
const fertilizerDefs: FertilizerDef[] = [
  { label: 'Urea', nutrientContent: { Ammonium: 46 }, description: 'A highly concentrated nitrogen fertilizer that promotes vigorous vegetative growth and rapid green-up in crops.' },
  { label: 'Calcium Nitrate', nutrientContent: { Calcium: 17, Nitrate: 12 }, phLogic: { min_pH: null, max_pH: 7.5 }, releaseType: 'fast' },
  { label: 'Potassium Nitrate', nutrientContent: { Potassium: 39, Nitrate: 14 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Sodium Nitrate (Chile Nitrate)', nutrientContent: { Sodium: 26, Nitrate: 16 }, phLogic: { min_pH: null, max_pH: 8.0 }, releaseType: 'fast' },
  { label: 'Zinc Nitrate', nutrientContent: { Zinc: 12, Nitrate: 8 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Iron Nitrate', nutrientContent: { Iron: 6, Nitrate: 10 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Copper Nitrate', nutrientContent: { Copper: 8, Nitrate: 12 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Ammonium Nitrate', nutrientContent: { Ammonium: 17, Nitrate: 17 }, phLogic: { min_pH: 5.5, max_pH: 7.5 }, releaseType: 'fast' },
  { label: 'UAN Solution (Urea Ammonium Nitrate)', nutrientContent: { Urea: 18, Ammonium: 9, Nitrate: 9 }, phLogic: { min_pH: 5.5, max_pH: 7.5 }, releaseType: 'fast' },
  { label: 'Calcium Ammonium Nitrate (CAN)', nutrientContent: { Calcium: 8, Magnesium: 2, Ammonium: 13, Nitrate: 13 }, phLogic: { min_pH: 5.5, max_pH: 7.5 }, releaseType: 'fast' },
  { label: 'Ammonium Polyphosphate (APP)', nutrientContent: { Phosphorus: 10, Ammonium: 11 }, phLogic: { min_pH: 5.5, max_pH: 8.0 }, releaseType: 'fast' },
  { label: 'Ammonium Chloride', nutrientContent: { Ammonium: 25 }, phLogic: { min_pH: 5.0, max_pH: 7.0 }, releaseType: 'fast' },
  { label: 'Ammonium Acetate', nutrientContent: { Ammonium: 12 }, phLogic: { min_pH: 5.0, max_pH: 8.5 }, releaseType: 'fast' },
  { label: 'Triple Superphosphate (TSP)', nutrientContent: { Phosphorus: 45, Calcium: 19 }, phLogic: { min_pH: 5.5, max_pH: 7.5 }, releaseType: 'fast' },
  { label: 'Monoammonium Phosphate (MAP)', nutrientContent: { Phosphorus: 21.9, Ammonium: 10 }, phLogic: { min_pH: 6.5, max_pH: 8.5 }, releaseType: 'fast' },
  { label: 'Diammonium Phosphate (DAP)', nutrientContent: { Phosphorus: 20, Ammonium: 18 }, phLogic: { min_pH: 5.0, max_pH: 6.8 }, releaseType: 'fast' },
  { label: 'Rock Phosphate', nutrientContent: { Phosphorus: 25, Calcium: 30 }, phLogic: { min_pH: null, max_pH: 6.0 }, releaseType: 'very slow' },
  { label: 'Agricultural Limestone (CaCO₃)', nutrientContent: { Calcium: 40 }, phLogic: { min_pH: null, max_pH: 6.5 }, releaseType: 'slow' },
  { label: 'Bone Meal', nutrientContent: { Calcium: 26, Phosphorus: 14 }, phLogic: { min_pH: null, max_pH: 7.0 }, releaseType: 'slow' },
  { label: 'Fish Bone Meal', nutrientContent: { Calcium: 20, Phosphorus: 10, Ammonium: 5 }, phLogic: { min_pH: 5.0, max_pH: 7.5 }, releaseType: 'slow' },
  { label: 'Calcium Chloride', nutrientContent: { Calcium: 27 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Muriate of Potash (Potassium Chloride)', nutrientContent: { Potassium: 60 }, phLogic: { min_pH: 5.5, max_pH: 8.5 }, releaseType: 'fast' },
  { label: 'Langbeinite', nutrientContent: { Potassium: 22, Magnesium: 11, Sulphur: 22 }, phLogic: { min_pH: 5.5, max_pH: 8.0 }, releaseType: 'moderate' },
  { label: 'Potassium Magnesium Sulfate', nutrientContent: { Potassium: 22, Magnesium: 11, Sulphur: 22 }, phLogic: { min_pH: 5.5, max_pH: 8.0 }, releaseType: 'moderate' },
  { label: 'Potassium Thiosulfate', nutrientContent: { Potassium: 25, Sulphur: 17 }, phLogic: { min_pH: 5.0, max_pH: 8.0 }, releaseType: 'fast' },
  { label: 'Potassium Carbonate', nutrientContent: { Potassium: 55 }, phLogic: { min_pH: 5.5, max_pH: 7.5 }, releaseType: 'fast' },
  { label: 'Potassium Acetate', nutrientContent: { Potassium: 25 }, phLogic: { min_pH: 5.5, max_pH: 8.0 }, releaseType: 'fast' },
  { label: 'Wood Ash', nutrientContent: { Potassium: 5, Calcium: 10, Magnesium: 2, Phosphorus: 1 }, phLogic: { min_pH: 5.0, max_pH: 7.0 }, releaseType: 'slow' },
  { label: 'Dolomitic Lime', nutrientContent: { Calcium: 20, Magnesium: 10 }, phLogic: { min_pH: null, max_pH: 6.5 }, releaseType: 'slow' },
  { label: 'Kieserite (Magnesium Sulfate Monohydrate)', nutrientContent: { Magnesium: 16, Sulphur: 22 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'moderate' },
  { label: 'Epsom Salt (Magnesium Sulfate Heptahydrate)', nutrientContent: { Magnesium: 9.9, Sulphur: 13 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Thermophosphate', nutrientContent: { Calcium: 20, Magnesium: 2, Phosphorus: 18 }, phLogic: { min_pH: 5.5, max_pH: 7.5 }, releaseType: 'slow' },
  { label: 'Magnesium Nitrate', nutrientContent: { Magnesium: 10.5, Nitrate: 11 }, phLogic: { min_pH: 5.5, max_pH: 8.0 }, releaseType: 'fast' },
  { label: 'Magnesium Chloride', nutrientContent: { Magnesium: 12 }, phLogic: { min_pH: 5.0, max_pH: 8.0 }, releaseType: 'fast' },
  { label: 'Sulfur-Rich Compost', nutrientContent: { Sulphur: 2, Calcium: 3, Magnesium: 2, Potassium: 2, Phosphorus: 1, Ammonium: 2 }, phLogic: { min_pH: 5.0, max_pH: 8.0 }, releaseType: 'slow' },
  { label: 'Elemental Sulfur', nutrientContent: { Sulphur: 90 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'very slow' },
  { label: 'Ammonium Sulfate', nutrientContent: { Ammonium: 21, Sulphur: 24 }, phLogic: { min_pH: 5.0, max_pH: 8.5 }, releaseType: 'fast' },
  { label: 'Potassium Sulfate (Sulfate of Potash)', nutrientContent: { Potassium: 42.5, Sulphur: 18.4 }, phLogic: { min_pH: 5.0, max_pH: 8.5 }, releaseType: 'fast' },
  { label: 'Ammonium Thiosulfate', nutrientContent: { Sulphur: 26, Ammonium: 12 }, phLogic: { min_pH: 5.0, max_pH: 8.5 }, releaseType: 'moderate' },
  { label: 'Sulfur-Coated Urea', nutrientContent: { Sulphur: 15, Ammonium: 35 }, phLogic: { min_pH: 5.0, max_pH: 8.0 }, releaseType: 'slow' },
  { label: 'Chicken Manure', nutrientContent: { Phosphorus: 2.5, Ammonium: 3, Potassium: 2, Calcium: 3, Magnesium: 1, Sulphur: 0.5 }, phLogic: { min_pH: 5.0, max_pH: 8.0 }, releaseType: 'slow' },
  { label: 'NTS Fast Fulvic™', nutrientContent: { Nitrate: 0.1, Ammonium: 0.1, Calcium: 0.1, Magnesium: 0.1, Potassium: 0.1, Phosphorus: 0.1, Sulphur: 0.1 }, phLogic: { min_pH: 4, max_pH: 12 }, releaseType: 'fast',description: 'An 8 % fulvic acid liquid possessing a myriad of yield-enhancing qualities.' },
  { label: 'NTS Fulvic Acid Powder™', nutrientContent: { Nitrate: 0.1, Ammonium: 0.1, Calcium: 0.1, Magnesium: 0.1, Potassium: 0.1, Phosphorus: 0.1, Sulphur: 0.1 }, phLogic: { min_pH: 4, max_pH: 12 }, releaseType: 'fast' ,description: 'Fulvic acid in a concentrated, soluble powder – the most versatile and productive input in agriculture, in freight-friendly form.'},
  { label: 'NTS FulvX™ Powder', nutrientContent: { Nitrate: 0.1, Ammonium: 0.1, Calcium: 0.1, Magnesium: 0.1, Potassium: 0.1, Phosphorus: 0.1, Sulphur: 0.1 }, phLogic: { min_pH: 4, max_pH: 12 }, releaseType: 'fast' ,description: 'Concentrated soluble fulvic & humic acid.'},
  { label: 'NTS Liquid Humus™', nutrientContent: { Nitrate: 0.1, Ammonium: 0.1, Calcium: 0.1, Magnesium: 0.1, Potassium: 0.1, Phosphorus: 0.1, Sulphur: 0.1 }, phLogic: { min_pH: 4, max_pH: 12 }, releaseType: 'fast' ,description: 'A liquid humic acid suspension derived from premium humates, designed to improve soil structure, nutrient retention, and biological activity.'},
  { label: 'NTS Soluble Humate Granules™', nutrientContent: { Nitrate: 0.1, Ammonium: 0.1, Calcium: 0.1, Magnesium: 0.1, Potassium: 0.1, Phosphorus: 0.1, Sulphur: 0.1 }, phLogic: { min_pH: 4, max_pH: 12 }, releaseType: 'fast' ,description: 'High-purity, fully soluble humate granules for use in liquid formulations or direct soil application to enhance CEC, nutrient chelation, and microbial health.' },
  { label: 'NTS Super Soluble Humates™', nutrientContent: { Nitrate: 0.1, Ammonium: 0.1, Calcium: 0.1, Magnesium: 0.1, Potassium: 0.1, Phosphorus: 0.1, Sulphur: 0.1 }, phLogic: { min_pH: 4, max_pH: 12 }, releaseType: 'fast' ,description: 'Highly refined, super-soluble humic acid powder for preparing DIY liquid humus, boosting nutrient efficiency, and stimulating beneficial soil microbes.'},
  { label: 'Life Force® Carbon™', nutrientContent: { Nitrate: 0.1, Ammonium: 0.1, Calcium: 0.1, Magnesium: 0.1, Potassium: 0.1, Phosphorus: 0.1, Sulphur: 0.1 }, phLogic: { min_pH: 4, max_pH: 12 }, releaseType: 'slow' },
  { label: 'Life Force Gold™', nutrientContent: { Calcium: 9.8, Potassium: 2.4, Ammonium: 2, Phosphorus: 1.55, Sulphur: 4 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'moderate' },
  { label: 'NTS Soft Rock™', nutrientContent: { Calcium: 20, Phosphorus: 9 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow', url: 'https://nutri-tech.com.au/collections/composted-fertilisers/products/nts-soft-rock' },
  { label: 'Nutri-Gyp™ Natural Gypsum', nutrientContent: { Calcium: 19, Sulphur: 15 }, phLogic: { min_pH: 4.5, max_pH: 8.4 }, releaseType: 'moderate' },
  { label: 'Nutri-Cal™', nutrientContent: { Potassium: 2.5, Magnesium: 3.26, Sulphur: 4.63 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Nutri-Phos Super Active™', nutrientContent: { Calcium: 28.9, Phosphorus: 12.6 }, phLogic: { min_pH: 6.0, max_pH: 7.0 }, releaseType: 'slow' },
  { label: 'Soluble Boron™', nutrientContent: { Boron: 22 }, phLogic: { min_pH: 5.0, max_pH: 8.0 }, releaseType: 'fast' },
  { label: 'Boric Acid™', nutrientContent: { Boron: 17.5 }, phLogic: { min_pH: 5.5, max_pH: 8.5 }, releaseType: 'moderate' },
  { label: 'Borax', nutrientContent: { Boron: 14 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'moderate' },
  { label: 'Cobalt Sulfate Heptahydrate', nutrientContent: { Cobalt: 21 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Copper Sulfate', nutrientContent: { Copper: 25 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Dolomite', nutrientContent: { Calcium: 20, Magnesium: 10 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow' },
  { label: 'Gran Am', nutrientContent: { Ammonium: 20, Sulphur: 24 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Granulated Boric Acid', nutrientContent: { Boron: 17.5 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'moderate' },
  { label: 'Granulated Copper Sulfate', nutrientContent: { Copper: 25 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Granulated Zinc Mono', nutrientContent: { Zinc: 35 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Guano', nutrientContent: { Calcium: 30, Phosphorus: 13 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow' },
  { label: 'Iron Sulfate', nutrientContent: { Iron: 18 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Magnesite', nutrientContent: { Magnesium: 27 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow' },
  { label: 'Magnesium Oxide', nutrientContent: { Magnesium: 53 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow' },
  { label: 'Magnesium Sulfate', nutrientContent: { Magnesium: 9.9, Sulphur: 13 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Manganese Sulfate', nutrientContent: { Manganese: 31 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Mono Potassium Phosphate (MKP)', nutrientContent: { Potassium: 28, Phosphorus: 22 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Natural Gypsum', nutrientContent: { Calcium: 20, Sulphur: 15 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'moderate' },
  { label: 'NTS Stabilised Boron Granules™', nutrientContent: { Boron: 3.3 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'moderate' },
  { label: 'Sodium Molybdate', nutrientContent: { Molybdenum: 39 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Super Fine Ag Lime', nutrientContent: { Calcium: 40 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow' },
  { label: 'Zinc Sulfate Heptahydrate', nutrientContent: { Zinc: 22, Sulphur: 11 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Zinc Sulfate Monohydrate', nutrientContent: { Zinc: 34, Sulphur: 15 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  // Add more as needed
];

// After fertilizerDefs is defined, add this code to deduplicate by label:
const uniqueFertilizerDefs = [];
const seenLabels = new Set();
for (const fert of fertilizerDefs) {
  if (!seenLabels.has(fert.label)) {
    uniqueFertilizerDefs.push(fert);
    seenLabels.add(fert.label);
  }
}
// Use uniqueFertilizerDefs everywhere instead of fertilizerDefs


function getFertilizersForNutrient(nutrient) {
  if (!nutrient) return [];
  return uniqueFertilizerDefs.filter(f =>
    f.nutrientContent &&
    Object.keys(f.nutrientContent).some(
      k => k.toLowerCase() === nutrient.toLowerCase()
    )
  );
}

function ppmToKgHa(ppm) {
  return (Number(ppm) * 2.4).toFixed(1);
}

// Extract soil pH from nutrients array
function getSoilPh(nutrients) {
  const phNutrient = nutrients.find(n => n.name && n.name.toLowerCase().includes('ph'));
  return phNutrient ? Number(phNutrient.current) : null;
}

const releaseTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'fast', label: 'Fast Release' },
  { value: 'moderate', label: 'Moderate Release' },
  { value: 'slow', label: 'Slow Release' },
  { value: 'very slow', label: 'Very Slow Release' },
  { value: 'controlled', label: 'Controlled Release' },
];

const SoilCorrections = ({ nutrients, soilAmendmentsSummary, setSoilAmendmentsSummary, onNutrientLevelsChange }) => {
  // Removed debug logging
  const soilPh = getSoilPh(nutrients);

  // For each nutrient with status 'low', show a correction card
  // Prioritize main testing methods over TAE, LaMotte, and base saturation
  const deficientNutrients = nutrients.filter(n => {
    const nameLower = (n.name || '').toLowerCase();
    const categoryLower = (n.category || '').toLowerCase();
    const isMetaMetric = [
      'paramagnetism',
      'organic_matter_calc',
      'organic_carbon_leco',
      'conductivity_1_5_water',
      'ca_mg_ratio'
    ].includes(nameLower);
    const isExcludedCategory = ['lamotte_reams', 'tae', 'base_saturation'].includes(categoryLower);
    const isExcludedByName = nameLower.includes('lamotte') || nameLower.includes('tae');
    return (
      n.status === 'low' &&
      !isExcludedCategory &&
      !isExcludedByName &&
      !isMetaMetric
    );
  });
  
  // Removed debug logging

  // Filter to prioritize main testing methods for each nutrient
  const prioritizedDeficientNutrients = [];
  const nutrientGroups = {};
  
  // Group nutrients by their base name (e.g., 'Calcium', 'Magnesium', etc.)
  deficientNutrients.forEach(nutrient => {
    const baseName = nutrient.genericName || nutrient.name.split('_')[0] || nutrient.name;
    if (!nutrientGroups[baseName]) {
      nutrientGroups[baseName] = [];
    }
    nutrientGroups[baseName].push(nutrient);
  });
  
  // For each group, select the nutrient with the highest priority testing method
  Object.entries(nutrientGroups).forEach(([baseName, groupNutrients]) => {
          // Removed debug logging
    
    // If any Albrecht-method reading for this base nutrient is NOT low, skip corrections for this nutrient entirely
    const hasNonLowAlbrecht = (nutrients || []).some(nu => {
      const nuBase = (nu.genericName || (nu.name || '').split('_')[0] || nu.name || '').toLowerCase();
      const baseLower = (baseName || '').toLowerCase();
      const nameLower = (nu.name || '').toLowerCase();
      const categoryLower = (nu.category || '').toLowerCase();
      const isAlbrechtMethod = (
        nameLower.includes('mehlich') ||
        nameLower.includes('kcl') ||
        nameLower.includes('dtpa') ||
        nameLower.includes('cacl2') ||
        nameLower.includes('hot cacl2') ||
        nameLower.includes('1:5 water') ||
        nameLower.includes('leco') ||
        nameLower.includes('calc') ||
        categoryLower === 'albrecht_mehlich_kcl'
      );
      return nuBase === baseLower && isAlbrechtMethod && nu.status !== 'low';
    });
    if (hasNonLowAlbrecht) {
      return; // do not add any correction for this base nutrient
    }

    if (groupNutrients.length === 1) {
      // Only one nutrient in group, use it
              // Removed debug logging
      prioritizedDeficientNutrients.push(groupNutrients[0]);
    } else {
      // Multiple nutrients - prioritize main testing methods
      const priorityOrder = [
        ' (Mehlich III)',
        ' (KCl)',
        ' (DTPA)',
        ' (Hot CaCl2)',
        ' (CaCl2)',
        ' (LECO)',
        ' (Calc)',
        ' (1:5 water)',
        // Ensure LaMotte/TAE are lowest priority if they ever appear
        'LaMotte',
        'TAE'
      ];
      
      // Find the nutrient with the highest priority method
      let bestNutrient = groupNutrients[0];
      let bestPriority = -1;
      
      groupNutrients.forEach(nutrient => {
        const method = nutrient.name.replace(baseName, '');
        const priority = priorityOrder.findIndex(m => method.includes(m));
        // Removed debug logging
        if (priority !== -1 && (bestPriority === -1 || priority < bestPriority)) {
          bestPriority = priority;
          bestNutrient = nutrient;
          // Removed debug logging
        }
      });
      
              // Removed debug logging
      prioritizedDeficientNutrients.push(bestNutrient);
    }
  });
  
  // Removed debug logging
  
  // Main nutrient names and order
  const mainNutrientOrder = ['calcium', 'magnesium', 'potassium', 'phosphorus', 'sulphur', 'nitrate', 'ammonium'];
  // Split into main and secondary
  const mainDeficientNutrients = mainNutrientOrder
    .map(main => prioritizedDeficientNutrients.find(n => (n.genericName || n.name || '').toLowerCase() === main))
    .filter(Boolean);
  const secondaryDeficientNutrients = prioritizedDeficientNutrients.filter(
    n => !mainNutrientOrder.includes((n.genericName || n.name || '').toLowerCase())
  );

  // Local state for selected fertilizer and rate per nutrient
  const [fertSelections, setFertSelections] = useState({}); // { [nutrientName]: { fertLabel, rate } }
  // State for max allowed excess percentage
  const [maxAllowedExcess, setMaxAllowedExcess] = useState(25);
  // Add state for fertilizer type filter
  const [releaseTypeFilter, setReleaseTypeFilter] = useState('all');
  // Add this at the top level of the component, after other useState hooks:
  const [dropdownReleaseTypes, setDropdownReleaseTypes] = useState({}); // { [`${nutrient.name}-${idx}`]: value }
  const [dropdownSearches, setDropdownSearches] = useState({}); // { [`${nutrient.name}-${idx}`]: searchTerm }
  
  // Add ref to track previous nutrients to detect paddock switches
  // const prevNutrientsRef = useRef(nutrients); // This line is removed
  
  // Initialize fertSelections from soilAmendmentsSummary only on mount
  useEffect(() => {
    // Only initialize if soilAmendmentsSummary contains manually added fertilizers
    if (soilAmendmentsSummary && soilAmendmentsSummary.length > 0) {
      const newFertSelections = {};
      soilAmendmentsSummary.forEach(item => {
        if (item.fertilizer && item.nutrient && item.rate) {
          if (!newFertSelections[item.nutrient]) {
            newFertSelections[item.nutrient] = [];
          }
          newFertSelections[item.nutrient].push({
            fertLabel: item.fertilizer,
            rate: item.rate
          });
        }
      });
      setFertSelections(newFertSelections);
    } else {
      // Clear any existing selections if no manual fertilizers
      setFertSelections({});
    }
    setDropdownReleaseTypes({});
  }, []); // Only run on mount



  // Helper: get total applied for a nutrient from summary
  function getTotalApplied(nutrient) {
    return soilAmendmentsSummary
      .filter(item => item.nutrient === nutrient)
      .reduce((sum, item) => sum + (item.actualNutrientApplied || 0), 0);
  }

  // Handler for fertilizer selection and rate
  function handleApplyFertilizer(nutrient, fertLabel, rate) {
    const fert = uniqueFertilizerDefs.find(f => f.label === fertLabel);
    if (!fert) return;
    const percent = fert.nutrientContent[nutrient] || 0;
    const actualNutrientApplied = (rate * percent) / 100;
    // Remove only this specific fertilizer if it already exists, keep others
    const filtered = soilAmendmentsSummary.filter(item => !(item.nutrient === nutrient && item.fertilizer === fertLabel));
    console.log('handleApplyFertilizer','nutrient',nutrient,'fertLabel',fertLabel,'rate',rate,'filtered',filtered,'soilAmendmentsSummary',soilAmendmentsSummary)
    setSoilAmendmentsSummary([
      ...filtered,
      {
        fertilizer: fertLabel,
        nutrient,
        rate,
        actualNutrientApplied,
        unit: 'kg/ha',
        contains: Object.keys(fert.nutrientContent),
        recommended: true,
        nutrientsFor: [nutrient],
      },
    ]);
    // Update fertSelections to reflect the applied fertilizer
    setFertSelections(prev => {
      const currentSelections = prev[nutrient] || [];
      const newSelections = Array.isArray(currentSelections) ? [...currentSelections] : [];
      newSelections.push({ fertLabel, rate });
      return { ...prev, [nutrient]: newSelections };
    });
  }

  // Helper: get globally selected fertilizer labels (excluding current nutrient's selectors)
  function getGloballySelectedFertilizers(currentNutrient) {
    const selected = new Set();
    Object.entries(fertSelections).forEach(([nutr, sels]) => {
      if (nutr === currentNutrient) return; // allow re-selecting for same nutrient
      (Array.isArray(sels) ? sels : []).forEach(sel => {
        if (sel.fertLabel && sel.fertLabel !== 'none') selected.add(sel.fertLabel);
      });
    });
    return selected;
  }

  return (
    <ReportSection title="Soil Corrections" infoContent={
      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        <div className="mb-2 font-semibold text-gray-800">How to use the Soil Corrections section</div>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Purpose:</strong> This section helps you correct soil nutrient deficiencies by recommending fertilizers and application rates tailored to your soil test results. The goal is to bring each nutrient up to its optimal target value, while avoiding excessive application that could harm your soil or plants.</p>
          <p><strong>Nutrient Display:</strong> Nutrients are split into <span className="font-semibold">Main Soil Corrections</span> (the most important nutrients for plant growth, such as Calcium, Magnesium, Potassium, Phosphorus, and Sulphur) and <span className="font-semibold">Secondary Soil Corrections</span> (other essential nutrients). Only nutrients that are currently below their target (deficient) are shown here.</p>
          <p><strong>Fertilizer Selection:</strong> For each deficient nutrient, you can select one or more fertilizers from a dropdown menu. Each fertilizer option shows its nutrient content, a recommended application rate, and special icons/colors to help you choose safely:</p>
          <ul className="list-disc ml-6">
            <li><span className="inline-flex items-center"><CheckCircle className="inline h-4 w-4 text-green-500 mr-1" /> <span className="text-green-700 font-semibold">Green check:</span></span> Safe to use at the recommended rate.</li>
            <li><span className="inline-flex items-center"><Gift className="inline h-4 w-4 text-purple-600 mr-1" /> <span className="text-purple-700 font-semibold">Purple bonus:</span></span> This fertilizer fulfills the requirement for another nutrient and is capped to avoid excess. The rate shown is the maximum safe rate for all nutrients it contains.</li>
            <li><span className="inline-flex items-center"><ShieldAlert className="inline h-4 w-4 text-red-600 mr-1" /> <span className="text-red-700 font-semibold">Red risk:</span></span> No safe rate: any application would push a nutrient above its safe limit.</li>
          </ul>
          <p><strong>Application Rate:</strong> The recommended rate is calculated to bring the nutrient up to its target. If a fertilizer contains multiple nutrients, the rate may be <span className="font-semibold">capped</span> (limited) to avoid exceeding the safe limit for any nutrient. If capped, the dropdown will show which nutrient is limiting and why.</p>
          <p><strong>Progress Bars:</strong> Each nutrient card shows four progress bars:
            <ul className="list-disc ml-6">
              <li><span className="font-semibold">Original:</span> Your current soil value.</li>
              <li><span className="font-semibold">New:</span> The value after applying selected fertilizers.</li>
              <li><span className="font-semibold">Requirement:</span> The amount still needed to reach the target.</li>
              <li><span className="font-semibold">Target:</span> The optimal value for healthy plant growth.</li>
            </ul>
            The color of the "New" bar turns green if within ±25% of the target, or red if outside this range.
          </p>
          <p><strong>Adjustable Parameters:</strong> You can adjust the <span className="font-semibold">Max Allowed Excess (%)</span> using the settings button (gear icon) at the top right. This controls how much above the target value a nutrient is allowed to go when applying fertilizers. Lowering this value makes recommendations more conservative; raising it allows more flexibility but increases risk of excess.</p>
          <p><strong>Objectives:</strong> The main objective is to correct deficiencies without causing excess. The system automatically calculates safe rates and warns you if a fertilizer could cause a problem. You can add, remove, or adjust fertilizers and rates as needed.</p>
          <p><strong>Other Details:</strong> The section updates in real time as you make changes. You can see a breakdown of how much each fertilizer contributes to each nutrient, and a summary of selected fertilizers. If all nutrients are optimal, the section will let you know that no corrections are needed.</p>
          <p>If you are new to soil science or fertilizer management, don't worry! The icons, colors, and warnings are designed to guide you safely. Hover over icons or read the messages for more information. If in doubt, consult a local agronomist or soil expert.</p>
        </div>
      </div>
    }>
      <div className="flex justify-end items-center mb-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-200" title="Adjust max allowed excess">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <div className="mb-2 font-semibold text-gray-800">Max Allowed Excess (%)</div>
            <input
              type="range"
              min={5}
              max={100}
              value={maxAllowedExcess}
              onChange={e => setMaxAllowedExcess(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
            <div className="text-center text-cyan-700 font-semibold mt-1">{maxAllowedExcess}%</div>
            <div className="text-xs text-gray-500 mt-2">Fertilizers will not be recommended if any nutrient exceeds its target by more than this percentage.</div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-6 mt-6">
        {mainDeficientNutrients.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-black mb-2">Main Soil Corrections</h3>
            {/* Fertilizer type filter dropdown */}
            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Show:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={releaseTypeFilter}
                onChange={e => setReleaseTypeFilter(e.target.value)}
              >
                {releaseTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {mainDeficientNutrients.map(nutrient => {
              const totalApplied = getTotalApplied(nutrient.name);
              const newValue = nutrient.current + (totalApplied / 2.4);
              let availableFerts = getFertilizersForNutrient(nutrient.genericName || nutrient.name);
              if (releaseTypeFilter !== 'all') {
                availableFerts = availableFerts.filter(f => (f.releaseType || '').toLowerCase() === releaseTypeFilter);
              }
              const selection = Array.isArray(fertSelections[nutrient.name]) ? fertSelections[nutrient.name] : [];
              return (
                <Card key={nutrient.name} className="bg-white border-gray-200 mb-4">
                  <CardHeader>
                    <CardTitle className="text-black text-lg">{nutrient.genericName || nutrient.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* No duplicate current/target display, only summary below */}

                    {/* --- Deviation and Requirement Summary --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAdded = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            // Find the fertilizer in the full list (not just availableFerts)
                            const fert = uniqueFertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAdded += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const newValue = nutrient.current + totalAdded;
                      const deviation = newValue - nutrient.ideal;
                      const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                      const requirement = Math.max(nutrient.ideal - newValue, 0);
                      const deviationKgHa = (Number(ppmToKgHa(newValue)) - Number(ppmToKgHa(nutrient.ideal))).toFixed(1);
                      const requirementKgHa = ppmToKgHa(requirement);
                      let deviationColor = 'text-green-700 font-semibold';
                      if (percentDiff < -25 || percentDiff > 25) deviationColor = 'text-red-600 font-semibold';
                      return (
                        <div className="mb-1">
                          <span className="font-semibold">{nutrient.genericName || nutrient.name}:</span>
                          <span> Current: {nutrient.current} {nutrient.unit}, Target: {nutrient.ideal} {nutrient.unit}, Needed: {requirement.toFixed(1)} {nutrient.unit}.</span>
                          <br />
                          <span className={deviationColor}>
                            Deviation: {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% ({deviation >= 0 ? '+' : ''}{deviation.toFixed(1)} {nutrient.unit}, {deviationKgHa} kg/ha)
                          </span>
                        </div>
                      );
                    })()}

                    {/* --- Progress Bars (restored) --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAdded = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            // Find the fertilizer in the full list (not just availableFerts)
                            const fert = uniqueFertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAdded += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const newValue = nutrient.current + totalAdded;
                      const requirement = Math.max(nutrient.ideal - newValue, 0);
                      // Bar values (all as % of target)
                      const originalPct = Math.min((nutrient.current / nutrient.ideal) * 100, 100);
                      const newPct = Math.min((newValue / nutrient.ideal) * 100, 100);
                      const reqPct = Math.min((requirement / nutrient.ideal) * 100, 100);
                      // Bar color for 'New'
                      const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                      const newBarColor = (percentDiff < -25 || percentDiff > 25) ? '[&>div]:bg-red-600' : '[&>div]:bg-green-500';
                      return (
                        <div className="space-y-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Original</span>
                            <Progress value={originalPct} className="h-2 [&>div]:bg-gray-400 flex-1" />
                            <span className="text-xs ml-2">{nutrient.current.toFixed(1)} {nutrient.unit} ({ppmToKgHa(nutrient.current)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">New</span>
                            <Progress value={newPct} className={`h-2 flex-1 ${newBarColor}`} />
                            <span className="text-xs ml-2">{newValue.toFixed(1)} {nutrient.unit} ({ppmToKgHa(newValue)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Requirement</span>
                            <Progress value={reqPct} className="h-2 [&>div]:bg-cyan-400 flex-1" />
                            <span className="text-xs ml-2">{requirement.toFixed(1)} {nutrient.unit} ({ppmToKgHa(requirement)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Target</span>
                            <Progress value={100} className="h-2 [&>div]:bg-green-600 flex-1" />
                            <span className="text-xs ml-2">{nutrient.ideal} {nutrient.unit} ({ppmToKgHa(nutrient.ideal)} kg/ha)</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* --- Total Recommended Value --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAddedPpm = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            const fert = uniqueFertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAddedPpm += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const totalAddedKgHa = (totalAddedPpm * 2.4).toFixed(1);
                      return (
                        <>
                          <div className="mb-2 text-sm text-blue-800 font-semibold">
                            Total Recommended: {totalAddedPpm.toFixed(1)} ppm ({totalAddedKgHa} kg/ha)
                          </div>
                          {/* --- Breakdown of sources --- */}
                          <div className="mb-2 text-xs text-gray-700">
                            <strong>Source breakdown:</strong>
                            <ul className="list-disc ml-5">
                              {Object.keys(fertSelections).map(nutrKey => {
                                const selections = fertSelections[nutrKey] || [];
                                return selections.map((sel, idx) => {
                                  if (sel.fertLabel && sel.fertLabel !== 'none') {
                                    const fert = uniqueFertilizerDefs.find(f => f.label === sel.fertLabel);
                                    if (fert) {
                                      const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                      if (percent > 0) {
                                        const addedPpm = (sel.rate * percent) / 100 / 2.4;
                                        const addedKgHa = (addedPpm * 2.4).toFixed(1);
                                        return (
                                          <li key={nutrKey + '-' + idx}>
                                            {fert.label}: {addedPpm.toFixed(2)} ppm ({addedKgHa} kg/ha)
                                          </li>
                                        );
                                      }
                                    }
                                  }
                                  return null;
                                });
                              })}
                            </ul>
                          </div>
                        </>
                      );
                    })()}

                    {/* --- Multiple Fertilizer Selectors --- */}
                    {selection.length === 0 ? (
                      <div className="text-xs text-gray-500 mb-2">No fertilizers selected. Click "Add Fertilizer" to begin.</div>
                    ) : (
                      selection.map((sel, idx) => {
                        const dropdownKey = `${nutrient.name}-${idx}`;
                        const dropdownReleaseType = dropdownReleaseTypes[dropdownKey] || 'all';
                        const dropdownSearch = dropdownSearches[dropdownKey] || '';
                        let filteredFerts = availableFerts;
                        if (dropdownReleaseType !== 'all') {
                          filteredFerts = availableFerts.filter(f => (f.releaseType || '').toLowerCase() === dropdownReleaseType);
                        }
                        // Apply search filter
                        if (dropdownSearch) {
                          filteredFerts = filteredFerts.filter(f => 
                            f.label.toLowerCase().includes(dropdownSearch.toLowerCase())
                          );
                        }
                        // Allow fertilizers to be selected for multiple nutrients they contain
                        // (removed global selection filter to allow multi-nutrient fertilizers)
                        // Calculate recommended rate for this fertilizer
                        const fert = filteredFerts.find(f => f.label === sel.fertLabel);
                        let recommendedRate = sel.rate;
                        if (fert) {
                          const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                          // Calculate requirement left after previous selectors for main nutrient
                          let prevAdded = 0;
                          (fertSelections[nutrient.name] || []).forEach((s, i) => {
                            if (i < idx && s.fertLabel && s.fertLabel !== 'none') {
                              const f = filteredFerts.find(ff => ff.label === s.fertLabel);
                              if (f) {
                                const pct = f.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                prevAdded += (s.rate * pct) / 100 / 2.4;
                              }
                            }
                          });
                          const needed = Math.max(nutrient.ideal - (nutrient.current + prevAdded), 0);
                          const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                          // Now, for each other nutrient in the fertilizer, calculate the max rate that keeps it <= 115% of target
                          let cappedRate = uncappedRate;
                          let limitingNutrient = null;
                          Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                            if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                            // Find the nutrient object
                            const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                            if (!nObj) return;
                            // Calculate total added from all other selected fertilizers for this nutrient
                            let alreadyAdded = 0;
                            Object.keys(fertSelections).forEach(nutrKey => {
                              const selections = fertSelections[nutrKey] || [];
                              selections.forEach(sel => {
                                if (sel.fertLabel && sel.fertLabel !== 'none') {
                                  const f2 = filteredFerts.find(f => f.label === sel.fertLabel);
                                  if (f2) {
                                    const pct2 = f2.nutrientContent[otherNutrient] || 0;
                                    alreadyAdded += (sel.rate * pct2) / 100 / 2.4;
                                  }
                                }
                              });
                            });
                            // Allow up to 15% above target if this nutrient is also deficient, else do not exceed 15% above target
                            const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                            const maxToAddInner = Number(maxAllowed) - Number(nObj.current);
                            const maxRateInner = Number(pct) > 0 ? ((maxToAddInner * 100 * 2.4) / Number(pct)) : Infinity;
                            if (maxRateInner < cappedRate) {
                              cappedRate = Math.max(0, Number(maxRateInner.toFixed(1)));
                              limitingNutrient = otherNutrient;
                            }
                          });
                          recommendedRate = cappedRate;
                          // Store uncapped/capped/limitingReason for display
                          sel._uncappedRate = uncappedRate;
                          sel._cappedRate = cappedRate;
                          sel._limitingNutrient = limitingNutrient;
                          sel._limitingReason = limitingNutrient ? `Full rate to reach target is ${uncappedRate} kg/ha, but capped at ${cappedRate} kg/ha due to ${limitingNutrient} exceeding target by more than ${maxAllowedExcess}%` : '';
                        }
                        // Check if this fertilizer would cause any nutrient to exceed maxAllowedExcess
                        let wouldExceed = false;
                        let exceedNutrient = '';
                        let exceedAmount = 0;
                        Object.entries(fert ? fert.nutrientContent : {}).forEach(([otherNutrient, pct]) => {
                          if (!pct) return;
                          const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                          if (!nObj) return;
                          // Calculate total added from all other selected fertilizers for this nutrient, plus this one at recommendedRate
                          let alreadyAdded = 0;
                          Object.keys(fertSelections).forEach(nutrKey => {
                            const selections = fertSelections[nutrKey] || [];
                            selections.forEach(sel => {
                              if (sel.fertLabel && sel.fertLabel !== 'none') {
                                const f2 = filteredFerts.find(f => f.label === sel.fertLabel);
                                if (f2) {
                                  const pct2 = f2.nutrientContent[otherNutrient] || 0;
                                  alreadyAdded += (sel.rate * pct2) / 100 / 2.4;
                                }
                              }
                            });
                          });
                          const addedByThis = (recommendedRate * pct) / 100 / 2.4;
                          const newValue = nObj.current + alreadyAdded + addedByThis;
                          const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                          const EPSILON = 1e-6;
                          if (newValue > maxAllowed + EPSILON) {
                            wouldExceed = true;
                            exceedNutrient = otherNutrient;
                            exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                          }
                        });
                        // ... existing code for rendering selector ...
                        return (
                          <div key={idx} className="flex gap-4 items-end mb-2">
                            <div className="flex-1">
                              <Select
                                value={sel.fertLabel}
                                onValueChange={fertLabel => {
                                  // When fertilizer changes, set recommended rate
                                  debugger
                                  let rate = sel.rate;
                                  
                                  const fert = filteredFerts.find(f => f.label === fertLabel);
                                  if (fert) {
                                    const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                    // Calculate requirement left after previous selectors for main nutrient
                                    let prevAdded = 0;
                                    (fertSelections[nutrient.name] || []).forEach((s, i) => {
                                      if (i < idx && s.fertLabel && s.fertLabel !== 'none') {
                                        const f = filteredFerts.find(ff => ff.label === s.fertLabel);
                                        if (f) {
                                          const pct = f.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                          prevAdded += (s.rate * pct) / 100 / 2.4;
                                        }
                                      }
                                    });
                                    const needed = Math.max(nutrient.ideal - (nutrient.current + prevAdded), 0);
                                    const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                                    let cappedRate = uncappedRate;
                                    let limitingNutrient = null;
                                    Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                      if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                                      const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                      if (!nObj) return;
                                      const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                      const maxToAddInner = Number(maxAllowed) - Number(nObj.current);
                                      const maxRateInner = Number(pct) > 0 ? ((maxToAddInner * 100 * 2.4) / Number(pct)) : Infinity;
                                      if (maxRateInner < cappedRate) {
                                        cappedRate = Math.max(0, Number(maxRateInner.toFixed(1)));
                                        limitingNutrient = otherNutrient;
                                      }
                                    });
                                    rate = cappedRate;
                                  }
                                  // Apply the fertilizer directly
                                  handleApplyFertilizer(nutrient.name, fertLabel, rate);
                                }}
                              >
                                <SelectTrigger className="bg-white w-full h-10">
                                  <SelectValue placeholder="Choose fertilizer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Search input */}
                                  <input
                                    type="text"
                                    placeholder="Search fertilizer..."
                                    value={dropdownSearch}
                                    onChange={e => setDropdownSearches(prev => ({ ...prev, [dropdownKey]: e.target.value }))}
                                    className="w-full px-2 py-1 mb-2 border rounded text-sm"
                                  />
                                  {/* Per-dropdown filter UI */}
                                  <div className="flex gap-2 mb-2 px-2">
                                    {releaseTypeOptions.map(opt => (
                                      <button
                                        key={opt.value}
                                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${dropdownReleaseType === opt.value ? 'bg-[#a97c50] text-white border-[#a97c50]' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                        style={{
                                          background: opt.value === 'fast' ? '#dbeafe' :
                                                      opt.value === 'moderate' ? '#fef9c3' :
                                                      opt.value === 'slow' ? '#d1fae5' :
                                                      opt.value === 'very slow' ? '#e5e7eb' :
                                                      opt.value === 'controlled' ? '#ede9fe' :
                                                      dropdownReleaseType === opt.value ? '#a97c50' : '#f3f4f6',
                                          color: dropdownReleaseType === opt.value ? 'white' : undefined
                                        }}
                                        onClick={e => { e.preventDefault(); setDropdownReleaseTypes(prev => ({ ...prev, [dropdownKey]: opt.value })); }}
                                      >{opt.label}</button>
                                    ))}
                                  </div>
                                  {(() => {
                                    // Helper function to calculate icon priority for sorting
                                    // Returns: 0 = green star, 1 = yellow triangle, 2 = green check, 3 = red shield
                                    const getIconPriority = (fert) => {
                                      const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                      const needed = Math.max(nutrient.ideal - nutrient.current, 0);
                                      const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                                      let cappedRate = uncappedRate;
                                      Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                        if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                                        const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                        if (!nObj) return;
                                        const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                        const maxToAddInner = Number(maxAllowed) - Number(nObj.current);
                                        const maxRateInner = Number(pct) > 0 ? ((maxToAddInner * 100 * 2.4) / Number(pct)) : Infinity;
                                        if (maxRateInner < cappedRate) {
                                          cappedRate = Math.max(0, Number(maxRateInner.toFixed(1)));
                                        }
                                      });
                                      
                                      // pH recommendation logic
                                      let isPhRecommended = false;
                                      let isPhNotRecommended = false;
                                      if (fert.phLogic && soilPh !== null) {
                                        const { min_pH, max_pH } = fert.phLogic;
                                        if ((min_pH === null || soilPh >= min_pH) && (max_pH === null || soilPh <= max_pH)) {
                                          isPhRecommended = true;
                                        } else {
                                          isPhNotRecommended = true;
                                        }
                                      }
                                      
                                      // Determine priority
                                      if (isPhRecommended) return 0; // Green star - highest priority
                                      if (isPhNotRecommended) return 1; // Yellow triangle
                                      if (cappedRate === 0) return 3; // Red shield - lowest priority
                                      return 2; // Green checkmark
                                    };
                                    
                                    // Sort filteredFerts by icon priority
                                    const sortedFerts = [...filteredFerts].sort((a, b) => {
                                      return getIconPriority(a) - getIconPriority(b);
                                    });
                                    
                                    return sortedFerts.map(fert => {
                                    const isRecommended = true;
                                    const isLowContent = (fert.nutrientContent[nutrient.genericName || nutrient.name] || 0) < 1;
                                    const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                    const contentString = Object.entries(fert.nutrientContent)
                                      .map(([k, v]) => `${k} ${v}%`).join(', ');
                                    // --- Calculate recommended rate for this dropdown item ---
                                    const needed = Math.max(nutrient.ideal - nutrient.current, 0);
                                    const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                                    let cappedRate = uncappedRate;
                                    let limitingNutrient = null;
                                    Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                      if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                                      const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                      if (!nObj) return;
                                      const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                      const maxToAddInner = Number(maxAllowed) - Number(nObj.current);
                                      const maxRateInner = Number(pct) > 0 ? ((maxToAddInner * 100 * 2.4) / Number(pct)) : Infinity;
                                      if (maxRateInner < cappedRate) {
                                        cappedRate = Math.max(0, Number(maxRateInner.toFixed(1)));
                                        limitingNutrient = otherNutrient;
                                      }
                                    });
                                    const recommendedRate = cappedRate;
                                    // Check if this fertilizer would cause any nutrient to exceed maxAllowedExcess
                                    let wouldExceed = false;
                                    let exceedNutrient = '';
                                    let exceedAmount = 0;
                                    const EPSILON = 1e-6;
                                    Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                      if (!pct) return;
                                      const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                      if (!nObj) return;
                                      const addedByThis = (recommendedRate * pct) / 100 / 2.4;
                                      const newValue = nObj.current + addedByThis;
                                      const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                      if (newValue > maxAllowed + EPSILON) {
                                        wouldExceed = true;
                                        exceedNutrient = otherNutrient;
                                        exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                      }
                                    });
                                    // --- Determine color and icon ---
                                    let icon, nameClass, rateClass, message;
                                    // pH recommendation logic
                                    let isPhRecommended = false;
                                    let isPhNotRecommended = false;
                                    if (fert.phLogic && soilPh !== null) {
                                      const { min_pH, max_pH } = fert.phLogic;
                                      if ((min_pH === null || soilPh >= min_pH) && (max_pH === null || soilPh <= max_pH)) {
                                        isPhRecommended = true;
                                      } else {
                                        isPhNotRecommended = true;
                                      }
                                    }
                                    if (isPhRecommended) {
                                      icon = <span title="Recommended for your soil pH"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.75l-6.172 3.247 1.179-6.873L2 9.753l6.908-1.004L12 2.25l3.092 6.499L22 9.753l-5.007 4.371 1.179 6.873z" /></svg></span>;
                                      nameClass = "text-green-700 hover:underline font-medium";
                                      rateClass = "text-xs text-green-700 ml-2";
                                      message = <span className="text-xs text-green-700">Recommended for your soil pH.</span>;
                                    } else if (isPhNotRecommended) {
                                      icon = <AlertTriangle className="h-4 w-4 text-yellow-500" />;
                                      nameClass = "text-yellow-700 hover:underline font-medium";
                                      rateClass = "text-xs text-yellow-700 ml-2";
                                      message = <span className="text-xs text-yellow-700">Not recommended: soil pH is not within the recommended range for this fertilizer.</span>;
                                    } else if (cappedRate === 0) {
                                      icon = <ShieldAlert className="h-4 w-4 text-red-600" />;
                                      nameClass = "text-red-700 hover:underline font-medium";
                                      rateClass = "text-xs text-red-700 ml-2";
                                      message = <span className="text-xs text-red-600">No safe rate: any application would push {limitingNutrient} above the {maxAllowedExcess}% excess limit.</span>;
                                    } else {
                                      icon = <CheckCircle className="h-4 w-4 text-green-500" />;
                                      nameClass = "text-blue-700 hover:underline font-medium";
                                      rateClass = "text-xs text-green-700 ml-2";
                                      message = null;
                                    }
                                    return (
                                      <SelectItem key={fert.label} value={fert.label} /* never disabled */>
                                        <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-2">
                                            {icon}
                                            <a
                                              href={`https://www.nutri-tech.com.au/products/${fert.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={nameClass}
                                            >
                                              {fert.label}
                                            </a>
                                            <span className="text-xs text-gray-700 ml-1">[{contentString}]</span>
                                            <span className={rateClass}>
                                              {uncappedRate === cappedRate
                                                ? `(${uncappedRate} kg/ha)`
                                                : `(needed: ${uncappedRate} kg/ha, capped: ${cappedRate} kg/ha due to ${limitingNutrient})`}
                                            </span>
                                            {fert.releaseType && (
                                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                                                fert.releaseType === 'fast' ? 'bg-blue-100 text-blue-800' :
                                                fert.releaseType === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                fert.releaseType === 'slow' ? 'bg-green-100 text-green-800' :
                                                fert.releaseType === 'very slow' ? 'bg-gray-200 text-gray-800' :
                                                'bg-gray-100 text-gray-700'
                                              }`}>
                                                {fert.releaseType.charAt(0).toUpperCase() + fert.releaseType.slice(1)} Release
                                              </span>
                                            )}
                                          </div>
                                          {message}
                                        </div>
                                      </SelectItem>
                                    );
                                  });
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 flex flex-col">
                              <label className="block text-xs font-medium text-gray-700 mb-0.5">Application Rate (kg/ha)</label>
                              <Input
                                type="number"
                                min={0}
                                value={(!sel.fertLabel || sel.fertLabel === 'none') ? '' : sel.rate}
                                onChange={e => {
                                  const rate = Number(e.target.value);
                                  setFertSelections(prev => {
                                    const arr = [...(prev[nutrient.name] || [])];
                                    arr[idx] = { ...arr[idx], rate };
                                    return { ...prev, [nutrient.name]: arr };
                                  }); 
        
                                  // Update summary in place to avoid duplicating selections
                                  try {
                                  if (sel.fertLabel && sel.fertLabel !== 'none') {
                                    const fert = uniqueFertilizerDefs.find(f => f.label === sel.fertLabel);
                                    if (fert) {
                                      const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                      const actualNutrientApplied = (rate * percent) / 100;
                                      
                                      console.log('soilAmendmentsSummary',  soilAmendmentsSummary)
                                      const tempArrary= Array.isArray(soilAmendmentsSummary) ? soilAmendmentsSummary : [];
                                      const filtered = tempArrary.filter(item => !(item.nutrient === nutrient.name && item.fertilizer === sel.fertLabel));
                                      console.log('filtered',filtered)
                                      setSoilAmendmentsSummary([
                                        ...filtered,
                                        {
                                          fertilizer: sel.fertLabel,
                                          nutrient: nutrient.name,
                                          rate,
                                          actualNutrientApplied,
                                          unit: 'kg/ha',
                                          contains: Object.keys(fert.nutrientContent),
                                        },
                                      ]);
                                    }
                                  }
                                  } catch (error) {
                                    console.error('Error updating soil amendments summary', error);
                                  }
                                }}
                                className="bg-white h-10 w-20"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 text-red-500"
                              onClick={() => {
                                const removedFert = sel.fertLabel;
                                // Remove from fertSelections
                                setFertSelections(prev => {
                                  const arr = [...(prev[nutrient.name] || [])];
                                  arr.splice(idx, 1);
                                  return { ...prev, [nutrient.name]: arr };
                                });
                                // Also remove from soilAmendmentsSummary
                                if (removedFert && removedFert !== 'none') {
                                  setSoilAmendmentsSummary(prev => {
                                    const tempArray = Array.isArray(prev) ? prev : [];
                                    const filtered = tempArray.filter(item => !(item.nutrient === nutrient.name && item.fertilizer === removedFert));
                                    // Always return an array, even if empty
                                    return Array.isArray(filtered) ? filtered : [];
                                  });
                                }
                              }}
                            >Remove</Button>
                          </div>
                        );
                      })
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-[#8cb43a] hover:bg-[#7ca32e] text-white"
                      onClick={() => {
                        setFertSelections(prev => {
                          const arr = Array.isArray(prev[nutrient.name]) ? prev[nutrient.name] : [];
                          return { ...prev, [nutrient.name]: [...arr, { fertLabel: '', rate: 100 }] };
                        });
                      }}
                    >Add Fertilizer</Button>

                    {/* --- Show selected fertilizers summary --- */}
                    {selection.length > 0 && (
                      <div className="mt-2 text-xs text-gray-700">
                        <strong>Selected Fertilizers:</strong>
                        <ul className="list-disc ml-5">
                          {selection.map((sel, idx) => sel.fertLabel && sel.fertLabel !== 'none' ? (
                            <li key={idx}>{sel.fertLabel} ({sel.rate} kg/ha)</li>
                          ) : null)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {/* Brownish summary card for selected soil correction fertilizers */}
        {soilAmendmentsSummary && soilAmendmentsSummary.length > 0 && (
          <div className="mt-6">
            <div className="rounded-lg shadow p-4" style={{ background: '#f5eee6', borderLeft: '6px solid #a97c50' }}>
              <div className="font-bold text-[#a97c50] mb-2">Soil Corrections Summary</div>
              <ul className="list-disc ml-6 text-sm">
                {soilAmendmentsSummary.map((item, idx) => (
                  <li key={idx} className="mb-1">
                    <span className="font-semibold">{item.fertilizer}</span> at a rate of {item.rate} {item.unit}
                    {item.contains && item.contains.length > 0 && (
                      <span className="text-gray-600"> (Contains: {item.contains.join(', ')})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {mainDeficientNutrients.length === 0 && (
          <div className="text-green-700 font-semibold">No corrections needed. All nutrients are optimal!</div>
        )}
        {/* Selected Products summary card for soil corrections */}
        {Object.entries(fertSelections).flatMap(([nutrient, sels]) =>
          (Array.isArray(sels) ? sels : []).filter(sel => sel.fertLabel && sel.fertLabel !== 'none').map((sel, idx) => {
            const fert = uniqueFertilizerDefs.find(f => f.label === sel.fertLabel);
            if (!fert) return null;
            const contentString = Object.entries(fert.nutrientContent)
              .map(([k, v]) => `${k} ${v}%`).join(', ');
            // For each nutrient in the fertilizer, calculate amount applied
            const nutrientAmounts = Object.entries(fert.nutrientContent).map(([nutr, pct]) => {
              const appliedPpm = (sel.rate * pct) / 100 / 2.4;
              const appliedKgHa = (appliedPpm * 2.4).toFixed(2);
              return `${nutr}: ${appliedPpm.toFixed(2)} ppm (${appliedKgHa} kg/ha)`;
            });
            return (
              <div key={sel.fertLabel + '-' + idx} className="mb-3 bg-[#f3e5d2] rounded-md px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">
                    {sel.fertLabel}
                  </div>
                  <div className="text-xs text-gray-700">Contains: {contentString}</div>
                  <div className="text-sm text-[#a97c50]">Rate: {sel.rate} kg/ha</div>
                  <div className="text-xs text-gray-700 mt-1">
                    {nutrientAmounts.map((str, i) => <div key={i}>{str}</div>)}
                  </div>
                </div>
                {/* Remove button could be added here if desired */}
              </div>
            );
          })
        )}
      </div>
    </ReportSection>
  );
};

export default SoilCorrections; 