import React from 'react';

const ReportTemplateHeader: React.FC = () => (
  <div className="container mt-4 mb-4">
    <div className="row mb-4 align-items-center justify-content-between">
      <div className="col-4 d-flex align-items-center">
        <img src="/images/NTS Logo.webp" alt="NTS Logo" style={{ maxHeight: 60 }} />
      </div>
      <div className="col-4 text-center">
        <h1 className="fw-bold mb-0" style={{ fontSize: '2.5rem' }}>
          Plant Therapy <sup className="sub">TM</sup>
        </h1>
      </div>
      <div className="col-4 d-flex align-items-center justify-content-end">
        <img src="/images/Nutrition_Farming_Logo.webp" alt="Nutrition Farming Logo" style={{ maxHeight: 60 }} />
      </div>
    </div>
    <hr className="mb-0" style={{ borderTop: '4px solid #8cb33a' }} />
  </div>
);

export default ReportTemplateHeader; 