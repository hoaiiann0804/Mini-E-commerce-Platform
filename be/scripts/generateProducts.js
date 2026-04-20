const { Product } = require("../src/models");
const slugify = require("slugify");

async function generateProducts() {
  // 1. Lấy dữ liệu mẫu
  const sourceProducts = await Product.findAll({
    attributes: ["name", "description", "shortDescription", "price"],
    limit: 100,
  });

  if (sourceProducts.length === 0) {
    console.error("❌ Không có sản phẩm nào trong DB để làm mẫu!");
    return;
  }

  const TOTAL_TO_INSERT = 100000;
  const BATCH_SIZE = 5000;
  const totalBatches = TOTAL_TO_INSERT / BATCH_SIZE;

  //console.log(`🚀 Bắt đầu quá trình bơm ${TOTAL_TO_INSERT} sản phẩm...`);

  for (let b = 0; b < totalBatches; b++) {
    const clones = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      // ĐÃ SỬA: Tên biến đúng là sourceProducts
      const random =
        sourceProducts[Math.floor(Math.random() * sourceProducts.length)];

      // ĐÃ SỬA: Xóa dấu cách để slug đẹp hơn
      const uniqueSuffix = `${b}-${i}`;
      const name = `${random.name} ${uniqueSuffix}`;

      clones.push({
        name: name,
        slug: slugify(name, { lower: true }),
        description: random.description,
        shortDescription: random.shortDescription,
        price: random.price,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await Product.bulkCreate(clones, { logging: false });

    //console.log(
      `✅ Đã chèn thành công: ${(b + 1) * BATCH_SIZE} / ${TOTAL_TO_INSERT}`
    );
  }

  //console.log("✨ Hoàn tất bơm dữ liệu!");
  process.exit(0);
}

generateProducts().catch((e) => {
  console.error("❌ Lỗi khi bơm dữ liệu:", e);
  process.exit(1);
});
