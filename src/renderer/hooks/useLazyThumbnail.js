import { useEffect, useRef, useState } from 'react';

// Cache thumbnail di memori, hidup selama sesi aplikasi berjalan.
// Dibatasi (LRU, max 2000 entri) supaya pada katalog besar (ratusan ribu
// foto) memori tidak terus naik tanpa batas selama user scroll panjang
// dalam satu sesi -- entri terlama otomatis dibuang saat cache penuh.
const THUMB_CACHE_MAX = 2000;
const thumbCache = new Map();

function cacheGet(imageId) {
  if (!thumbCache.has(imageId)) return undefined;
  // Re-insert supaya entri yang baru diakses jadi "paling baru" (LRU).
  const value = thumbCache.get(imageId);
  thumbCache.delete(imageId);
  thumbCache.set(imageId, value);
  return value;
}

function cacheSet(imageId, value) {
  if (thumbCache.has(imageId)) thumbCache.delete(imageId);
  thumbCache.set(imageId, value);
  if (thumbCache.size > THUMB_CACHE_MAX) {
    const oldestKey = thumbCache.keys().next().value;
    thumbCache.delete(oldestKey);
  }
}

function bufferToDataUrl(bufferLike, mimeType) {
  // bufferLike datang dari IPC sebagai Uint8Array/ArrayBuffer.
  const bytes = bufferLike instanceof Uint8Array ? bufferLike : new Uint8Array(bufferLike);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Lazy-load thumbnail untuk satu imageId hanya ketika elemen terlihat di
 * viewport (IntersectionObserver), lalu cache hasilnya di memori supaya
 * scroll berulang tidak memicu IPC call lagi.
 */
export function useLazyThumbnail(imageId) {
  const [src, setSrc] = useState(() => cacheGet(imageId) || null);
  const elRef = useRef(null);

  useEffect(() => {
    if (!imageId || src) return;

    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            const cached = cacheGet(imageId);
            if (cached) {
              setSrc(cached);
              return;
            }
            try {
              const result = await window.api.images.getThumbnail(imageId);
              if (result) {
                const dataUrl = bufferToDataUrl(result.data, result.mimeType);
                cacheSet(imageId, dataUrl);
                setSrc(dataUrl);
              }
            } catch (err) {
              console.error('Gagal memuat thumbnail', err);
            }
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [imageId, src]);

  return { src, elRef };
}

export function bufferToDataUrlPublic(bufferLike, mimeType) {
  return bufferToDataUrl(bufferLike, mimeType);
}
