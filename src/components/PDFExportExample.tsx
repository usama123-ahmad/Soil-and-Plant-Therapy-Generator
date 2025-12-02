import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PDFExportButton from './PDFExportButton';
import ClientReportExport from './ClientReportExport';
import { PDFExportOptions } from '../utils/pdfExport';

// Example data for demonstration
const exampleData = {
  client: 'Sample Farm',
  crop: 'Wheat',
  date: '2025-01-15',
  summary: `<b>Plant Nutrition Analysis Report</b><br><br>This comprehensive analysis reveals optimal levels of <b>Nitrogen (N), Phosphorus (P), and Potassium (K)</b> in your wheat crop. The soil analysis indicates excellent nutrient availability with balanced ratios. We recommend maintaining current fertilization practices while monitoring for any seasonal variations. The crop shows strong vegetative growth with good potential for yield optimization.`,
  fertigationProducts: [
    { name: 'Nutri-Life BAM™', rate: '2', unit: 'L/Ha' },
    { name: 'Cal-Tech™', rate: '1.5', unit: 'L/Ha' },
  ],
  preFloweringFoliarProducts: [
    { name: 'Photo-Finish™', rate: '1', unit: 'L/Ha' },
  ],
  nutritionalFoliarProducts: [
    { name: 'Nutri-Key Boron Shuttle™', rate: '0.5', unit: 'L/Ha' },
    { name: 'Nutri-Key Zinc Shuttle™', rate: '0.5', unit: 'L/Ha' },
  ],
  tankMixing: [
    { sequence: 1, description: 'Least soluble solids', products: 'Nutri-Life BAM™, Cal-Tech™', notes: 'Mix thoroughly for 5 minutes before adding other products.' },
    { sequence: 2, description: 'Liquid solutions', products: 'Photo-Finish™', notes: 'Add slowly with continuous agitation.' },
    { sequence: 3, description: 'Micronutrients', products: 'Nutri-Key Boron Shuttle™, Nutri-Key Zinc Shuttle™', notes: 'Add last and maintain agitation.' },
  ],
  agronomist: {
    name: 'Dr. Sarah Johnson',
    role: 'Senior Agronomist',
    email: 'sarah.johnson@nutri-tech.com.au'
  },
  reportFooterText: 'This report is generated using advanced plant nutrition analysis techniques. All recommendations are based on current best practices in sustainable agriculture. For questions or additional support, please contact your agronomist.',
  plantHealthScore: 92
};

const PDFExportExample: React.FC = () => {
  // Different export configurations
  const basicOptions: PDFExportOptions = {
    filename: 'Basic_Report.pdf',
    orientation: 'portrait',
    format: 'a4',
    scale: 2
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          PDF Export Examples
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore different PDF export configurations and see how the enhanced export functionality works.
          Each example demonstrates different features and quality settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Export */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Basic</Badge>
              Basic Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Simple PDF export with standard quality and formatting.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Standard A4 format</li>
              <li>• 2x scale for good quality</li>
              <li>• No cover page</li>
              <li>• No watermark</li>
            </ul>
            <PDFExportButton
              component={<ClientReportExport {...exampleData} isSoilReport={false} />}
              filename="Basic_Report.pdf"
              options={basicOptions}
              variant="outline"
              size="sm"
            >
              Export Basic PDF
            </PDFExportButton>
          </CardContent>
        </Card>

        {/* Professional Export */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Professional</Badge>
              Professional Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Professional PDF with cover page, watermark, and enhanced formatting.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Cover page included</li>
              <li>• NTS G.R.O.W watermark</li>
              <li>• High quality settings</li>
              <li>• Professional margins</li>
            </ul>
            <PDFExportButton
              component={<ClientReportExport {...exampleData} isSoilReport={false} />}
              filename="Professional_Report.pdf"
              options={professionalOptions}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Export Professional PDF
            </PDFExportButton>
          </CardContent>
        </Card>

        {/* High Quality Export */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">Premium</Badge>
              High Quality Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Premium quality PDF with maximum resolution and professional features.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 3x scale for maximum quality</li>
              <li>• Premium watermark</li>
              <li>• Enhanced margins</li>
              <li>• 99% quality setting</li>
            </ul>
            <PDFExportButton
              component={<ClientReportExport {...exampleData} isSoilReport={false} />}
              filename="High_Quality_Report.pdf"
              options={highQualityOptions}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Export Premium PDF
            </PDFExportButton>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>PDF Export Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Core Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  High-quality HTML to PDF conversion
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Automatic page breaks and pagination
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Cover page support with PDF attachments
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Customizable watermarks and branding
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Page numbering and professional formatting
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Advanced Options</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Configurable quality and scale settings
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Custom margins and page orientation
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Multiple page support with custom heights
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Error handling and user feedback
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  Loading states and progress indicators
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Import the Component</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import PDFExportButton from './components/PDFExportButton';
import { PDFExportOptions } from './utils/pdfExport';`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. Configure Export Options</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const options: PDFExportOptions = {
  filename: 'My_Report.pdf',
  includeCoverPage: true,
  coverPageUrl: '/attachments/cover.pdf',
  watermark: 'Company Name',
  scale: 2,
  quality: 0.98
};`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">3. Use the Export Button</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<PDFExportButton
  component={<MyReportComponent data={data} />}
  filename="My_Report.pdf"
  options={options}
  variant="default"
>
  Export PDF
</PDFExportButton>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFExportExample; 