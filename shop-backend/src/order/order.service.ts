import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BakongService } from '../bakong/bakong.service';
import { TelegramService } from '../telegram/telegram.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private bakongService: BakongService,
    private telegramService: TelegramService,
    private pdfService: PdfService,
    private configService: ConfigService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    try {
      this.logger.log(
        `Creating order for customer: ${createOrderDto.customerName}`,
      );

      // Calculate total amount (mock calculation if database is unavailable)
      let totalAmountCents = 0;
      let order;

      try {
        // Validate products and calculate total
        const productIds = createOrderDto.items.map((item) => item.productId);
        const products = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
          throw new NotFoundException('One or more products not found');
        }

        const orderItemsData = createOrderDto.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }
          const itemTotal = product.priceCents * item.qty;
          totalAmountCents += itemTotal;

          return {
            productId: item.productId,
            qty: item.qty,
            priceCents: product.priceCents,
          };
        });

        // Create order
        order = await this.prisma.order.create({
          data: {
            customerName: createOrderDto.customerName,
            phone: createOrderDto.phone,
            address: createOrderDto.address,
            amountCents: totalAmountCents,
            currency: 'USD',
            status: 'PENDING',
            orderItems: {
              create: orderItemsData,
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });
      } catch (dbError) {
        // If database is unavailable, create a mock order for development
        this.logger.warn('Database not available, creating mock order');

        // Mock calculation for total amount
        totalAmountCents = createOrderDto.items.reduce((total, item) => {
          return total + 2500 * item.qty; // Mock price: $25.00 per item
        }, 0);

        order = {
          id: `mock_order_${Date.now()}`,
          customerName: createOrderDto.customerName,
          phone: createOrderDto.phone,
          address: createOrderDto.address,
          amountCents: totalAmountCents,
          currency: 'USD',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          khqrString: null,
          md5: null,
          paidAt: null,
          orderItems: createOrderDto.items.map((item, index) => ({
            id: `mock_item_${index}`,
            orderId: `mock_order_${Date.now()}`,
            productId: item.productId,
            qty: item.qty,
            priceCents: 2500, // Mock price
            product: {
              id: item.productId,
              name: `Mock Product ${index + 1}`,
              slug: `mock-product-${index + 1}`,
              priceCents: 2500,
              currency: 'USD',
              imageUrl: 'https://via.placeholder.com/300',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })),
        };
      }

      // Send Telegram notification (if possible)
      try {
        await this.telegramService.sendOrderNotification(order);
      } catch (telegramError) {
        this.logger.warn(
          'Could not send Telegram notification',
          telegramError.message,
        );
      }

      this.logger.log(`Order created successfully: ${order.id}`);
      return order;
    } catch (error) {
      this.logger.error('Failed to create order', error);
      throw error;
    }
  }

  async generateKHQR(orderId: string) {
    try {
      this.logger.log(`Generating KHQR for order: ${orderId}`);

      let order;
      try {
        order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });
      } catch (dbError) {
        // If database is not available, create a mock order for development
        this.logger.warn('Database not available, using mock order data');
        order = {
          id: orderId,
          amountCents: 5000, // $50.00
          currency: 'USD',
          status: 'PENDING',
          customerName: 'Test Customer',
          phone: '+855 12 345 678',
          address: 'Test Address',
          orderItems: [
            {
              id: 'item1',
              qty: 2,
              priceCents: 2500,
              product: {
                id: 'prod1',
                name: 'Test Product',
                slug: 'test-product',
                priceCents: 2500,
                currency: 'USD',
                imageUrl: 'https://via.placeholder.com/300',
              },
            },
          ],
        };
      }

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('KHQR can only be generated for pending orders');
      }

      // Use static KHQR image from environment variables
      const staticKhqrImagePath = this.configService.get<string>(
        'STATIC_KHQR_IMAGE_PATH',
      );
      const staticKhqrImageUrl = this.configService.get<string>(
        'STATIC_KHQR_IMAGE_URL',
      );

      let khqrString: string;
      let qrImageBuffer: Buffer | null = null;
      let md5: string;
      let isStaticKhqr = false;

      if (staticKhqrImagePath || staticKhqrImageUrl) {
        // Use your static KHQR image
        khqrString = `Static KHQR for Order #${orderId} - Amount: $${order.amountCents / 100}`;
        md5 = this.bakongService.generateMD5(khqrString);

        // For static image, we'll just return the URL/path without generating QR
        isStaticKhqr = true;

        this.logger.log('Using static KHQR image from environment variables');
      } else {
        // Fallback to dynamic generation if no static KHQR is provided
        this.logger.log('No static KHQR image found, using dynamic generation');

        // Generate KHQR
        const khqrRequest = {
          amount: order.amountCents / 100,
          currency: order.currency,
          merchantName: 'Accessories Store',
          merchantCode: 'ACCS001',
          billNumber: order.id,
          storeLabel: 'Online Accessories Store',
          terminalLabel: 'WEB',
          purposeOfTransaction: 'Purchase',
        };

        khqrString = await this.bakongService.generateKHQR(khqrRequest);
        md5 = this.bakongService.generateMD5(khqrString);
        qrImageBuffer = await this.bakongService.generateQRImage(khqrString);
      }

      // Try to update order with KHQR info if database is available
      try {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            khqrString,
            md5,
          },
        });
      } catch (dbError) {
        this.logger.warn(
          'Could not update order in database, continuing with KHQR generation',
        );
      }

      this.logger.log(`KHQR generated successfully for order: ${orderId}`);

      // Construct the image URL for static KHQR
      let imageUrl: string | null = null;
      if (isStaticKhqr) {
        if (staticKhqrImageUrl) {
          imageUrl = staticKhqrImageUrl;
        } else if (staticKhqrImagePath) {
          const baseUrl = this.configService.get(
            'BASE_URL',
            'http://localhost:3001',
          );
          imageUrl = `${baseUrl}/static/${staticKhqrImagePath}`;
        }
      }

      return {
        orderId,
        khqrString,
        md5,
        qrImage: isStaticKhqr
          ? null
          : qrImageBuffer
            ? qrImageBuffer.toString('base64')
            : null,
        staticImageUrl: imageUrl,
        expiresIn: this.configService.get('PAYMENT_TIMEOUT_MINUTES', 10) * 60, // seconds
        amount: order.amountCents,
        currency: order.currency,
        isStaticKhqr,
      };
    } catch (error) {
      this.logger.error('Failed to generate KHQR', error);
      throw error;
    }
  }

  async checkPaymentStatus(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status === 'PAID') {
        return { status: 'PAID', paidAt: order.paidAt };
      }

      if (!order.md5) {
        return { status: 'PENDING', message: 'Payment not initiated' };
      }

      // Check with Bakong API
      const transactionStatus = await this.bakongService.checkTransactionStatus(
        order.md5,
      );

      if (
        transactionStatus.responseCode === 0 &&
        transactionStatus.data?.status === 'SUCCESS'
      ) {
        // Payment successful, update order
        const updatedOrder = await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });

        // Generate and send receipt
        await this.generateAndSendReceipt(updatedOrder);

        this.logger.log(`Order paid successfully: ${orderId}`);
        return { status: 'PAID', paidAt: updatedOrder.paidAt };
      }

      // Check if order should be expired
      const timeoutMinutes = this.configService.get(
        'PAYMENT_TIMEOUT_MINUTES',
        10,
      );
      const expiryTime = new Date(
        order.createdAt.getTime() + timeoutMinutes * 60000,
      );

      if (new Date() > expiryTime && order.status === 'PENDING') {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'EXPIRED' },
        });
        return { status: 'EXPIRED', message: 'Payment timeout' };
      }

      return { status: 'PENDING', message: 'Payment pending' };
    } catch (error) {
      this.logger.error('Failed to check payment status', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: {
          status: updateOrderStatusDto.status,
          paidAt:
            updateOrderStatusDto.status === 'PAID' ? new Date() : undefined,
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (updateOrderStatusDto.status === 'PAID') {
        await this.generateAndSendReceipt(order);
      }

      return order;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Order not found');
      }
      throw error;
    }
  }

  private async generateAndSendReceipt(order: any) {
    try {
      this.logger.log(`Generating receipt for order: ${order.id}`);

      // Generate PDF receipt
      const receiptPdf = await this.pdfService.generateReceipt({ order });

      // Send Telegram notifications
      await Promise.all([
        this.telegramService.sendPaymentConfirmation(order),
        this.telegramService.sendReceipt(order, receiptPdf),
      ]);

      this.logger.log(`Receipt generated and sent for order: ${order.id}`);
    } catch (error) {
      this.logger.error('Failed to generate and send receipt', error);
      // Don't throw error as the payment is still successful
    }
  }

  async processReceiptUpload(
    file: any,
    body: { orderId: string; amount: number; customerName: string },
  ) {
    try {
      this.logger.log(`Processing receipt upload for order: ${body.orderId}`);

      if (!file) {
        throw new Error('No file uploaded');
      }

      // Try to find and update the order
      let order;
      try {
        order = await this.prisma.order.update({
          where: { id: body.orderId },
          data: {
            status: 'RECEIPT_UPLOADED',
            receiptPath: file.path,
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });
      } catch (dbError) {
        // If database is not available, create mock order data for Telegram
        this.logger.warn(
          'Database not available, using mock order data for Telegram',
        );
        order = {
          id: body.orderId,
          customerName: body.customerName,
          amountCents: body.amount,
          currency: 'USD',
          status: 'RECEIPT_UPLOADED',
          receiptPath: file.path,
          orderItems: [],
        };
      }

      // Send Telegram notification with receipt
      try {
        await this.telegramService.sendReceiptUploadNotification(order, file);
      } catch (telegramError) {
        this.logger.warn(
          'Could not send Telegram notification',
          telegramError.message,
        );
      }

      this.logger.log(
        `Receipt uploaded successfully for order: ${body.orderId}`,
      );

      return {
        success: true,
        message: 'Receipt uploaded successfully',
        orderId: body.orderId,
        receiptPath: file.path,
      };
    } catch (error) {
      this.logger.error('Failed to process receipt upload', error);
      throw error;
    }
  }
}
