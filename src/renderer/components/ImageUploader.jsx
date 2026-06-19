import React, { useEffect, useState, useRef } from 'react';
import { bufferToDataUrlPublic } from '../hooks/useLazyThumbnail.js';

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export default function ImageUploader({ gameId, coverImageId, onCoverChange }) {
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const fileInputRef = useRef(null);

  async function refreshImages() {
    if (!gameId) return;
    const meta = await window.api.images.listMeta(gameId);
    const withThumbs = await Promise.all(
      meta.map(async (img) => {
        const thumb = await window.api.images.getThumbnail(img.id);
        return { ...img, thumbSrc: thumb ? bufferToDataUrlPublic(thumb.data, thumb.mimeType) : null };
      })
    );
    setImages(withThumbs);
  }

  useEffect(() => {
    refreshImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function handleFiles(fileList) {
    if (!gameId) {
      alert('Simpan data game dasar terlebih dahulu sebelum menambahkan foto.');
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/')) continue;
        const buffer = await fileToBuffer(file);
        await window.api.images.add(gameId, buffer, file.name);
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
    await window.api.images.remove(imageId);
    await refreshImages();
    if (imageId === coverImageId) onCoverChange(null);
  }

  async function handleSetCover(imageId) {
    await window.api.images.setCover(gameId, imageId);
    onCoverChange(imageId);
  }

  async function openZoom(imageId) {
    const full = await window.api.images.getFull(imageId);
    if (full) {
      setZoomImage(bufferToDataUrlPublic(full.data, full.mimeType));
    }
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
        {uploading ? 'Mengunggah & mengompres foto...' : 'Drag & drop foto di sini, atau klik untuk pilih file'}
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
            <div key={img.id} className={`image-thumb-item ${img.id === coverImageId ? 'is-cover' : ''}`}>
              {img.thumbSrc && (
                <img src={img.thumbSrc} alt={img.originalName || ''} onClick={() => openZoom(img.id)} />
              )}
              <button className="remove-btn" onClick={() => handleRemove(img.id)} title="Hapus foto">×</button>
              {img.id === coverImageId ? (
                <span className="cover-badge">Cover</span>
              ) : (
                <button
                  className="cover-badge"
                  style={{ border: 'none', cursor: 'pointer' }}
                  onClick={() => handleSetCover(img.id)}
                  title="Jadikan cover"
                >
                  Jadikan cover
                </button>
              )}
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
