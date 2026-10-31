require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Device, VALID_STATUSES } = require('./models/Device');
const seedData = require('./seed-data.json');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

async function seedInitialDevices() {
  try {
    const count = await Device.countDocuments();
    if (count === 0) {
      await Device.insertMany(seedData);
      console.log('Đã tự động khởi tạo 3 bản ghi thiết bị mẫu vào collection devices.');
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo dữ liệu mẫu:', err.message);
  }
}

function validateDevicePayload(body, isUpdate = false) {
  const requiredFields = [
    'deviceId',
    'name',
    'deviceType',
    'room',
    'brand',
    'model',
    'quantity',
    'status',
    'purchaseDate'
  ];

  if (!isUpdate) {
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
        return `Trường "${field}" là bắt buộc và không được để trống.`;
      }
    }
  }

  if (body.quantity !== undefined) {
    const qty = Number(body.quantity);
    if (Number.isNaN(qty) || qty < 0) {
      return 'Số lượng (quantity) phải là một số không âm.';
    }
  }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return `Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}`;
  }

  if (body.purchaseDate !== undefined && Number.isNaN(Date.parse(body.purchaseDate))) {
    return 'Ngày mua (purchaseDate) không đúng định dạng ngày hợp lệ.';
  }

  return null;
}

async function findDeviceByIdentifier(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byObjectId = await Device.findById(id);
    if (byObjectId) return byObjectId;
  }
  return Device.findOne({ deviceId: id });
}

app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.status(200).json({
    status: 'OK',
    service: 'classroom-device-backend',
    database: states[dbState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/devices', async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { deviceId: regex },
        { name: regex },
        { deviceType: regex },
        { room: regex },
        { brand: regex },
        { model: regex }
      ];
    }

    if (status && status.trim() !== '') {
      filter.status = status.trim();
    }

    const devices = await Device.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách thiết bị',
      error: error.message
    });
  }
});

app.get('/api/devices/:id', async (req, res) => {
  try {
    const device = await findDeviceByIdentifier(req.params.id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      });
    }
    res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi truy vấn thiết bị',
      error: error.message
    });
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const validationError = validateDevicePayload(req.body, false);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const normalizedDeviceId = String(req.body.deviceId).trim();
    const existingDevice = await Device.findOne({ deviceId: normalizedDeviceId });
    if (existingDevice) {
      return res.status(409).json({
        success: false,
        message: `Mã thiết bị "${normalizedDeviceId}" đã tồn tại. Không cho phép trùng mã thiết bị.`
      });
    }

    const newDevice = await Device.create({
      deviceId: normalizedDeviceId,
      name: req.body.name.trim(),
      deviceType: req.body.deviceType.trim(),
      room: req.body.room.trim(),
      brand: req.body.brand.trim(),
      model: req.body.model.trim(),
      quantity: Number(req.body.quantity),
      status: req.body.status,
      purchaseDate: new Date(req.body.purchaseDate),
      description: req.body.description ? req.body.description.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Thêm thiết bị thành công',
      data: newDevice
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Mã thiết bị (deviceId) đã tồn tại trong hệ thống'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      error: error.message
    });
  }
});

app.put('/api/devices/:id', async (req, res) => {
  try {
    const existingDevice = await findDeviceByIdentifier(req.params.id);
    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị cần cập nhật'
      });
    }

    const validationError = validateDevicePayload(req.body, true);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    if (req.body.deviceId && req.body.deviceId.trim() !== existingDevice.deviceId) {
      const duplicate = await Device.findOne({
        deviceId: req.body.deviceId.trim(),
        _id: { $ne: existingDevice._id }
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Mã thiết bị "${req.body.deviceId.trim()}" đã được sử dụng bởi thiết bị khác.`
        });
      }
    }

    const updatedFields = {
      deviceId: req.body.deviceId !== undefined ? req.body.deviceId.trim() : existingDevice.deviceId,
      name: req.body.name !== undefined ? req.body.name.trim() : existingDevice.name,
      deviceType: req.body.deviceType !== undefined ? req.body.deviceType.trim() : existingDevice.deviceType,
      room: req.body.room !== undefined ? req.body.room.trim() : existingDevice.room,
      brand: req.body.brand !== undefined ? req.body.brand.trim() : existingDevice.brand,
      model: req.body.model !== undefined ? req.body.model.trim() : existingDevice.model,
      quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : existingDevice.quantity,
      status: req.body.status !== undefined ? req.body.status : existingDevice.status,
      purchaseDate: req.body.purchaseDate !== undefined ? new Date(req.body.purchaseDate) : existingDevice.purchaseDate,
      description: req.body.description !== undefined ? req.body.description.trim() : existingDevice.description
    };

    const updatedDevice = await Device.findByIdAndUpdate(
      existingDevice._id,
      updatedFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật thiết bị thành công',
      data: updatedDevice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Không thể cập nhật thiết bị',
      error: error.message
    });
  }
});

app.delete('/api/devices/:id', async (req, res) => {
  try {
    const existingDevice = await findDeviceByIdentifier(req.params.id);
    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị cần xóa'
      });
    }

    await Device.findByIdAndDelete(existingDevice._id);
    res.status(200).json({
      success: true,
      message: 'Xóa thiết bị thành công',
      data: existingDevice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa thiết bị',
      error: error.message
    });
  }
});

if (!MONGODB_URI) {
  console.error('Thiếu biến môi trường MONGODB_URI trong file .env!');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Đã kết nối MongoDB Atlas thành công!');
    await seedInitialDevices();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend API đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB Atlas:', err.message);
    process.exit(1);
  });
