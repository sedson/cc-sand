export const clamp = (v, mn, mx) => Math.min(Math.max(mn, v), mx);
export const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];