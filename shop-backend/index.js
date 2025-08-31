const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Telegram Bot setup
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
let bot;

if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
}

// Database initialization
async function initializeDatabase() {
  try {
    // Create products table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        quantity INTEGER DEFAULT 1,
        total_amount DECIMAL(10, 2) NOT NULL,
        receipt_url TEXT,
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample products if table is empty
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price, stock, image_url) VALUES
        ('Smartphone', 'Latest model smartphone with advanced features', 699.99, 50, 'https://example.com/phone.jpg'),
        ('Laptop', 'High-performance laptop for work and gaming', 1299.99, 30, 'https://example.com/laptop.jpg'),
        ('Headphones', 'Wireless noise-canceling headphones', 199.99, 100, 'https://example.com/headphones.jpg'),
        ('Smart Watch', 'Fitness tracking smartwatch', 299.99, 75, 'https://example.com/watch.jpg'),
        ('Tablet', '10-inch tablet with high-resolution display', 449.99, 40, 'https://example.com/tablet.jpg')
      `);
      console.log('Sample products inserted');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Utility Functions
const generateReceiptUrl = (orderId) => {
  return `${process.env.BASE_URL || 'http://localhost:3001'}/receipt/${orderId}`;
};

const sendTelegramNotification = async (orderData) => {
  if (!bot || !TELEGRAM_CHAT_ID) {
    console.log('Telegram bot not configured');
    return;
  }

  try {
    const message = `
🛒 *New Order Received!*

📦 *Order ID:* ${orderData.id}
👤 *Customer:* ${orderData.customer_name}
📧 *Email:* ${orderData.customer_email || 'N/A'}
📱 *Phone:* ${orderData.customer_phone || 'N/A'}
🛍️ *Product:* ${orderData.product_name}
🔢 *Quantity:* ${orderData.quantity}
💰 *Total Amount:* $${orderData.total_amount}
💳 *Payment Status:* ${orderData.payment_status}
🧾 *Receipt:* ${orderData.receipt_url}

📅 *Order Date:* ${new Date(orderData.created_at).toLocaleString()}
    `;

    await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
      parse_mode: 'Markdown',
    });
    console.log('Telegram notification sent successfully');
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};

// API Routes

// GET /products - Retrieve all products
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, price, stock, image_url, created_at 
      FROM products 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

// GET /products/:id - Retrieve a specific product
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, description, price, stock, image_url, created_at FROM products WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
});

// POST /checkout - Process order and payment
app.post('/checkout', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      product_id,
      customer_name,
      customer_email,
      customer_phone,
      quantity = 1,
      payment_method = 'card',
    } = req.body;

    // Validate required fields
    if (!product_id || !customer_name) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and customer name are required',
      });
    }

    // Check if product exists and has sufficient stock
    const productResult = await client.query(
      'SELECT id, name, price, stock FROM products WHERE id = $1',
      [product_id],
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const product = productResult.rows[0];

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available',
      });
    }

    const totalAmount = (parseFloat(product.price) * quantity).toFixed(2);

    // Create order
    const orderResult = await client.query(
      `
      INSERT INTO orders (product_id, customer_name, customer_email, customer_phone, quantity, total_amount, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `,
      [
        product_id,
        customer_name,
        customer_email,
        customer_phone,
        quantity,
        totalAmount,
        'pending',
      ],
    );

    const order = orderResult.rows[0];

    // Generate receipt URL
    const receiptUrl = generateReceiptUrl(order.id);

    // Update order with receipt URL
    await client.query('UPDATE orders SET receipt_url = $1 WHERE id = $2', [
      receiptUrl,
      order.id,
    ]);

    // Simulate payment processing (in real app, integrate with payment gateway)
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

    let paymentStatus = 'pending';
    if (paymentSuccess) {
      paymentStatus = 'completed';

      // Update stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [quantity, product_id],
      );
    } else {
      paymentStatus = 'failed';
    }

    // Update payment status
    await client.query(
      'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [paymentStatus, order.id],
    );

    await client.query('COMMIT');

    // Prepare order data for response and notification
    const orderData = {
      id: order.id,
      product_id,
      product_name: product.name,
      customer_name,
      customer_email,
      customer_phone,
      quantity,
      total_amount: totalAmount,
      receipt_url: receiptUrl,
      payment_status: paymentStatus,
      created_at: order.created_at,
    };

    // Send Telegram notification if payment is successful
    if (paymentStatus === 'completed') {
      await sendTelegramNotification(orderData);
    }

    res.status(201).json({
      success: true,
      message:
        paymentStatus === 'completed'
          ? 'Order placed successfully'
          : 'Payment failed, please try again',
      data: orderData,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process checkout',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// GET /orders - Retrieve all orders
app.get('/orders', async (req, res) => {
  try {
    const { customer_name, payment_status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT o.id, o.product_id, p.name as product_name, o.customer_name, 
             o.customer_email, o.customer_phone, o.quantity, o.total_amount,
             o.receipt_url, o.payment_status, o.created_at, o.updated_at
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (customer_name) {
      paramCount++;
      query += ` AND o.customer_name ILIKE $${paramCount}`;
      params.push(`%${customer_name}%`);
    }

    if (payment_status) {
      paramCount++;
      query += ` AND o.payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM orders WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (customer_name) {
      countParamCount++;
      countQuery += ` AND customer_name ILIKE $${countParamCount}`;
      countParams.push(`%${customer_name}%`);
    }

    if (payment_status) {
      countParamCount++;
      countQuery += ` AND payment_status = $${countParamCount}`;
      countParams.push(payment_status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});

// GET /orders/:id - Retrieve a specific order
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT o.id, o.product_id, p.name as product_name, p.description, p.price as unit_price,
             o.customer_name, o.customer_email, o.customer_phone, o.quantity, o.total_amount,
             o.receipt_url, o.payment_status, o.created_at, o.updated_at
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
});

// GET /receipt/:orderId - Generate receipt page
app.get('/receipt/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query(
      `
      SELECT o.id, o.product_id, p.name as product_name, p.description,
             o.customer_name, o.customer_email, o.customer_phone, o.quantity, 
             o.total_amount, o.payment_status, o.created_at
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = $1
    `,
      [orderId],
    );

    if (result.rows.length === 0) {
      return res.status(404).send('<h1>Receipt not found</h1>');
    }

    const order = result.rows[0];

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .order-info { margin: 20px 0; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
          .status { padding: 5px 10px; border-radius: 5px; color: white; }
          .completed { background-color: #28a745; }
          .pending { background-color: #ffc107; color: #333; }
          .failed { background-color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Online Shop Receipt</h1>
          <p>Order #${order.id}</p>
        </div>
        
        <div class="order-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${order.customer_name}</p>
          <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        
        <div class="item">
          <h3>Order Details</h3>
          <p><strong>Product:</strong> ${order.product_name}</p>
          <p><strong>Description:</strong> ${order.description || 'N/A'}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Unit Price:</strong> $${(order.total_amount / order.quantity).toFixed(2)}</p>
        </div>
        
        <div class="total">
          <p>Total Amount: $${order.total_amount}</p>
          <p>Payment Status: <span class="status ${order.payment_status}">${order.payment_status.toUpperCase()}</span></p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Thank you for your purchase!</p>
        </div>
      </body>
      </html>
    `;

    res.send(receiptHtml);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).send('<h1>Error generating receipt</h1>');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Shop backend is running',
    timestamp: new Date().toISOString(),
    telegram_configured: !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Shop backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🛍️  Products API: http://localhost:${PORT}/products`);
      console.log(`📦 Orders API: http://localhost:${PORT}/orders`);
      console.log(`💳 Checkout API: http://localhost:${PORT}/checkout`);

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        console.log('📱 Telegram notifications: ENABLED');
      } else {
        console.log(
          '📱 Telegram notifications: DISABLED (configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)',
        );
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startServer();
