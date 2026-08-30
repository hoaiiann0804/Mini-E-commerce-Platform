const {
  Product,
  Category,
  ProductAttribute,
  ProductVariant,
  ProductSpecification,
  sequelize,
} = require('../src/models');
const { v4: uuidv4 } = require('uuid');

const brands = ['Asus', 'Acer', 'Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'Sony', 'Logitech', 'Razer'];
const categories = ['Laptop', 'Điện thoại', 'Phụ kiện', 'Màn hình', 'Âm thanh'];
const prefixes = ['Pro', 'Ultra', 'Max', 'Gaming', 'Office', 'Slim', 'Plus', 'Elite'];
const adjectives = ['Siêu mượt', 'Cực mạnh', 'Giá rẻ', 'Cao cấp', 'Chính hãng', 'Nhập khẩu', 'Mới 100%'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice() {
  // 500,000 to 50,000,000
  return Math.floor(Math.random() * 500 + 5) * 100000;
}

function getRandomImages() {
  const allImages = [
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1606220588913-b3eea2ce405c?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1526876798423-97e53fb23428?w=800&h=800&fit=crop',
  ];
  return [getRandomItem(allImages), getRandomItem(allImages)];
}

async function seedRandomProducts() {
  try {
    console.log('🚀 Bắt đầu tạo 50 sản phẩm ngẫu nhiên...');

    // Get categories or create if empty (should have from previous script)
    const dbCategories = await Category.findAll();
    const categoryMap = {};
    for (const cat of dbCategories) {
      categoryMap[cat.name] = cat.id;
    }

    for (let i = 1; i <= 50; i++) {
      const brand = getRandomItem(brands);
      const catName = getRandomItem(categories);
      const prefix = getRandomItem(prefixes);
      const adj = getRandomItem(adjectives);
      
      const name = `${catName} ${brand} ${prefix} ${Math.floor(Math.random() * 9000) + 1000}`;
      const shortDescription = `${name} - ${adj} tốt nhất trong tầm giá.`;
      const description = `Sản phẩm ${name} mang đến trải nghiệm tuyệt vời. ${adj}, độ bền cao, bảo hành dài hạn. Phù hợp cho mọi nhu cầu từ cơ bản đến nâng cao.`;
      const price = getRandomPrice();
      const compareAtPrice = price + Math.floor(Math.random() * 5 + 1) * 500000;
      const images = getRandomImages();

      let categoryId = categoryMap[catName];
      if (!categoryId) {
        const newCat = await Category.create({ 
          id: uuidv4(), name: catName, slug: catName.toLowerCase().replace(/ /g, '-'), isActive: true 
        });
        categoryMap[catName] = newCat.id;
        categoryId = newCat.id;
      }

      const productId = uuidv4();
      await Product.create({
        id: productId,
        name,
        slug: name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000),
        shortDescription,
        description,
        price,
        compareAtPrice,
        thumbnail: images[0],
        images,
        categoryId,
        tags: [brand.toLowerCase(), prefix.toLowerCase(), '2024'],
        status: 'active',
        featured: Math.random() > 0.8,
        brand,
        model: `${prefix} ${Math.floor(Math.random() * 100)}`,
        condition: 'new',
        warrantyMonths: 12,
        stock: Math.floor(Math.random() * 50) + 5,
        soldCount: Math.floor(Math.random() * 20)
      });

      // Specifications
      const specs = [
        { id: uuidv4(), productId, category: 'Khác', name: 'Màu sắc', value: 'Đen/Trắng/Bạc' },
        { id: uuidv4(), productId, category: 'Khác', name: 'Năm sản xuất', value: '2024' }
      ];
      await ProductSpecification.bulkCreate(specs);

      console.log(`[${i}/50] Tạo thành công: ${name}`);
    }

    console.log('✅ Hoàn thành tạo 50 sản phẩm!');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

seedRandomProducts();
