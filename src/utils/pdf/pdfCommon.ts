
import { jsPDF } from 'jspdf';

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

// Helper function to draw a checkbox
export const drawCheckbox = (doc: jsPDF, x: number, y: number, checked: boolean | string) => {
  const isChecked = ensureBoolean(checked);
  // Always use black for checkbox color
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  
  // Draw checkbox rectangle
  doc.rect(x, y, 3, 3);
  
  // Draw X mark if checked
  if (isChecked) {
    doc.line(x, y, x + 3, y + 3);
    doc.line(x + 3, y, x, y + 3);
  }
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
  
  doc.setFont("helvetica", "bold");
  doc.text("Observações:", 15, startY);
  startY += 6;
  
  // Calculate the height needed for the observations text
  const splitText = doc.splitTextToSize(text || "", pageWidth - 30 - (padding * 2));
  const textHeight = splitText.length * lineHeight;
  
  // Draw rectangle with padding
  const boxHeight = Math.max(20, textHeight + padding * 2); // Minimum 20px height
  doc.setDrawColor(0, 0, 0); // Always black
  doc.setLineWidth(0.5);
  doc.rect(15 - padding, startY - padding, pageWidth - 30, boxHeight);
  
  // If there is text, add it inside the rectangle
  if (text) {
    doc.setFont("helvetica", "normal");
    doc.text(splitText, 15, startY + padding);
    return startY + textHeight + (padding * 2);
  }
  
  return startY + boxHeight;
};
