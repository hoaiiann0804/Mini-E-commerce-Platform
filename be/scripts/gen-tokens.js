const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const jwt = require("jsonwebtoken");

// 1. Lấy Secret Key thật trong file .env của fen
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Check be/.env");
}
// 2. Dán 10 cái ID fen vừa lấy ở Bước 1 vào đây
const userIds = [
  "e5c64f27-fcaf-4c6b-a76a-718946d1a957",
  "ea13cd16-0174-4e41-b5fb-1048facbf7cf",
  "081c1f43-44af-40e1-a372-5bb89dd36ac3",
  "2410b2ca-be73-438c-bf83-fab559fe1230",
  "a86b4317-6358-4f64-b96f-0bced8b749b7",
  "43785c4b-aac1-489f-a577-aa2c1fc29d9b",
  "e52748b3-338d-4d44-b40b-6de804c2f43b",
  "35b8c6cc-c6a6-4066-a94c-c923ec1bc86f",
  "4758ff93-2665-44ca-9f77-4aeaae9aec99",
  "9d622427-09e1-47e0-a63f-e0b0281b178c",
];

//console.log("--- COPY DANH SÁCH TOKEN DƯỚI ĐÂY DÁN VÀO K6 ---");
const tokens = userIds.map((id) => {
  // Tạo token y hệt logic login thật
  return jwt.sign({ id: id }, JWT_SECRET, { expiresIn: "1d" });
});

//console.log(JSON.stringify(tokens, null, 2));
