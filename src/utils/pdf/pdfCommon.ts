
import { jsPDF } from 'jspdf';

// BCA Brand Colors (RGB values for jsPDF)
export const BCA_COLORS = {
  blue: [0, 102, 179] as [number, number, number],      // #0066B3 - Main BCA Blue
  darkBlue: [0, 51, 102] as [number, number, number],   // #003366 - Dark Blue
  lightBlue: [230, 240, 247] as [number, number, number], // #E6F0F7 - Light Blue background
  black: [26, 26, 26] as [number, number, number],      // #1A1A1A - Text
  gray: [128, 128, 128] as [number, number, number],    // #808080 - Gray
  lightGray: [245, 245, 245] as [number, number, number], // #F5F5F5 - Light gray
  white: [255, 255, 255] as [number, number, number],   // #FFFFFF
  green: [40, 167, 69] as [number, number, number],     // #28a745 - Success
  orange: [253, 126, 20] as [number, number, number],   // #fd7e14 - Warning
};

// Helper function to add BCA logo to the PDF header
export const addBCALogo = (doc: jsPDF, x: number = 15, y: number = 10, width: number = 25): void => {
  try {
    // Try to add the logo image - this will work if the image is available
    // We'll use a base64 encoded version or skip if not available
    const logoPath = '/bca-icon.png';
    // Since jsPDF can't directly load from path, we'll draw a placeholder text
    doc.setFillColor(...BCA_COLORS.blue);
    doc.roundedRect(x, y, width, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BCA", x + width/2, y + 8, { align: 'center' });
    // Reset text color
    doc.setTextColor(0, 0, 0);
  } catch (e) {
    // If logo fails, just continue without it
  }
};

// Helper function to draw section header with colored background
export const drawSectionHeader = (doc: jsPDF, text: string, y: number, fullWidth: boolean = true): number => {
  const pageWidth = doc.internal.pageSize.width;
  const headerHeight = 8;
  const padding = 3;
  
  // Draw background rectangle
  doc.setFillColor(...BCA_COLORS.lightBlue);
  doc.setDrawColor(...BCA_COLORS.blue);
  doc.setLineWidth(0.3);
  
  if (fullWidth) {
    doc.roundedRect(15, y - 5, pageWidth - 30, headerHeight, 1, 1, 'FD');
  } else {
    const textWidth = doc.getTextWidth(text) + 10;
    doc.roundedRect(15, y - 5, textWidth, headerHeight, 1, 1, 'FD');
  }
  
  // Draw text
  doc.setTextColor(...BCA_COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(text, 18, y);
  
  // Reset
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  return y + headerHeight + 2;
};

// Helper function to draw a subsection title
export const drawSubsectionTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setTextColor(...BCA_COLORS.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(text, 15, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  return y + 6;
};

// Helper function to center text on page
export const centerText = (doc: jsPDF, text: string, y: number) => {
  const pageWidth = doc.internal.pageSize.width;
  const textWidth = doc.getTextWidth(text);
  const x = (pageWidth - textWidth) / 2;
  doc.text(text, x, y);
};

// Helper function to ensure we only pass boolean values to drawCheckbox
export const ensureBoolean = (value: boolean | string): boolean => {
  if (typeof value === 'string') {
    return value === 'true' || value === 'indeterminate';
  }
  return Boolean(value);
};

// Helper function to draw an improved checkbox
export const drawCheckbox = (doc: jsPDF, x: number, y: number, checked: boolean | string) => {
  const isChecked = ensureBoolean(checked);
  const size = 3.5;
  
  // Set styling
  doc.setDrawColor(...BCA_COLORS.darkBlue);
  doc.setLineWidth(0.2);
  
  if (isChecked) {
    // Filled checkbox with checkmark
    doc.setFillColor(...BCA_COLORS.blue);
    doc.roundedRect(x, y, size, size, 0.5, 0.5, 'FD');
    
    // Draw checkmark in white
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(x + 0.7, y + size/2, x + size/2 - 0.2, y + size - 0.7);
    doc.line(x + size/2 - 0.2, y + size - 0.7, x + size - 0.5, y + 0.7);
    
    // Reset
    doc.setDrawColor(0, 0, 0);
  } else {
    // Empty checkbox
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, size, size, 0.5, 0.5, 'FD');
  }
  
  doc.setLineWidth(0.1);
};

// Helper function to draw a separator line
export const drawSeparator = (doc: jsPDF, y: number): number => {
  const pageWidth = doc.internal.pageSize.width;
  doc.setDrawColor(...BCA_COLORS.lightBlue);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  return y + 3;
};

// Helper function to check page space and add a new page if needed
export const checkPageSpace = (doc: jsPDF, y: number, requiredSpace: number): number => {
  const pageHeight = doc.internal.pageSize.height;
  if (y + requiredSpace > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return y;
};

// Helper function to draw a rectangle around observations
export const drawObservationsBox = (doc: jsPDF, startY: number, text: string): number => {
  const pageWidth = doc.internal.pageSize.width;
  const padding = 5;
  const lineHeight = 5;
  
  // Draw label with color
  doc.setTextColor(...BCA_COLORS.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Observações:", 15, startY);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  startY += 6;
  
  // Calculate the height needed for the observations text
  const splitText = doc.splitTextToSize(text || "", pageWidth - 30 - (padding * 2));
  const textHeight = splitText.length * lineHeight;
  
  // Draw rectangle with padding and subtle style
  const boxHeight = Math.max(20, textHeight + padding * 2);
  doc.setDrawColor(...BCA_COLORS.blue);
  doc.setFillColor(...BCA_COLORS.lightGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(15 - padding, startY - padding, pageWidth - 30, boxHeight, 2, 2, 'FD');
  
  // If there is text, add it inside the rectangle
  if (text) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(splitText, 15, startY + padding);
    return startY + textHeight + (padding * 2);
  }
  
  return startY + boxHeight;
};

// Helper function to add page footer with page number
export const addPageFooter = (doc: jsPDF, pageNumber: number): void => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(8);
  doc.setTextColor(...BCA_COLORS.gray);
  doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.setTextColor(0, 0, 0);
};

// Helper function to highlight important text
export const drawHighlightedTask = (doc: jsPDF, x: number, y: number, text: string, checked: boolean): void => {
  // Draw checkbox
  drawCheckbox(doc, x, y - 3, checked);
  
  // Draw text with highlight background if checked
  if (checked) {
    const textWidth = doc.getTextWidth(text);
    doc.setFillColor(...BCA_COLORS.lightBlue);
    doc.rect(x + 5, y - 3.5, textWidth + 2, 5, 'F');
  }
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(text, x + 5, y);
};
