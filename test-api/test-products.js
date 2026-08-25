// import http from "k6/http";
// import { check, sleep } from "k6";
// import { Trend } from "k6/metrics";

// export const options = {
//   stages: [
//     { duration: "2m", target: 100 },  // Warm-up: Để Node.js JIT compiler và DB cache làm nóng
//     { duration: "3m", target: 500 },  // Tăng tải trung bình
//     { duration: "5m", target: 1000 }, // Stress test thực sự
//     { duration: "2m", target: 0 },    // Hạ nhiệt
//   ],
//   // THAY ĐỔI QUAN TRỌNG Ở ĐÂY:
//   noConnectionReuse: false,         // BẮT BUỘC đổi thành false để dùng Keep-Alive
//   batch: 15,                        // Giới hạn số lượng kết nối đồng thời trên mỗi VU
//   userAgent: "MyK6StressTest/1.0",

//   thresholds: {
//     http_req_failed: ["rate<0.01"],
//     http_req_duration: ["p(95)<500"],
//   },
// };
// const BASE_URL = __ENV.API_URL || "http://localhost:8888";
// const paginationDepth = new Trend("pagination_depth");
// export default function () {
//   // const page = Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 1000) + 1;
//   const shouldPaginationDeeply = Math.random() > 0.7;
//   const limit = 10;
//   // const res = http.get(`${BASE_URL}/api/products?page=${page}&limit=${limit}`);
//   let nextCursor = null;
//   let url = `${BASE_URL}/api/products?limit=${limit}`;
//   let depth = 0;

//   const maxDepth = shouldPaginationDeeply ? 15 : 2;
//   for (let i = 0; i < maxDepth; i++) {
//     const res = http.get(url);
//     const success = check(res, {
//       "status is 200": (r) => r.status === 200,
//     });
//     if (!success) {
//       // console.error(`Request failed: ${res.url}, status: ${res.status}`);
//       break;
//     }
//     try {
//       const body = res.json();
//       const hasObjectBody = body && typeof body === "object";
//       const hasObjectData =
//         hasObjectBody && body.data && typeof body.data === "object";
//       if (!hasObjectData) {
//         nextCursor = null;
//       } else {
//         nextCursor = body.data.nextCursor || null;
//         depth++;
//       }
//     } catch (e) {
//       nextCursor = null;
//     }
//     if (nextCursor) {
//       url = `${BASE_URL}/api/products?limit=${limit}&cursor=${nextCursor}`;
//     } else {
//       break;
//     }
//   }
//   paginationDepth.add(depth);
//   const minThinkTime = 1;
//   const maxThinkTime = 3;
//   sleep(Math.random() * (maxThinkTime - minThinkTime) + minThinkTime);
// }

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

export const options = {
  stages: [
    { duration: "1m", target: 50 },
    { duration: "2m", target: 100 }, // Test mốc này là chuẩn nhất cho localhost
    { duration: "1m", target: 0 },
  ],
  noConnectionReuse: false, // Giữ kết nối để tiết kiệm CPU cho Node.js
  userAgent: "MyK6StressTest/1.0",

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"], // Để mức 1s vì chạy localhost gánh cả Client lẫn Server
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:8888";
const paginationDepth = new Trend("pagination_depth");

// Dùng một biến toàn cục giả lập bộ nhớ cache cho cursor (chỉ trong 1 VU)
export default function () {
  // 1. Khởi tạo URL ban đầu
  let url = `${BASE_URL}/api/products?limit=10`;

  // 2. Xác định độ sâu lần này VU sẽ cuộn (giả lập người dùng lười hoặc siêng)
  // Giảm maxDepth từ 15 xuống 5 để tránh dồn toa request trên localhost
  const shouldPaginationDeeply = Math.random() > 0.8;
  const maxDepth = shouldPaginationDeeply ? 5 : 1;

  let depth = 0;

  for (let i = 0; i < maxDepth; i++) {
    const res = http.get(url);
    
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
    });

    if (!success) break;

    try {
      const body = res.json();
      const nextCursor = body.data.nextCursor;

      if (nextCursor) {
        url = `${BASE_URL}/api/products?limit=10&cursor=${nextCursor}`;
        depth++;

        // --- THAY ĐỔI QUAN TRỌNG ---
        // Nghỉ một chút giữa các lần cuộn trang (Pagination)
        // Người dùng thật cần thời gian xem sản phẩm trước khi cuộn tiếp
        sleep(0.5);
      } else {
        break;
      }
    } catch (e) {
      break;
    }
  }

  paginationDepth.add(depth);

  // 3. Nghỉ dài giữa các lần thực hiện lại kịch bản (Think time)
  // Tăng lên để Server kịp dọn dẹp bộ nhớ
  sleep(Math.random() * 3 + 2); // Nghỉ từ 2s - 5s
}
