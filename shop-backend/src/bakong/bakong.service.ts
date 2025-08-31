import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import axios from 'axios';

export interface BakongKHQRRequest {
  amount: number;
  currency: string;
  merchantName: string;
  merchantCode: string;
  billNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
  purposeOfTransaction?: string;
  languagePreference?: string;
  merchantCategoryCode?: string;
  countryCode?: string;
  merchantCity?: string;
  postalCode?: string;
  additionalDataFieldTemplate?: {
    billNumber?: string;
    mobileNumber?: string;
    storeLabel?: string;
    loyaltyNumber?: string;
    referenceLabel?: string;
    customerLabel?: string;
    terminalLabel?: string;
    purposeOfTransaction?: string;
    additionalConsumerDataRequest?: string;
  };
}

export interface BakongTransactionStatus {
  responseCode: number;
  responseDescription: string;
  data?: {
    transactionId: string;
    status: string;
    amount: number;
    currency: string;
    timestamp: string;
  };
}

@Injectable()
export class BakongService {
  private readonly logger = new Logger(BakongService.name);
  private readonly bakongBaseUrl: string;
  private readonly bakongToken: string;

  constructor(private configService: ConfigService) {
    this.bakongBaseUrl =
      this.configService.get<string>('BAKONG_BASE_URL') ||
      'https://api-bakong.nbc.gov.kh';
    this.bakongToken = this.configService.get<string>('BAKONG_TOKEN') || '';
  }

  /**
   * Generate KHQR string for payment
   */
  async generateKHQR(request: BakongKHQRRequest): Promise<string> {
    try {
      this.logger.log(`Generating KHQR for amount: ${request.amount}`);

      // Mock KHQR generation for now - replace with actual bakong-khqr SDK
      // In production, use: import { generateKHQR } from 'bakong-khqr';
      const khqrString = this.mockGenerateKHQR(request);

      this.logger.log('KHQR generated successfully');
      return khqrString;
    } catch (error) {
      this.logger.error('Failed to generate KHQR', error);
      throw new Error('Failed to generate KHQR');
    }
  }

  /**
   * Generate MD5 hash from KHQR string
   */
  generateMD5(khqrString: string): string {
    return crypto.createHash('md5').update(khqrString).digest('hex');
  }

  /**
   * Generate QR code image from KHQR string
   */
  async generateQRImage(khqrString: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(khqrString, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeBuffer;
    } catch (error) {
      this.logger.error('Failed to generate QR image', error);
      throw new Error('Failed to generate QR image');
    }
  }

  /**
   * Check transaction status by MD5
   */
  async checkTransactionStatus(md5: string): Promise<BakongTransactionStatus> {
    try {
      this.logger.log(`Checking transaction status for MD5: ${md5}`);

      const response = await axios.get(
        `${this.bakongBaseUrl}/v1/check_transaction_by_md5`,
        {
          headers: {
            Authorization: `Bearer ${this.bakongToken}`,
            'Content-Type': 'application/json',
          },
          params: { md5 },
          timeout: 10000,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to check transaction status', error);

      // Mock response for development
      return this.mockTransactionStatus(md5);
    }
  }

  /**
   * Mock KHQR generation for development
   * Replace this with actual bakong-khqr SDK implementation
   */
  private mockGenerateKHQR(request: BakongKHQRRequest): string {
    // This is a mock implementation
    // In production, use the actual bakong-khqr SDK
    const mockKHQR = `00020101021230${request.amount.toString().padStart(13, '0')}5204${request.merchantCategoryCode || '5999'}5303${request.currency}5802KH5920${request.merchantName}6008${request.merchantCode || 'MERCHANT'}62070503***6304`;
    return mockKHQR;
  }

  /**
   * Mock transaction status for development
   */
  private mockTransactionStatus(md5: string): BakongTransactionStatus {
    // For development, randomly return success/pending
    const isSuccess = Math.random() > 0.7;

    if (isSuccess) {
      return {
        responseCode: 0,
        responseDescription: 'Success',
        data: {
          transactionId: `TXN${Date.now()}`,
          status: 'SUCCESS',
          amount: 1000, // cents
          currency: 'USD',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      responseCode: 1,
      responseDescription: 'Transaction not found or pending',
    };
  }
}
