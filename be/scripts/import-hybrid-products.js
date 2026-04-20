const {
  Product,
  Category,
  ProductAttribute,
  ProductVariant,
  ProductSpecification,
  OrderItem,
  CartItem,
  sequelize,
} = require('../src/models');
const { v4: uuidv4 } = require('uuid');

// Helper function để phân loại specifications
function getSpecificationCategory(specName) {
  const categories = {
    'Hiệu năng': ['cpu', 'ram', 'graphics', 'storage'],
    'Màn hình': ['display', 'screen', 'resolution'],
    'Thiết kế': ['weight', 'dimensions', 'color', 'material'],
    'Kết nối': ['ports', 'connectivity', 'wireless', 'bluetooth', 'wifi'],
    'Pin & Nguồn': ['battery', 'power', 'adapter'],
    'Hệ điều hành': ['os', 'operating'],
    'Bảo mật': ['security', 'fingerprint', 'camera'],
    'Âm thanh': ['audio', 'speaker', 'microphone'],
    'Bàn phím': ['keyboard', 'trackpad', 'touchpad'],
    Khác: ['certification', 'warranty', 'accessories'],
  };

  const lowerSpecName = specName.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerSpecName.includes(keyword))) {
      return category;
    }
  }

  return 'Thông số chung';
}

const sampleProducts = [
  // === LENOVO THINKPAD P16 GEN 1 ===
  {
    name: 'Lenovo ThinkPad P16 Gen 1',
    shortDescription: 'Workstation di động mạnh mẽ với RTX A1000 4GB',
    description:
      'Lenovo ThinkPad P16 Gen 1 là workstation di động cao cấp với CPU Intel Core i7-12850HX, RAM 16GB DDR5, SSD 512GB PCIe Gen 4, VGA RTX A1000 4GB, màn hình 16 inch WQXGA (2560x1600). Thiết kế chắc chắn với tiêu chuẩn quân đội MIL-STD-810H.',
    price: 85990000,
    compareAtPrice: 95990000,
    thumbnail:
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['lenovo', 'thinkpad', 'workstation', 'p16', 'rtx'],
    status: 'active',
    featured: true,
    brand: 'Lenovo',
    model: 'ThinkPad P16 Gen 1',
    condition: 'new',
    warrantyMonths: 36,
    specifications: {
      cpu: 'Intel Core i7-12850HX',
      ram: '16GB DDR5',
      storage: '512GB SSD',
      graphics: 'NVIDIA RTX A1000',
      display: '16 inch WQXGA (2560x1600)',
      weight: '2.95kg',
      battery: '94Wh',
      ports: 'USB-A, USB-C, HDMI, Thunderbolt 4',
      os: 'Windows 11 Pro',
      keyboard: 'Backlit Keyboard',
      security: 'Fingerprint Reader',
    },
    attributes: [
      {
        name: 'CPU',
        values: ['Intel Core i5-12600H', 'Intel Core i7-12850HX'],
      },
      { name: 'RAM', values: ['16GB DDR5', '32GB DDR5', '64GB DDR5'] },
      { name: 'Storage', values: ['512GB SSD', '1TB SSD', '2TB SSD'] },
      { name: 'Graphics', values: ['RTX A1000', 'RTX A2000'] },
    ],
    variants: [
      {
        name: 'i5-12600H - 16GB - 512GB - RTX A1000',
        displayName: 'Core i5 - 16GB - 512GB',
        attributes: {
          CPU: 'Intel Core i5-12600H',
          RAM: '16GB DDR5',
          Storage: '512GB SSD',
          Graphics: 'RTX A1000',
        },
        price: 75990000,
        stock: 8,
        isDefault: true,
      },
      {
        name: 'i7-12850HX - 16GB - 512GB - RTX A1000',
        displayName: 'Core i7 - 16GB - 512GB',
        attributes: {
          CPU: 'Intel Core i7-12850HX',
          RAM: '16GB DDR5',
          Storage: '512GB SSD',
          Graphics: 'RTX A1000',
        },
        price: 85990000,
        stock: 12,
      },
      {
        name: 'i7-12850HX - 32GB - 1TB - RTX A1000',
        displayName: 'Core i7 - 32GB - 1TB',
        attributes: {
          CPU: 'Intel Core i7-12850HX',
          RAM: '32GB DDR5',
          Storage: '1TB SSD',
          Graphics: 'RTX A1000',
        },
        price: 105990000,
        stock: 6,
      },
      {
        name: 'i7-12850HX - 32GB - 1TB - RTX A2000',
        displayName: 'Core i7 - 32GB - 1TB - RTX A2000',
        attributes: {
          CPU: 'Intel Core i7-12850HX',
          RAM: '32GB DDR5',
          Storage: '1TB SSD',
          Graphics: 'RTX A2000',
        },
        price: 125990000,
        stock: 3,
      },
    ],
  },

  // === LENOVO THINKPAD T14 GEN 3 ===
  {
    name: 'Lenovo ThinkPad T14 Gen 3',
    shortDescription: 'Laptop business cao cấp với AMD Ryzen 7',
    description:
      'Lenovo ThinkPad T14 Gen 3 với AMD Ryzen 7 PRO 6850U, RAM 16GB DDR4, SSD 512GB, màn hình 14 inch FHD IPS. Thiết kế mỏng nhẹ nhưng vẫn đảm bảo độ bền và hiệu năng cho doanh nghiệp.',
    price: 28990000,
    compareAtPrice: 34990000,
    thumbnail:
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['lenovo', 'thinkpad', 't14', 'business', 'amd'],
    status: 'active',
    featured: true,
    brand: 'Lenovo',
    model: 'ThinkPad T14 Gen 3',
    condition: 'new',
    warrantyMonths: 24,
    specifications: {
      cpu: 'AMD Ryzen 7 PRO 6850U',
      ram: '16GB DDR4',
      storage: '512GB SSD',
      graphics: 'AMD Radeon 680M',
      display: '14 inch FHD (1920x1080)',
      weight: '1.46kg',
      battery: '52.5Wh',
      ports: 'USB-A, USB-C, HDMI, Ethernet',
      os: 'Windows 11 Pro',
      keyboard: 'Backlit Keyboard',
      security: 'Fingerprint + IR Camera',
    },
    attributes: [
      {
        name: 'CPU',
        values: ['AMD Ryzen 5 PRO 6650U', 'AMD Ryzen 7 PRO 6850U'],
      },
      { name: 'RAM', values: ['8GB DDR4', '16GB DDR4', '32GB DDR4'] },
      { name: 'Storage', values: ['256GB SSD', '512GB SSD', '1TB SSD'] },
    ],
    variants: [
      {
        name: 'Ryzen 5 - 8GB - 256GB',
        displayName: 'Ryzen 5 - 8GB - 256GB',
        attributes: {
          CPU: 'AMD Ryzen 5 PRO 6650U',
          RAM: '8GB DDR4',
          Storage: '256GB SSD',
        },
        price: 22990000,
        stock: 15,
      },
      {
        name: 'Ryzen 7 - 16GB - 512GB',
        displayName: 'Ryzen 7 - 16GB - 512GB',
        attributes: {
          CPU: 'AMD Ryzen 7 PRO 6850U',
          RAM: '16GB DDR4',
          Storage: '512GB SSD',
        },
        price: 28990000,
        stock: 10,
        isDefault: true,
      },
      {
        name: 'Ryzen 7 - 32GB - 1TB',
        displayName: 'Ryzen 7 - 32GB - 1TB',
        attributes: {
          CPU: 'AMD Ryzen 7 PRO 6850U',
          RAM: '32GB DDR4',
          Storage: '1TB SSD',
        },
        price: 38990000,
        stock: 5,
      },
    ],
  },

  // === LENOVO THINKPAD X1 CARBON GEN 10 ===
  {
    name: 'Lenovo ThinkPad X1 Carbon Gen 10',
    shortDescription: 'Ultrabook cao cấp siêu mỏng nhẹ',
    description:
      'Lenovo ThinkPad X1 Carbon Gen 10 với Intel Core i7-1260P, RAM 16GB LPDDR5, SSD 1TB, màn hình 14 inch 2.8K OLED. Thiết kế carbon fiber siêu mỏng nhẹ chỉ 1.12kg, pin 57Wh.',
    price: 45990000,
    compareAtPrice: 52990000,
    thumbnail:
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['lenovo', 'thinkpad', 'x1', 'carbon', 'ultrabook'],
    status: 'active',
    featured: true,
    brand: 'Lenovo',
    model: 'ThinkPad X1 Carbon Gen 10',
    condition: 'new',
    warrantyMonths: 36,
    specifications: {
      cpu: 'Intel Core i7-1260P',
      ram: '16GB LPDDR5',
      storage: '1TB SSD',
      graphics: 'Intel Iris Xe',
      display: '14 inch 2.8K OLED (2880x1800)',
      weight: '1.12kg',
      battery: '57Wh',
      ports: 'USB-A, USB-C, Thunderbolt 4',
      os: 'Windows 11 Pro',
      keyboard: 'Backlit Keyboard',
      security: 'Fingerprint + IR Camera',
    },
    attributes: [
      { name: 'CPU', values: ['Intel Core i5-1240P', 'Intel Core i7-1260P'] },
      { name: 'RAM', values: ['16GB LPDDR5', '32GB LPDDR5'] },
      { name: 'Storage', values: ['512GB SSD', '1TB SSD', '2TB SSD'] },
      { name: 'Display', values: ['14 inch FHD', '14 inch 2.8K OLED'] },
    ],
    variants: [
      {
        name: 'i5-1240P - 16GB - 512GB - FHD',
        displayName: 'Core i5 - 16GB - 512GB - FHD',
        attributes: {
          CPU: 'Intel Core i5-1240P',
          RAM: '16GB LPDDR5',
          Storage: '512GB SSD',
          Display: '14 inch FHD',
        },
        price: 38990000,
        stock: 8,
      },
      {
        name: 'i7-1260P - 16GB - 1TB - OLED',
        displayName: 'Core i7 - 16GB - 1TB - OLED',
        attributes: {
          CPU: 'Intel Core i7-1260P',
          RAM: '16GB LPDDR5',
          Storage: '1TB SSD',
          Display: '14 inch 2.8K OLED',
        },
        price: 45990000,
        stock: 6,
        isDefault: true,
      },
      {
        name: 'i7-1260P - 32GB - 2TB - OLED',
        displayName: 'Core i7 - 32GB - 2TB - OLED',
        attributes: {
          CPU: 'Intel Core i7-1260P',
          RAM: '32GB LPDDR5',
          Storage: '2TB SSD',
          Display: '14 inch 2.8K OLED',
        },
        price: 65990000,
        stock: 2,
      },
    ],
  },

  // === LENOVO THINKPAD E14 GEN 4 ===
  {
    name: 'Lenovo ThinkPad E14 Gen 4',
    shortDescription: 'Laptop văn phòng giá tốt cho doanh nghiệp nhỏ',
    description:
      'Lenovo ThinkPad E14 Gen 4 với Intel Core i5-1235U, RAM 8GB DDR4, SSD 256GB, màn hình 14 inch FHD. Giải pháp laptop văn phòng tối ưu với chất lượng ThinkPad nhưng giá cả phải chăng.',
    price: 18990000,
    compareAtPrice: 22990000,
    thumbnail:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['lenovo', 'thinkpad', 'e14', 'office', 'budget'],
    status: 'active',
    featured: false,
    brand: 'Lenovo',
    model: 'ThinkPad E14 Gen 4',
    condition: 'new',
    warrantyMonths: 12,
    specifications: {
      cpu: 'Intel Core i5-1235U',
      ram: '8GB DDR4',
      storage: '256GB SSD',
      graphics: 'Intel Iris Xe',
      display: '14 inch FHD (1920x1080)',
      weight: '1.64kg',
      battery: '45Wh',
      ports: 'USB-A, USB-C, HDMI, Ethernet',
      os: 'Windows 11 Home',
      keyboard: 'Standard Keyboard',
      security: 'Fingerprint Reader',
    },
    attributes: [
      { name: 'CPU', values: ['Intel Core i3-1215U', 'Intel Core i5-1235U'] },
      { name: 'RAM', values: ['8GB DDR4', '16GB DDR4'] },
      { name: 'Storage', values: ['256GB SSD', '512GB SSD'] },
    ],
    variants: [
      {
        name: 'i3-1215U - 8GB - 256GB',
        displayName: 'Core i3 - 8GB - 256GB',
        attributes: {
          CPU: 'Intel Core i3-1215U',
          RAM: '8GB DDR4',
          Storage: '256GB SSD',
        },
        price: 15990000,
        stock: 20,
      },
      {
        name: 'i5-1235U - 8GB - 256GB',
        displayName: 'Core i5 - 8GB - 256GB',
        attributes: {
          CPU: 'Intel Core i5-1235U',
          RAM: '8GB DDR4',
          Storage: '256GB SSD',
        },
        price: 18990000,
        stock: 15,
        isDefault: true,
      },
      {
        name: 'i5-1235U - 16GB - 512GB',
        displayName: 'Core i5 - 16GB - 512GB',
        attributes: {
          CPU: 'Intel Core i5-1235U',
          RAM: '16GB DDR4',
          Storage: '512GB SSD',
        },
        price: 24990000,
        stock: 10,
      },
    ],
  },

  // === LENOVO THINKPAD P1 GEN 5 ===
  {
    name: 'Lenovo ThinkPad P1 Gen 5',
    shortDescription: 'Mobile workstation siêu mỏng với RTX A2000',
    description:
      'Lenovo ThinkPad P1 Gen 5 là mobile workstation cao cấp với Intel Core i7-12800H, RAM 32GB DDR5, SSD 1TB, RTX A2000 8GB, màn hình 16 inch 4K OLED. Thiết kế mỏng nhẹ nhưng hiệu năng mạnh mẽ.',
    price: 115990000,
    compareAtPrice: 129990000,
    thumbnail:
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['lenovo', 'thinkpad', 'p1', 'workstation', 'oled'],
    status: 'active',
    featured: true,
    brand: 'Lenovo',
    model: 'ThinkPad P1 Gen 5',
    condition: 'new',
    warrantyMonths: 36,
    specifications: {
      cpu: 'Intel Core i7-12800H',
      ram: '32GB DDR5',
      storage: '1TB SSD',
      graphics: 'NVIDIA RTX A2000',
      display: '16 inch 4K OLED (3840x2400)',
      weight: '1.86kg',
      battery: '90Wh',
      ports: 'USB-A, USB-C, HDMI, Thunderbolt 4',
      os: 'Windows 11 Pro',
      keyboard: 'RGB Keyboard',
      security: 'Fingerprint + IR Camera',
    },
    attributes: [
      { name: 'CPU', values: ['Intel Core i7-12800H', 'Intel Core i9-12900H'] },
      { name: 'RAM', values: ['16GB DDR5', '32GB DDR5', '64GB DDR5'] },
      { name: 'Storage', values: ['512GB SSD', '1TB SSD', '2TB SSD'] },
      { name: 'Graphics', values: ['RTX A1000', 'RTX A2000'] },
    ],
    variants: [
      {
        name: 'i7-12800H - 16GB - 512GB - RTX A1000',
        displayName: 'Core i7 - 16GB - 512GB - RTX A1000',
        attributes: {
          CPU: 'Intel Core i7-12800H',
          RAM: '16GB DDR5',
          Storage: '512GB SSD',
          Graphics: 'RTX A1000',
        },
        price: 95990000,
        stock: 4,
      },
      {
        name: 'i7-12800H - 32GB - 1TB - RTX A2000',
        displayName: 'Core i7 - 32GB - 1TB - RTX A2000',
        attributes: {
          CPU: 'Intel Core i7-12800H',
          RAM: '32GB DDR5',
          Storage: '1TB SSD',
          Graphics: 'RTX A2000',
        },
        price: 115990000,
        stock: 2,
        isDefault: true,
      },
      {
        name: 'i9-12900H - 64GB - 2TB - RTX A2000',
        displayName: 'Core i9 - 64GB - 2TB - RTX A2000',
        attributes: {
          CPU: 'Intel Core i9-12900H',
          RAM: '64GB DDR5',
          Storage: '2TB SSD',
          Graphics: 'RTX A2000',
        },
        price: 155990000,
        stock: 1,
      },
    ],
  },

  // === MSI MODERN 14 C12MO-660VN ===
  {
    name: 'Laptop MSI Modern 14 C12MO-660VN',
    shortDescription: 'Laptop doanh nhân hiện đại với Intel Core i5 thế hệ 12',
    description:
      'Laptop MSI Modern 14 C12MO-660VN là chiếc laptop doanh nhân có nhiều cải tiến về sức mạnh và thiết kế. Được tích hợp CPU Intel Core i5-1235U thế hệ 12, RAM DDR4 16GB, SSD 512GB PCIe NVMe, card đồ họa Intel Iris Xe Graphics. Thiết kế mỏng nhẹ chỉ 1.4kg với màn hình 14 inch Full HD IPS, bàn phím có đèn nền và đạt tiêu chuẩn quân sự MIL-STD-810G.',
    price: 18990000,
    compareAtPrice: 21990000,
    thumbnail:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['msi', 'modern', 'business', 'intel', 'core-i5'],
    status: 'active',
    featured: true,
    brand: 'MSI',
    model: 'Modern 14 C12MO-660VN',
    condition: 'new',
    warrantyMonths: 24,
    specifications: {
      cpu: 'Intel Core i5-1235U',
      ram: '16GB DDR4 3200MHz',
      storage: '512GB SSD M.2 PCIe NVMe Gen3 x4',
      graphics: 'Intel Iris Xe Graphics',
      display: '14 inch Full HD (1920x1080) IPS',
      weight: '1.4kg',
      battery: '39WHrs 3-cell',
      ports:
        '1x USB 3.2 Gen2 Type-A, 2x USB 2.0, 1x USB Type-C, 1x HDMI, 1x MicroSD, 1x Audio Jack',
      os: 'Windows 11 Home',
      keyboard: 'Backlit Keyboard',
      security: 'Fingerprint Reader',
      connectivity: 'Wi-Fi 6, Bluetooth 5.2',
      certification: 'MIL-STD-810G',
    },
    attributes: [
      {
        name: 'BỘ VI XỬ LÝ',
        values: ['R7-7730U', 'i5-1335U', 'i7-1255U'],
      },
      { name: 'RAM', values: ['8GB', '16GB'] },
      { name: 'MÀN HÌNH', values: ['14 inch', '15.6 inch'] },
    ],
    variants: [
      {
        name: 'R7-7730U - 8GB - 14 inch',
        displayName: 'AMD Ryzen 7 - 8GB - 14 inch',
        attributes: {
          'BỘ VI XỬ LÝ': 'R7-7730U',
          RAM: '8GB',
          'MÀN HÌNH': '14 inch',
        },
        price: 16990000,
        stock: 5,
        isDefault: true,
      },
      {
        name: 'R7-7730U - 8GB - 15.6 inch',
        displayName: 'AMD Ryzen 7 - 8GB - 15.6 inch',
        attributes: {
          'BỘ VI XỬ LÝ': 'R7-7730U',
          RAM: '8GB',
          'MÀN HÌNH': '15.6 inch',
        },
        price: 17990000,
        stock: 3,
      },
      {
        name: 'R7-7730U - 16GB - 14 inch',
        displayName: 'AMD Ryzen 7 - 16GB - 14 inch',
        attributes: {
          'BỘ VI XỬ LÝ': 'R7-7730U',
          RAM: '16GB',
          'MÀN HÌNH': '14 inch',
        },
        price: 19990000,
        stock: 4,
      },
      {
        name: 'R7-7730U - 16GB - 15.6 inch',
        displayName: 'AMD Ryzen 7 - 16GB - 15.6 inch',
        attributes: {
          'BỘ VI XỬ LÝ': 'R7-7730U',
          RAM: '16GB',
          'MÀN HÌNH': '15.6 inch',
        },
        price: 20990000,
        stock: 2,
      },
      {
        name: 'i5-1335U - 16GB - 15.6 inch',
        displayName: 'Intel Core i5 - 16GB - 15.6 inch',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1335U',
          RAM: '16GB',
          'MÀN HÌNH': '15.6 inch',
        },
        price: 21990000,
        stock: 6,
      },
      {
        name: 'i7-1255U - 16GB - 14 inch',
        displayName: 'Intel Core i7 - 16GB - 14 inch',
        attributes: {
          'BỘ VI XỬ LÝ': 'i7-1255U',
          RAM: '16GB',
          'MÀN HÌNH': '14 inch',
        },
        price: 24990000,
        stock: 3,
      },
    ],
  },

  // === ASUS VIVOBOOK 15 X1504VA ===
  {
    name: 'Laptop ASUS Vivobook 15 X1504VA-NJ025W',
    shortDescription: 'Laptop học tập văn phòng với Intel Core i5 thế hệ 13',
    description:
      'ASUS Vivobook 15 X1504VA là laptop lý tưởng cho học sinh, sinh viên và nhân viên văn phòng. Được trang bị CPU Intel Core i5-1335U thế hệ 13, RAM 8GB DDR4, SSD 512GB PCIe. Màn hình 15.6 inch Full HD IPS với viền mỏng, bàn phím có đèn nền và touchpad lớn. Thiết kế hiện đại với trọng lượng chỉ 1.7kg, pin 42WHrs cho thời gian sử dụng lâu dài.',
    price: 15990000,
    compareAtPrice: 18990000,
    thumbnail:
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['asus', 'vivobook', 'student', 'intel', 'core-i5'],
    status: 'active',
    featured: true,
    brand: 'ASUS',
    model: 'Vivobook 15 X1504VA-NJ025W',
    condition: 'new',
    warrantyMonths: 24,
    specifications: {
      cpu: 'Intel Core i5-1335U',
      ram: '8GB DDR4 3200MHz',
      storage: '512GB SSD M.2 PCIe NVMe',
      graphics: 'Intel Iris Xe Graphics',
      display: '15.6 inch Full HD (1920x1080) IPS',
      weight: '1.7kg',
      battery: '42WHrs 3-cell',
      ports:
        '1x USB 3.2 Gen1 Type-A, 2x USB 2.0, 1x USB Type-C, 1x HDMI, 1x MicroSD, 1x Audio Jack',
      os: 'Windows 11 Home',
      keyboard: 'Backlit Keyboard',
      connectivity: 'Wi-Fi 6, Bluetooth 5.0',
      color: 'Transparent Silver',
    },
    attributes: [
      {
        name: 'BỘ VI XỬ LÝ',
        values: ['i5-1335U', 'i7-1355U', 'R5-7530U'],
      },
      { name: 'RAM', values: ['8GB', '16GB'] },
      { name: 'Ổ CỨNG', values: ['512GB SSD', '1TB SSD'] },
    ],
    variants: [
      {
        name: 'i5-1335U - 8GB - 512GB SSD',
        displayName: 'Intel Core i5 - 8GB - 512GB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1335U',
          RAM: '8GB',
          'Ổ CỨNG': '512GB SSD',
        },
        price: 15990000,
        stock: 8,
        isDefault: true,
      },
      {
        name: 'i5-1335U - 16GB - 512GB SSD',
        displayName: 'Intel Core i5 - 16GB - 512GB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1335U',
          RAM: '16GB',
          'Ổ CỨNG': '512GB SSD',
        },
        price: 18990000,
        stock: 5,
      },
      {
        name: 'i7-1355U - 16GB - 1TB SSD',
        displayName: 'Intel Core i7 - 16GB - 1TB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'i7-1355U',
          RAM: '16GB',
          'Ổ CỨNG': '1TB SSD',
        },
        price: 24990000,
        stock: 3,
      },
      {
        name: 'R5-7530U - 8GB - 512GB SSD',
        displayName: 'AMD Ryzen 5 - 8GB - 512GB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'R5-7530U',
          RAM: '8GB',
          'Ổ CỨNG': '512GB SSD',
        },
        price: 14990000,
        stock: 6,
      },
    ],
  },

  // === HP PAVILION 15-EG2081TU ===
  {
    name: 'Laptop HP Pavilion 15-eg2081TU',
    shortDescription:
      'Laptop đa năng với thiết kế thanh lịch và hiệu năng ổn định',
    description: `Laptop MSI Modern 14 C12MO-660VN - Thoải mái lưu trữ, xử lý nhanh chóng 
Laptop MSI Modern 14 C12MO-660VN là chiếc laptop doanh nhân có nhiều cải tiến về sức mạnh và thiết kế. Cụ thể thiết bị được tích hợp chiếc CPU Intel core i5 và vỏ nhựa bền bỉ và rất nhẹ. Hãy xem đoạn mô tả sau đây để biết được thiết kế của laptop MSI Modern sang trọng như thế nào và khả năng xử lý dữ liệu ra sao nhé!

Tăng tốc độ xử lý, lưu trữ linh hoạt 
Laptop MSI Modern 14 C12MO-660VN được tích hợp chiếc Ram DDR4 3200 MHz giúp nâng cao hiệu suất hệ thống tổng thể, tăng tốc quá trình chạy ứng dụng. Thiết bị cũng cho phép đa nhiệm tốt hơn, hỗ trợ tốt cho quá trình thiết kế đồ họa, làm video,...

Laptop MSI Modern 14 C12MO-660VN

Thiết bị cho phép người dùng có đủ không gian lưu trữ với ổ cứng SSD M.2 PCle, đồng thời giảm thời gian khởi động và tắt máy. Ổ cứng này cũng có kích thước nhỏ gọn giúp tiết kiệm không gian cho hệ thống.

Truy xuất cực nhanh, card đồ họa 
Laptop MSI Modern 14 C12MO-660VN được tích hợp bộ vi xử lý Intel Core thế hệ 12 i5-1235U. Bộ chipset này có tốc độ xung nhịp lên tới 4.4 GHz mang tới hiệu năng ấn tượng.

Laptop MSI Modern 14 C12MO-660VN

Chiếc laptop này được tích hợp thêm card đồ họa VGA Intel Iris Xe Graphic hỗ trợ thiết kế hình ảnh 2D dễ dàng. Nhờ vậy bạn có thể thiết kế, chơi game với hình ảnh mãn nhãn mỗi ngày.

Thiết kế hiện đại cùng trọng lượng nhẹ chỉ 1.4kg
Laptop MSI Modern 14 C12MO-660VN sở hữu phong cách thiết kế gọn gàng với các đường nét tối giản, phù hợp cho người dùng yêu thích sự thanh lịch. Vỏ máy được hoàn thiện tỉ mỉ, tông màu xám thanh lịch giúp máy toát lên vẻ hiện đại và chuyên nghiệp.

Thiết kế laptop MSI Modern 14 C12MO-660VN

MSI Modern 14 C12MO-660VN được trang bị bản lề mở 180 độ, cho phép người dùng dễ dàng chia sẻ nội dung hoặc làm việc ở nhiều tư thế khác nhau. Được kết cấu với tiêu chuẩn quân sự MIL-STD-810G, chiếc laptop còn có độ bền vượt trội.

Thiết kế laptop MSI Modern 14 C12MO-660VN

Với trọng lượng chỉ 1.4kg, dòng máy này dễ dàng đồng hành trong các buổi học, họp hoặc công tác. Logo MSI nhỏ gọn phía mặt lưng cùng kiểu dáng tổng thể mỏng nhẹ giúp máy ghi điểm với người dùng năng động và đề cao tính thẩm mỹ.

Kết nối linh hoạt từ có dây đến không dây
Laptop MSI Modern 14 C12MO-660VN sở hữu đa dạng cổng kết nối thiết yếu, gồm 2 cổng USB-A, 1 cổng USB-C, HDMI, khe microSD và jack âm thanh. Nhiều cổng kết nối mang đến khả năng tương thích rộng với các thiết bị ngoại vi, phục vụ tốt nhu cầu làm việc và giải trí.

Cổng kết nối laptop MSI Modern 14 C12MO-660VN

Máy hỗ trợ Wi-Fi 6 và Bluetooth 5.2, cho tốc độ mạng nhanh và ổn định hơn khi học tập, làm việc trực tuyến hoặc chia sẻ dữ liệu không dây. Dù không có cổng Thunderbolt, các cổng hiện có vẫn đáp ứng tốt cho nhu cầu sử dụng phổ thông và văn phòng.

Cổng kết nối laptop MSI Modern 14 C12MO-660VN

Bên cạnh đó, laptop MSI Modern 14 C12MO-660VN được trang bị pin 3-cell dung lượng 39WHrs, đi kèm bộ sạc 65W hỗ trợ sạc nhanh qua cổng USB-C. Sản phẩm cung cấp thời lượng sử dụng tốt cùng với chế độ tiết kiệm pin trong MSI Center giúp kéo dài thời gian trải nghiệm.

Màn hình FHD sắc nét với viền mỏng
Màn hình 14 inch độ phân giải Full HD (1920x1080) của laptop MSI Modern 14 C12MO-660VN mang đến hình ảnh rõ nét, chi tiết. Độ phân giải cao giúp hiển thị nội dung văn bản và hình ảnh sắc sảo, dễ theo dõi trong thời gian dài.

Màn hình laptop MSI Modern 14 C12MO-660VN

Tấm nền IPS giúp mang lại góc nhìn rộng, màu sắc và độ sáng ổn định khi nhìn từ nhiều góc độ khác nhau. Thiết kế viền màn hình mỏng gọn giúp tăng diện tích hiển thị, mang lại cảm giác rộng rãi hơn so với kích thước thực tế của máy. Kiểu dáng này vừa nâng cao tính thẩm mỹ vừa mang lại trải nghiệm thị giác hiện đại, phù hợp với xu hướng thiết kế laptop hiện nay.

Hệ thống âm thanh gồm 2 loa 2W với chứng nhận Hi-Res Audio, hỗ trợ âm thanh chất lượng cao (lên đến 24bit/192kHz). Hệ thống này đáp ứng tốt cho việc sử dụng trong các không gian nhỏ như phòng làm việc hay lớp học.

Âm thanh laptop MSI Modern 14 C12MO-660VN

Camera của MSI Modern 14 C12MO-660VN là webcam HD với độ phân giải 720p, được đặt trên viền bezel phía trên màn hình. Chất lượng hình ảnh của camera đủ để đáp ứng các nhu cầu cơ bản như gọi video qua Zoom, Microsoft Teams, hoặc học trực tuyến.

Bàn phím có đèn nền, touchpad thao tác mượt mà
Bàn phím trên laptop MSI Modern 14 C12MO-660VN có thiết kế tiêu chuẩn, được trang bị đèn nền, rất tiện lợi khi làm việc trong môi trường thiếu sáng. Độ chính xác khi gõ phím được đảm bảo với hành trình phím 1.5mm, mang lại sự thoải mái cho người dùng, đặc biệt là những người thường xuyên làm việc với văn bản.

Bàn phím laptop MSI Modern 14 C12MO-660VN

Đặc biệt, touchpad có diện tích vừa phải, được phủ nhám nhẹ, giúp thao tác di chuột chính xác và êm ái. Các thao tác đa điểm như cuộn trang, phóng to – thu nhỏ đều phản hồi nhanh, giúp nâng cao trải nghiệm sử dụng khi không dùng chuột rời. 

Mua ngay laptop MSI Modern 14 C12MO-660VN chính hãng giá tốt tại CellphoneS
Laptop MSI Modern 14 C12MO-660VN đã có mặt tại cửa hàng CellphoneS, đồ họa cực mượt rất đáng sở hữu. Kết nối ngay với nhân viên CellphoneS để được tư vấn kỹ hơn về những cải tiến mới của laptop nhé! `,
    price: 17990000,
    compareAtPrice: 20990000,
    thumbnail:
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['hp', 'pavilion', 'multimedia', 'intel', 'core-i5'],
    status: 'active',
    featured: true,
    brand: 'HP',
    model: 'Pavilion 15-eg2081TU',
    condition: 'new',
    warrantyMonths: 24,
    specifications: {
      cpu: 'Intel Core i5-1235U',
      ram: '8GB DDR4 3200MHz',
      storage: '512GB SSD M.2 PCIe NVMe',
      graphics: 'Intel Iris Xe Graphics',
      display: '15.6 inch Full HD (1920x1080) IPS',
      weight: '1.75kg',
      battery: '41WHrs 3-cell',
      ports:
        '1x USB 3.1 Gen1 Type-A, 2x USB 3.1 Gen1 Type-A, 1x USB Type-C, 1x HDMI, 1x MicroSD, 1x Audio Jack',
      os: 'Windows 11 Home',
      keyboard: 'Backlit Keyboard',
      audio: 'B&O Play Audio',
      connectivity: 'Wi-Fi 6, Bluetooth 5.2',
      color: 'Natural Silver',
    },
    attributes: [
      {
        name: 'BỘ VI XỬ LÝ',
        values: ['i5-1235U', 'i7-1255U'],
      },
      { name: 'RAM', values: ['8GB', '16GB'] },
      { name: 'MÀU SẮC', values: ['Natural Silver', 'Warm Gold'] },
    ],
    variants: [
      {
        name: 'i5-1235U - 8GB - Natural Silver',
        displayName: 'Intel Core i5 - 8GB - Bạc',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1235U',
          RAM: '8GB',
          'MÀU SẮC': 'Natural Silver',
        },
        price: 17990000,
        stock: 7,
        isDefault: true,
      },
      {
        name: 'i5-1235U - 16GB - Natural Silver',
        displayName: 'Intel Core i5 - 16GB - Bạc',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1235U',
          RAM: '16GB',
          'MÀU SẮC': 'Natural Silver',
        },
        price: 20990000,
        stock: 4,
      },
      {
        name: 'i7-1255U - 16GB - Warm Gold',
        displayName: 'Intel Core i7 - 16GB - Vàng',
        attributes: {
          'BỘ VI XỬ LÝ': 'i7-1255U',
          RAM: '16GB',
          'MÀU SẮC': 'Warm Gold',
        },
        price: 25990000,
        stock: 2,
      },
    ],
  },

  // === ACER ASPIRE 5 A515-58M ===
  {
    name: 'Laptop Acer Aspire 5 A515-58M-53S9',
    shortDescription:
      'Laptop phổ thông với hiệu năng tốt cho mọi nhu cầu sử dụng',
    description:
      'Acer Aspire 5 A515-58M là laptop phổ thông với hiệu năng ổn định cho học tập và làm việc. Được trang bị CPU Intel Core i5-1335U thế hệ 13, RAM 8GB DDR4, SSD 512GB. Màn hình 15.6 inch Full HD với công nghệ Acer ComfyView chống chói. Thiết kế đơn giản, bền bỉ với bàn phím số riêng biệt và hệ thống tản nhiệt hiệu quả.',
    price: 14990000,
    compareAtPrice: 17990000,
    thumbnail:
      'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['acer', 'aspire', 'budget', 'intel', 'core-i5'],
    status: 'active',
    featured: false,
    brand: 'Acer',
    model: 'Aspire 5 A515-58M-53S9',
    condition: 'new',
    warrantyMonths: 24,
    specifications: {
      cpu: 'Intel Core i5-1335U',
      ram: '8GB DDR4 3200MHz',
      storage: '512GB SSD M.2 PCIe NVMe',
      graphics: 'Intel Iris Xe Graphics',
      display: '15.6 inch Full HD (1920x1080) ComfyView',
      weight: '1.8kg',
      battery: '50WHrs 3-cell',
      ports:
        '1x USB 3.2 Gen2 Type-A, 2x USB 3.2 Gen1 Type-A, 1x USB Type-C, 1x HDMI, 1x Ethernet, 1x Audio Jack',
      os: 'Windows 11 Home',
      keyboard: 'Full-size keyboard with numeric keypad',
      connectivity: 'Wi-Fi 6, Bluetooth 5.1',
      color: 'Pure Silver',
    },
    attributes: [
      {
        name: 'BỘ VI XỬ LÝ',
        values: ['i3-1315U', 'i5-1335U', 'i7-1355U'],
      },
      { name: 'RAM', values: ['8GB', '16GB'] },
      { name: 'Ổ CỨNG', values: ['256GB SSD', '512GB SSD', '1TB SSD'] },
    ],
    variants: [
      {
        name: 'i3-1315U - 8GB - 256GB SSD',
        displayName: 'Intel Core i3 - 8GB - 256GB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'i3-1315U',
          RAM: '8GB',
          'Ổ CỨNG': '256GB SSD',
        },
        price: 12990000,
        stock: 10,
      },
      {
        name: 'i5-1335U - 8GB - 512GB SSD',
        displayName: 'Intel Core i5 - 8GB - 512GB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1335U',
          RAM: '8GB',
          'Ổ CỨNG': '512GB SSD',
        },
        price: 14990000,
        stock: 12,
        isDefault: true,
      },
      {
        name: 'i5-1335U - 16GB - 512GB SSD',
        displayName: 'Intel Core i5 - 16GB - 512GB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1335U',
          RAM: '16GB',
          'Ổ CỨNG': '512GB SSD',
        },
        price: 17990000,
        stock: 8,
      },
      {
        name: 'i7-1355U - 16GB - 1TB SSD',
        displayName: 'Intel Core i7 - 16GB - 1TB SSD',
        attributes: {
          'BỘ VI XỬ LÝ': 'i7-1355U',
          RAM: '16GB',
          'Ổ CỨNG': '1TB SSD',
        },
        price: 22990000,
        stock: 4,
      },
    ],
  },

  // === DELL INSPIRON 15 3530 ===
  {
    name: 'Laptop Dell Inspiron 15 3530',
    shortDescription:
      'Laptop Dell tin cậy với hiệu năng ổn định cho công việc hàng ngày',
    description:
      'Dell Inspiron 15 3530 là laptop đáng tin cậy với thiết kế chắc chắn và hiệu năng ổn định. Được trang bị CPU Intel Core i5-1335U, RAM 8GB DDR4, SSD 512GB. Màn hình 15.6 inch Full HD với viền mỏng, bàn phím có đèn nền và touchpad lớn. Hệ thống tản nhiệt hiệu quả và pin 54WHrs cho thời gian sử dụng lâu dài.',
    price: 16990000,
    compareAtPrice: 19990000,
    thumbnail:
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['dell', 'inspiron', 'business', 'intel', 'core-i5'],
    status: 'active',
    featured: false,
    brand: 'Dell',
    model: 'Inspiron 15 3530',
    condition: 'new',
    warrantyMonths: 24,
    specifications: {
      cpu: 'Intel Core i5-1335U',
      ram: '8GB DDR4 3200MHz',
      storage: '512GB SSD M.2 PCIe NVMe',
      graphics: 'Intel Iris Xe Graphics',
      display: '15.6 inch Full HD (1920x1080) WVA',
      weight: '1.9kg',
      battery: '54WHrs 3-cell',
      ports:
        '1x USB 3.2 Gen1 Type-A, 2x USB 2.0, 1x USB Type-C, 1x HDMI, 1x MicroSD, 1x Audio Jack',
      os: 'Windows 11 Home',
      keyboard: 'Backlit Keyboard',
      connectivity: 'Wi-Fi 5, Bluetooth 5.1',
      color: 'Carbon Black',
    },
    attributes: [
      {
        name: 'BỘ VI XỬ LÝ',
        values: ['i3-1315U', 'i5-1335U', 'i7-1355U'],
      },
      { name: 'RAM', values: ['8GB', '16GB'] },
      { name: 'MÀU SẮC', values: ['Carbon Black', 'Platinum Silver'] },
    ],
    variants: [
      {
        name: 'i3-1315U - 8GB - Carbon Black',
        displayName: 'Intel Core i3 - 8GB - Đen',
        attributes: {
          'BỘ VI XỬ LÝ': 'i3-1315U',
          RAM: '8GB',
          'MÀU SẮC': 'Carbon Black',
        },
        price: 13990000,
        stock: 9,
      },
      {
        name: 'i5-1335U - 8GB - Carbon Black',
        displayName: 'Intel Core i5 - 8GB - Đen',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1335U',
          RAM: '8GB',
          'MÀU SẮC': 'Carbon Black',
        },
        price: 16990000,
        stock: 7,
        isDefault: true,
      },
      {
        name: 'i5-1335U - 16GB - Platinum Silver',
        displayName: 'Intel Core i5 - 16GB - Bạc',
        attributes: {
          'BỘ VI XỬ LÝ': 'i5-1335U',
          RAM: '16GB',
          'MÀU SẮC': 'Platinum Silver',
        },
        price: 19990000,
        stock: 5,
      },
      {
        name: 'i7-1355U - 16GB - Carbon Black',
        displayName: 'Intel Core i7 - 16GB - Đen',
        attributes: {
          'BỘ VI XỬ LÝ': 'i7-1355U',
          RAM: '16GB',
          'MÀU SẮC': 'Carbon Black',
        },
        price: 23990000,
        stock: 3,
      },
    ],
  },

  // === MACBOOK AIR M2 ===
  {
    name: 'MacBook Air 13 inch M2 2022',
    shortDescription: 'MacBook Air với chip M2 mạnh mẽ, thiết kế siêu mỏng nhẹ',
    description:
      'MacBook Air M2 2022 mang đến hiệu năng vượt trội với chip Apple M2 8-core CPU và 8-core GPU. Màn hình Liquid Retina 13.6 inch với độ sáng 500 nits, camera FaceTime HD 1080p và hệ thống âm thanh 4 loa. Thiết kế siêu mỏng chỉ 11.3mm, trọng lượng 1.24kg với pin lên đến 18 giờ sử dụng. Bàn phím Magic Keyboard và Touch ID.',
    price: 28990000,
    compareAtPrice: 32990000,
    thumbnail:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
    ],
    category: 'Laptop',
    tags: ['apple', 'macbook', 'air', 'm2', 'premium'],
    status: 'active',
    featured: true,
    brand: 'Apple',
    model: 'MacBook Air M2 2022',
    condition: 'new',
    warrantyMonths: 12,
    specifications: {
      cpu: 'Apple M2 8-core CPU',
      ram: '8GB Unified Memory',
      storage: '256GB SSD',
      graphics: 'Apple M2 8-core GPU',
      display: '13.6 inch Liquid Retina (2560x1664)',
      weight: '1.24kg',
      battery: 'Up to 18 hours',
      ports: '2x Thunderbolt/USB 4, 1x MagSafe 3, 1x Audio Jack',
      os: 'macOS Ventura',
      keyboard: 'Magic Keyboard with Touch ID',
      camera: 'FaceTime HD 1080p',
      audio: '4-speaker sound system',
      connectivity: 'Wi-Fi 6, Bluetooth 5.0',
    },
    attributes: [
      {
        name: 'BỘ NHỚ',
        values: ['8GB', '16GB', '24GB'],
      },
      { name: 'Ổ CỨNG', values: ['256GB', '512GB', '1TB', '2TB'] },
      {
        name: 'MÀU SẮC',
        values: ['Space Gray', 'Silver', 'Starlight', 'Midnight'],
      },
    ],
    variants: [
      {
        name: '8GB - 256GB - Space Gray',
        displayName: '8GB - 256GB - Xám',
        attributes: {
          'BỘ NHỚ': '8GB',
          'Ổ CỨNG': '256GB',
          'MÀU SẮC': 'Space Gray',
        },
        price: 28990000,
        stock: 5,
        isDefault: true,
      },
      {
        name: '8GB - 512GB - Silver',
        displayName: '8GB - 512GB - Bạc',
        attributes: {
          'BỘ NHỚ': '8GB',
          'Ổ CỨNG': '512GB',
          'MÀU SẮC': 'Silver',
        },
        price: 35990000,
        stock: 4,
      },
      {
        name: '16GB - 512GB - Starlight',
        displayName: '16GB - 512GB - Vàng',
        attributes: {
          'BỘ NHỚ': '16GB',
          'Ổ CỨNG': '512GB',
          'MÀU SẮC': 'Starlight',
        },
        price: 42990000,
        stock: 3,
      },
      {
        name: '16GB - 1TB - Midnight',
        displayName: '16GB - 1TB - Xanh đêm',
        attributes: {
          'BỘ NHỚ': '16GB',
          'Ổ CỨNG': '1TB',
          'MÀU SẮC': 'Midnight',
        },
        price: 49990000,
        stock: 2,
      },
    ],
  },
];

async function importProducts() {
  try {
    //console.log('🚀 Bắt đầu import sản phẩm...');

    // Xóa dữ liệu cũ theo thứ tự để tránh foreign key constraint
    await OrderItem.destroy({ where: {} });
    await CartItem.destroy({ where: {} });
    await ProductVariant.destroy({ where: {} });
    await ProductAttribute.destroy({ where: {} });
    await ProductSpecification.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });

    //console.log('🗑️ Đã xóa dữ liệu cũ');

    // Tạo categories
    const categories = [
      {
        name: 'Thời trang nữ',
        slug: 'thoi-trang-nu',
        description: 'Thời trang dành cho phụ nữ',
      },
      {
        name: 'Thời trang nam',
        slug: 'thoi-trang-nam',
        description: 'Thời trang dành cho nam giới',
      },
      { name: 'Laptop', slug: 'laptop', description: 'Máy tính xách tay' },
      { name: 'Ô tô', slug: 'o-to', description: 'Xe hơi các loại' },
      {
        name: 'Điện thoại',
        slug: 'dien-thoai',
        description: 'Điện thoại thông minh',
      },
      {
        name: 'Giày dép',
        slug: 'giay-dep',
        description: 'Giày dép thời trang',
      },
      { name: 'Điện tử', slug: 'dien-tu', description: 'Thiết bị điện tử' },
    ];

    const createdCategories = await Category.bulkCreate(categories);
    //console.log(`📁 Đã tạo ${createdCategories.length} danh mục`);

    // Tạo products với attributes và variants
    for (const productData of sampleProducts) {
      // Tìm category
      const category = createdCategories.find(
        (cat) => cat.name === productData.category
      );

      // Tạo product
      const product = await Product.create({
        name: productData.name,
        description: productData.description,
        shortDescription: productData.shortDescription,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        images: productData.images,
        thumbnail: productData.thumbnail,
        inStock: true,
        stockQuantity: 0, // Sẽ được tính từ variants
        sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: productData.status,
        featured: productData.featured,
        searchKeywords: productData.tags,
        seoTitle: productData.name,
        seoDescription: productData.shortDescription,
        seoKeywords: productData.tags,
        specifications: productData.specifications || {},
        condition: productData.condition || 'new',
        baseName: productData.name,
        isVariantProduct: true,
      });

      // Gán category
      if (category) {
        await product.setCategories([category]);
      }

      // Tạo specifications
      const createdSpecifications = [];
      if (productData.specifications) {
        let sortOrder = 0;
        for (const [specName, specValue] of Object.entries(
          productData.specifications
        )) {
          const specification = await ProductSpecification.create({
            productId: product.id,
            name: specName,
            value: specValue,
            category: getSpecificationCategory(specName),
            sortOrder: sortOrder++,
          });
          createdSpecifications.push(specification);
        }
      }

      // Tạo attributes
      const createdAttributes = [];
      for (const attr of productData.attributes) {
        const attribute = await ProductAttribute.create({
          productId: product.id,
          name: attr.name,
          values: attr.values,
        });
        createdAttributes.push(attribute);
      }

      // Tạo variants
      const createdVariants = [];
      for (const variant of productData.variants) {
        const variantSku = `${product.sku}-${Object.values(variant.attributes).join('-').toUpperCase().replace(/\s+/g, '')}`;

        const productVariant = await ProductVariant.create({
          productId: product.id,
          name: variant.name,
          sku: variantSku,
          attributes: variant.attributes,
          price: variant.price,
          stockQuantity: variant.stock || 0,
          images: variant.images || [],
          displayName: variant.displayName || variant.name,
          isDefault: variant.isDefault || false,
          isAvailable: (variant.stock || 0) > 0,
          compareAtPrice: variant.compareAtPrice || null,
          specifications: variant.specifications || {},
        });
        createdVariants.push(productVariant);
      }

      // Cập nhật tổng stock cho product
      const totalStock = createdVariants.reduce(
        (sum, variant) => sum + variant.stockQuantity,
        0
      );
      await product.update({
        stockQuantity: totalStock,
        inStock: totalStock > 0,
      });

      //console.log(
        `✅ Đã tạo sản phẩm: ${product.name} (${createdSpecifications.length} specs, ${createdAttributes.length} attributes, ${createdVariants.length} variants, ${totalStock} stock)`
      );
    }

    //console.log('🎉 Import thành công!');
    //console.log(`📊 Tổng kết:`);
    //console.log(`   - ${sampleProducts.length} sản phẩm`);
    //console.log(`   - ${createdCategories.length} danh mục`);
    //console.log(
      `   - Tổng variants: ${sampleProducts.reduce((sum, p) => sum + p.variants.length, 0)}`
    );
  } catch (error) {
    console.error('❌ Lỗi import:', error);
  }
}

// Chạy import
importProducts().then(() => {
  //console.log('🏁 Hoàn tất import');
  process.exit(0);
});
