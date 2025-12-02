import React from 'react';

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

interface ReportPaddockSectionProps {
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
  showBreakdown?: boolean;
  mixingTableHtml?: string;
  showMixingTable?: boolean;
}

const ReportPaddockSection: React.FC<ReportPaddockSectionProps> = ({
  paddockName,
  description,
  fertigationProducts,
  fertigationBreakdown,
  fertigationBreakdownPerProduct,
  fertigationTotalCost,
  foliarProducts,
  foliarBreakdown,
  foliarBreakdownPerProduct,
  foliarTotalCost,
  showBreakdown = false,
  mixingTableHtml,
  showMixingTable = false,
}) => (
  <div className="my-5">
    <p className="secondary-font-color mb-0 mt-3" style={{ textDecoration: 'underline' }}>
      <b><i>{paddockName}</i></b>
    </p>
    {description && (
      <p className="mb-3 text-justify" dangerouslySetInnerHTML={{ __html: description.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
    )}

    {fertigationProducts.length > 0 && (
      <>
        <p className="m-0" style={{ textDecoration: 'underline' }}><i>In a single fertigation (drip irrigation) apply the following:</i></p>
        <ul className="mt-0 mb-1">
          {fertigationProducts.map((p, i) => (
            <li key={i}><b>{p.name}</b> at {p.rate} {p.unit}</li>
          ))}
        </ul>
        {showBreakdown && fertigationBreakdown && (
          <div className="d-flex align-items-start justify-content-between flex-row">
            <span>
              <p className="mt-1 mb-0 fw-bold">Combined Nutrient Breakdown:</p>
              <table className="table table-bordered combined_nutrient_breakdown_table" style={{ width: 'auto' }}>
                <thead>
                  <tr>
                    <th>Nutrient</th>
                    <th>kg/ha</th>
                    <th>ppm</th>
                  </tr>
                </thead>
                <tbody>
                  {fertigationBreakdown.map((n, i) => (
                    <tr key={i}>
                      <td>{n.Nutrient}</td>
                      <td>{n['kg/ha'].toFixed(4)}</td>
                      <td>{n.ppm.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </span>
            <span>
              <p className="mt-1 mb-0 fw-bold">Nutrient Breakdown Per Product:</p>
              {fertigationBreakdownPerProduct && fertigationBreakdownPerProduct.map((pb, i) => (
                <div key={i}>
                  <p className="fw-bold mb-0" style={{ fontSize: 11 }}>Product Name: {pb.product}</p>
                  {pb.nutrients.length > 0 ? pb.nutrients.map((item, j) => (
                    <p className="mb-0" style={{ fontSize: 11 }} key={j}>
                      Nutrient: {item.Nutrient} &ensp; kg/ha: {item['kg/ha']} &ensp; ppm: {item.ppm}
                    </p>
                  )) : <p style={{ fontSize: 11 }}>No nutrients details found.</p>}
                </div>
              ))}
            </span>
          </div>
        )}
        {fertigationTotalCost !== undefined && (
          <div className="d-flex align-items-center justify-content-between mt-3 mb-3">
            <p className="m-0 w-100">Total cost: ${fertigationTotalCost.toFixed(2)}</p>
          </div>
        )}
      </>
    )}

    {foliarProducts.length > 0 && (
      <>
        <p className="m-0" style={{ textDecoration: 'underline' }}><i>In a single foliar spray (drip irrigation) apply the following:</i></p>
        <ul className="mt-0 mb-1">
          {foliarProducts.map((p, i) => (
            <li key={i}><b>{p.name}</b> at {p.rate} {p.unit}</li>
          ))}
        </ul>
        {showBreakdown && foliarBreakdown && (
          <div className="d-flex align-items-start justify-content-between flex-row">
            <span>
              <p className="mt-1 mb-0 fw-bold">Combined Nutrient Breakdown:</p>
              <table className="table table-bordered combined_nutrient_breakdown_table" style={{ width: 'auto' }}>
                <thead>
                  <tr>
                    <th>Nutrient</th>
                    <th>kg/ha</th>
                    <th>ppm</th>
                  </tr>
                </thead>
                <tbody>
                  {foliarBreakdown.map((n, i) => (
                    <tr key={i}>
                      <td>{n.Nutrient}</td>
                      <td>{n['kg/ha'].toFixed(4)}</td>
                      <td>{n.ppm.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </span>
            <span>
              <p className="mt-1 mb-0 fw-bold">Nutrient Breakdown Per Product:</p>
              {foliarBreakdownPerProduct && foliarBreakdownPerProduct.map((pb, i) => (
                <div key={i}>
                  <p className="fw-bold mb-0" style={{ fontSize: 11 }}>Product Name: {pb.product}</p>
                  {pb.nutrients.length > 0 ? pb.nutrients.map((item, j) => (
                    <p className="mb-0" style={{ fontSize: 11 }} key={j}>
                      Nutrient: {item.Nutrient} &ensp; kg/ha: {item['kg/ha']} &ensp; ppm: {item.ppm}
                    </p>
                  )) : <p style={{ fontSize: 11 }}>No nutrients details found.</p>}
                </div>
              ))}
            </span>
          </div>
        )}
        {foliarTotalCost !== undefined && (
          <div className="d-flex align-items-center justify-content-between mt-3 mb-3">
            <p className="m-0 w-100">Total cost: ${foliarTotalCost.toFixed(2)}</p>
          </div>
        )}
      </>
    )}

    {showMixingTable && mixingTableHtml && (
      <div className="mt-4">
        <p className="mb-2" style={{ textDecoration: 'underline' }}><i>General Tank Mixing Sequence Instructions:</i></p>
        <div dangerouslySetInnerHTML={{ __html: mixingTableHtml }} />
        <p className="mt-2"><b>Note:</b> Always perform a jar-test first if unsure of tank compatibility.</p>
      </div>
    )}
  </div>
);

export default ReportPaddockSection; 