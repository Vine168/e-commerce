import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';

// Define types for our entities
type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  amountCents: number;
  currency: string;
  status: string;
  paidAt?: Date | null;
  createdAt: Date;
};

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

type OrderWithItems = Order & {
  orderItems: OrderItem[];
};

export interface TelegramMessage {
  text: string;
  attachment?: Buffer;
  filename?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot?: TelegramBot;
  private adminChatId?: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');

    if (token) {
      try {
        // Import dynamically to handle potential issues
        const TelegramBotConstructor = require('node-telegram-bot-api');
        this.bot = new TelegramBotConstructor(token, { polling: false });
        this.logger.log('Telegram bot initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Telegram bot', error);
      }
    } else {
      this.logger.warn('Telegram bot token not provided');
    }
  }

  /**
   * Send order notification to admin
   */
  async sendOrderNotification(
    order: Order & {
      orderItems: (OrderItem & {
        product: Product;
      })[];
    },
  ): Promise<void> {
    if (!this.bot || !this.adminChatId) {
      this.logger.warn('Telegram bot not configured, skipping notification');
      return;
    }

    try {
      const totalAmount = order.amountCents / 100;
      const itemsText = order.orderItems
        .map(
          (item) =>
            `• ${item.product.name} x${item.qty} - $${(item.priceCents * item.qty) / 100}`,
        )
        .join('\n');

      const message = `
🛍️ **New Order Received**

**Order ID:** ${order.id}
**Customer:** ${order.customerName}
**Phone:** ${order.phone}
**Address:** ${order.address}

**Items:**
${itemsText}

**Total Amount:** $${totalAmount.toFixed(2)}
**Status:** ${order.status}
**Order Date:** ${order.createdAt.toLocaleDateString()}

${order.paidAt ? `**Paid At:** ${order.paidAt.toLocaleDateString()}` : ''}
      `;

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`Order notification sent for order: ${order.id}`);
    } catch (error) {
      this.logger.error('Failed to send order notification', error);
    }
  }

  /**
   * Send receipt PDF to admin
   */
  async sendReceipt(order: Order, receiptPdf: Buffer): Promise<void> {
    if (!this.bot || !this.adminChatId) {
      this.logger.warn('Telegram bot not configured, skipping receipt');
      return;
    }

    try {
      await this.bot.sendDocument(
        this.adminChatId,
        receiptPdf,
        {
          caption: `📄 Receipt for Order ${order.id}`,
        },
        {
          filename: `receipt-${order.id}.pdf`,
          contentType: 'application/pdf',
        },
      );

      this.logger.log(`Receipt sent for order: ${order.id}`);
    } catch (error) {
      this.logger.error('Failed to send receipt', error);
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(order: Order): Promise<void> {
    if (!this.bot || !this.adminChatId) {
      return;
    }

    try {
      const message = `
💰 **Payment Received**

**Order ID:** ${order.id}
**Customer:** ${order.customerName}
**Amount:** $${(order.amountCents / 100).toFixed(2)}
**Paid At:** ${order.paidAt?.toLocaleDateString() || 'Just now'}

✅ Order has been successfully paid!
      `;

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`Payment confirmation sent for order: ${order.id}`);
    } catch (error) {
      this.logger.error('Failed to send payment confirmation', error);
    }
  }

  /**
   * Send receipt upload notification
   */
  async sendReceiptUploadNotification(order: any, file: any): Promise<void> {
    if (!this.bot || !this.adminChatId) {
      return;
    }

    try {
      const message = `
📸 **Payment Receipt Uploaded**

**Order ID:** ${order.id}
**Customer:** ${order.customerName}
**Amount:** $${(order.amountCents / 100).toFixed(2)}
**Receipt File:** ${file.filename}
**Uploaded At:** ${new Date().toLocaleString()}

⚠️ **Action Required:** Please verify the payment receipt and confirm the order.

*File saved at: ${file.path}*
      `;

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'Markdown',
      });

      // Try to send the actual receipt image if possible
      if (file.path) {
        try {
          await this.bot.sendPhoto(this.adminChatId, file.path, {
            caption: `Payment Receipt for Order #${order.id}`,
          });
        } catch (photoError) {
          this.logger.warn('Could not send receipt photo', photoError);
        }
      }

      this.logger.log(
        `Receipt upload notification sent for order: ${order.id}`,
      );
    } catch (error) {
      this.logger.error('Failed to send receipt upload notification', error);
    }
  }
}
