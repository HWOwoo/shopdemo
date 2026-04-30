import axiosClient from "./axiosClient";

export const getOrCreateRoom = (username) =>
  axiosClient.post(`/chat/rooms/${username}`).then(r => r.data.data);

export const getMyRooms = () =>
  axiosClient.get("/chat/rooms").then(r => r.data.data);

export const getMessages = (roomId) =>
  axiosClient.get(`/chat/rooms/${roomId}/messages`).then(r => r.data.data);

export const sendMessage = (roomId, content) =>
  axiosClient.post(`/chat/rooms/${roomId}/messages`, { content }).then(r => r.data.data);

export const getChatUnreadCount = () =>
  axiosClient.get("/chat/unread-count").then(r => r.data.data);
