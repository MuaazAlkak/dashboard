import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Product } from '@/lib/supabase';
import { toast } from 'sonner';

interface ExportButtonProps {
  products: Product[];
}

export function ExportButton({ products }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'ID',
        'Slug',
        'Title (EN)',
        'Title (AR)',
        'Title (SV)',
        'Price',
        'Currency',
        'Stock',
        'Category',
        'Discount %',
        'Discount Active',
        'Created At',
      ];

      const rows = products.map((product) => [
        product.id,
        product.slug,
        product.title.en,
        product.title.ar,
        product.title.sv,
        product.price,
        product.currency,
        product.stock,
        product.category,
        product.discount_percentage || 0,
        product.discount_active ? 'Yes' : 'No',
        new Date(product.created_at).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Products exported successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to export products: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const jsonContent = JSON.stringify(products, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Products exported successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to export products: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

