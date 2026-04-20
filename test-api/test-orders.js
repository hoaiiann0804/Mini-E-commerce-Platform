import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10, // 10 người dùng ảo (Virtual Users)
  iterations: 10, // Tổng cộng 10 lần thực hiện nhấn mua
};
const tokens = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1YzY0ZjI3LWZjYWYtNGM2Yi1hNzZhLTcxODk0NmQxYTk1NyIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.RvX3ANCFwQnshqCVc5KoyFcLUPgMkwcTm7HIEOYmeXo",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVhMTNjZDE2LTAxNzQtNGU0MS1iNWZiLTEwNDhmYWNiZjdjZiIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.6dt5Pqqdvj1bMb0ec28i4YehfLDJ5UGTiQBRFZmSFyk",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA4MWMxZjQzLTQ0YWYtNDBlMS1hMzcyLTViYjg5ZGQzNmFjMyIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.p1mWHQ-fXbggNYX4Q0t1Kim-GfBHFk_QivAD3uY0oLc",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI0MTBiMmNhLWJlNzMtNDM4Yy1iZjgzLWZhYjU1OWZlMTIzMCIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.ITcNKEy2YcVd6cPOpaCkWsDnovchjZdT4dzhRC-8fYU",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4NmI0MzE3LTYzNTgtNGY2NC1iOTZmLTBiY2VkOGI3NDliNyIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.uGhRfRXYk4lYvxpeBsnRiyMXscxAFcx7oik9pDi5jCo",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzNzg1YzRiLWFhYzEtNDg5Zi1hNTc3LWFhMmMxZmMyOWQ5YiIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.oohxujv0hn168eRNOKhQQEeYxJUeu4BMxzhxugHUoSM",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1Mjc0OGIzLTMzOGQtNGQ0NC1iNDBiLTZkZTgwNGMyZjQzYiIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.dcFZiCVhVnJCVTBYhGHJYUNzMjwJRN1zN0WdFcdT-GA",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM1YjhjNmNjLWM2YTYtNDA2Ni1hOTRjLWM5MjNlYzFiYzg2ZiIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.dRHnLJPBIOg415lrtQghWb9ZifolB7gZ42mejvz2tko",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ3NThmZjkzLTI2NjUtNDRjYS05Zjc3LTRhZWFhZTlhZWM5OSIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.xyOGk4zbQXMhZdQYduIZFiiGAqV7BqQberJ8hG4qOrA",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlkNjIyNDI3LTA5ZTEtNDdlMC1hNjNmLWUwYjAyODFiMTc4YyIsImlhdCI6MTc3NTAyNTQwMywiZXhwIjoxNzc1MTExODAzfQ.kW9GWx-BFjML5lKrj7p1iw7ikkkhVqNoRjNNBnT4erk",
];
export default function () {
  const url = "http://localhost:8888/api/orders";
  const token = tokens[__VU - 1];
  const payload = JSON.stringify({
    // --- THÔNG TIN GIAO HÀNG (SHIPPING) ---
    shippingFirstName: `User-${__VU}`,
    shippingLastName: "Tester",
    shippingAddress1: "123 Đường ABC",
    shippingCity: "Hồ Chí Minh", // Tỉnh/Thành phố giao hàng
    shippingState: "Thành phố HCM", // Thêm cho chắc ăn
    shippingZip: "70000", // Mã bưu điện giao hàng (Bắt buộc)
    shippingCountry: "VN",
    shippingPhone: "0901234567",

    // --- THÔNG TIN THANH TOÁN (BILLING) ---
    billingFirstName: "Nguyễn",
    billingLastName: "Tester",
    billingAddress1: "123 Đường ABC",
    billingCity: "Hồ Chí Minh", // Tỉnh/Thành phố thanh toán (BẮT BUỘC)
    billingState: "Thành phố HCM", // Thêm cho chắc ăn
    billingZip: "70000", // Mã bưu điện thanh toán (Bắt buộc)
    billingCountry: "VN",
    billingPhone: "0901234567",

    paymentMethod: "cod",
    notes: "Test k6 concurrency",
  });
  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Token của user test
    },
  };

  const res = http.post(url, payload, params);
  if (res.status !== 201) {
    //console.log(`--- LỖI TỪ USER ${__VU} ---`);
    //console.log(`Status: ${res.status}`);
    //console.log(`Body: ${res.body}`);
  }

  check(res, {
    "Trạng thái 201 (Thành công)": (r) => r.status === 201,
    "Trạng thái 400 (Hết hàng)": (r) => r.status === 400,
    "Lỗi Auth (401)": (r) => r.status === 401,
  });

  sleep(0.1);
}
