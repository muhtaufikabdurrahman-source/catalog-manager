import React, { useEffect, useRef, useState } from 'react';
import { bufferToDataUrlPublic } from '../hooks/useLazyThumbnail.js';

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * FaqImageUploader
 *
 * Upload gambar yang ditempel di sebuah jawaban FAQ. Mirip ImageUploader.jsx
 * tapi lebih sederhana (tanpa konsep cover) karena tujuannya hanya melampirkan
 * 1+ gambar ke jawaban pertanyaan.
 */
export default function FaqImageUploader({ faqId }) {
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const fileInputRef = useRef(null);

  async function refreshImages() {
    if (!faqId) return;
    const meta = await window.api.faqImages.listMeta(faqId);
    const withThumbs = await Promise.all(
      meta.map(async (img) => {
        const thumb = await window.api.faqImages.getThumbnail(img.id);
        return { ...img, thumbSrc: thumb ? bufferToDataUrlPublic(thumb.data, thumb.mimeType) : null };
      })
    );
    setImages(withThumbs);
  }

  useEffect(() => {
    refreshImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqId]);

  async function handleFiles(fileList) {
    if (!faqId) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const buffer = await fileToBuffer(file);
        await window.api.faqImages.add(faqId, buffer, file.name);
      }
      await refreshImages();
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleRemove(imageId) {
    await window.api.faqImages.remove(imageId);
    await refreshImages();
  }

  async function openZoom(imageId) {
    const full = await window.api.faqImages.getFull(imageId);
    if (full) setZoomImage(bufferToDataUrlPublic(full.data, full.mimeType));
  }

  return (
    <div>
      <div
        className={`dropzone ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading
          ? 'Mengunggah & mengompres gambar...'
          : 'Drag & drop gambar jawaban di sini, atau klik untuk pilih file'}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="image-thumb-list">
          {images.map((img) => (
            <div key={img.id} className="image-thumb-item">
              {img.thumbSrc && (
                <img
                  src={img.thumbSrc}
                  alt={img.originalName || ''}
                  onClick={() => openZoom(img.id)}
                  style={{ cursor: 'zoom-in' }}
                />
              )}
              <button className="remove-btn" onClick={() => handleRemove(img.id)} title="Hapus gambar">×</button>
            </div>
          ))}
        </div>
      )}

      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <button className="zoom-close" onClick={() => setZoomImage(null)}>×</button>
          <img src={zoomImage} alt="Zoom" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
