import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface SoilUploadProps {
  onFileUpload: (file: File) => void;
  resetKey?: number;
  isLoading?: boolean;
}

const SoilUpload: React.FC<SoilUploadProps> = ({ onFileUpload, resetKey, isLoading = false }) => {
  // Removed debug logging that was causing infinite loop
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    setUploadedFile(null);
  }, [resetKey]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    onFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="w-full max-w-screen-xl mx-auto bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black text-2xl">
          <Upload className="h-6 w-6" />
          PDF Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive && !isLoading ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } ${isLoading ? 'border-green-500 bg-green-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-green-600">
              <Loader2 className="h-16 w-16 animate-spin" />
              <div>
                <p className="font-medium text-lg">Processing PDF...</p>
                <p className="text-base text-gray-500">
                  Please wait while we analyze your therapy charts
                </p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="flex items-center justify-center gap-2 text-black">
              <FileText className="h-10 w-10" />
              <div>
                <p className="font-medium text-lg">{uploadedFile.name}</p>
                <p className="text-base text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-16 w-16 mx-auto text-gray-400 mb-6" />
              <p className="text-center text-gray-600 text-lg">
                Drop your therapy charts PDF here
              </p>
              <p className="text-lg text-gray-500 mb-6">
                (Export from NTS admin platform first)
              </p>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <Button asChild size="lg" disabled={isLoading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SoilUpload;