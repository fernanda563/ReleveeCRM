import { CSVDiamondRow } from "@/types/internal-orders";

export const parseCSV = (file: File): Promise<CSVDiamondRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error("El archivo CSV debe contener al menos una fila de encabezados y una fila de datos");
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Verificar que existan las columnas requeridas
        const requiredColumns = [
          'stock', 'shape', 'cts', 'color', 'grade', 'cut', 
          'pol', 'sym', 'lab', 'measurements', 'report no', 'image link'
        ];
        
        const missingColumns = requiredColumns.filter(col => 
          !headers.some(h => h.includes(col.toLowerCase()))
        );
        
        if (missingColumns.length > 0) {
          throw new Error(`Faltan las siguientes columnas en el CSV: ${missingColumns.join(', ')}`);
        }
        
        // Mapear índices de columnas
        const columnIndexes = {
          stock: headers.findIndex(h => h.includes('stock')),
          shape: headers.findIndex(h => h.includes('shape')),
          carats: headers.findIndex(h => h.includes('cts')),
          color: headers.findIndex(h => h.includes('color') && !h.includes('image')),
          clarity: headers.findIndex(h => h.includes('grade') || h.includes('clarity')),
          cut: headers.findIndex(h => h.includes('cut')),
          polish: headers.findIndex(h => h.includes('pol')),
          symmetry: headers.findIndex(h => h.includes('sym')),
          lab: headers.findIndex(h => h.includes('lab')),
          measurements: headers.findIndex(h => h.includes('measurements')),
          report: headers.findIndex(h => h.includes('report')),
          image: headers.findIndex(h => h.includes('image link') || h.includes('image')),
        };
        
        const diamonds: CSVDiamondRow[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          diamonds.push({
            stock_number: values[columnIndexes.stock] || '',
            shape: values[columnIndexes.shape] || '',
            carats: values[columnIndexes.carats] || '',
            color: values[columnIndexes.color] || '',
            clarity: values[columnIndexes.clarity] || '',
            cut: values[columnIndexes.cut] || '',
            polish: values[columnIndexes.polish] || '',
            symmetry: values[columnIndexes.symmetry] || '',
            lab: values[columnIndexes.lab] || '',
            measurements: values[columnIndexes.measurements] || '',
            report_number: values[columnIndexes.report] || '',
            image_link: values[columnIndexes.image] || '',
          });
        }
        
        resolve(diamonds);
      } catch (error: any) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo CSV"));
    };
    
    reader.readAsText(file);
  });
};
