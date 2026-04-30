import axiosClient from './axiosClient';

export async function listNotices() {
  const res = await axiosClient.get('/notices');
  return res.data.data || [];
}

export async function getNoticeBanner(limit = 3) {
  const res = await axiosClient.get('/notices/banner', { params: { limit } });
  return res.data.data || [];
}

export async function getNotice(id) {
  const res = await axiosClient.get(`/notices/${id}`);
  return res.data.data;
}

export async function createNotice(payload) {
  const res = await axiosClient.post('/admin/notices', payload);
  return res.data.data;
}

export async function updateNotice(id, payload) {
  const res = await axiosClient.put(`/admin/notices/${id}`, payload);
  return res.data.data;
}

export async function deleteNotice(id) {
  const res = await axiosClient.delete(`/admin/notices/${id}`);
  return res.data;
}
