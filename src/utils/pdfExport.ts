import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';

export interface PDFExportOptions {
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

export interface PDFPageData {
  content: React.ReactElement;
  pageBreak?: boolean;
  customHeight?: number;
}

export class PDFExporter {
  private pdf: jsPDF;
  private options: PDFExportOptions;
  private coverPageDoc?: any;

  constructor(options: PDFExportOptions = {}) {
    this.options = {
      filename: 'report.pdf',
      orientation: 'portrait',
      format: 'a4',
      scale: 2,
      quality: 0.98,
      includeCoverPage: false,
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      ...options
    };

    this.pdf = new jsPDF({
      orientation: this.options.orientation,
      unit: 'pt',
      format: this.options.format
    });
  }

  /**
   * Load cover page PDF if specified
   */
  async loadCoverPage(): Promise<void> {
    if (this.options.includeCoverPage && this.options.coverPageUrl) {
      try {
        const loadingTask = pdfjsLib.getDocument(this.options.coverPageUrl);
        this.coverPageDoc = await loadingTask.promise;
      } catch (error) {
        console.warn('Failed to load cover page:', error);
      }
    }
  }

  /**
   * Add cover page to PDF
   */
  async addCoverPage(): Promise<void> {
    if (this.coverPageDoc) {
      const page = await this.coverPageDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = this.pdf.internal.pageSize.getWidth();
      const pdfHeight = this.pdf.internal.pageSize.getHeight();
      
      this.pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
  }

  /**
   * Convert React component to canvas
   */
  private async componentToCanvas(component: React.ReactElement): Promise<HTMLCanvasElement> {
    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '900px';
    container.style.backgroundColor = '#fff';
    document.body.appendChild(container);

    // Render component
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);
    root.render(component);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: this.options.scale || 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true
    });

    // Cleanup
    root.unmount();
    document.body.removeChild(container);

    return canvas;
  }

  /**
   * Add page to PDF with proper scaling and pagination
   */
  async addPage(component: React.ReactElement, customHeight?: number): Promise<void> {
    const canvas = await this.componentToCanvas(component);
    const imgData = canvas.toDataURL('image/png');
    
    const pdfWidth = this.pdf.internal.pageSize.getWidth();
    const pdfHeight = this.pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = imgWidth / pdfWidth;
    const pageHeightPx = customHeight ? customHeight * ratio : pdfHeight * ratio;
    
    let remainingHeight = imgHeight;
    let position = 0;
    let isFirstPage = true;

    while (remainingHeight > 0) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(pageHeightPx, remainingHeight);
      
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          position,
          imgWidth,
          Math.min(pageHeightPx, remainingHeight),
          0,
          0,
          imgWidth,
          Math.min(pageHeightPx, remainingHeight)
        );
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        
        if (!isFirstPage) {
          this.pdf.addPage();
        }
        
        this.pdf.addImage(
          pageImgData, 
          'PNG', 
          0, 
          0, 
          pdfWidth, 
          (pageCanvas.height / ratio)
        );
      }
      
      position += pageHeightPx;
      remainingHeight -= pageHeightPx;
      isFirstPage = false;
    }
  }

  /**
   * Add watermark to PDF
   */
  addWatermark(text: string): void {
    const pages = this.pdf.getNumberOfPages();
    const fontSize = 12;
    const color = '#cccccc';
    
    for (let i = 1; i <= pages; i++) {
      this.pdf.setPage(i);
      this.pdf.setTextColor(color);
      this.pdf.setFontSize(fontSize);
      
      const pageWidth = this.pdf.internal.pageSize.getWidth();
      const pageHeight = this.pdf.internal.pageSize.getHeight();
      
      // Add diagonal watermark using text positioning instead of transform
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      this.pdf.text(text, centerX, centerY, { align: 'center', angle: -45 });
    }
  }

  /**
   * Add page numbers
   */
  addPageNumbers(): void {
    const pages = this.pdf.getNumberOfPages();
    const fontSize = 10;
    
    for (let i = 1; i <= pages; i++) {
      this.pdf.setPage(i);
      this.pdf.setTextColor('#666666');
      this.pdf.setFontSize(fontSize);
      
      const pageWidth = this.pdf.internal.pageSize.getWidth();
      const pageHeight = this.pdf.internal.pageSize.getHeight();
      
      this.pdf.text(
        `Page ${i} of ${pages}`,
        pageWidth - 60,
        pageHeight - 20
      );
    }
  }

  /**
   * Generate and download PDF
   */
  async generatePDF(pages: PDFPageData[]): Promise<void> {
    try {
      // Load cover page if specified
      await this.loadCoverPage();
      
      // Add cover page if available
      if (this.options.includeCoverPage && this.coverPageDoc) {
        await this.addCoverPage();
      }
      
      // Add content pages
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        if (page.pageBreak && i > 0) {
          this.pdf.addPage();
        }
        
        await this.addPage(page.content, page.customHeight);
      }
      
      // Add watermark if specified
      if (this.options.watermark) {
        this.addWatermark(this.options.watermark);
      }
      
      // Add page numbers
      this.addPageNumbers();
      
      // Save PDF
      this.pdf.save(this.options.filename || 'report.pdf');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from single component
   */
  async generateSinglePagePDF(component: React.ReactElement, filename?: string): Promise<void> {
    const pages: PDFPageData[] = [{ content: component }];
    const options = { ...this.options, filename: filename || this.options.filename };
    const exporter = new PDFExporter(options);
    await exporter.generatePDF(pages);
  }
}

/**
 * Utility function to sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_ ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);
}

/**
 * Generate PDF with enhanced options
 */
export async function generateEnhancedPDF(
  pages: PDFPageData[],
  options: PDFExportOptions = {}
): Promise<void> {
  const exporter = new PDFExporter(options);
  await exporter.generatePDF(pages);
}

/**
 * Quick PDF generation for single component
 */
export async function quickPDFExport(
  component: React.ReactElement,
  filename: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const exporter = new PDFExporter({
    filename: sanitizeFilename(filename),
    ...options
  });
  await exporter.generateSinglePagePDF(component, sanitizeFilename(filename));
} 