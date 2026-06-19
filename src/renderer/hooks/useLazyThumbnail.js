import { useEffect, useRef, useState } from 'react';

// Cache thumbnail di memori (Map global, hidup selama sesi aplikasi berjalan).
// Ini memenuhi requirement "Thumbnail Cache" tanpa menulis ke disk/localStorage
// (yang dilarang di artifact, dan di aplikasi nyata kita memang ingin cache
// in-memory karena BLOB sudah permanen tersimpan di SQLite).
const thumbCache = new Map();

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
  const [src, setSrc] = useState(() => thumbCache.get(imageId) || null);
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
            if (thumbCache.has(imageId)) {
              setSrc(thumbCache.get(imageId));
              return;
            }
            try {
              const result = await window.api.images.getThumbnail(imageId);
              if (result) {
                const dataUrl = bufferToDataUrl(result.data, result.mimeType);
                thumbCache.set(imageId, dataUrl);
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
