import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';
import { generateHTMLInvoice } from '@/lib/invoice-generator';
import { showToast } from '@/hooks/use-toast';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: any;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, receiptData }) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = async () => {
    try {
      const htmlContent = generateHTMLInvoice(receiptData.invoiceData || receiptData);
      
      // استخدام نافذة Electron منفصلة للطباعة دائماً
      const response = await window.electronAPI.printer.createPrintWindow(htmlContent);
      
      if (response.success) {
        // النافذة ستفتح تلقائياً بحجم عادي وثابت
        console.log('Print window created successfully');
        showToast.success('طباعة', 'تم فتح نافذة الطباعة');
      } else {
        console.error('Failed to create print window:', response.error);
        showToast.error('خطأ', 'فشل في فتح نافذة الطباعة');
      }
    } catch (error) {
      console.error('Error creating print window:', error);
      showToast.error('خطأ', 'حدث خطأ في فتح نافذة الطباعة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 space-x-reverse">
            <img 
              src="/cafe-icon.svg" 
              alt="Cafe Logo" 
              className="w-8 h-8"
            />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              فاتورة الطلب
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Receipt Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-900 dark:text-white text-right leading-relaxed">
              {receiptData.receipt}
            </pre>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            إغلاق
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 bg-cafe-500 hover:bg-cafe-600"
          >
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
