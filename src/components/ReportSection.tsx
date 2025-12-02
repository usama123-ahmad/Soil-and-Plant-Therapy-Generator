import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface ReportSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  useHideButton?: boolean;
  infoContent?: React.ReactNode;
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, children, className = '', collapsible = false, expanded = true, onToggle, useHideButton = false, infoContent }) => {
  // Info icon and modal removed as per user request
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {collapsible && (
            useHideButton ? (
              <button
                type="button"
                onClick={onToggle}
                className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200"
                aria-label={expanded ? 'Hide section' : 'Show section'}
              >
                {expanded ? 'Hide' : 'Show'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="ml-2 text-gray-500 hover:text-black focus:outline-none"
                aria-label={expanded ? 'Collapse section' : 'Expand section'}
              >
                <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  ▶
                </span>
              </button>
            )
          )}
        </div>
      </CardHeader>
      {(!collapsible || expanded) && <CardContent>{children}</CardContent>}
    </Card>
  );
};

export default ReportSection;