import JSZip from 'jszip';
import { SalesRecord } from '../types';
import { extractSalesDataFromMedia } from '../services/gemini';
import * as XLSX from 'xlsx';

export const processZipFile = async (
  zipFile: File,
  onProgress?: (filename: string) => void
): Promise<SalesRecord[]> => {
  const zip = new JSZip();
  const unzipped = await zip.loadAsync(zipFile);
  const allRecords: SalesRecord[] = [];

  for (const [filename, fileObj] of Object.entries(unzipped.files)) {
    // Skip directories and hidden system files (like __MACOSX)
    if (fileObj.dir || filename.startsWith('__MACOSX') || filename.startsWith('.')) {
      continue;
    }

    if (onProgress) onProgress(filename);

    const lowerName = filename.toLowerCase();

    // 1. Handle CSV inside ZIP
    if (lowerName.endsWith('.csv')) {
      const text = await fileObj.async('string');
      // Replace with your preferred CSV parser (e.g., PapaParse or basic splitter)
      const parsed = parseCSVText(text); 
      allRecords.push(...parsed);
    } 
    // 2. Handle Excel inside ZIP
    else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const buffer = await fileObj.async('arraybuffer');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<any>(firstSheet);
      
      const parsed = rawData.map((row: any, idx: number) => ({
        date: row.Date || row.date || new Date().toISOString().split('T')[0],
        invoiceNo: String(row['Invoice No'] || row.invoiceNo || `INV-${idx}`),
        customerName: String(row['Customer Name'] || row.customerName || 'Unknown'),
        distributor: String(row.Distributor || row.distributor || 'Direct'),
        product: String(row.Product || row.product || 'Standard Product'),
        quantity: Number(row.Quantity || row.quantity) || 1,
        revenue: Number(row.Revenue || row.revenue || row.Amount) || 0,
        discount: Number(row.Discount || row.discount) || 0,
        cost: Number(row.Cost || row.cost) || 0,
        creditDays: Number(row['Credit Days'] || row.creditDays) || 0,
        outstandingAmount: Number(row['Outstanding Amount'] || row.outstandingAmount) || 0,
        region: String(row.Region || row.region || 'Local'),
        salesRep: String(row['Sales Rep'] || row.salesRep || 'House Account')
      }));
      
      allRecords.push(...parsed);
    } 
    // 3. Handle PDF & Images inside ZIP via Gemini
    else if (lowerName.endsWith('.pdf') || lowerName.match(/\.(png|jpg|jpeg|webp)$/)) {
      const base64 = await fileObj.async('base64');
      const mimeType = lowerName.endsWith('.pdf') 
        ? 'application/pdf' 
        : `image/${lowerName.split('.').pop()}`;
      
      const extracted = await extractSalesDataFromMedia(base64, mimeType);
      allRecords.push(...extracted);
    }
  }

  return allRecords;
};

// Simple fallback helper for raw CSV string
const parseCSVText = (csvText: string): SalesRecord[] => {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines.slice(1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim());
    return {
      date: values[0] || new Date().toISOString().split('T')[0],
      invoiceNo: values[1] || `INV-${idx}`,
      customerName: values[2] || 'Customer',
      distributor: values[3] || 'Direct',
      product: values[4] || 'Product',
      quantity: Number(values[5]) || 1,
      revenue: Number(values[6]) || 0,
      discount: Number(values[7]) || 0,
      cost: Number(values[8]) || 0,
      creditDays: Number(values[9]) || 0,
      outstandingAmount: Number(values[10]) || 0,
      region: values[11] || 'Local',
      salesRep: values[12] || 'House Account'
    };
  });
};