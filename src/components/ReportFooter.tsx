import React from 'react';

const ReportFooter: React.FC = () => (
  <>
    <p><i>Please refer to product label or PIS for alternate application rates.</i></p>
    <p className="mt-4" style={{ textAlign: 'center', color: '#eee' }}> END OF REPORT </p>
    <div className="page-footer mt-4">
      <p className="text-justify" style={{ fontSize: 12 }}>
        Any recommendations provided by Soil Therapy P/L are advice only. As no control can be exercised over storage, 
        handling, mixing application or use, or weather, plant or soil conditions before, during or after application (all of 
        which may affect the performance of our program), no responsibility for, or liability for any failure in performance, 
        losses, damages, or injuries (consequential or otherwise), arising from such storage, mixing, application, or use will 
        be accepted under any circumstances whatsoever. The buyer assumes all responsibility for the use of any of our 
        products.
      </p>
    </div>
  </>
);

export default ReportFooter; 