import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INITIAL_FORM = {
  deviceId: '',
  name: '',
  deviceType: '',
  room: '',
  brand: '',
  model: '',
  quantity: 1,
  status: 'Đang sử dụng',
  purchaseDate: '2025-01-15',
  description: ''
};

const STATUS_OPTIONS = [
  'Đang sử dụng',
  'Hư hỏng',
  'Đang sửa chữa',
  'Ngừng sử dụng'
];

export default function App() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchDevices = async (searchTerm = search, statusTerm = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusTerm) params.append('status', statusTerm);

      const res = await fetch(`${API_BASE_URL}/api/devices?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể tải danh sách thiết bị');
      setDevices(json.data || []);
    } catch (err) {
      setError(err.message || 'Lỗi kết nối đến máy chủ Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/devices/${editingId}`
        : `${API_BASE_URL}/api/devices`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Thao tác thất bại');

      setMessage(json.message || (editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!'));
      setFormData(INITIAL_FORM);
      setEditingId(null);
      fetchDevices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (device) => {
    setEditingId(device._id);
    setFormData({
      deviceId: device.deviceId,
      name: device.name,
      deviceType: device.deviceType,
      room: device.room,
      brand: device.brand,
      model: device.model,
      quantity: device.quantity,
      status: device.status,
      purchaseDate: device.purchaseDate ? device.purchaseDate.slice(0, 10) : '2025-01-01',
      description: device.description || ''
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thiết bị "${name}"?`)) return;
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/devices/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể xóa thiết bị');
      setMessage('Đã xóa thiết bị thành công!');
      fetchDevices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDetail = async (id) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/devices/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể tải chi tiết thiết bị');
      setSelectedDevice(json.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Đang sử dụng': return 'badge status-active';
      case 'Hư hỏng': return 'badge status-broken';
      case 'Đang sửa chữa': return 'badge status-repair';
      default: return 'badge status-stopped';
    }
  };

  return (
    <div className="container">
      <header>
        <h2>Hệ Thống Quản Lý Thiết Bị Phòng Học (235641_TranTrongDoan)</h2>
        <small>API Endpoint: {API_BASE_URL}</small>
      </header>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid">
        <div className="card">
          <h3>{editingId ? 'Cập Nhật Thiết Bị' : 'Thêm Thiết Bị Mới'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Mã thiết bị (deviceId) *</label>
              <input name="deviceId" value={formData.deviceId} onChange={handleInputChange} required placeholder="VD: TB004" />
            </div>
            <div className="form-group">
              <label>Tên thiết bị *</label>
              <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="VD: Máy chiếu Sony" />
            </div>
            <div className="form-group">
              <label>Loại thiết bị *</label>
              <input name="deviceType" value={formData.deviceType} onChange={handleInputChange} required placeholder="VD: Máy chiếu, Máy tính..." />
            </div>
            <div className="form-group">
              <label>Phòng học *</label>
              <input name="room" value={formData.room} onChange={handleInputChange} required placeholder="VD: P.A102" />
            </div>
            <div className="form-group">
              <label>Hãng sản xuất *</label>
              <input name="brand" value={formData.brand} onChange={handleInputChange} required placeholder="VD: Sony, Dell..." />
            </div>
            <div className="form-group">
              <label>Model *</label>
              <input name="model" value={formData.model} onChange={handleInputChange} required placeholder="VD: VPL-EX430" />
            </div>
            <div className="form-group">
              <label>Số lượng *</label>
              <input type="number" min="0" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Tình trạng *</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ngày mua / tiếp nhận *</label>
              <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Mô tả / Ghi chú</label>
              <textarea rows="2" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary">
                {editingId ? 'Lưu cập nhật' : 'Thêm thiết bị'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setFormData(INITIAL_FORM);
                  }}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Danh Sách Thiết Bị ({devices.length})</h3>
          <div className="toolbar">
            <input
              placeholder="Tìm theo mã, tên, loại, phòng học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDevices(search, statusFilter)}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchDevices(search, e.target.value);
              }}
            >
              <option value="">-- Tất cả tình trạng --</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => fetchDevices(search, statusFilter)}>
              Tìm kiếm
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                fetchDevices('', '');
              }}
            >
              Làm mới
            </button>
          </div>

          {loading ? (
            <p>Đang tải dữ liệu thiết bị...</p>
          ) : devices.length === 0 ? (
            <p>Không có thiết bị nào phù hợp.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Mã TB</th>
                    <th>Tên thiết bị</th>
                    <th>Loại</th>
                    <th>Phòng</th>
                    <th>SL</th>
                    <th>Tình trạng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((item) => (
                    <tr key={item._id}>
                      <td><strong>{item.deviceId}</strong></td>
                      <td>{item.name}</td>
                      <td>{item.deviceType}</td>
                      <td>{item.room}</td>
                      <td>{item.quantity}</td>
                      <td><span className={getBadgeClass(item.status)}>{item.status}</span></td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-info" onClick={() => handleViewDetail(item._id)}>Chi tiết</button>
                        <button className="btn-warning" onClick={() => handleEdit(item)}>Sửa</button>
                        <button className="btn-danger" onClick={() => handleDelete(item._id, item.name)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedDevice && (
        <div className="modal-backdrop" onClick={() => setSelectedDevice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Chi Tiết Thiết Bị: {selectedDevice.deviceId}</h3>
            <p><strong>Tên thiết bị:</strong> {selectedDevice.name}</p>
            <p><strong>Loại thiết bị:</strong> {selectedDevice.deviceType}</p>
            <p><strong>Phòng học:</strong> {selectedDevice.room}</p>
            <p><strong>Hãng sản xuất:</strong> {selectedDevice.brand}</p>
            <p><strong>Model:</strong> {selectedDevice.model}</p>
            <p><strong>Số lượng:</strong> {selectedDevice.quantity}</p>
            <p><strong>Tình trạng:</strong> <span className={getBadgeClass(selectedDevice.status)}>{selectedDevice.status}</span></p>
            <p><strong>Ngày mua:</strong> {selectedDevice.purchaseDate ? new Date(selectedDevice.purchaseDate).toLocaleDateString('vi-VN') : ''}</p>
            <p><strong>Mô tả:</strong> {selectedDevice.description || 'Không có ghi chú'}</p>
            <button className="btn-secondary" onClick={() => setSelectedDevice(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
