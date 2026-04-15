import axiosClient from './axiosClient';

export const toggleWishlist = (goodsId) =>
  axiosClient.post(`/wishlist/${goodsId}`).then((res) => res.data.data);

export const getMyWishlist = () =>
  axiosClient.get('/wishlist').then((res) => res.data.data);

export const checkWishlistStatus = (goodsId) =>
  axiosClient.get(`/wishlist/${goodsId}/status`).then((res) => res.data.data);
