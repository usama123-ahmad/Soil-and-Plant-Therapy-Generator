import React, { useEffect, useMemo, useState } from 'react';
import ReportSection from './ReportSection';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RichTextEditor } from './ui/rich-text-editor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Info } from 'lucide-react';
import { Button } from './ui/button';
import { useAppContext } from '@/contexts/AppContext';

interface Nutrient {
  name: string;
  current: number;
  ideal: number;
  unit: string;
  status: 'low' | 'optimal' | 'high';
  range?: string; // Add this line to match backend structure
}

interface GeneralCommentsProps {
  nutrients: Nutrient[];
  somCecText: string;
  setSomCecText: (v: string) => void;
  baseSaturationText: string;
  setBaseSaturationText: (v: string) => void;
  phText: string;
  setPhText: (v: string) => void;
  availableNutrientsText: string;
  setAvailableNutrientsText: (v: string) => void;
  soilReservesText: string;
  setSoilReservesText: (v: string) => void;
  lamotteReamsText: string;
  setLamotteReamsText: (v: string) => void;
  taeText: string;
  setTaeText: (v: string) => void;
  reportRefId?: string,
  currentPaddockKey?: string | null | undefined,
  closest_key?: string | null | undefined,
  setClosestKey?: (v: string) => void,
}

// Helper for status label
function StatusLabel({ status }: { status: 'low' | 'optimal' | 'high' }) {
  let color = 'bg-green-100 text-green-800 border-green-300';
  let text = 'Optimal';
  if (status === 'low') { color = 'bg-red-100 text-red-800 border-red-300'; text = 'Deficient'; }
  else if (status === 'high') { color = 'bg-blue-100 text-blue-800 border-blue-300'; text = 'Excessive'; }
  return <span className={`ml-2 px-2 py-0.5 rounded-full border text-xs font-semibold ${color}`}>{text}</span>;
}

// Helper to get nutrient status by name (case-insensitive, allow partial match)
function getStatus(nutrients: any[], name: string) {
  const found = nutrients.find(n => n.name.toLowerCase().includes(name.toLowerCase()));
  return found ? found.status : undefined;
}

// Comprehensive nutrient antagonism database based on Mulder's Chart
const NUTRIENT_ANTAGONISMS = { 
  "Nitrogen": ["Potassium", "Copper", "Boron"], 
  "Phosphorus": ["Zinc", "Iron", "Copper", "Potassium", "Calcium"], 
  "Potassium": ["Magnesium", "Calcium", "Boron", "Nitrogen", "Phosphorus"], 
  "Calcium": ["Magnesium", "Potassium", "Iron", "Manganese", "Zinc", "Boron", "Phosphorus", "Sulphur"], 
  "Magnesium": ["Calcium", "Potassium"], 
  "Zinc": ["Iron", "Copper", "Phosphorus"], 
  "Copper": ["Nitrogen", "Phosphorus", "Manganese", "Iron", "Sulphur"], 
  "Iron": ["Manganese", "Zinc", "Copper", "Phosphorus", "Calcium"], 
  "Manganese": ["Iron", "Copper", "Calcium"],
  "Boron": ["Nitrogen", "Potassium", "Calcium"], 
  "Sulphur": ["Copper", "Molybdenum", "Calcium"], 
  "Molybdenum": ["Sulphur"] 
}

const nutrient_antagonism = {
  'nitrogen': ['potassium (K)', 'copper (Cu)', 'boron (B)'],
  'phosphorus': ['zinc (Zn)', 'iron (Fe)', 'copper (Cu)', 'potassium (K)', 'calcium (Ca)'],
  'potassium': ['magnesium (Mg)', 'calcium (Ca)', 'boron (B)', 'nitrogen (N)', 'phosphorus (P)'],
  'calcium': ['magnesium (Mg)', 'potassium (K)', 'iron (Fe)', 'manganese (Mn)', 'zinc (Zn)', 'boron (B)', 'phosphorus (P)', 'sulphur (S)'],
  'magnesium': ['calcium (Ca)', 'potassium (K)'],
  'zinc': ['iron (Fe)', 'copper (Cu)', 'phosphorus (P)'],
  'copper': ['nitrogen (N)', 'phosphorus (P)', 'manganese (Mn)', 'iron (Fe)', 'sulphur (S)'],
  'iron': ['manganese (Mn)', 'zinc (Zn)', 'copper (Cu)', 'phosphorus (P)', 'calcium (Ca)'],
  'manganese': ['iron (Fe)', 'copper (Cu)', 'calcium (Ca)'],
  'boron': ['nitrogen (N)', 'potassium (K)', 'calcium (Ca)'],
  'sulphur': ['copper (Cu)', 'molybdenum (Mo)', 'calcium (Ca)'],
  'molybdenum': ['sulphur (S)']
};

// Helper function to get nutrient abbreviation
function getNutrientAbbrev(nutrientName: string): string {
  const abbrevMap: { [key: string]: string } = {
    'Nitrogen': 'N',
    'Phosphorus': 'P',
    'Potassium': 'K',
    'Calcium': 'Ca',
    'Magnesium': 'Mg',
    'Sulphur': 'S',
    'Copper': 'Cu',
    'Zinc': 'Zn',
    'Iron': 'Fe',
    'Manganese': 'Mn',
    'Boron': 'B',
    'Molybdenum': 'Mo'
  };
  return abbrevMap[nutrientName] || nutrientName;
}

// Helper function to analyze nutrient antagonism
function analyzeNutrientAntagonism(nutrientsWithStatus: Nutrient[]) {
  const excessiveNutrients = [] as string[];
  const antagonismDetails = [] as string[];

  // Check for excessive nutrients that cause antagonism
  nutrientsWithStatus.forEach(nutrient => {
    if (nutrient.status === 'high') {
      const nutrientName = nutrient.name.split(' - ')[1] || nutrient.name;
      const antagonized = NUTRIENT_ANTAGONISMS[nutrientName];
      if (antagonized) {
        excessiveNutrients.push(nutrientName);
        const antagonizedFormatted = antagonized.map(n => `**${n} (${getNutrientAbbrev(n)})**`);
        antagonismDetails.push(`${nutrientName} (${getNutrientAbbrev(nutrientName)}) can shut down ${antagonizedFormatted.join(', ')}`);
      }
    }
  });

  return { excessiveNutrients, antagonismDetails };
}
// Helper function to analyze nutrient antagonism
function analyzeNutrientAntagonismNew(nutrient_excess: string[]) {
  const excessiveNutrients = [] as string[];
  const antagonismDetails = [] as string[];

  nutrient_excess.forEach(nutrientName => {
    // const antagonized = nutrient_antagonism[nutrientName];
    const antagonized = NUTRIENT_ANTAGONISMS[nutrientName];
    if (antagonized) {
      excessiveNutrients.push(nutrientName);
      const antagonizedFormatted = antagonized.map(n => `**${n} (${getNutrientAbbrev(n)})**`);
      antagonismDetails.push(`${nutrientName} (${getNutrientAbbrev(nutrientName)}) can shut down ${antagonizedFormatted.join(', ')}`);

    }

  })


  return { excessiveNutrients, antagonismDetails };
}

function joinArrayToSentence(arr) {
  const lowerCaseArr = arr.map(item => item.toLowerCase());
  if (lowerCaseArr.length === 0) return '';
  if (lowerCaseArr.length === 1) return lowerCaseArr[0];
  if (lowerCaseArr.length === 2) return lowerCaseArr.join(' and ');
  return lowerCaseArr.slice(0, -1).join(', ') + ', and ' + lowerCaseArr[lowerCaseArr.length - 1];
}

function capitalizeFirstLetter(str) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}
// Nutrient antagonism mapping

async function generatePaddockNutrientExplanation(report, key, formInput, urls) {
  let recommendedProductsDeficientTag = '';
  let explanationHtml = '';
  // Normalize input: accept FormData or plain object
  let formData;
  if (formInput instanceof FormData) {
    formData = formInput;
  } else {
    formData = new FormData();
    if (formInput) {
      Object.keys(formInput).forEach(k => {
        formData.append(k, formInput[k]);
      });
    }
  }
  // Ensure leafCropGroup is set (fallback to report)
  if (!formData.get("leafCropGroup") && report['leafCropGroup'] !== undefined) {
    formData.append("leafCropGroup", report['leafCropGroup']);
  }
  const response = await fetch(urls.generateRecommendations, { method: 'POST', body: formData });
  const data = await response.json();
  report['paddocks'][key]["recommendations"]["recommended_products"] = data?.products_recommendation || []
  // Normalize arrays from form data values
  const normalizeArray = (val) => {
    if (Array.isArray(val)) return val;
    if (val == null) return [];
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return Array.from(val);
  };
  const nutrientDef = normalizeArray(formData.get("nutrient_deficient"));
  const nutrientEx = normalizeArray(formData.get("nutrient_excess"));
  report['paddocks'][key]["recommendations"]["form_data"] = {
    "leafCropGroup": formData.get("leafCropGroup") ?? report['leafCropGroup'],
    "application_method": formData.get("application_method"),
    "recommendation_type": formData.get("recommendation_type"),
    "nutrient_deficient": nutrientDef,
    "nutrient_excess": nutrientEx,
  }
  let bigFourNutrients = ['calcium', 'magnesium', 'phosphorus', 'boron'];
  let bigFourNutrientsDeficient = report['paddocks'][key]["recommendations"]["form_data"]["nutrient_deficient"].filter(nutrient => bigFourNutrients.includes(nutrient.toLowerCase()));
  let bigFourNutrientsExcess = report['paddocks'][key]["recommendations"]["form_data"]["nutrient_excess"];
  explanationHtml = `<span class="m-0 text-justify">We have found that it is remarkably productive to try to maintain "luxury levels" of 4 minerals on a leaf test (The Big four). "Luxury", refers to the top end of the acceptable range. The Big Four include calcium, magnesium, phosphorus and boron.</span>`;
  if (bigFourNutrientsDeficient.length > 0) {
    let bigFourNutrientsDeficientTag = `<span class="m-0 text-justify"> Here, you are deficient in ${bigFourNutrientsDeficient.length} of the nutrients of the big four. 
            In this case, ${joinArrayToSentence(bigFourNutrientsDeficient)} should be foliar sprayed to bypass issues in the soil. </span>
            `;
    explanationHtml += bigFourNutrientsDeficientTag
  } else {
    explanationHtml += `<span class="m-0 text-justify">You do not have any deficiency in any of the nutrients of the big four.</span>`;
  }
  if (bigFourNutrientsExcess.length > 0) {
    let nutrientAntagonismTag = document.createElement('ul');
    nutrientAntagonismTag.classList.add('mt-0', 'text-justify');
    bigFourNutrientsExcess.forEach(nutrient => {
      nutrient = nutrient.toLowerCase();
      if (nutrient_antagonism[nutrient]) {
        let antagonisticNutrients = nutrient_antagonism[nutrient].map(word => capitalizeFirstLetter(word)).join(', ');
        nutrientAntagonismTag.innerHTML += `
                        <li><b>${capitalizeFirstLetter(nutrient)}</b> shuts down <b>${antagonisticNutrients}<b></li>
                    `;
      }
    });
    let bigFourNutrientsExcessTag = `<span > Your excess of ${joinArrayToSentence(bigFourNutrientsExcess)} can shut down several nutrients.</span>
            <span class="m-0 text-justify"><p class="m-0 text-justify">Your nutrient antagonism is summarized as following:</p>
                ${nutrientAntagonismTag.outerHTML}
            </span>
            `;
    explanationHtml += bigFourNutrientsExcessTag
  } else {
    explanationHtml += `<span class="m-0 text-justify">You do not have any excess in any of the nutrients of the big four.</span>`;
  }
  explanationHtml += `<p class="text-justify">${data?.combined_nutrients_explanation}</p>` || "";
  report['paddocks'][key]["recommendations"]["explanation"] = explanationHtml;
  recommendedProductsDeficientTag = '';
  if (report['paddocks'][key]["recommendations"]["form_data"]["nutrient_deficient"].length > 0) {
    Object.keys(report['paddocks'][key]["recommendations"]["recommended_products"]['deficient']).forEach(innerkey => {
      let product = report['paddocks'][key]["recommendations"]["recommended_products"]['deficient'][innerkey];
      const productUrlMap = {
        "10 kg Calcium Nitrate": "https://nutri-tech.com.au/collections/liquid-fertilisers/products/calcium-nitrate",
        "10 L Lime-Life": "https://nutri-tech.com.au/collections/mms/products/lime-life-organic",
        "1 kg Fulvx": "https://nutri-tech.com.au/collections/humates/products/fulvx",
        "2 kg Sodium Borate": "https://nutri-tech.com.au/collections/liquid-fertilisers/products/sodium-borate",
        "10 L DIY Humic Acid": "https://nutri-tech.com.au/collections/humates/products/diy-humic-acid",
        "30 ml Triacontanol": "https://nutri-tech.com.au/collections/liquid-fertilisers/products/triacontanol",
        "1 L Micro Amino Drive (MAD)": "https://nutri-tech.com.au/collections/liquid-fertilisers/products/micro-amino-drive",
        "5 kg Calcium Nitrate": "https://nutri-tech.com.au/collections/liquid-fertilisers/products/calcium-nitrate-5kg",
        "5 L Lime-Life": "https://nutri-tech.com.au/collections/liquid-fertilisers/products/lime-life-5l",
        "500 g Fulvx": "https://nutri-tech.com.au/collections/humates/products/fulvx-500g",
        "1 kg Sodium Borate": "https://nutri-tech.com.au/collections/liquid-fertilisers/products/sodium-borate-1kg",
        "5 L DIY Humic Acid": "https://nutri-tech.com.au/collections/humates/products/diy-humic-acid-5l"
      };
      let productLinks = product.recommended_products.map(productName => {
        const productUrl = productUrlMap[productName];
        if (productUrl && productUrl.trim() !== "" && productUrl.trim() !== "Source locally" && productUrl.trim().startsWith("http")) {
          return `<a href="${productUrl}" target="_blank" style="text-decoration: none; color: #8cb43a;">🛒 ${productName}</a>`;
        } else {
          return `🛒 ${productName}`;
        }
      }).join(', ');
      recommendedProductsDeficientTag += `<li><b>${product.nutrient}</b>: ${productLinks}</li>`
    });
  }
  return { recommendedProductsDeficientTag, explanationHtml };
}

const GeneralComments: React.FC<GeneralCommentsProps> = ({ nutrients, somCecText, setSomCecText, baseSaturationText, setBaseSaturationText, phText, setPhText, availableNutrientsText, setAvailableNutrientsText, soilReservesText, setSoilReservesText, lamotteReamsText, setLamotteReamsText, taeText, setTaeText, reportRefId, currentPaddockKey, closest_key, setClosestKey }) => {
  const { ntsGeneralCommentsHtml, setNtsGeneralCommentsHtml } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string>('');

  // Helper function to convert markdown-like text (**bold**, bullets) to HTML
  // Also handles URLs in format: 🛒 Product Name (https://url.com)
  const markdownToHtml = (text: string) => {
    if (!text) return '';
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Convert URL patterns to links: 🛒 Product Name (https://url.com) -> <a>🛒 Product Name</a>
    const convertUrlsToLinks = (line: string) => {
      const urlPattern = /🛒\s*([^(]+)\s*\(((https?:\/\/[^)]+))\)/g;
      return line.replace(urlPattern, (match, productName, url) => {
        const cleanProductName = productName.trim();
        return `<a href="${url}" target="_blank" style="text-decoration: none; color: #8cb43a;">🛒 ${escape(cleanProductName)}</a>`;
      });
    };

    const lines = String(text).split(/\r?\n/);
    let html = '';
    let inUl = false;
    let i = 0;
    while (i < lines.length) {
      const raw = lines[i];
      const line = raw.trim();
      const isBullet = /^•\s+/.test(line);
      const isAntagonismIntro = /Your nutrient antagonism is summarized as following:/i.test(line);
      if (isAntagonismIntro) {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += `<p>${escape(line)}</p>`;
        let j = i + 1;
        let hadAny = false;
        while (j < lines.length && /can shut down/i.test(lines[j])) {
          if (!inUl) { html += '<ul>'; inUl = true; }
          hadAny = true;
          const liText = lines[j].replace(/^•\s+/, '').trim();
          const withBold = liText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          html += `<li>${withBold}</li>`;
          j++;
        }
        if (inUl && hadAny) { html += '</ul>'; inUl = false; }
        i = j;
        continue;
      }

      if (isBullet) {
        if (!inUl) { html += '<ul>'; inUl = true; }
        let liText = line.replace(/^•\s+/, '');
        liText = convertUrlsToLinks(liText);
        const withBold = liText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html += `<li>${withBold}</li>`;
        i++;
        continue;
      } else {
        if (inUl) { html += '</ul>'; inUl = false; }
      }

      if (line.length === 0) {
        html += '';
      } else {
        let processed = escape(line);
        processed = convertUrlsToLinks(processed);
        const withBold = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html += `<p>${withBold}</p>`;
      }
      i++;
    }
    if (inUl) html += '</ul>';
    return html;
  };

  // Keep preview in sync with rich text editor (somCecText is already HTML)
  useEffect(() => {
    setHtmlPreview(somCecText);
    try {
      (window as any).__ntsGeneralCommentsHtml ={

        currentPaddockKey: somCecText,
        ...(window as any).__ntsGeneralCommentsHtml
      } ;

      setNtsGeneralCommentsHtml({ ...ntsGeneralCommentsHtml, [currentPaddockKey]: somCecText });

    } catch { }
  }, [somCecText]);

  async function handleGenerateAI() {
    setLoading(true);
    setError(null);

    debugger
    console.log('handleGenerateAI', reportRefId)




    // Calculate status for each nutrient based on current vs ideal range, and exclude those without a valid range
    const nutrientsWithStatus = nutrients
      .filter(n => n.range && /[\d.]+\s*-\s*[\d.]+/.test(n.range))
      .map(n => {
        let status: 'low' | 'optimal' | 'high' = 'optimal';
        // Parse min/max from range string
        const match = n.range.match(/([\d.]+)\s*-\s*([\d.]+)/);
        if (match) {
          const low = parseFloat(match[1]);
          const high = parseFloat(match[2]);
          if (n.current < low) status = 'low';
          else if (n.current > high) status = 'high';
        }
        return { ...n, status };
      });

    // Group nutrients by calculated status
    const deficient = nutrientsWithStatus.filter(n => n.status === 'low').map(n => n.name);
    const optimal = nutrientsWithStatus.filter(n => n.status === 'optimal').map(n => n.name);
    const excess = nutrientsWithStatus.filter(n => n.status === 'high').map(n => n.name);

    try {
      let wasFetchSuccessfull = false
      let data = null;
      if (reportRefId) {
        const requestOptions: RequestInit = {
          method: 'GET'
        };
        debugger
        // let response = await fetch(`http://localhost:8000/api/downloadable-charts-pdfs/${reportRefId}/get_ai_comments/?key=${currentPaddockKey}`, requestOptions);
        // Use proxy endpoint to avoid CORS issues
        let response = await fetch(`/api/proxy/get-ai-comments/${reportRefId}?key=${encodeURIComponent(currentPaddockKey)}`, requestOptions);

        console.log('get_ai_comments', response)
        if (response.status == 200) {
          data = await response.json();
          console.log('get_ai_comments', data)
          data['summary'] = data.ai_comments.combined_nutrients_explanation
          wasFetchSuccessfull = true
          if ('closest_key' in data) {
            setClosestKey(data.closest_key);
          }
        }

      }
      if (!wasFetchSuccessfull) {
        const res = await fetch('/generate-comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deficient, optimal, excess })
        });
        data = await res.json();
      }



      if (data.summary) {
        // When API succeeded, mirror generatePaddockNutrientExplanation structure in plain text
        if (wasFetchSuccessfull) {
          // Big Four paragraph
          const bigFourIntro = 'We have found that it is remarkably productive to try to maintain "luxury levels" of 4 minerals on a leaf test (The Big four). "Luxury", refers to the top end of the acceptable range. The Big Four include **Calcium (Ca)**, **Magnesium (Mg)**, **Phosphorus (P)**, and **Boron (B)**.';

          let form_data = data.form_data
          let nutrient_deficient = form_data.nutrient_deficient
          let nutrient_excess = form_data.nutrient_excess

          nutrient_deficient = nutrient_deficient.split(",");
          nutrient_excess = nutrient_excess.split(",");

          // Deficiency line (count + foliar spray text)
          const bigFourNutrients = ['Ca - Calcium', 'Mg - Magnesium', 'P - Phosphorus', 'B - Boron'];
          // const bigFourDeficient = bigFourNutrients.filter(nutrient => 
          //   nutrientsWithStatus.some(n => n.name.includes(nutrient.split(' - ')[1]) && n.status === 'low')
          // );
          const bigFourDeficient = bigFourNutrients.filter(nutrient =>
            nutrient_deficient.some(n => {


              return n.includes(nutrient.split(' - ')[1])
            })
          );
          const bigFourDeficientCount = bigFourDeficient.length;
          const foliarNutrients = bigFourDeficient.map(n => {
            const fullName = n.split(' - ')[1];
            const abbrev = n.split(' - ')[0];
            return `**${fullName} (${abbrev})**`;
          });
          const foliarText = bigFourDeficientCount === 0
            ? 'You do not have any deficiency in any of the nutrients of the big four.'
            : `Here, you are deficient in ${bigFourDeficientCount} of the nutrients of the big four. In this case, ${foliarNutrients.length === 1 ? `${foliarNutrients[0]} should be foliar sprayed` : `${foliarNutrients.slice(0, -1).join(', ')} and ${foliarNutrients[foliarNutrients.length - 1]} need to be foliar sprayed`} to bypass issues in the soil.`;

          // Antagonism list
          const antagonism = analyzeNutrientAntagonismNew(nutrient_excess);
          let antagonismBlock = '';
          if (antagonism.excessiveNutrients.length > 0) {
            const excessiveNames = antagonism.excessiveNutrients.map(n => `**${n} (${getNutrientAbbrev(n)})**`).join(', ');
            const bullets = antagonism.antagonismDetails.join('\n');
            antagonismBlock = `Your excess of ${excessiveNames} can shut down several nutrients.\nYour nutrient antagonism is summarized as following:\n${bullets}`;
          }

          // AI combined explanation (from API)
          const aiCombined = String(data.summary || '').trim();

          // Recommended products (from API structure like products_recommendation.deficient)
          // Generate both text format (for textarea) and HTML format (for preview/PDF)
          let recommendedProductsText = '';
          let recommendedProductsHtml = '';
          const productsRec = data?.products_recommendation || data?.ai_comments?.products_recommendation;
          if (productsRec && productsRec.deficient && typeof productsRec.deficient === 'object') {
            const productUrlMap: Record<string, string> = {
              "0.05 kg Cobalt Sulfate": "Source locally",
              "0.1 kg Cobalt Sulfate": " Source locally ",
              "0.1 kg Sodium Molybdate": " Source locally ",
              "0.2 kg Sodium Molybdate": " Source locally ",
              "0.3 kg Fulvic Acid Powder": " https://nutri-tech.com.au/collections/humates/products/fulvic-acid-powder ",
              "0.3 kg Fulvx": " https://nutri-tech.com.au/collections/humates/products/nts-fulvx-powder ",
              "0.5 L Bio-Plex": " https://nutri-tech.com.au/collections/microbes/products/bio-plex ",
              "0.5 L Micro Amino Drive (MAD)": " https://nutri-tech.com.au/collections/nslpgp/products/micro-amino-drive-mad ",
              "0.5 kg Copper Sulfate": " Source locally ",
              "0.5 kg Fulvic Acid Powder": " https://nutri-tech.com.au/collections/humates/products/fulvic-acid-powder ",
              "0.5 kg Fulvx": " https://nutri-tech.com.au/collections/humates/products/nts-fulvx-powder ",
              "0.5 kg Sodium Molybdate": " Source locally ",
              "0.7 L Photo-Finish": " https://nutri-tech.com.au/collections/premium-liquids/products/photo-finish ",
              "0.7 L Potassium Silicate": " https://nutri-tech.com.au/collections/premium-liquids/products/potassium-silicate ",
              "1 L Bio-N": " https://nutri-tech.com.au/collections/microbes/products/bio-n ",
              "1 L Bio-P": " https://nutri-tech.com.au/collections/microbes/products/bio-p ",
              "1 L Bio-Plex": " https://nutri-tech.com.au/collections/microbes/products/bio-plex ",
              "1 L Micro Amino Drive (MAD)": " https://nutri-tech.com.au/collections/nslpgp/products/micro-amino-drive-mad ",
              "1 kg Fulvx": " https://nutri-tech.com.au/collections/humates/products/nts-fulvx-powder ",
              "1 kg Iron Sulfate": " Source locally ",
              "1 kg Manganese Sulfate": "https://nutri-tech.com.au/collections/micronised-minerals/products/manganese-sulfate-1kg",
              "1 kg Sodium Borate": " Source locally ",
              "1 kg Zinc Sulfate": " Source locally ",
              "10 L DIY Humic Acid": " https://nutri-tech.com.au/products/soluble-humate-granules ",
              "10 L Dia-Life": " https://nutri-tech.com.au/collections/mms/products/dia-life-organic ",
              "10 L Lime-Life": " https://nutri-tech.com.au/collections/mms/products/lime-life-organic ",
              "10 kg Calcium Nitrate": " Source locally ",
              "12 kg Urea": "https://nutri-tech.com.au/collections/dry-mineral-fertilisers/products/urea-12kg",
              "15 kg Micronised Guano": " https://nutri-tech.com.au/collections/composted-fertilisers/products/nutri-phos-super-active ",
              "15 kg Urea": " Source locally ",
              "2 L Lime-Life": " https://nutri-tech.com.au/collections/mms/products/lime-life-organic ",
              "2 L Micro Amino Drive (MAD)": " https://nutri-tech.com.au/collections/nslpgp/products/micro-amino-drive-mad ",
              "2 L Photo-Finish": " https://nutri-tech.com.au/collections/premium-liquids/products/photo-finish ",
              "2 L Potassium Silicate": " https://nutri-tech.com.au/collections/premium-liquids/products/potassium-silicate ",
              "2 L Triple Ten": " https://nutri-tech.com.au/collections/premium-liquids/products/triple-ten ",
              "2 kg Calcium Nitrate": " Source locally ",
              "2 kg Copper Sulfate": " Source locally ",
              "2 kg Fulvx": " https://nutri-tech.com.au/collections/humates/products/nts-fulvx-powder ",
              "2 kg Magnesium Sulfate": " Source locally ",
              "2 kg Micronised Guano": " https://nutri-tech.com.au/collections/composted-fertilisers/products/nutri-phos-super-active ",
              "2 kg Sodium Borate": " Source locally ",
              "20 L Nutri-Sea Liquid Fish": " https://nutri-tech.com.au/collections/nslpgp/products/nutri-sea-liquid-fish ",
              "20 kg Magnesium Sulfate": " Source locally ",
              "20 kg Potassium Sulfate": " Source locally ",
              "20 kg Tech Grade MAP": " Source locally ",
              "20 kg Urea": " Source locally ",
              "3 L Copper Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/copper-essentials ",
              "3 L Copper Shuttle": " https://nutri-tech.com.au/collections/shuttle/products/copper-shuttle ",
              "3 L Phos-Force": " https://nutri-tech.com.au/collections/premium-liquids/products/phos-force ",
              "3 kg MKP": " Source locally ",
              "3 kg Magnesium Sulfate": " Source locally ",
              "3 kg Zinc Sulfate": " Source locally ",
              "30 ml Triacontanol": " https://nutri-tech.com.au/collections/nslpgp/products/nutri-stim-triacontanol ",
              "4 L Copper Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/copper-essentials ",
              "4 L Copper Shuttle": " https://nutri-tech.com.au/collections/shuttle/products/copper-shuttle ",
              "4 L Iron Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/iron-essentials ",
              "4 L Manganese Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/manganese-essentials ",
              "4 L Photo-Finish": " https://nutri-tech.com.au/collections/premium-liquids/products/photo-finish ",
              "4 L Potassium Silicate": " https://nutri-tech.com.au/collections/premium-liquids/products/potassium-silicate ",
              "4 L Zinc Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/zinc-essentials ",
              "4 L Zinc Shuttle": " https://nutri-tech.com.au/collections/shuttle/products/zinc-shuttle ",
              "5 L Amino Max": " https://nutri-tech.com.au/collections/nslpgp/products/amino-max ",
              "5 L Calcium Fulvate": " https://nutri-tech.com.au/collections/premium-liquids/products/farm-saver-calcium-fulvate ",
              "5 L Iron Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/iron-essentials ",
              "5 L K-Rich": " https://nutri-tech.com.au/collections/premium-liquids/products/k-rich ",
              "5 L Lime-Life": " https://nutri-tech.com.au/collections/mms/products/lime-life-organic ",
              "5 L Manganese Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/manganese-essentials ",
              "5 L Phos-Force": " https://nutri-tech.com.au/collections/premium-liquids/products/phos-force ",
              "5 L Trio (CMB)": " https://nutri-tech.com.au/collections/premium-liquids/products/trio-cmb ",
              "5 L Triple Ten": " https://nutri-tech.com.au/collections/premium-liquids/products/triple-ten ",
              "5 L Zinc Essentials": " https://nutri-tech.com.au/collections/farm-essentials/products/zinc-essentials ",
              "5 L Zinc Shuttle": " https://nutri-tech.com.au/collections/shuttle/products/zinc-shuttle ",
              "5 kg Iron Sulfate": " Source locally ",
              "5 kg Magnesium Sulfate": " Source locally ",
              "5 kg Manganese Sulfate": " Source locally ",
              "5 kg Micronised Guano": " https://nutri-tech.com.au/collections/composted-fertilisers/products/nutri-phos-super-active ",
              "5 kg Potassium Sulfate": " Source locally ",
              "50 ml Triacontanol": " https://nutri-tech.com.au/collections/nslpgp/products/nutri-stim-triacontanol ",
              "7 kg Magnesium Sulfate": " Source locally ",
              "8 L Nutri-Sea Liquid Fish": " https://nutri-tech.com.au/collections/nslpgp/products/nutri-sea-liquid-fish ",
              "8 kg Potassium Sulfate": " Source locally "
            };

            const textLines: string[] = [];
            const htmlItems: string[] = [];

            Object.keys(productsRec.deficient).forEach(innerKey => {
              const entry = productsRec.deficient[innerKey];
              if (!entry) return;
              const nutrientName = entry.nutrient || innerKey;
              const items = Array.isArray(entry.recommended_products) ? entry.recommended_products : [];
              if (items.length > 0) {
                // Generate text format: • Nutrient: 🛒 Product1 (url1), 🛒 Product2 (url2)
                const textProducts = items.map(productName => {
                  const productUrl = productUrlMap[productName];
                  if (productUrl && productUrl.trim() !== "" && productUrl.trim() !== "Source locally" && productUrl.trim().startsWith("http")) {
                    return `🛒 ${productName} (${productUrl})`;
                  } else {
                    return `🛒 ${productName}`;
                  }
                }).join(', ');
                textLines.push(`• ${nutrientName}: ${textProducts}`);

                // Generate HTML format: <li><strong>Nutrient</strong>: <a>🛒 Product1</a>, <a>🛒 Product2</a></li>
                const htmlProducts = items.map(productName => {
                  const productUrl = productUrlMap[productName];
                  if (productUrl && productUrl.trim() !== "" && productUrl.trim() !== "Source locally" && productUrl.trim().startsWith("http")) {
                    return `<a href="${productUrl}" target="_blank" style="text-decoration: none; color: #8cb43a;">🛒 ${productName}</a>`;
                  } else {
                    return `🛒 ${productName}`;
                  }
                }).join(', ');
                htmlItems.push(`<li><strong>${nutrientName}</strong>: ${htmlProducts}</li>`);
              }
            });

            if (textLines.length > 0) {
              recommendedProductsText = 'Recommended Products:\n' + textLines.join('\n');
              recommendedProductsHtml = `<p style="color: #8cb43a; font-weight: bold; margin-bottom: 8px;">Recommended Products:</p><ul style="margin-top: 0; margin-bottom: 0;">${htmlItems.join('')}</ul>`;
            }
          }

          // Combine parts and convert to HTML for rich text editor
          // Order: AI summary first (from backend/app.py), then hardcoded sections
          const parts: string[] = [];
          if (aiCombined) parts.push(aiCombined);
          parts.push(bigFourIntro);
          parts.push(foliarText);
          if (antagonismBlock) parts.push(antagonismBlock);
          const composed = parts.join('\n\n');

          // Convert markdown-like text to HTML
          const composedHtmlBase = markdownToHtml(composed);

          // Put into general comments (rich text editor uses HTML directly)
          const composedHtmlForEditor = composedHtmlBase;
          // const composedHtmlForEditor = composedHtmlBase + (recommendedProductsHtml ? '\n' + recommendedProductsHtml : '');
          setSomCecText(composedHtmlForEditor);
          setHtmlPreview(composedHtmlForEditor);
          try { 
            (window as any).__ntsGeneralCommentsHtml = { ...(window as any).__ntsGeneralCommentsHtml, [currentPaddockKey]: composedHtmlForEditor }; 
            setNtsGeneralCommentsHtml({ ...ntsGeneralCommentsHtml, [currentPaddockKey]: composedHtmlForEditor });
          
          } catch { }
        } else {
          // Fallback: existing local composition
          // Generate dynamic content based on nutrient analysis
          const bigFourNutrients = ['Ca - Calcium', 'Mg - Magnesium', 'P - Phosphorus', 'B - Boron'];
          const bigFourDeficient = bigFourNutrients.filter(nutrient =>
            nutrientsWithStatus.some(n => n.name.includes(nutrient.split(' - ')[1]) && n.status === 'low')
          );
          const bigFourDeficientCount = bigFourNutrients.filter(nutrient =>
            nutrientsWithStatus.some(n => n.name.includes(nutrient.split(' - ')[1]) && n.status === 'low')
          ).length;

          // Analyze nutrient antagonism
          const antagonism = analyzeNutrientAntagonism(nutrientsWithStatus);

          // Generate antagonism text
          let antagonismText = '';
          if (antagonism.excessiveNutrients.length > 0) {
            const excessiveNames = antagonism.excessiveNutrients.map(n => `**${n} (${getNutrientAbbrev(n)})**`);
            antagonismText = `Your excess of ${excessiveNames.join(', ')} can shut down several nutrients.\nYour nutrient antagonism is summarized as following:\n${antagonism.antagonismDetails.join('\n')}`;
          }

          // Combine AI summary with dynamic content
          const foliarNutrients = bigFourDeficient.map(n => {
            const fullName = n.split(' - ')[1];
            const abbrev = n.split(' - ')[0];
            return `**${fullName} (${abbrev})**`;
          });
          const foliarText = foliarNutrients.length === 1
            ? `${foliarNutrients[0]} should be foliar sprayed`
            : `${foliarNutrients.slice(0, -1).join(', ')} and ${foliarNutrients[foliarNutrients.length - 1]} need to be foliar sprayed`;
          const dynamicContent = `\n\nWe have found that it is remarkably productive to try to maintain "luxury levels" of 4 minerals on a leaf test (The Big four). "Luxury", refers to the top end of the acceptable range. The Big Four include **Calcium (Ca)**, **Magnesium (Mg)**, **Phosphorus (P)**, and **Boron (B)**. Here, you are deficient in ${bigFourDeficientCount} of the nutrients of the big four. ${bigFourDeficientCount > 0 ? `In this case, ${foliarText} to bypass issues in the soil.` : ''}${antagonismText}`;
          const closingSentence = '\n\nBalanced nutrition is key to optimal plant health—addressing these nutrient imbalances will help your crop reach its full potential.';

          // Generate content for all 7 summaries based on actual nutrient data
          const fallbackText = data.summary + dynamicContent + closingSentence;
          // Convert markdown-like text to HTML for rich text editor
          const fallbackHtml = markdownToHtml(fallbackText);
          setSomCecText(fallbackHtml);
          setHtmlPreview(fallbackHtml);
          try { 
            (window as any).__ntsGeneralCommentsHtml = { ...(window as any).__ntsGeneralCommentsHtml, [currentPaddockKey]: fallbackHtml }; 
            setNtsGeneralCommentsHtml({ ...ntsGeneralCommentsHtml, [currentPaddockKey]: fallbackHtml });
          
          } catch { }
        }

        // Generate Base Saturation summary
        const baseSaturationNutrients = nutrientsWithStatus.filter(n =>
          n.name.toLowerCase().includes('base saturation') ||
          n.name.toLowerCase().includes('calcium') ||
          n.name.toLowerCase().includes('magnesium') ||
          n.name.toLowerCase().includes('potassium') ||
          n.name.toLowerCase().includes('sodium')
        );
        const baseSaturationDeficient = baseSaturationNutrients.filter(n => n.status === 'low');
        const baseSaturationExcess = baseSaturationNutrients.filter(n => n.status === 'high');

        let baseSaturationSummary = 'Base saturation analysis reveals cation balance in the soil. ';
        if (baseSaturationDeficient.length > 0) {
          baseSaturationSummary += `Deficiencies detected in ${baseSaturationDeficient.map(n => n.name).join(', ')}. `;
        }
        if (baseSaturationExcess.length > 0) {
          baseSaturationSummary += `Excessive levels found in ${baseSaturationExcess.map(n => n.name).join(', ')}. `;
        }
        baseSaturationSummary += 'These values indicate the current cation exchange capacity and nutrient availability for plant uptake.';
        setBaseSaturationText(baseSaturationSummary);

        // Generate pH summary
        const phNutrients = nutrientsWithStatus.filter(n =>
          n.name.toLowerCase().includes('ph') ||
          n.name.toLowerCase().includes('hydrogen')
        );
        const phDeficient = phNutrients.filter(n => n.status === 'low');
        const phExcess = phNutrients.filter(n => n.status === 'high');

        let phSummary = 'Soil pH analysis indicates the acidity or alkalinity of the soil. ';
        if (phDeficient.length > 0) {
          phSummary += `Low pH detected in ${phDeficient.map(n => n.name).join(', ')}. `;
        }
        if (phExcess.length > 0) {
          phSummary += `High pH detected in ${phExcess.map(n => n.name).join(', ')}. `;
        }
        phSummary += 'This affects nutrient availability and microbial activity in the soil.';
        setPhText(phSummary);

        // Generate Available Nutrients summary
        const availableNutrients = nutrientsWithStatus.filter(n =>
          n.name.toLowerCase().includes('nitrogen') ||
          n.name.toLowerCase().includes('phosphorus') ||
          n.name.toLowerCase().includes('potassium') ||
          n.name.toLowerCase().includes('sulfur') ||
          n.name.toLowerCase().includes('zinc') ||
          n.name.toLowerCase().includes('iron') ||
          n.name.toLowerCase().includes('manganese') ||
          n.name.toLowerCase().includes('copper') ||
          n.name.toLowerCase().includes('boron')
        );
        const availableDeficient = availableNutrients.filter(n => n.status === 'low');
        const availableExcess = availableNutrients.filter(n => n.status === 'high');

        let availableSummary = 'Available nutrient analysis shows the current plant-available nutrient levels. ';
        if (availableDeficient.length > 0) {
          availableSummary += `Deficiencies detected in ${availableDeficient.map(n => n.name).join(', ')}. `;
        }
        if (availableExcess.length > 0) {
          availableSummary += `Excessive levels found in ${availableExcess.map(n => n.name).join(', ')}. `;
        }
        availableSummary += 'These concentrations reflect the current soil fertility status and plant-available nutrient pool.';
        setAvailableNutrientsText(availableSummary);

        // Generate Soil Reserves summary
        const reservesNutrients = nutrientsWithStatus.filter(n =>
          n.name.toLowerCase().includes('reserve') ||
          n.name.toLowerCase().includes('total') ||
          n.name.toLowerCase().includes('organic')
        );
        const reservesDeficient = reservesNutrients.filter(n => n.status === 'low');
        const reservesExcess = reservesNutrients.filter(n => n.status === 'high');

        let reservesSummary = 'Total soil reserves indicate the long-term nutrient supply capacity. ';
        if (reservesDeficient.length > 0) {
          reservesSummary += `Low reserves detected in ${reservesDeficient.map(n => n.name).join(', ')}. `;
        }
        if (reservesExcess.length > 0) {
          reservesSummary += `High reserves found in ${reservesExcess.map(n => n.name).join(', ')}. `;
        }
        reservesSummary += 'The clay fraction shows good mineral diversity, while organic reserves contribute to long-term nutrient cycling.';
        setSoilReservesText(reservesSummary);

        // Generate Lamotte Reams summary
        const lamotteNutrients = nutrientsWithStatus.filter(n =>
          n.name.toLowerCase().includes('lamotte') ||
          n.name.toLowerCase().includes('calcium') ||
          n.name.toLowerCase().includes('magnesium') ||
          n.name.toLowerCase().includes('phosphorus') ||
          n.name.toLowerCase().includes('potassium')
        );
        const lamotteDeficient = lamotteNutrients.filter(n => n.status === 'low');
        const lamotteExcess = lamotteNutrients.filter(n => n.status === 'high');

        let lamotteSummary = 'LaMotte/Reams analysis provides detailed insights into soil nutrient availability. ';
        if (lamotteDeficient.length > 0) {
          lamotteSummary += `Deficiencies detected in ${lamotteDeficient.map(n => n.name).join(', ')}. `;
        }
        if (lamotteExcess.length > 0) {
          lamotteSummary += `Excessive levels found in ${lamotteExcess.map(n => n.name).join(', ')}. `;
        }
        lamotteSummary += 'These values indicate the current availability of essential nutrients in the soil solution and their potential for plant uptake.';
        setLamotteReamsText(lamotteSummary);

        // Generate TAE summary
        const taeNutrients = nutrientsWithStatus.filter(n =>
          !n.name.toLowerCase().includes('lamotte') &&
          (n.name.toLowerCase().includes('trace') ||
            n.name.toLowerCase().includes('micronutrient') ||
            n.name.toLowerCase().includes('zinc') ||
            n.name.toLowerCase().includes('iron') ||
            n.name.toLowerCase().includes('manganese') ||
            n.name.toLowerCase().includes('copper') ||
            n.name.toLowerCase().includes('boron'))
        );
        const taeDeficient = taeNutrients.filter(n => n.status === 'low');
        const taeExcess = taeNutrients.filter(n => n.status === 'high');

        let taeSummary = 'Total Available Elements (TAE) analysis reveals the complete mineral profile including trace elements. ';
        if (taeDeficient.length > 0) {
          taeSummary += `Trace element deficiencies detected in ${taeDeficient.map(n => n.name).join(', ')}. `;
        }
        if (taeExcess.length > 0) {
          taeSummary += `Excessive trace elements found in ${taeExcess.map(n => n.name).join(', ')}. `;
        }
        taeSummary += 'This analysis provides a comprehensive view of all plant-available nutrients and their interactions.';
        setTaeText(taeSummary);
      } else {
        setError(data.error || 'Failed to generate summary.');
      }
    } catch (err: any) {
      setError('Error contacting AI service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReportSection title="General Comments">
      <div className="space-y-4">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-4">
              Enter the general comments here
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={somCecText}
              onChange={(html) => {
                setSomCecText(html);
                setHtmlPreview(html);
                try {
                  (window as any).__ntsGeneralCommentsHtml = { ...(window as any).__ntsGeneralCommentsHtml, [currentPaddockKey]: html };
                  setNtsGeneralCommentsHtml({ ...ntsGeneralCommentsHtml, [currentPaddockKey]: html });
                } catch { }
              }}
              className="min-h-[100px]"
              placeholder="Enter general comments here..."
            />
            <div className="mt-4 flex gap-2 items-center">
              <Button onClick={handleGenerateAI} disabled={loading} type="button">
                {loading ? 'Generating...' : 'Generate with AI'}
              </Button>
              {error && <span className="text-red-600 text-sm">{error}</span>}
            </div>
            {/* Live formatted view */}
            <div className="mt-6">
              <div className="text-black font-semibold mb-2">Preview</div>
              <div
                className="prose prose-sm max-w-none text-black"
                style={{
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
              <style>{`
                .prose a {
                  color: #8cb43a !important;
                  text-decoration: none !important;
                  cursor: pointer;
                }
                .prose a:hover {
                  text-decoration: underline !important;
                }
                .prose ul {
                  list-style-type: none;
                  padding-left: 0;
                }
                .prose li {
                  margin: 0.5rem 0;
                }
              `}</style>
            </div>
          </CardContent>
        </Card>
      </div>
    </ReportSection>
  );
};

export default GeneralComments;