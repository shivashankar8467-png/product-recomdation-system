import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

if (process.env.NODE_ENV === "production") {
  throw new Error("The demo seed is disabled in production.");
}

const prisma = new PrismaClient();
const categories = [
  { name: "Audio & Tech", slug: "audio-tech", image: "/product-art/audio.svg", description: "Thoughtful tech for listening, working, and unwinding." },
  { name: "Home Objects", slug: "home-objects", image: "/product-art/home.svg", description: "Useful pieces that make a room feel more like yours." },
  { name: "Kitchen & Table", slug: "kitchen-table", image: "/product-art/kitchen.svg", description: "Everyday tools for slower, better meals." },
  { name: "Wellness", slug: "wellness", image: "/product-art/wellness.svg", description: "Small rituals and good essentials for everyday care." },
  { name: "Travel Goods", slug: "travel-goods", image: "/product-art/travel.svg", description: "Well-made companions for the days away." },
  { name: "Outdoors", slug: "outdoors", image: "/product-art/outdoor.svg", description: "Comfortable, dependable gear for fresh air." },
  { name: "Apparel", slug: "apparel", image: "/product-art/apparel.svg", description: "Comfort-first layers, cut to wear on repeat." },
  { name: "Desk & Studio", slug: "desk-studio", image: "/product-art/tech.svg", description: "Clear-headed upgrades for focused work." },
];

const catalog = [
  { category: "audio-tech", image: "/product-art/audio.svg", brand: "Audo", products: [
    ["Quiet Form Headphones", 189, 229], ["Everyday Wireless Earbuds", 88, 110], ["Pocket Bluetooth Speaker", 74, 92],
    ["Studio Monitor Stand", 56, 69], ["Soft Touch Charging Dock", 42, 55], ["Field Notes Voice Recorder", 129, 159], ["Sculpted Desk Speaker", 148, 179],
  ] },
  { category: "home-objects", image: "/product-art/home.svg", brand: "Sunday House", products: [
    ["Hand-thrown Stoneware Vase", 68, 82], ["Washed Linen Throw", 118, 145], ["Soft Grid Cushion Cover", 38, 48],
    ["Oak Side Table", 245, 295], ["Ripple Glass Set", 48, 60], ["Warm Glow Table Lamp", 156, 189], ["Cotton Bath Sheet", 46, 58],
  ] },
  { category: "kitchen-table", image: "/product-art/kitchen.svg", brand: "Common Table", products: [
    ["Morning Pour Kettle", 96, 118], ["Olivewood Serving Board", 58, 72], ["Daily Ceramic Mug Set", 42, 52],
    ["Brushed Steel Pour-over", 48, 59], ["Canvas Market Tote", 32, 40], ["Everyday Chef Knife", 112, 138], ["Lidded Pantry Jar Set", 54, 68],
  ] },
  { category: "wellness", image: "/product-art/wellness.svg", brand: "Still Practice", products: [
    ["Ritual Body Oil", 34, 42], ["Reed Diffuser, Cedar", 46, 58], ["Soft Cotton Eye Mask", 24, 30],
    ["Daily Mineral Sunscreen", 28, 35], ["Herbal Bath Soak", 26, 33], ["Stone Massage Tool", 39, 48], ["Refillable Hand Wash", 22, 28],
  ] },
  { category: "travel-goods", image: "/product-art/travel.svg", brand: "Elsewhere", products: [
    ["Weekender Carryall", 168, 205], ["Packable Day Bag", 72, 89], ["Passport Wallet", 48, 59],
    ["Compact Travel Organizer", 36, 45], ["Insulated Bottle, 20 oz", 38, 48], ["Soft-shell Cabin Case", 289, 340], ["Merino Travel Wrap", 98, 120],
  ] },
  { category: "outdoors", image: "/product-art/outdoors.svg", brand: "Open Country", products: [
    ["Trail Flask, 750 ml", 42, 52], ["Foldaway Picnic Blanket", 74, 90], ["Ultralight Camp Lantern", 64, 79],
    ["All-weather Daypack", 128, 155], ["Canvas Field Cap", 34, 42], ["Trek-ready Walking Poles", 92, 112], ["Enamel Camp Mug Pair", 28, 35],
  ] },
  { category: "apparel", image: "/product-art/apparel.svg", brand: "Form & Field", products: [
    ["Heavyweight Cotton Tee", 44, 54], ["Soft Rib Lounge Set", 112, 135], ["Relaxed Linen Shirt", 98, 118],
    ["Everyday Merino Socks", 24, 30], ["Brushed Fleece Crew", 88, 108], ["Weekend Canvas Cap", 32, 40], ["Easy Drawstring Trouser", 92, 112],
  ] },
  { category: "desk-studio", image: "/product-art/tech.svg", brand: "Goodkind Studio", products: [
    ["Aluminium Desk Riser", 178, 215], ["Quiet Click Keyboard", 118, 145], ["Soft Light Task Lamp", 142, 175],
    ["Leather Cable Wrap Set", 18, 24], ["Weekly Desk Planner", 26, 32], ["Recycled Paper Notebook Set", 22, 28],
  ] },
];

const reviewComments = [
  "Beautifully made and even better in person. It has quickly become part of my everyday routine.",
  "The details feel considered without being fussy. A really lovely piece to use.",
  "Exactly what I was hoping for: useful, comfortable, and made to last.",
  "Thoughtful packaging and a genuinely well-made product. I'd happily recommend it.",
  "A small upgrade that makes a real difference. The quality is excellent.",
];
const customers = [
  { email: "customer@example.com", name: "Alex Morgan", password: "Customer@123" },
  { email: "mila@example.com", name: "Mila Chen" },
  { email: "sam@example.com", name: "Sam Rivera" },
  { email: "jordan@example.com", name: "Jordan Ellis" },
  { email: "priya@example.com", name: "Priya Das" },
  { email: "leo@example.com", name: "Leo Brooks" },
  { email: "ava@example.com", name: "Ava Patel" },
  { email: "noah@example.com", name: "Noah Kim" },
  { email: "maya@example.com", name: "Maya James" },
  { email: "elliot@example.com", name: "Elliot Park" },
  { email: "isla@example.com", name: "Isla Reed" },
  { email: "ravi@example.com", name: "Ravi Shah" },
];

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      email: "admin@example.com",
      name: "Goodkind Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("Admin@123", 12),
    },
    update: {},
  });
  const customerUsers = [];
  for (const [index, customer] of customers.entries()) {
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      create: {
        email: customer.email,
        name: customer.name,
        role: "CUSTOMER",
        preferences: [categories[index % categories.length].slug],
        passwordHash: await bcrypt.hash(customer.password ?? `Welcome${index + 1}@123`, 12),
      },
      update: {},
    });
    customerUsers.push(user);
    await prisma.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  }
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, description: category.description, image: category.image },
    });
  }
  const products = [];
  for (const group of catalog) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: group.category } });
    for (const [index, [name, price, compareAtPrice]] of group.products.entries()) {
      const slug = `${group.category}-${index + 1}`;
      const existing = await prisma.product.findUnique({ where: { slug } });
      const product = await prisma.product.upsert({
        where: { slug },
        create: {
          name,
          slug,
          description: `${name} by ${group.brand}. A considered everyday essential, made with durable materials and thoughtful details for years of regular use.`,
          brand: group.brand,
          price,
          compareAtPrice,
          categoryId: category.id,
          image: group.image,
          images: [group.image],
          inventory: 18 + ((index * 7 + group.products.length) % 35),
          rating: 4.5,
          reviewCount: 0,
          soldCount: 0,
          featured: index === 0 || (index === 3 && group.products.length > 5),
          attributes: {
            color: ["Olive", "Natural", "Clay", "Ink", "Oat"][index % 5],
            material: ["Recycled canvas", "Stoneware", "Brushed steel", "Organic cotton"][index % 4],
            useCase: ["Everyday", "Travel", "Home", "Studio"][index % 4],
          },
        },
        update: {},
      });
      products.push(product);
      if (!existing) {
        const reviewCount = index % 3 === 0 ? 3 : 2;
        for (let offset = 0; offset < reviewCount; offset += 1) {
          const reviewer = customerUsers[(products.length + offset) % customerUsers.length];
          await prisma.review.upsert({
            where: { productId_userId: { productId: product.id, userId: reviewer.id } },
            create: {
              productId: product.id,
              userId: reviewer.id,
              rating: 4 + ((products.length + offset) % 2),
              comment: reviewComments[(products.length + offset) % reviewComments.length],
            },
            update: {},
          });
        }
      }
    }
  }

  for (const product of products) {
    const stats = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { rating: stats._avg.rating ?? 0, reviewCount: stats._count._all },
    });
  }

  const existingOrders = await prisma.order.count({ where: { orderNumber: { startsWith: "SP-DEMO-" } } });
  if (existingOrders === 0) {
    for (let index = 0; index < 24; index += 1) {
      const user = customerUsers[index % customerUsers.length];
      const first = products[(index * 3) % products.length];
      const second = products[(index * 3 + 11) % products.length];
      const lines = [
        { product: first, quantity: 1 + (index % 2) },
        ...(index % 3 === 0 ? [{ product: second, quantity: 1 }] : []),
      ];
      const total = Number(lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0).toFixed(2));
      const daysAgo = (index * 2) % 30;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await prisma.order.create({
        data: {
          orderNumber: `SP-DEMO-${String(10001 + index)}`,
          userId: user.id,
          status: index % 7 === 0 ? "SHIPPED" : index % 5 === 0 ? "DELIVERED" : "PROCESSING",
          paymentMethod: index % 2 === 0 ? "MOCK_ONLINE" : "COD",
          paymentStatus: index % 2 === 0 ? "PAID" : "PENDING",
          total,
          shippingName: user.name,
          shippingPhone: "+1 (555) 010-0199",
          shippingAddress: `${100 + index} Mercer Street`,
          shippingCity: ["Brooklyn", "Portland", "Austin", "Chicago"][index % 4],
          shippingPostalCode: ["11211", "97205", "78701", "60610"][index % 4],
          createdAt,
          items: {
            create: lines.map(({ product, quantity }) => ({
              productId: product.id,
              productName: product.name,
              image: product.image,
              quantity,
              unitPrice: product.price,
            })),
          },
        },
      });
      for (const { product, quantity } of lines) {
        await prisma.product.update({
          where: { id: product.id },
          data: { soldCount: { increment: quantity }, inventory: { decrement: quantity } },
        });
      }
    }
  }

  if ((await prisma.behaviorEvent.count()) < 100) {
    const events = [];
    const types = ["VIEW", "CLICK", "WISHLIST", "ADD_TO_CART", "PURCHASE", "RATING"];
    for (let index = 0; index < 240; index += 1) {
      const user = customerUsers[index % customerUsers.length];
      const product = products[(index * 7 + Math.floor(index / 3)) % products.length];
      const category = await prisma.category.findUniqueOrThrow({
        where: { id: product.categoryId },
        select: { id: true },
      });
      events.push({
        userId: user.id,
        productId: product.id,
        categoryId: category.id,
        type: types[index % types.length],
        createdAt: new Date(Date.now() - (index % 45) * 24 * 60 * 60 * 1000),
      });
    }
    await prisma.behaviorEvent.createMany({ data: events });
  }

  for (let userIndex = 0; userIndex < customerUsers.length; userIndex += 1) {
    const user = customerUsers[userIndex];
    const picks = [products[(userIndex + 4) % products.length], products[(userIndex + 15) % products.length]];
    for (const product of picks) {
      await prisma.recommendation.upsert({
        where: { userId_productId: { userId: user.id, productId: product.id } },
        create: {
          userId: user.id,
          productId: product.id,
          score: 13.5 - userIndex * 0.2,
          reason: userIndex % 2 ? "Popular with customers like you" : "Based on your recent interests",
        },
        update: {},
      });
    }
  }
  if ((await prisma.recommendationEvent.count()) === 0) {
    const recommendations = await prisma.recommendation.findMany({ take: 24 });
    for (const [index, recommendation] of recommendations.entries()) {
      await prisma.recommendationEvent.create({
        data: {
          userId: recommendation.userId,
          recommendationId: recommendation.id,
          productId: recommendation.productId,
          type: index % 6 === 0 ? "PURCHASE" : index % 3 === 0 ? "CLICK" : "IMPRESSION",
          revenue: index % 6 === 0 ? products[index % products.length].price : 0,
          createdAt: new Date(Date.now() - index * 3 * 60 * 60 * 1000),
        },
      });
    }
  }
  await prisma.$disconnect();
  process.stdout.write(`Seed complete: ${categories.length} categories, ${products.length} products, ${customerUsers.length + 1} accounts.\n`);
}

main().catch(async (error) => {
  await prisma.$disconnect();
  process.stderr.write(`${error instanceof Error ? error.message : "Seed failed"}\n`);
  process.exit(1);
});
