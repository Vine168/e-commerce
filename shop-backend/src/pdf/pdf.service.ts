import { Injectable, Logger } from '@nestjs/common';
import PDFDocument = require('pdfkit');

// Define types for our entities
type Product = {
  id: string;
  name: string;
  priceCents: number;
};

type OrderItem = {
  id: string;
  qty: number;
  priceCents: number;
  product: Product;
};

type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  amountCents: number;
  status: string;
  paidAt?: Date | null;
  createdAt: Date;
  orderItems: OrderItem[];
};

export interface ReceiptData {
  order: Order;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Generate PDF receipt for an order
   */
  async generateReceipt(receiptData: ReceiptData): Promise<Buffer> {
    try {
      this.logger.log(
        `Generating PDF receipt for order: ${receiptData.order.id}`,
      );

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('Purchase Receipt', { align: 'center' });
        doc.moveDown();

        // Order Information
        doc.fontSize(12);
        doc.text(`Order ID: ${receiptData.order.id}`);
        doc.text(`Date: ${receiptData.order.createdAt.toLocaleDateString()}`);
        doc.text(`Customer: ${receiptData.order.customerName}`);
        doc.text(`Phone: ${receiptData.order.phone}`);
        doc.text(`Address: ${receiptData.order.address}`);
        doc.moveDown();

        // Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Items Header
        doc.fontSize(14).text('Items:', { underline: true });
        doc.moveDown(0.5);

        // Items Table
        let yPosition = doc.y;
        doc.fontSize(10);

        // Table headers
        doc.text('Product', 50, yPosition, { width: 200 });
        doc.text('Qty', 250, yPosition, { width: 50, align: 'center' });
        doc.text('Price', 300, yPosition, { width: 100, align: 'right' });
        doc.text('Total', 400, yPosition, { width: 100, align: 'right' });

        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        // Items
        receiptData.order.orderItems.forEach((item) => {
          const unitPrice = item.priceCents / 100;
          const totalPrice = (item.priceCents * item.qty) / 100;

          doc.text(item.product.name, 50, yPosition, { width: 200 });
          doc.text(item.qty.toString(), 250, yPosition, {
            width: 50,
            align: 'center',
          });
          doc.text(`$${unitPrice.toFixed(2)}`, 300, yPosition, {
            width: 100,
            align: 'right',
          });
          doc.text(`$${totalPrice.toFixed(2)}`, 400, yPosition, {
            width: 100,
            align: 'right',
          });

          yPosition += 20;
        });

        // Total line
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;

        // Total
        const totalAmount = receiptData.order.amountCents / 100;
        doc.fontSize(12);
        doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 400, yPosition, {
          width: 100,
          align: 'right',
        });

        yPosition += 30;

        // Payment Information
        doc.moveDown();
        doc.fontSize(10);
        doc.text(`Payment Status: ${receiptData.order.status}`);
        if (receiptData.order.paidAt) {
          doc.text(`Paid At: ${receiptData.order.paidAt.toLocaleDateString()}`);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8);
        doc.text('Thank you for your purchase!', { align: 'center' });
        doc.text('For any questions, please contact our support team.', {
          align: 'center',
        });

        doc.end();
      });
    } catch (error) {
      this.logger.error('Failed to generate PDF receipt', error);
      throw new Error('Failed to generate PDF receipt');
    }
  }
}
