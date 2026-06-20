import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Stable placeholder image (seeded so each product looks consistent).
function img(seed: string, w = 800, h = 800): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

interface VariantSeed {
  sku: string;
  price: number;
  stock: number;
  // map of attributeName -> value
  attrs: Record<string, string>;
}

interface ProductSeed {
  name: string;
  categorySlug: string;
  description: string;
  basePrice: number;
  tags: string[];
  featured?: boolean;
  attributes: { name: string; values: { value: string; swatchHex?: string }[] }[];
  variants: VariantSeed[];
}

async function main() {
  console.log('Seeding Shimeka database...');

  // ---- Admin + sample staff/customer ----
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@shimeka.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  const adminHash = await argon2.hash(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: 'Shimeka Admin', role: 'ADMIN', passwordHash: adminHash },
  });

  const staffHash = await argon2.hash('Staff@12345');
  await prisma.user.upsert({
    where: { email: 'staff@shimeka.com' },
    update: {},
    create: { email: 'staff@shimeka.com', name: 'Shimeka Staff', role: 'STAFF', passwordHash: staffHash },
  });

  const customerHash = await argon2.hash('Customer@123');
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      phone: '01700000000',
      name: 'Demo Customer',
      role: 'CUSTOMER',
      passwordHash: customerHash,
    },
  });
  await prisma.address.deleteMany({ where: { userId: customer.id } });
  await prisma.address.create({
    data: {
      userId: customer.id,
      fullName: 'Demo Customer',
      phone: '01700000000',
      addressLine1: 'House 12, Road 5, Dhanmondi',
      city: 'Dhaka',
      area: 'Dhanmondi',
      postalCode: '1209',
      isDefault: true,
    },
  });

  // ---- Categories (nested) ----
  const categoryTree: {
    name: string;
    type: 'MAKEUP' | 'CLOTHING';
    children: string[];
  }[] = [
    { name: 'Makeup', type: 'MAKEUP', children: ['Lips', 'Face', 'Eyes'] },
    { name: 'Clothing', type: 'CLOTHING', children: ['Saree', 'Lehenga', 'Three Piece'] },
  ];

  const slugToId = new Map<string, string>();
  let sort = 0;
  for (const top of categoryTree) {
    const topSlug = slugify(top.name);
    const parent = await prisma.category.upsert({
      where: { slug: topSlug },
      update: {},
      create: {
        name: top.name,
        slug: topSlug,
        type: top.type,
        sortOrder: sort++,
        image: img(`cat-${topSlug}`, 600, 400),
      },
    });
    slugToId.set(topSlug, parent.id);
    let csort = 0;
    for (const child of top.children) {
      const childSlug = slugify(`${top.name}-${child}`);
      const c = await prisma.category.upsert({
        where: { slug: childSlug },
        update: {},
        create: {
          name: child,
          slug: childSlug,
          type: top.type,
          parentId: parent.id,
          sortOrder: csort++,
          image: img(`cat-${childSlug}`, 600, 400),
        },
      });
      slugToId.set(childSlug, c.id);
    }
  }

  // ---- Products ----
  const products: ProductSeed[] = [
    {
      name: 'Velvet Matte Lipstick',
      categorySlug: 'makeup-lips',
      description:
        'Long-lasting velvet matte lipstick with rich, full-coverage color and a comfortable, non-drying finish.',
      basePrice: 650,
      tags: ['lipstick', 'matte', 'makeup', 'lips'],
      featured: true,
      attributes: [
        {
          name: 'Shade',
          values: [
            { value: 'Ruby Red', swatchHex: '#9B1B30' },
            { value: 'Nude Beige', swatchHex: '#C8A07A' },
            { value: 'Coral Crush', swatchHex: '#F26B5E' },
            { value: 'Plum Wine', swatchHex: '#5E2C4B' },
            { value: 'Pink Petal', swatchHex: '#E58FA5' },
          ],
        },
      ],
      variants: [
        { sku: 'LIP-VM-RED', price: 650, stock: 40, attrs: { Shade: 'Ruby Red' } },
        { sku: 'LIP-VM-NUD', price: 650, stock: 35, attrs: { Shade: 'Nude Beige' } },
        { sku: 'LIP-VM-COR', price: 650, stock: 28, attrs: { Shade: 'Coral Crush' } },
        { sku: 'LIP-VM-PLM', price: 680, stock: 18, attrs: { Shade: 'Plum Wine' } },
        { sku: 'LIP-VM-PNK', price: 650, stock: 4, attrs: { Shade: 'Pink Petal' } },
      ],
    },
    {
      name: 'Flawless Liquid Foundation',
      categorySlug: 'makeup-face',
      description:
        'Buildable medium-to-full coverage liquid foundation with a natural satin finish. Suitable for all skin types.',
      basePrice: 1200,
      tags: ['foundation', 'face', 'makeup', 'base'],
      featured: true,
      attributes: [
        {
          name: 'Shade',
          values: [
            { value: 'Ivory', swatchHex: '#F3DDC9' },
            { value: 'Beige', swatchHex: '#E3BC97' },
            { value: 'Sand', swatchHex: '#CDA079' },
            { value: 'Tan', swatchHex: '#B07E54' },
          ],
        },
      ],
      variants: [
        { sku: 'FND-FL-IVO', price: 1200, stock: 22, attrs: { Shade: 'Ivory' } },
        { sku: 'FND-FL-BEI', price: 1200, stock: 30, attrs: { Shade: 'Beige' } },
        { sku: 'FND-FL-SAN', price: 1200, stock: 16, attrs: { Shade: 'Sand' } },
        { sku: 'FND-FL-TAN', price: 1250, stock: 9, attrs: { Shade: 'Tan' } },
      ],
    },
    {
      name: 'Silk Blend Saree',
      categorySlug: 'clothing-saree',
      description:
        'Elegant silk-blend saree with intricate woven border. Comes with an unstitched blouse piece.',
      basePrice: 3500,
      tags: ['saree', 'silk', 'clothing', 'women'],
      featured: true,
      attributes: [
        {
          name: 'Color',
          values: [
            { value: 'Maroon', swatchHex: '#7B1E22' },
            { value: 'Teal', swatchHex: '#1F6F6B' },
            { value: 'Royal Blue', swatchHex: '#23408F' },
          ],
        },
      ],
      variants: [
        { sku: 'SAR-SB-MAR', price: 3500, stock: 12, attrs: { Color: 'Maroon' } },
        { sku: 'SAR-SB-TEA', price: 3500, stock: 8, attrs: { Color: 'Teal' } },
        { sku: 'SAR-SB-BLU', price: 3700, stock: 5, attrs: { Color: 'Royal Blue' } },
      ],
    },
    {
      name: 'Embroidered Bridal Lehenga',
      categorySlug: 'clothing-lehenga',
      description:
        'Heavily embroidered bridal lehenga with sequin and zari work. Includes choli and dupatta.',
      basePrice: 12500,
      tags: ['lehenga', 'bridal', 'clothing', 'women'],
      featured: true,
      attributes: [
        { name: 'Color', values: [{ value: 'Red', swatchHex: '#B11226' }, { value: 'Pink', swatchHex: '#D6608A' }] },
        { name: 'Size', values: [{ value: 'S' }, { value: 'M' }, { value: 'L' }] },
      ],
      variants: [
        { sku: 'LEH-EB-RED-S', price: 12500, stock: 3, attrs: { Color: 'Red', Size: 'S' } },
        { sku: 'LEH-EB-RED-M', price: 12500, stock: 4, attrs: { Color: 'Red', Size: 'M' } },
        { sku: 'LEH-EB-RED-L', price: 12500, stock: 2, attrs: { Color: 'Red', Size: 'L' } },
        { sku: 'LEH-EB-PNK-M', price: 12800, stock: 3, attrs: { Color: 'Pink', Size: 'M' } },
        { sku: 'LEH-EB-PNK-L', price: 12800, stock: 1, attrs: { Color: 'Pink', Size: 'L' } },
      ],
    },
    {
      name: 'Cotton Three Piece Set',
      categorySlug: 'clothing-three-piece',
      description:
        'Comfortable printed cotton three-piece set (kameez, salwar, dupatta) for everyday elegance.',
      basePrice: 1800,
      tags: ['three piece', 'cotton', 'clothing', 'women'],
      attributes: [
        { name: 'Color', values: [{ value: 'Mustard', swatchHex: '#D8A12B' }, { value: 'Olive', swatchHex: '#6B7A3A' }, { value: 'Black', swatchHex: '#1C1C1C' }] },
        { name: 'Size', values: [{ value: 'S' }, { value: 'M' }, { value: 'L' }, { value: 'XL' }] },
      ],
      variants: [
        { sku: 'TP-CT-MUS-M', price: 1800, stock: 20, attrs: { Color: 'Mustard', Size: 'M' } },
        { sku: 'TP-CT-MUS-L', price: 1800, stock: 15, attrs: { Color: 'Mustard', Size: 'L' } },
        { sku: 'TP-CT-OLI-M', price: 1800, stock: 12, attrs: { Color: 'Olive', Size: 'M' } },
        { sku: 'TP-CT-BLK-L', price: 1850, stock: 10, attrs: { Color: 'Black', Size: 'L' } },
        { sku: 'TP-CT-BLK-XL', price: 1850, stock: 6, attrs: { Color: 'Black', Size: 'XL' } },
      ],
    },
    {
      name: 'Kohl Eyeliner Pencil',
      categorySlug: 'makeup-eyes',
      description: 'Smudge-proof, intensely pigmented kohl eyeliner pencil for bold, defined eyes.',
      basePrice: 350,
      tags: ['eyeliner', 'kohl', 'eyes', 'makeup'],
      attributes: [
        { name: 'Shade', values: [{ value: 'Jet Black', swatchHex: '#0A0A0A' }, { value: 'Brown', swatchHex: '#5A3A22' }] },
      ],
      variants: [
        { sku: 'EYE-KL-BLK', price: 350, stock: 50, attrs: { Shade: 'Jet Black' } },
        { sku: 'EYE-KL-BRN', price: 350, stock: 33, attrs: { Shade: 'Brown' } },
      ],
    },
  ];

  for (const p of products) {
    const categoryId = slugToId.get(p.categorySlug);
    if (!categoryId) {
      console.warn(`Skipping ${p.name}: category ${p.categorySlug} not found`);
      continue;
    }
    const slug = slugify(p.name);

    // Remove existing product (idempotent reseed).
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.delete({ where: { id: existing.id } });
    }

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        tags: p.tags,
        categoryId,
        basePrice: new Prisma.Decimal(p.basePrice),
        status: 'PUBLISHED',
        isFeatured: p.featured ?? false,
        thumbnailImage: img(`prod-${slug}`),
        images: {
          create: [0, 1, 2].map((i) => ({ url: img(`prod-${slug}-${i}`), sortOrder: i })),
        },
      },
    });

    // Attributes + values.
    const valueId = new Map<string, string>();
    let ai = 0;
    for (const attr of p.attributes) {
      const created = await prisma.variantAttribute.create({
        data: {
          productId: product.id,
          name: attr.name,
          sortOrder: ai++,
          values: {
            create: attr.values.map((v, i) => ({
              value: v.value,
              swatchHex: v.swatchHex ?? null,
              sortOrder: i,
            })),
          },
        },
        include: { values: true },
      });
      for (const v of created.values) valueId.set(`${attr.name}|${v.value}`, v.id);
    }

    // Variants.
    for (const v of p.variants) {
      const valueIds = Object.entries(v.attrs).map(([name, value]) => {
        const id = valueId.get(`${name}|${value}`);
        if (!id) throw new Error(`Missing attribute value ${name}=${value} for ${p.name}`);
        return id;
      });
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          price: new Prisma.Decimal(v.price),
          stockQuantity: v.stock,
          lowStockThreshold: 5,
          images: [img(`var-${v.sku}`)],
          attributeValues: { connect: valueIds.map((id) => ({ id })) },
        },
      });
    }
    console.log(`  + ${p.name} (${p.variants.length} variants)`);
  }

  // ---- Coupon ----
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: new Prisma.Decimal(10),
      minOrderValue: new Prisma.Decimal(1000),
      maxUses: 1000,
      isActive: true,
    },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT200' },
    update: {},
    create: {
      code: 'FLAT200',
      type: 'FIXED',
      value: new Prisma.Decimal(200),
      minOrderValue: new Prisma.Decimal(2000),
      isActive: true,
    },
  });

  // ---- Banners ----
  await prisma.banner.deleteMany({});
  await prisma.banner.createMany({
    data: [
      { title: 'New Arrivals — Festive Collection', imageUrl: img('banner-festive', 1600, 600), linkUrl: '/category/clothing', sortOrder: 0, isActive: true },
      { title: 'Makeup Must-Haves', imageUrl: img('banner-makeup', 1600, 600), linkUrl: '/category/makeup', sortOrder: 1, isActive: true },
    ],
  });

  // ---- Site content / settings ----
  await prisma.siteContent.upsert({
    where: { key: 'store_settings' },
    update: {},
    create: {
      key: 'store_settings',
      value: {
        name: 'Shimeka',
        contactPhone: '+880 1XXX-XXXXXX',
        contactEmail: 'support@shimeka.com',
        shipping: { insideDhaka: 60, outsideDhaka: 100, freeShippingThreshold: 0 },
        payment: {
          bkash: '01XXXXXXXXX',
          nagad: '01XXXXXXXXX',
          bankAccount: { bank: 'Example Bank Ltd.', name: 'Shimeka', number: '0000-0000-0000' },
        },
      },
    },
  });
  await prisma.siteContent.upsert({
    where: { key: 'page_about' },
    update: {},
    create: {
      key: 'page_about',
      value: { title: 'About Shimeka', body: 'Shimeka brings you curated makeup and clothing for the modern woman.' },
    },
  });

  console.log('Seed complete.');
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
