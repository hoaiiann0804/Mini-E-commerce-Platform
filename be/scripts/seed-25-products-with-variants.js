'use strict';

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const {
  Product,
  Category,
  ProductAttribute,
  ProductVariant,
  ProductSpecification,
  sequelize,
} = require('../src/models');

/**
 * BUSINESS LOGIC:
 * Tạo 25 sản phẩm điện tử cao cấp với đầy đủ biến thể (RAM, SSD, Màu sắc)
 * và thông số kỹ thuật (CPU, Màn hình, GPU, Pin...)
 * Đảm bảo:
 * 1. isVariantProduct = true
 * 2. Tồn kho biến thể (stockQuantity) riêng biệt
 * 3. Đồng bộ minVariantPrice và tổng stockQuantity cho sản phẩm cha
 * 4. Tiết kiệm dung lượng Neon (< 3MB data)
 */

const baseProducts = [
  // 1. Laptop Apple
  {
    name: 'MacBook Air 13 inch M2 2024',
    category: 'Laptop',
    brand: 'Apple',
    basePrice: 26990000,
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&fit=crop',
    specs: { cpu: 'Apple M2 8-core', screen: '13.6 inch Liquid Retina', ram: 'Unified Memory', storage: 'SSD NVMe', battery: '52.6 Wh' },
    attributes: [
      { name: 'CẤU HÌNH', values: ['8GB - 256GB', '16GB - 512GB', '24GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Space Gray', 'Silver', 'Midnight', 'Starlight'] }
    ]
  },
  {
    name: 'MacBook Pro 14 inch M3 Pro',
    category: 'Laptop',
    brand: 'Apple',
    basePrice: 48990000,
    thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&fit=crop',
    specs: { cpu: 'Apple M3 Pro 11-core', screen: '14.2 inch Liquid Retina XDR 120Hz', ram: '18GB Unified', storage: '512GB SSD', battery: '70 Wh' },
    attributes: [
      { name: 'BỘ NHỚ', values: ['18GB - 512GB', '36GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Space Black', 'Silver'] }
    ]
  },
  {
    name: 'MacBook Air 15 inch M3',
    category: 'Laptop',
    brand: 'Apple',
    basePrice: 32990000,
    thumbnail: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&fit=crop',
    specs: { cpu: 'Apple M3 8-core', screen: '15.3 inch Liquid Retina', ram: 'Unified Memory', storage: 'SSD High Speed', battery: '66.5 Wh' },
    attributes: [
      { name: 'CẤU HÌNH', values: ['8GB - 256GB', '16GB - 512GB'] },
      { name: 'MÀU SẮC', values: ['Midnight', 'Starlight', 'Silver'] }
    ]
  },

  // 2. ThinkPad / Lenovo
  {
    name: 'ThinkPad X1 Carbon Gen 11',
    category: 'Laptop',
    brand: 'Lenovo',
    basePrice: 38500000,
    thumbnail: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&fit=crop',
    specs: { cpu: 'Intel Core i7-1365U vPro', screen: '14 inch 2.8K OLED', ram: 'LPDDR5 6000MHz', storage: 'PCIe 4.0 SSD', weight: '1.12 kg' },
    attributes: [
      { name: 'RAM/SSD', values: ['16GB - 512GB', '32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Deep Black'] }
    ]
  },
  {
    name: 'ThinkPad T14 Gen 4',
    category: 'Laptop',
    brand: 'Lenovo',
    basePrice: 24900000,
    thumbnail: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&fit=crop',
    specs: { cpu: 'AMD Ryzen 7 PRO 7840U', screen: '14 inch WUXGA IPS', ram: 'DDR5 5600MHz', storage: 'NVMe SSD', battery: '52.5 Wh' },
    attributes: [
      { name: 'PHIÊN BẢN', values: ['Ryzen 5 - 16GB - 512GB', 'Ryzen 7 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Thunder Black', 'Storm Grey'] }
    ]
  },
  {
    name: 'Lenovo Legion Pro 5 16IRX9',
    category: 'Laptop Gaming',
    brand: 'Lenovo',
    basePrice: 39990000,
    thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&fit=crop',
    specs: { cpu: 'Intel Core i7-14700HX', gpu: 'NVIDIA RTX 4060 8GB', screen: '16 inch WQXGA 240Hz', ram: 'DDR5 5600MHz', battery: '80 Wh' },
    attributes: [
      { name: 'VGA / RAM', values: ['RTX 4060 - 16GB - 512GB', 'RTX 4070 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Onyx Grey'] }
    ]
  },

  // 3. Dell
  {
    name: 'Dell XPS 13 Plus 9320',
    category: 'Laptop',
    brand: 'Dell',
    basePrice: 34500000,
    thumbnail: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&fit=crop',
    specs: { cpu: 'Intel Core i7-1360P', screen: '13.4 inch 3.5K OLED Touch', ram: 'LPDDR5 6000MHz', storage: 'PCIe Gen4 SSD', weight: '1.26 kg' },
    attributes: [
      { name: 'RAM/SSD', values: ['16GB - 512GB', '32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Platinum Silver', 'Graphite'] }
    ]
  },
  {
    name: 'Dell XPS 15 9530',
    category: 'Laptop',
    brand: 'Dell',
    basePrice: 46900000,
    thumbnail: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500&fit=crop',
    specs: { cpu: 'Intel Core i7-13700H', gpu: 'NVIDIA RTX 4050 6GB', screen: '15.6 inch 3.5K OLED Touch', ram: 'DDR5 4800MHz', battery: '86 Wh' },
    attributes: [
      { name: 'CẤU HÌNH', values: ['16GB - 512GB - RTX 4050', '32GB - 1TB - RTX 4060'] },
      { name: 'MÀU SẮC', values: ['Platinum Silver'] }
    ]
  },
  {
    name: 'Dell Inspiron 16 5630',
    category: 'Laptop',
    brand: 'Dell',
    basePrice: 19990000,
    thumbnail: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&fit=crop',
    specs: { cpu: 'Intel Core i5-1335U', screen: '16 inch FHD+ 16:10', ram: 'LPDDR5 4800MHz', storage: '512GB SSD', weight: '1.82 kg' },
    attributes: [
      { name: 'BỘ NHỚ', values: ['8GB - 512GB', '16GB - 512GB'] },
      { name: 'MÀU SẮC', values: ['Platinum Silver'] }
    ]
  },

  // 4. Asus
  {
    name: 'ASUS ROG Zephyrus G14 2024',
    category: 'Laptop Gaming',
    brand: 'Asus',
    basePrice: 42900000,
    thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&fit=crop',
    specs: { cpu: 'AMD Ryzen 9 8945HS', gpu: 'NVIDIA RTX 4060 8GB', screen: '14 inch 3K OLED 120Hz', ram: 'LPDDR5X 6400MHz', weight: '1.5 kg' },
    attributes: [
      { name: 'GPU / RAM', values: ['RTX 4060 - 16GB - 1TB', 'RTX 4070 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Eclipse Gray', 'Platinum White'] }
    ]
  },
  {
    name: 'ASUS Zenbook 14 OLED UX3405',
    category: 'Laptop',
    brand: 'Asus',
    basePrice: 25900000,
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&fit=crop',
    specs: { cpu: 'Intel Core Ultra 7 155H', screen: '14 inch 3K OLED 120Hz', ram: 'LPDDR5X', storage: '1TB PCIe 4.0 SSD', weight: '1.2 kg' },
    attributes: [
      { name: 'CPU / RAM', values: ['Ultra 5 - 16GB - 512GB', 'Ultra 7 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Ponder Blue', 'Foggy Silver'] }
    ]
  },
  {
    name: 'ASUS TUF Gaming A15',
    category: 'Laptop Gaming',
    brand: 'Asus',
    basePrice: 22490000,
    thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&fit=crop',
    specs: { cpu: 'AMD Ryzen 7 7735HS', gpu: 'NVIDIA RTX 4050 6GB', screen: '15.6 inch FHD 144Hz', ram: 'DDR5 4800MHz', battery: '90 Wh' },
    attributes: [
      { name: 'CẤU HÌNH', values: ['16GB - 512GB', '32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Mecha Gray', 'Jaeger Gray'] }
    ]
  },

  // 5. HP
  {
    name: 'HP Spectre x360 14 2-in-1',
    category: 'Laptop',
    brand: 'HP',
    basePrice: 37900000,
    thumbnail: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&fit=crop',
    specs: { cpu: 'Intel Core Ultra 7 155H', screen: '14 inch 2.8K OLED Cảm ứng', ram: '32GB LPDDR5X', storage: '1TB NVMe', battery: '68 Wh' },
    attributes: [
      { name: 'BỘ NHỚ', values: ['16GB - 512GB', '32GB - 1TB', '32GB - 2TB'] },
      { name: 'MÀU SẮC', values: ['Nightfall Black', 'Slate Blue'] }
    ]
  },
  {
    name: 'HP Envy x360 15',
    category: 'Laptop',
    brand: 'HP',
    basePrice: 21990000,
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&fit=crop',
    specs: { cpu: 'Intel Core i5-1335U', screen: '15.6 inch FHD Cảm ứng xoay gập', ram: '16GB LPDDR5', storage: '512GB SSD', weight: '1.78 kg' },
    attributes: [
      { name: 'CẤU HÌNH', values: ['Core i5 - 16GB - 512GB', 'Core i7 - 16GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Natural Silver'] }
    ]
  },
  {
    name: 'HP Omen 16 Gaming Laptop',
    category: 'Laptop Gaming',
    brand: 'HP',
    basePrice: 33900000,
    thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&fit=crop',
    specs: { cpu: 'Intel Core i7-13700HX', gpu: 'NVIDIA RTX 4060 8GB', screen: '16.1 inch QHD 165Hz', ram: 'DDR5 4800MHz', battery: '83 Wh' },
    attributes: [
      { name: 'VGA / RAM', values: ['RTX 4060 - 16GB - 512GB', 'RTX 4070 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Shadow Black'] }
    ]
  },

  // 6. Acer & MSI
  {
    name: 'Acer Swift Go 14 OLED',
    category: 'Laptop',
    brand: 'Acer',
    basePrice: 19500000,
    thumbnail: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&fit=crop',
    specs: { cpu: 'Intel Core Ultra 5 125H', screen: '14 inch 2.8K OLED 90Hz', ram: '16GB LPDDR5X', storage: '512GB SSD', weight: '1.32 kg' },
    attributes: [
      { name: 'CẤU HÌNH', values: ['Ultra 5 - 16GB - 512GB', 'Ultra 7 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Pure Silver'] }
    ]
  },
  {
    name: 'Acer Predator Helios 16',
    category: 'Laptop Gaming',
    brand: 'Acer',
    basePrice: 45900000,
    thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&fit=crop',
    specs: { cpu: 'Intel Core i9-14900HX', gpu: 'NVIDIA RTX 4070 8GB', screen: '16 inch WQXGA Mini LED 250Hz', ram: 'DDR5 5600MHz', battery: '90 Wh' },
    attributes: [
      { name: 'CẤU HÌNH', values: ['i7 - 16GB - 512GB', 'i9 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Abyssal Black'] }
    ]
  },
  {
    name: 'MSI Stealth 14 Studio',
    category: 'Laptop Gaming',
    brand: 'MSI',
    basePrice: 38900000,
    thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&fit=crop',
    specs: { cpu: 'Intel Core i7-13700H', gpu: 'NVIDIA RTX 4060 8GB', screen: '14 inch QHD+ 240Hz', ram: 'DDR5 5200MHz', weight: '1.7 kg' },
    attributes: [
      { name: 'GPU / RAM', values: ['RTX 4060 - 16GB - 1TB', 'RTX 4070 - 32GB - 1TB'] },
      { name: 'MÀU SẮC', values: ['Star Blue', 'Pure White'] }
    ]
  },

  // 7. Màn hình & Phụ kiện
  {
    name: 'Màn hình Dell UltraSharp U2724D',
    category: 'Màn hình',
    brand: 'Dell',
    basePrice: 10490000,
    thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&fit=crop',
    specs: { resolution: '27 inch 2K QHD (2560x1440)', panel: 'IPS Black 120Hz', color: '100% sRGB, 98% DCI-P3', ports: 'Thunderbolt 4, DP, HDMI, RJ45' },
    attributes: [
      { name: 'KÍCH THƯỚC', values: ['27 inch 2K', '32 inch 4K'] },
      { name: 'CỔNG KẾT NỐI', values: ['Tiêu chuẩn (U2724D)', 'Có Hub Type-C 90W (U2724DE)'] }
    ]
  },
  {
    name: 'Màn hình LG UltraFine 27UP850N-W 4K',
    category: 'Màn hình',
    brand: 'LG',
    basePrice: 8990000,
    thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&fit=crop',
    specs: { resolution: '27 inch 4K UHD (3840x2160)', panel: 'IPS HDR400', color: 'DCI-P3 95%', power: 'USB-C sạc 96W' },
    attributes: [
      { name: 'KÍCH THƯỚC', values: ['27 inch 4K', '32 inch 4K'] },
      { name: 'MÀU SẮC', values: ['Trắng bạc', 'Đen'] }
    ]
  },
  {
    name: 'Bàn phím cơ Keychron Q1 Pro Wireless',
    category: 'Bàn phím',
    brand: 'Keychron',
    basePrice: 4290000,
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&fit=crop',
    specs: { layout: '75% Layout', case: 'Full nhôm CNC', battery: '4000mAh', connectivity: 'Bluetooth 5.1 & Type-C' },
    attributes: [
      { name: 'SWITCH', values: ['K Pro Red (Linear)', 'K Pro Brown (Tactile)', 'K Pro Banana'] },
      { name: 'MÀU VỎ', values: ['Carbon Black', 'Silver Grey', 'Shell White'] }
    ]
  },
  {
    name: 'Bàn phím cơ Logitech G915 TKL Lightspeed',
    category: 'Bàn phím',
    brand: 'Logitech',
    basePrice: 3890000,
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&fit=crop',
    specs: { switch: 'GL Low Profile cơ học', battery: '40 giờ bật RGB', connectivity: 'Lightspeed 1ms & Bluetooth' },
    attributes: [
      { name: 'SWITCH', values: ['GL Tactile', 'GL Linear', 'GL Clicky'] },
      { name: 'MÀU SẮC', values: ['Carbon Black', 'White'] }
    ]
  },
  {
    name: 'Chuột không dây Logitech MX Master 3S',
    category: 'Phụ kiện',
    brand: 'Logitech',
    basePrice: 2290000,
    thumbnail: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&fit=crop',
    specs: { sensor: 'Darkfield 8000 DPI', click: 'Quiet Clicks giảm 90% ồn', scroll: 'MagSpeed điện từ', battery: '70 ngày' },
    attributes: [
      { name: 'PHIÊN BẢN', values: ['Dành cho Windows/Mac', 'Dành riêng cho Mac'] },
      { name: 'MÀU SẮC', values: ['Graphite', 'Pale Grey'] }
    ]
  },
  {
    name: 'Tai nghe Sony WH-1000XM5 Chống ồn',
    category: 'Âm thanh',
    brand: 'Sony',
    basePrice: 6990000,
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&fit=crop',
    specs: { noiseCancelling: 'Bộ xử lý V1 + QN1', driver: '30mm màng sợi carbon', battery: '30 giờ nghe nhạc', codec: 'LDAC, Hi-Res Audio' },
    attributes: [
      { name: 'PHIÊN BẢN', values: ['Bản tiêu chuẩn'] },
      { name: 'MÀU SẮC', values: ['Đen', 'Bạc ánh kim', 'Midnight Blue'] }
    ]
  },
  {
    name: 'Loa Bluetooth Marshall Stanmore III',
    category: 'Âm thanh',
    brand: 'Marshall',
    basePrice: 8990000,
    thumbnail: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&fit=crop',
    specs: { power: 'Công suất 80W Class D', connectivity: 'Bluetooth 5.2, AUX 3.5mm, RCA', design: 'Vintage cổ điển' },
    attributes: [
      { name: 'PHIÊN BẢN', values: ['Stanmore III Chính Hãng'] },
      { name: 'MÀU SẮC', values: ['Black', 'Cream', 'Brown'] }
    ]
  }
];

async function seedData() {
  const transaction = await sequelize.transaction();
  try {
    console.log(`🚀 Bắt đầu seed ${baseProducts.length} sản phẩm đầy đủ biến thể...`);

    // Thiết lập inventory context để trigger audit cho phép tạo tồn kho đầu kỳ (OPENING)
    await sequelize.query(
      "SELECT set_config('app.inventory_context', :ctx, true)",
      {
        replacements: {
          ctx: JSON.stringify({
            actorName: 'SeedScript',
            source: 'SEED',
            type: 'OPENING',
            reason: 'Khởi tạo dữ liệu mẫu hệ thống',
          }),
        },
        transaction,
      }
    );

    // 1. Quản lý Danh mục (Categories)
    const categoryMap = {};
    const distinctCategories = [...new Set(baseProducts.map(p => p.category))];

    for (const catName of distinctCategories) {
      const slug = catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      let cat = await Category.findOne({ where: { slug }, transaction });
      if (!cat) {
        cat = await Category.create({
          id: uuidv4(),
          name: catName,
          slug,
          description: `Danh mục sản phẩm ${catName}`,
          isActive: true
        }, { transaction });
      }
      categoryMap[catName] = cat.id;
    }

    // 2. Tạo từng sản phẩm và biến thể
    let totalVariantsCount = 0;

    for (const item of baseProducts) {
      const productId = uuidv4();
      const slug = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

      const product = await Product.create({
        id: productId,
        name: item.name,
        baseName: item.name,
        slug,
        shortDescription: `${item.name} - Sản phẩm cao cấp, chính hãng với hiệu năng vượt trội.`,
        description: `<p><strong>${item.name}</strong> là sự lựa chọn hàng đầu cho công việc và giải trí đỉnh cao. Thiết kế đẳng cấp, bảo hành chính hãng 12-24 tháng.</p>`,
        price: item.basePrice,
        compareAtPrice: Math.round(item.basePrice * 1.15),
        thumbnail: item.thumbnail,
        images: [item.thumbnail],
        categoryId: categoryMap[item.category],
        status: 'active',
        featured: Math.random() > 0.4,
        brand: item.brand,
        condition: 'new',
        isVariantProduct: true,
        stockQuantity: 0,
        inStock: true,
        soldCount: Math.floor(Math.random() * 40) + 5,
        viewCount: Math.floor(Math.random() * 200) + 50,
        minVariantPrice: item.basePrice,
      }, { transaction });

      // Gán category quan hệ n-n
      if (categoryMap[item.category]) {
        await product.setCategories([categoryMap[item.category]], { transaction });
      }

      // Tạo specifications
      const specsList = Object.entries(item.specs).map(([name, value], idx) => ({
        id: uuidv4(),
        productId,
        name,
        value,
        category: 'Thông số kỹ thuật',
        sortOrder: idx
      }));
      await ProductSpecification.bulkCreate(specsList, { transaction });

      // Tạo attributes
      for (const attr of item.attributes) {
        await ProductAttribute.create({
          id: uuidv4(),
          productId,
          name: attr.name,
          values: attr.values,
          type: 'custom',
        }, { transaction });
      }

      // Tạo tổ hợp biến thể (Variants)
      const attr1 = item.attributes[0];
      const attr2 = item.attributes[1];
      const variantsToCreate = [];
      let productStockTotal = 0;
      let minPrice = item.basePrice;

      let varIndex = 0;
      for (let i = 0; i < attr1.values.length; i++) {
        const val1 = attr1.values[i];
        for (let j = 0; j < (attr2 ? attr2.values.length : 1); j++) {
          const val2 = attr2 ? attr2.values[j] : null;
          varIndex++;

          // Tính giá tăng theo cấu hình option
          const variantPrice = item.basePrice + (i * 3500000);
          if (variantPrice < minPrice) minPrice = variantPrice;

          const variantStock = Math.floor(Math.random() * 25) + 8; // Tồn từ 8 đến 32 cái
          productStockTotal += variantStock;

          const variantAttributes = { [attr1.name]: val1 };
          if (val2) variantAttributes[attr2.name] = val2;

          const variantName = val2 ? `${val1} - ${val2}` : val1;
          const cleanSkuCode = `${val1}-${val2 || ''}`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const sku = `SKU-${product.id.slice(0, 8)}-${cleanSkuCode.slice(0, 16)}`;

          variantsToCreate.push({
            id: uuidv4(),
            productId,
            name: variantName,
            displayName: `${item.name} (${variantName})`,
            sku,
            price: variantPrice,
            compareAtPrice: Math.round(variantPrice * 1.15),
            stockQuantity: variantStock,
            attributes: variantAttributes,
            isDefault: varIndex === 1, // Bản đầu tiên làm mặc định
            isAvailable: true,
            sortOrder: varIndex,
          });
        }
      }

      await ProductVariant.bulkCreate(variantsToCreate, { transaction });
      totalVariantsCount += variantsToCreate.length;

      // Cập nhật lại tồn kho tổng và giá tối thiểu cho sản phẩm cha
      await product.update({
        stockQuantity: productStockTotal,
        inStock: productStockTotal > 0,
        price: minPrice,
        minVariantPrice: minPrice,
      }, { transaction });

      console.log(`✅ [${item.category}] ${item.name} -> Đã tạo ${variantsToCreate.length} biến thể (Tổng tồn: ${productStockTotal})`);
    }

    await transaction.commit();
    console.log(`\n🎉 HOÀN THÀNH SEED DỮ LIỆU THÀNH CÔNG!`);
    console.log(`📊 Tổng kết:`);
    console.log(`   - Số sản phẩm: ${baseProducts.length}`);
    console.log(`   - Tổng số biến thể: ${totalVariantsCount}`);
    console.log(`   - Đầy đủ Attributes, Specs, Categories và Stock đồng bộ.`);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
}

seedData().then(() => {
  process.exit(0);
});

