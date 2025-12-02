import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { quickPDFExport, PDFExportOptions } from '../utils/pdfExport';
import { toast } from '@/hooks/use-toast';

interface PDFExportButtonProps {
  component: React.ReactElement;
  filename: string;
  options?: PDFExportOptions;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  showLoading?: boolean;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  component,
  filename,
  options = {},
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  showLoading = true
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting || disabled) return;

    setIsExporting(true);
    
    try {
      await quickPDFExport(component, filename, options);
      
      toast({
        title: 'PDF Exported Successfully',
        description: `The PDF "${filename}" has been downloaded.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      
      toast({
        title: 'Export Failed',
        description: 'There was an error generating the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isExporting}
    >
      {isExporting && showLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {children || 'Export PDF'}
    </Button>
  );
};

export default PDFExportButton; 