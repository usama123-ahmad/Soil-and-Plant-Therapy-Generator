# PDF Export Functionality

This document describes the enhanced PDF export functionality implemented in the Plant Therapy application.

## Overview

The PDF export system provides professional-grade PDF generation with the following features:

- **High-quality HTML to PDF conversion** using jsPDF and html2canvas
- **Cover page support** with PDF attachments
- **Customizable watermarks** and branding
- **Automatic page breaks** and pagination
- **Professional formatting** with consistent styling
- **Multiple export options** for different use cases

## Components

### 1. PDFExportButton Component

A reusable button component that handles PDF export with loading states and error handling.

```tsx
import PDFExportButton from './components/PDFExportButton';

<PDFExportButton
  component={<MyReportComponent data={data} />}
  filename="My_Report.pdf"
  options={exportOptions}
  variant="default"
  size="sm"
>
  Export PDF
</PDFExportButton>
```

**Props:**
- `component`: React element to export
- `filename`: Name of the exported PDF file
- `options`: PDF export configuration options
- `variant`: Button variant (default, outline, etc.)
- `size`: Button size (sm, default, lg)
- `disabled`: Whether the button is disabled
- `showLoading`: Whether to show loading spinner

### 2. PDFExporter Class

Advanced PDF export utility with comprehensive features.

```tsx
import { PDFExporter } from './utils/pdfExport';

const exporter = new PDFExporter({
  filename: 'report.pdf',
  includeCoverPage: true,
  coverPageUrl: '/attachments/cover.pdf',
  watermark: 'Company Name'
});

await exporter.generatePDF(pages);
```

### 3. ClientReportExport Component

Professional PDF template for plant therapy reports.

```tsx
import ClientReportExport from './components/ClientReportExport';

<ClientReportExport
  client="Farm Name"
  crop="Wheat"
  date="2025-01-15"
  summary="Analysis summary..."
  fertigationProducts={[...]}
  preFloweringFoliarProducts={[...]}
  nutritionalFoliarProducts={[...]}
  tankMixing={[...]}
  agronomist={{ name: 'Dr. Smith', role: 'Agronomist' }}
  plantHealthScore={85}
/>
```

## Export Options

### PDFExportOptions Interface

```tsx
interface PDFExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'legal';
  scale?: number;
  quality?: number;
  includeCoverPage?: boolean;
  coverPageUrl?: string;
  watermark?: string;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}
```

### Common Configurations

#### Basic Export
```tsx
const basicOptions: PDFExportOptions = {
  filename: 'Basic_Report.pdf',
  orientation: 'portrait',
  format: 'a4',
  scale: 2
};
```

#### Professional Export
```tsx
const professionalOptions: PDFExportOptions = {
  filename: 'Professional_Report.pdf',
  orientation: 'portrait',
  format: 'a4',
  scale: 2,
  quality: 0.98,
  includeCoverPage: true,
  coverPageUrl: '/attachments/plant-therapy-cover.pdf',
  watermark: 'NTS G.R.O.W',
  margins: { top: 20, bottom: 20, left: 20, right: 20 }
};
```

#### High Quality Export
```tsx
const highQualityOptions: PDFExportOptions = {
  filename: 'High_Quality_Report.pdf',
  orientation: 'portrait',
  format: 'a4',
  scale: 3,
  quality: 0.99,
  includeCoverPage: true,
  coverPageUrl: '/attachments/plant-therapy-cover.pdf',
  watermark: 'NTS G.R.O.W - Premium Report',
  margins: { top: 30, bottom: 30, left: 30, right: 30 }
};
```

## Features

### 1. Cover Page Support
- Automatically includes PDF cover pages
- Supports multiple cover page formats
- Seamless integration with existing PDFs

### 2. Watermarking
- Customizable text watermarks
- Diagonal placement for professional appearance
- Configurable opacity and positioning

### 3. Page Numbering
- Automatic page numbering
- Professional formatting
- Configurable position and style

### 4. Quality Control
- Configurable scale (1x to 4x)
- Quality settings (0.8 to 0.99)
- Optimized for different use cases

### 5. Error Handling
- Comprehensive error catching
- User-friendly error messages
- Graceful fallbacks

## Usage Examples

### Simple Export
```tsx
import PDFExportButton from './components/PDFExportButton';

function MyComponent() {
  return (
    <PDFExportButton
      component={<MyReport data={data} />}
      filename="Report.pdf"
    >
      Export PDF
    </PDFExportButton>
  );
}
```

### Advanced Export with Options
```tsx
import PDFExportButton from './components/PDFExportButton';
import { PDFExportOptions } from './utils/pdfExport';

function MyComponent() {
  const options: PDFExportOptions = {
    filename: 'Professional_Report.pdf',
    includeCoverPage: true,
    coverPageUrl: '/attachments/cover.pdf',
    watermark: 'Company Name',
    scale: 2,
    quality: 0.98
  };

  return (
    <PDFExportButton
      component={<MyReport data={data} />}
      filename="Professional_Report.pdf"
      options={options}
      variant="default"
      size="lg"
    >
      Export Professional PDF
    </PDFExportButton>
  );
}
```

### Multiple Page Export
```tsx
import { PDFExporter, PDFPageData } from './utils/pdfExport';

async function exportMultiPageReport() {
  const pages: PDFPageData[] = [
    { content: <CoverPage /> },
    { content: <ReportPage1 />, pageBreak: true },
    { content: <ReportPage2 />, pageBreak: true },
    { content: <Appendix /> }
  ];

  const exporter = new PDFExporter({
    filename: 'Multi_Page_Report.pdf',
    includeCoverPage: false // We're adding our own cover
  });

  await exporter.generatePDF(pages);
}
```

## File Structure

```
src/
├── components/
│   ├── PDFExportButton.tsx      # Reusable export button
│   ├── ClientReportExport.tsx   # PDF template component
│   └── PDFExportExample.tsx     # Usage examples
├── utils/
│   └── pdfExport.ts             # Core PDF export utilities
└── pages/
    └── Index.tsx                # Example implementation
```

## Dependencies

- `jspdf`: PDF generation library
- `html2canvas`: HTML to canvas conversion
- `pdfjs-dist`: PDF.js for cover page handling
- `react-dom/client`: React rendering for PDF generation

## Best Practices

1. **Always provide meaningful filenames** that include client and date information
2. **Use appropriate quality settings** based on the intended use (print vs screen)
3. **Include cover pages** for professional reports
4. **Handle errors gracefully** with user-friendly messages
5. **Test with different content sizes** to ensure proper pagination
6. **Use consistent styling** across all PDF templates

## Troubleshooting

### Common Issues

1. **Large PDF files**: Reduce scale or quality settings
2. **Missing fonts**: Ensure all fonts are web-safe or embedded
3. **Layout issues**: Check CSS for print compatibility
4. **Cover page not loading**: Verify file path and CORS settings

### Performance Tips

1. Use `scale: 2` for most use cases (good balance of quality and size)
2. Set `quality: 0.98` for professional reports
3. Avoid very large components that might cause memory issues
4. Consider breaking very long reports into multiple exports

## Future Enhancements

- [ ] PDF compression options
- [ ] Custom font embedding
- [ ] Interactive PDF elements
- [ ] Batch export functionality
- [ ] PDF preview before export
- [ ] Template customization system 