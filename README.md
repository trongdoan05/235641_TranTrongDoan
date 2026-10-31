# Hệ Thống Quản Lý Thiết Bị Phòng Học - 235641_TranTrongDoan

## 1. Mô tả đề tài
Hệ thống quản lý thiết bị phòng học trên nền tảng đám mây, hỗ trợ theo dõi tình trạng sử dụng và thực hiện các chức năng thêm, xem, cập nhật, xóa, tìm kiếm thiết bị.

## 2. Công nghệ sử dụng
- Frontend: React (Vite)
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas (235641_TranTrongDoan / collection: devices)
- Triển khai: Docker, Docker Hub, Render

## 3. Cấu trúc dự án
- backend/: Mã nguồn API Node.js + Express và Dockerfile
- frontend/: Mã nguồn giao diện React và Dockerfile

## 4. Hướng dẫn cài đặt và chạy chương trình
- Backend: cd backend -> npm install -> npm start
- Frontend: cd frontend -> npm install -> npm run dev

## 5. Hướng dẫn chạy Backend bằng Docker
- Build image: docker build -t trongdoan05/backend:latest ./backend
- Run container: docker run -d -p 5000:5000 -e PORT=5000 -e MONGODB_URI="<chuoi_ket_noi_mongodb>" --name backend-app trongdoan05/backend:latest
- Link Docker Hub Backend: https://hub.docker.com/r/trongdoan05/backend

## 6. Hướng dẫn chạy Frontend bằng Docker
- Build image: docker build -t trongdoan05/frontend:latest ./frontend
- Run container: docker run -d -p 3000:3000 --name frontend-app trongdoan05/frontend:latest
- Link Docker Hub Frontend: https://hub.docker.com/r/trongdoan05/frontend

## 7. Triển khai Frontend trên Render
- Dịch vụ Render Frontend: web-235641
- URL Frontend công khai: https://web-235641.onrender.com

## 8. Triển khai Backend API trên Render
- Dịch vụ Render Backend: api-235641
- URL Backend API công khai: https://api-235641.onrender.com
- Health Check Endpoint: https://api-235641.onrender.com/health
