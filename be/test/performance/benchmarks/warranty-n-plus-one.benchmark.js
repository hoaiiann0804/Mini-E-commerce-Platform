const { performance } = require("node:perf_hooks");
const { sequelize, WarrantyPackage } = require("../../src/models");

// Sửa đường dẫn import theo dự án của bạn

const TEST_SIZES = [100, 300, 500];
const RUNS = 10;

// Thay bằng ID warranty đang tồn tại và isActive = true
const TEST_WARRANTY_ID = 1;

// Tạo cart items giả trong RAM.
// Không cần tạo 100–500 sản phẩm thật trong database.
function createMockCartItems(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    productId: index + 1,
    quantity: 1,
    warrantyPackageIds: [TEST_WARRANTY_ID],
  }));
}

// Tạo logger riêng cho từng lần chạy để đếm query chính xác
function createQueryTracker() {
  const queries = [];

  return {
    logging(sql) {
      queries.push(sql);
    },

    getTotalQueryCount() {
      return queries.length;
    },

    getWarrantyQueryCount() {
      return queries.filter((sql) =>
        sql.toLowerCase().includes("warrantypackages"),
      ).length;
    },
  };
}

// Phiên bản cũ bị N+1.
// Chỉ dùng trong benchmark, không dùng trong production.
async function loadWarrantiesNPlusOne(cartItems, logging) {
  return Promise.all(
    cartItems.map(async (item) => {
      const itemData =
        typeof item.toJSON === "function" ? item.toJSON() : { ...item };

      if (!itemData.warrantyPackageIds?.length) {
        return {
          ...itemData,
          warrantyPackages: [],
        };
      }

      const warrantyPackages = await WarrantyPackage.findAll({
        where: {
          id: itemData.warrantyPackageIds,
          isActive: true,
        },
        attributes: ["id", "name", "price", "durationMonths"],
        raw: true,
        logging,
      });

      return {
        ...itemData,
        warrantyPackages,
      };
    }),
  );
}

// Phiên bản mới dùng batch query
async function loadWarrantiesBatch(cartItems, logging) {
  const normalizedCartItems = cartItems.map((item) =>
    typeof item.toJSON === "function" ? item.toJSON() : { ...item },
  );

  const allWarrantyIds = [
    ...new Set(
      normalizedCartItems.flatMap((item) => item.warrantyPackageIds || []),
    ),
  ];

  const warranties = allWarrantyIds.length
    ? await WarrantyPackage.findAll({
        where: {
          id: allWarrantyIds,
          isActive: true,
        },
        attributes: ["id", "name", "price", "durationMonths"],
        raw: true,
        logging,
      })
    : [];

  const warrantyMap = new Map(
    warranties.map((warranty) => [String(warranty.id), warranty]),
  );

  return normalizedCartItems.map((item) => ({
    ...item,
    warrantyPackages: (item.warrantyPackageIds || [])
      .map((id) => warrantyMap.get(String(id)))
      .filter(Boolean),
  }));
}

// Chạy một phiên bản nhiều lần và lấy thời gian trung bình
async function benchmarkVersion({ name, cartItems, loader }) {
  const durations = [];
  let warrantyQueryCount = 0;
  let totalQueryCount = 0;
  let lastResult;

  // Warm-up để tránh lần đầu kết nối DB làm lệch kết quả
  await loader(cartItems, false);

  for (let run = 0; run < RUNS; run++) {
    const tracker = createQueryTracker();

    const start = performance.now();

    lastResult = await loader(cartItems, tracker.logging);

    const end = performance.now();

    durations.push(end - start);

    // Mỗi lần chạy phải có số query giống nhau
    warrantyQueryCount = tracker.getWarrantyQueryCount();

    totalQueryCount = tracker.getTotalQueryCount();
  }

  const averageMs =
    durations.reduce((sum, value) => sum + value, 0) / durations.length;

  return {
    version: name,
    cartItems: cartItems.length,
    totalQueries: totalQueryCount,
    warrantyQueries: warrantyQueryCount,
    averageMs: Number(averageMs.toFixed(2)),
    minMs: Number(Math.min(...durations).toFixed(2)),
    maxMs: Number(Math.max(...durations).toFixed(2)),
    result: lastResult,
  };
}

// Chuẩn hóa kết quả để so sánh code cũ và mới
function normalizeResult(result) {
  return result.map((item) => ({
    id: item.id,
    warrantyPackageIds: item.warrantyPackageIds,
    warrantyPackages: item.warrantyPackages.map((warranty) => ({
      id: warranty.id,
      name: warranty.name,
      price: warranty.price,
      durationMonths: warranty.durationMonths,
    })),
  }));
}

async function main() {
  try {
    await sequelize.authenticate();

    const warranty = await WarrantyPackage.findOne({
      where: {
        id: TEST_WARRANTY_ID,
        isActive: true,
      },
      raw: true,
    });

    if (!warranty) {
      throw new Error(
        `Không tìm thấy WarrantyPackage active với id=${TEST_WARRANTY_ID}. ` +
          "Hãy thay TEST_WARRANTY_ID bằng ID tồn tại trong database.",
      );
    }

    const report = [];

    for (const size of TEST_SIZES) {
      const cartItems = createMockCartItems(size);

      const oldVersion = await benchmarkVersion({
        name: "N+1",
        cartItems,
        loader: loadWarrantiesNPlusOne,
      });

      const newVersion = await benchmarkVersion({
        name: "Batch",
        cartItems,
        loader: loadWarrantiesBatch,
      });

      const sameResult =
        JSON.stringify(normalizeResult(oldVersion.result)) ===
        JSON.stringify(normalizeResult(newVersion.result));

      if (!sameResult) {
        throw new Error(
          `Kết quả code cũ và code mới khác nhau tại ${size} items`,
        );
      }

      delete oldVersion.result;
      delete newVersion.result;

      report.push(oldVersion, newVersion);
    }

    console.table(report);

    console.log("\nĐã xác nhận code cũ và code mới trả về cùng dữ liệu.");
  } catch (error) {
    console.error("Benchmark thất bại:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
