import React from 'react';

interface Product {
  name: string;
  rate: string;
  unit: string;
}
interface TankMixRow {
  sequence: number;
  description: string;
  products: string;
  notes: string;
}

interface ClientReportExportProps {
  crop: string;
  date: string;
  summary: string;
  fertigationProducts: Product[];
  preFloweringFoliarProducts: Product[];
  nutritionalFoliarProducts: Product[];
  tankMixing: TankMixRow[];
  hideProductSummary?: boolean;
  agronomist?: { name: string; email?: string; role?: string };
  reportFooterText?: string;
  plantHealthScore?: number;
  isFirstPage?: boolean;
  isSoilReport?: boolean;
  // Individual section comments for soil reports
  somCecText?: string;
  baseSaturationText?: string;
  phText?: string;
  availableNutrientsText?: string;
  soilReservesText?: string;
  lamotteReamsText?: string;
  taeText?: string;
}

const highlight = { color: '#4e9c2c' };

// Replace the summary rendering with a function that converts **...** to <b>...</b>
function renderSummaryWithBold(summary: string) {
  // Replace **...** with <b>...</b>
  let html = summary.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  // Split by double newlines or \n\n and wrap each in <p>
  html = html.split(/\n\s*\n/).map(p => `<p style='margin-bottom: 1em;'>${p.trim()}</p>`).join('');
  return { __html: html };
}

// Utility to create a slug from product name for the URL
function productToSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/™|®/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Utility to normalize product names for lookup
function normalizeProductName(name: string) {
  return name.replace(/™|®/g, '').trim();
}

// Replace the SVG Star component with an emoji star styled with CSS
const Star = ({ filled }: { filled: boolean }) => (
  <span
    style={{
      fontSize: 22,
      color: filled ? '#FFC107' : '#E0E0E0',
      marginRight: 2,
      display: 'inline-block',
      verticalAlign: 'middle',
    }}
  >
    ⭐
  </span>
);

// Product descriptions and groupings for summary section
const PRODUCT_INFO = {
  // Biological Fertigation Program
  'Nutri-Life BAM™': {
    group: 'Biological Fertigation Program',
    description: 'A source of beneficial anaerobic (facultative) microbes that can increase organic matter decomposition levels and nutrient cycling, also helping enhance plant resilience.'
  },
  'Nutri-Life Tricho-Shield™': {
    group: 'Biological Fertigation Program',
    description: 'A combination of beneficial fungal species to enhance plant health and promote growth.'
  },
  'Nutri-Life Platform®': {
    group: 'Biological Fertigation Program',
    description: 'A Mycorrhizal fungi inoculum, also containing other beneficial microbes such as Trichoderma, enhancing nutrient uptake, root health, and plant resilience.'
  },
  'Root & Shoot': {
    group: 'Biological Fertigation Program',
    description: 'A biological seed treatment containing beneficial microbes and biostimulants to enhance root development, early vigor, and plant resilience. Promotes strong germination and supports early plant health for improved crop establishment.'
  },
  'Root & Shoot™': {
    group: 'Biological Fertigation Program',
    description: 'A biological seed treatment containing beneficial microbes and biostimulants to enhance root development, early vigor, and plant resilience. Promotes strong germination and supports early plant health for improved crop establishment.'
  },
  // Nutritional Fertigation/Foliar Spray Program
  'K-Rich™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'High-analysis liquid potassium (K 33.29%) for foliar and fertigation use.'
  },
  'Cal-Tech™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies N (11.71%), Ca (13.36%), and B (0.43%) for improved fruit set and quality.'
  },
  'Calcium Fulvate™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Chelated calcium with fulvic acid, enriched with a broad spectrum of trace minerals to improve nutrient uptake.'
  },
  'Citrus-Tech Triple Ten™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A complete NPK (N 10.48%, P 10.23%, K 10.69%) with trace elements for balanced nutrition.'
  },
  'Cloak Spray Oil™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A high-quality spreader/sticker/synergist to improve the performance of all foliar applications.'
  },
  'Nutri-Carb-N™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'High-analysis liquid N (15.18%) with K (1.1%) for rapid green-up and protein synthesis.'
  },
  'Phos-Force™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Contains P (14.3%), Ca (4.3%), N (4.2%), and Fe (3.5%) for strong root and shoot growth.'
  },
  'Photo-Finish™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A source of <b>Si</b> (10.38%) and <b>K</b> (10.6%) with humic acid and kelp for plant resilience.'
  },
  'Potassium Silicate™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies K (15.3%) and Si (17.3%) to strengthen cell walls and improve stress tolerance.'
  },
  'Seed-Start™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A starter fertilizer for seeds and seedlings.'
  },
  'Trio (CMB)™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies N (13.73%), Ca (15.3%), Mg (2.38%), and trace elements for balanced nutrition.'
  },
  'Triple Ten™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A complete NPK (N 10.48%, P 10.23%, K 10.69%) with trace elements for balanced nutrition.'
  },
  'Tsunami™ Super Spreader': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A spreader that improves the foliar fertiliser response.'
  },
  'Activated Char Condensate (ACC)™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A source of activated carbon for soil and plant health.'
  },
  'Aloe-Tech™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Aloe-based biostimulant for improved plant vigor.'
  },
  'Amino-Max™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A high‑amino acid concentrate. Ideal for supporting plant metabolism, stress recovery and microbial stimulation.'
  },
  'Brix-Fix™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Improves brix (sugar) levels in crops.'
  },
  'Nutri-Kelp™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A natural source of hormones (auxins, gibberellins, cytokinins) to enhance reproductive stage.'
  },
  'Nutri-Sea Liquid Fish™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A high-analysis fish fertiliser containing amino acids, vitamins, macro, and micro nutrients.'
  },
  'Nutri-Stim Saponins™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Saponin-based biostimulant for improved plant health.'
  },
  'Nutri-Stim Triacontanol™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Triacontanol-based biostimulant for enhanced growth.'
  },
  'Nutri-Tech Black Gold®': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A premium humic acid concentrate for improved soil and plant health.'
  },
  'SeaChange KFF™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Kelp and fish fertilizer for balanced nutrition.'
  },
  'SeaChange Liquid Kelp™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Liquid kelp for plant growth and stress tolerance.'
  },
  'Tri-Kelp™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A blend of three kelp species for root and shoot growth.'
  },
  'Nutri-Key Boron Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A foliar chelated boron formulation containing 3.61% B, supported by a full background of synergistic nutrition.'
  },
  'Nutri-Key Calcium Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Ca (9.81%), N (7.25%), and trace elements for calcium nutrition.'
  },
  'Nutri-Key Cobalt Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Co (3.1%) and Zn (2.8%) for micronutrient support.'
  },
  'Nutri-Key Copper Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Cu (7.64%), N (0.52%), S (4.29%), and trace elements for copper nutrition.'
  },
  'Nutri-Key Hydro-Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies N (2.14%) and C (21.15%) for improved water and nutrient uptake.'
  },
  'Nutri-Key Iron Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A chelated iron foliar (~7.2% Fe) supported by background nutrients to boost chlorophyll production and rapidly correct iron deficiency.'
  },
  'Nutri-Key Magnesium Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Mg (4.44%), N (0.45%), S (6.24%), and trace elements for magnesium nutrition.'
  },
  'Nutri-Key Manganese Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A high-analysis foliar Mn formulation (~13.2% Mn) featuring advanced chelation for improved uptake.'
  },
  'Nutri-Key Moly Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Mo (4.76%), N (0.18%), and C (1.6%) for molybdenum nutrition.'
  },
  'Nutri-Key Shuttle Seven™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A multi-nutrient blend with N, S, B, Mg, Co, Cu, Zn, Fe, K, Mn, Mo, Se, and C.'
  },
  'Nutri-Key Zinc Shuttle™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Zn (8.17%), N (0.73%), S (4.35%), and trace elements for zinc nutrition.'
  },
  'Boron Essentials™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies B (3.09%), N (0.05%), and Zn (0.04%) for boron nutrition.'
  },
  'Copper Essentials™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Cu (4.9%), N (0.12%), S (2.55%), Ca (0.02%), Mg (0.04%), and K (0.14%).'
  },
  'Iron Essentials™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Fe (6%), N (0.12%), S (3.49%), Ca (0.02%), Mg (0.04%), and K (0.14%).'
  },
  'Manganese Essentials™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Mn (0.13%), Si (10.96%), N (0.12%), S (6.52%), Ca (0.02%), and Mg (0.04%).'
  },
  'Multi-Boost™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A multi-nutrient blend with N (2.29%), S (6.2%), Ca (5.96%), Mg (0.64%), and trace elements.'
  },
  'Multi-Min™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A multi-nutrient blend with N (4.24%), S (4.12%), Mg (1.49%), Ca (0.02%), and trace elements.'
  },
  'Multi-Plex™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'A multi-nutrient blend with N (10.22%), P (10.09%), K (10.04%), and trace elements.'
  },
  'Zinc Essentials™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Zn (7.95%), N (0.12%), S (3.95%), Ca (0.02%), and Mg (0.04%).'
  },
  'CalMag-Life Organic™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Organic source of Ca (20.26%) and Mg (9.68%).'
  },
  'Dia-Life Organic™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Organic source of Si (12.51%), B (0.68%), Ca (0.16%), Mg (0.0277%), and Fe (0.32%).'
  },
  'Gyp-Life Organic™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Organic source of Ca (19.55%) and S (15.31%).'
  },
  'Lime-Life Organic™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Organic source of Ca (39.37%) and Mg (1.05%).'
  },
  'Mag-Life Organic™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Organic source of Mg (21.3%).'
  },
  'Phos-Life Organic™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Organic source of P (10.71%), Ca (24.56%), Si (10.73%), and trace elements.'
  },
  'Sili-Cal (B)™': {
    group: 'Nutritional Fertigation/Foliar Spray Program',
    description: 'Supplies Ca (21.59%), Si (3.34%), B (0.51%), S (0.13%), and Mg (0.64%).'
  },
};

const PRODUCT_GROUPS = [
  {
    key: 'Biological Fertigation Program',
    title: '<b>Biological Fertigation Program:</b> This will provide and stimulate beneficial soil biology.'
  },
  {
    key: 'Nutritional Fertigation/Foliar Spray Program',
    title: '<b>The following recommendations have been included</b>'
  }
];

export { PRODUCT_INFO, normalizeProductName };

const ClientReportExport: React.FC<ClientReportExportProps> = ({
  crop,
  date,
  summary,
  fertigationProducts = [],
  preFloweringFoliarProducts = [],
  nutritionalFoliarProducts = [],
  tankMixing = [],
  hideProductSummary = false,
  agronomist,
  reportFooterText,
  plantHealthScore,
  isFirstPage = true,
  isSoilReport = false,
  // Individual section comments for soil reports
  somCecText = '',
  baseSaturationText = '',
  phText = '',
  availableNutrientsText = '',
  soilReservesText = '',
  lamotteReamsText = '',
  taeText = '',
}) => {
  // Collect all unique product names from all recommendations
  const allProducts = [
    ...fertigationProducts,
    ...preFloweringFoliarProducts,
    ...nutritionalFoliarProducts
  ];
  const uniqueProducts = Array.from(new Set(allProducts.map(p => p.name)));

  // Group products by program
  const groupedProducts = PRODUCT_GROUPS.map(group => ({
    ...group,
    products: uniqueProducts.filter(name => PRODUCT_INFO[normalizeProductName(name)]?.group === group.key)
  }));

  // Calculate stars for plant health score (0-100 mapped to 0-5 stars)
  const starCount = 5;
  const filledStars = plantHealthScore !== undefined ? Math.floor(plantHealthScore / 20) : 0;
  const halfStar = plantHealthScore !== undefined && plantHealthScore % 20 >= 10;

  // Extract only the crop name if crop contains a dash (e.g., 'Client - Crop')
  const cleanCrop = crop && crop.includes(' - ') ? crop.split(' - ').pop().trim() : crop;

  return (
    <div style={{
      background: '#fff',
      color: '#222',
      fontFamily: 'Arial, sans-serif',
      padding: '40px',
      paddingTop: isFirstPage ? '40px' : '64px',
      maxWidth: '900px',
      margin: '0 auto',
      position: 'relative',
      minHeight: '1200px',
      lineHeight: '1.6',
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* TEST HEADER FOR DEBUGGING */}
      <div style={{
        textAlign: 'center',
        fontSize: '32px',
        fontWeight: 900,
        color: 'red',
        marginBottom: '16px',
        letterSpacing: '2px',
      }}>
        TEST EXPORT HEADER
      </div>
      {/* Header Section */}
      
      <h1 style={{ 
        textAlign: 'center', 
        color: '#8cb43a', 
        fontWeight: 600, 
        fontSize: '32px', 
        margin: '16px 0',
        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>
        {isSoilReport ? 'Soil Therapy' : 'Plant Therapy'}<sup style={{ fontSize: '18px' }}>™</sup> Report
      </h1>

      {/* Main Summary Section */}
      <div style={{ 
        margin: '24px 0', 
        fontSize: '16px', 
        lineHeight: '1.7', 
        textAlign: 'justify',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }} dangerouslySetInnerHTML={renderSummaryWithBold(summary)} />

      {/* Individual Section Comments for Soil Reports */}
      {isSoilReport && (
        <>
          {/* Organic Matter & CEC Section */}
          {somCecText && (
            <div style={{ 
              margin: '24px 0', 
              fontSize: '16px', 
              lineHeight: '1.7', 
              textAlign: 'justify',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }} dangerouslySetInnerHTML={renderSummaryWithBold(somCecText)} />
          )}

          {/* Base Saturation Section */}
          {baseSaturationText && (
            <div style={{ 
              margin: '24px 0', 
              fontSize: '16px', 
              lineHeight: '1.7', 
              textAlign: 'justify',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }} dangerouslySetInnerHTML={renderSummaryWithBold(baseSaturationText)} />
          )}

          {/* pH Section */}
          {phText && (
            <div style={{ 
              margin: '24px 0', 
              fontSize: '16px', 
              lineHeight: '1.7', 
              textAlign: 'justify',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }} dangerouslySetInnerHTML={renderSummaryWithBold(phText)} />
          )}

          {/* Available Nutrients Section */}
          {availableNutrientsText && (
            <div style={{ 
              margin: '24px 0', 
              fontSize: '16px', 
              lineHeight: '1.7', 
              textAlign: 'justify',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }} dangerouslySetInnerHTML={renderSummaryWithBold(availableNutrientsText)} />
          )}

          {/* Soil Reserves Section */}
          {soilReservesText && (
            <div style={{ 
              margin: '24px 0', 
              fontSize: '16px', 
              lineHeight: '1.7', 
              textAlign: 'justify',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }} dangerouslySetInnerHTML={renderSummaryWithBold(soilReservesText)} />
          )}

          {/* LaMotte Reams Section */}
          {lamotteReamsText && (
            <div style={{ 
              margin: '24px 0', 
              fontSize: '16px', 
              lineHeight: '1.7', 
              textAlign: 'justify',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }} dangerouslySetInnerHTML={renderSummaryWithBold(lamotteReamsText)} />
          )}

          {/* TAE Section */}
          {taeText && (
            <div style={{ 
              margin: '24px 0', 
              fontSize: '16px', 
              lineHeight: '1.7', 
              textAlign: 'justify',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }} dangerouslySetInnerHTML={renderSummaryWithBold(taeText)} />
          )}
        </>
      )}

      {/* Fertigation Products Section */}
      {fertigationProducts.length > 0 && (
        <div style={{ 
          margin: '24px 0',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            fontStyle: 'italic', 
            textDecoration: 'underline', 
            marginBottom: '8px',
            fontWeight: 600,
            color: '#495057'
          }}>
            In a single fertigation (drip irrigation) apply the following:
          </div>
          <ul style={{ margin: 0, paddingLeft: 24 }}>
            {fertigationProducts.map((p, i) => (
              <li key={i} style={{ 
                fontWeight: 600,
                marginBottom: '4px',
                color: '#212529'
              }}>
                {p.name} <span style={{ fontWeight: 400, color: '#6c757d' }}>at {p.rate} {p.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pre-Flowering Foliar Products Section */}
      {preFloweringFoliarProducts.length > 0 && (
        <div style={{ 
          margin: '24px 0',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            fontStyle: 'italic', 
            textDecoration: 'underline', 
            marginBottom: '8px',
            fontWeight: 600,
            color: '#495057'
          }}>
            In a single pre-flowering foliar spray apply the following:
          </div>
          <ul style={{ margin: 0, paddingLeft: 24 }}>
            {preFloweringFoliarProducts.map((p, i) => (
              <li key={i} style={{ 
                fontWeight: 600,
                marginBottom: '4px',
                color: '#212529'
              }}>
                {p.name} <span style={{ fontWeight: 400, color: '#6c757d' }}>at {p.rate} {p.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nutritional Foliar Products Section */}
      {nutritionalFoliarProducts.length > 0 && (
        <div style={{ 
          margin: '24px 0',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            fontStyle: 'italic', 
            textDecoration: 'underline', 
            marginBottom: '8px',
            fontWeight: 600,
            color: '#495057'
          }}>
            In a single nutritional foliar spray apply the following:
          </div>
          <ul style={{ margin: 0, paddingLeft: 24 }}>
            {nutritionalFoliarProducts.map((p, i) => (
              <li key={i} style={{ 
                fontWeight: 600,
                marginBottom: '4px',
                color: '#212529'
              }}>
                {p.name} <span style={{ fontWeight: 400, color: '#6c757d' }}>at {p.rate} {p.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Product Summary Section */}
      {!hideProductSummary && groupedProducts.some(g => g.products.length > 0) && (
        <>
          <div style={{ pageBreakBefore: 'always' }} />
          <div className="keep-together" style={{ marginBottom: '12px' }}>
            {groupedProducts.map(group => group.products.length > 0 && (
              <div key={group.key} style={{ marginBottom: 16 }}>
                <div
                  style={{ 
                    fontSize: 18, 
                    marginBottom: 8, 
                    color: '#495057',
                    fontWeight: 600,
                    ...(group.key === 'Nutritional Fertigation/Foliar Spray Program' ? { textAlign: 'center' } : {})
                  }}
                  dangerouslySetInnerHTML={{ __html: group.title }}
                />
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: 24, 
                  fontSize: 16, 
                  textAlign: 'justify',
                  backgroundColor: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6'
                }}>
                  {group.products.map((name, i) => {
                    const normalized = normalizeProductName(name);
                    const desc = PRODUCT_INFO[normalized]?.description;
                    // Removed debug logging
                    return (
                      <li key={i} style={{ 
                        marginBottom: 4, // Reduced from 8 to 4 to reduce space between products
                        lineHeight: '1.4' // Reduced from 1.5 to 1.4 for tighter spacing
                      }}>
                        <span style={{ display: 'inline' }}>
                          <a
                            href={`https://www.nutri-tech.com.au/products/${productToSlug(name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#1a0dab', 
                              textDecoration: 'underline', 
                              fontWeight: 500, 
                              fontStyle: 'italic' 
                            }}
                          >
                            {name}
                          </a>
                          {desc && (
                            <span style={{ color: '#222', fontWeight: 400, fontStyle: 'normal' }}>:
                              <span dangerouslySetInnerHTML={{ __html: ' ' + desc }} />
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mixing Table Section */}
      {tankMixing.length > 0 && (
        <div className="keep-together" style={{ margin: '24px 0' }}>
          <div style={{ 
            fontStyle: 'italic', 
            textDecoration: 'underline', 
            marginBottom: '8px',
            fontWeight: 600,
            color: '#495057'
          }}>
            General Tank Mixing Sequence Instructions:
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#8cb43a', color: '#fff' }}>
                <th style={{ padding: '8px', border: '1px solid #dee2e6', fontWeight: 700 }}>SEQUENCE</th>
                <th style={{ padding: '8px', border: '1px solid #dee2e6', fontWeight: 700 }}>PRODUCT DESCRIPTION</th>
                <th style={{ padding: '8px', border: '1px solid #dee2e6', fontWeight: 700 }}>SELECT PRODUCTS</th>
                <th style={{ padding: '8px', border: '1px solid #dee2e6', fontWeight: 700 }}>NOTES</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(tankMixing) ? tankMixing : []).map((row, i) => (
                <tr key={i} style={{ 
                  breakInside: 'avoid', 
                  pageBreakInside: 'avoid', 
                }}>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontWeight: 600 }}>{row.sequence}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{row.description}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{row.products}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Plant Health Score and Stars */}
      {plantHealthScore !== undefined && (
        <div style={{ 
          textAlign: 'center',
          marginTop: '20px',
          marginBottom: '8px',
          padding: '14px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 6 }}>
            {[...Array(starCount)].map((_, i) => (
              <Star key={i} filled={i < filledStars} />
            ))}
          </div>
          <div style={{ 
            color: '#8cb43a', 
            fontWeight: 700, 
            fontSize: '26px', 
            marginTop: '8px' 
          }}>
            {isSoilReport ? 'Overall Soil Health Score:' : 'Overall Plant Health Score:'} {plantHealthScore.toFixed(1)} / 100
          </div>
        </div>
      )}

      {/* Agronomist signature section */}
      {agronomist && (
        <div style={{
          marginTop: '12px',
          textAlign: 'center',
          padding: '12px',
          borderTop: '2px solid #dee2e6'
        }}>
          <div style={{ fontWeight: 600, fontSize: '18px', color: '#495057' }}>{agronomist.name}</div>
          {agronomist.role && <div style={{ fontSize: '15px', color: '#6c757d', marginTop: '4px' }}>{agronomist.role}</div>}
          {agronomist.email && <div style={{ fontSize: '15px', color: '#6c757d', marginTop: '4px' }}>{agronomist.email}</div>}
        </div>
      )}

      {/* Footer/disclaimer section */}
      <div style={{ flexGrow: 1 }} />
      <div style={{
        marginTop: '16px',
        textAlign: 'justify',
        fontSize: '13px',
        color: '#666',
        borderTop: '1px solid #eee',
        paddingTop: '10px',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto',
        fontStyle: 'italic',
        minHeight: '24px'
      }}>
        {reportFooterText || ''}
      </div>
    </div>
  );
}

export default ClientReportExport; 