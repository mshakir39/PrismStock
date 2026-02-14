import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const printHtmlAsPdf = async (element: HTMLElement) => {
  try {
    // Hide elements with print-hide class before generating PDF
    const elementsToHide = element.querySelectorAll('.print-hide');
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    const scaleFactor = 3; // Increase scale factor for higher quality
    const canvas = await html2canvas(element, {
      scale: scaleFactor,
      backgroundColor: '#ffffff', // Set background to white
    } as any);
    const imgData = canvas.toDataURL('image/jpeg', 1.0); // Use maximum quality

    const pdf = new jsPDF('p', 'mm', 'a4'); // Create a PDF in portrait mode, A4 size
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Define margins
    const margin = 10;
    const imgWidth = pdfWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pdfHeight - 2 * margin) {
      // If the image fits within the page height, add it directly
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      // If the image is taller than the page height, add it in parts
      let y = 0;
      while (y < canvas.height) {
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          margin - (y * imgWidth) / canvas.width,
          imgWidth,
          (canvas.height * imgWidth) / canvas.width
        );
        y += ((pdfHeight - 2 * margin) * canvas.width) / imgWidth;
        if (y < canvas.height) {
          pdf.addPage();
        }
      }
    }

    // Save the PDF
    pdf.save('invoice.pdf');

    // Restore elements after PDF generation
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Restore elements even if there's an error
    const elementsToHide = element.querySelectorAll('.print-hide');
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
  }
};

export default printHtmlAsPdf;
