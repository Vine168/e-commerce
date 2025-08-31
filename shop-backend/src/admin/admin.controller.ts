import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { OrderService } from '../order/order.service';

// Simple admin controller - in production, add proper authentication
@Controller('admin')
export class AdminController {
  constructor(
    private readonly productService: ProductService,
    private readonly orderService: OrderService,
  ) {}

  @Get('products')
  async getProductsData() {
    try {
      const products = await this.productService.findAll();
      return {
        products,
        success: true,
      };
    } catch (error) {
      return {
        products: [],
        success: false,
        error: error.message,
      };
    }
  }

  @Get('orders')
  async getOrdersData() {
    try {
      const orders = await this.orderService.findAll();
      return {
        orders,
        success: true,
      };
    } catch (error) {
      return {
        orders: [],
        success: false,
        error: error.message,
      };
    }
  }

  @Get('dashboard')
  async getDashboardData() {
    try {
      const [products, orders] = await Promise.all([
        this.productService.findAll(),
        this.orderService.findAll(),
      ]);

      const stats = {
        totalProducts: products.length,
        totalOrders: orders.length,
        paidOrders: orders.filter((order) => order.status === 'PAID').length,
        pendingOrders: orders.filter((order) => order.status === 'PENDING')
          .length,
        totalRevenue:
          orders
            .filter((order) => order.status === 'PAID')
            .reduce((sum, order) => sum + order.amountCents, 0) / 100,
        recentOrders: orders.slice(0, 5),
        topProducts: products.slice(0, 5),
      };

      return {
        stats,
        success: true,
      };
    } catch (error) {
      return {
        stats: null,
        success: false,
        error: error.message,
      };
    }
  }
}
