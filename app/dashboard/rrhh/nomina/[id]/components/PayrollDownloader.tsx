"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generatePayrollReceiptPDF } from "@/lib/pdf-generator";

interface PayrollDownloaderProps {
  payrollDetail: any;
  payroll: any;
  companyName: string;
}

export function PayrollDownloader({ payrollDetail, payroll, companyName }: PayrollDownloaderProps) {
  const handleDownload = () => {
    generatePayrollReceiptPDF(payrollDetail, payroll, { name: companyName });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDownload}
      className="text-primary hover:text-primary hover:bg-primary/10 gap-2 h-8 text-xs font-semibold"
    >
      <Download className="h-3.5 w-3.5" />
      Desprendible PDF
    </Button>
  );
}
