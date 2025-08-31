import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'wireless-bluetooth-headphones' },
      update: {},
      create: {
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        priceCents: 4999,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      },
    }),

    prisma.product.upsert({
      where: { slug: 'smartphone-case-clear' },
      update: {},
      create: {
        name: 'Smartphone Case - Clear',
        slug: 'smartphone-case-clear',
        priceCents: 1999,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=400',
      },
    }),

    prisma.product.upsert({
      where: { slug: 'usb-c-cable-2m' },
      update: {},
      create: {
        name: 'USB-C Cable 2m',
        slug: 'usb-c-cable-2m',
        priceCents: 1299,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      },
    }),

    prisma.product.upsert({
      where: { slug: 'wireless-charging-pad' },
      update: {},
      create: {
        name: 'Wireless Charging Pad',
        slug: 'wireless-charging-pad',
        priceCents: 2999,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
      },
    }),

    prisma.product.upsert({
      where: { slug: 'bluetooth-speaker-portable' },
      update: {},
      create: {
        name: 'Bluetooth Speaker Portable',
        slug: 'bluetooth-speaker-portable',
        priceCents: 3999,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
      },
    }),
  ]);

  console.log('✅ Created products:', products.length);

  // Create a sample order (optional)
  const sampleOrder = await prisma.order.upsert({
    where: { id: 'sample-order-1' },
    update: {},
    create: {
      id: 'sample-order-1',
      customerName: 'John Doe',
      phone: '+855123456789',
      address: '123 Main St, Phnom Penh, Cambodia',
      amountCents: 4999,
      currency: 'USD',
      status: 'PENDING',
      orderItems: {
        create: [
          {
            productId: products[0].id, // Headphones
            qty: 1,
            priceCents: 4999,
          },
        ],
      },
    },
    include: {
      orderItems: true,
    },
  });

  console.log('✅ Created sample order:', sampleOrder.id);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
