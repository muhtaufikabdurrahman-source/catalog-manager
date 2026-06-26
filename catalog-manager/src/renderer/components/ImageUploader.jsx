import React, { useEffect, useState, useRef } from 'react';
import { bufferToDataUrlPublic } from '../hooks/useLazyThumbnail.js';

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Buat preview data URL dari file lokal (belum disimpan ke DB)
async function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/**
 * ImageUploader
 *
 * - Jika gameId tersedia: mode normal, langsung upload ke DB
 * - Jika gameId null (game belum disimpan): simpan file sementara di memori,
 *   tampilkan preview. Saat gameId datang (setelah game disimpan), otomatis
 *   upload semua foto pending ke DB.
 *
 * Props:
 *   gameId        - ID game (null jika belum disimpan)
 *   coverImageId  - ID cover image aktif
 *   onCoverChange - callback(newCoverImageId)
 *   pendingRef    - React ref yang akan diisi fungsi flushPending(gameId)
 *                   agar parent bisa trigger upload pending saat save
 */
export default function ImageUploader({ gameId, coverImageId, onCoverChange, pendingRef, condition }) {
  const [images, setImages] = useState([]);         // foto tersimpan di DB
  const [pending, setPending] = useState([]);       // foto belum disimpan (preview saja)
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomCondition, setZoomCondition] = useState(null);
  const fileInputRef = useRef(null);

  // ── Refresh foto dari DB ──────────────────────────────────────────────────
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

  // ── Flush pending: upload semua foto sementara ke DB setelah game disimpan ─
  async function flushPending(newGameId) {
    if (pending.length === 0) return;
    setUploading(true);
    try {
      for (const p of pending) {
        const buffer = await fileToBuffer(p.file);
        await window.api.images.add(newGameId, buffer, p.file.name);
      }
      setPending([]);
      // Refresh images dengan gameId baru
      const meta = await window.api.images.listMeta(newGameId);
      const withThumbs = await Promise.all(
        meta.map(async (img) => {
          const thumb = await window.api.images.getThumbnail(img.id);
          return { ...img, thumbSrc: thumb ? bufferToDataUrlPublic(thumb.data, thumb.mimeType) : null };
        })
      );
      setImages(withThumbs);
    } finally {
      setUploading(false);
    }
  }

  // Ekspos flushPending ke parent melalui ref
  useEffect(() => {
    if (pendingRef) {
      pendingRef.current = flushPending;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, pendingRef]);

  // ── Handle file masuk ─────────────────────────────────────────────────────
  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    if (!gameId) {
      // Belum ada gameId → simpan sebagai pending preview
      const newPending = await Promise.all(
        files.map(async (file) => ({
          file,
          previewSrc: await fileToDataUrl(file),
          tempId: Math.random().toString(36).slice(2)
        }))
      );
      setPending((prev) => [...prev, ...newPending]);
      return;
    }

    // Sudah ada gameId → langsung upload
    setUploading(true);
    try {
      for (const file of files) {
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

  // ── Hapus foto ────────────────────────────────────────────────────────────
  async function handleRemove(imageId) {
    await window.api.images.remove(imageId);
    await refreshImages();
    if (imageId === coverImageId) onCoverChange(null);
  }

  function handleRemovePending(tempId) {
    setPending((prev) => prev.filter(p => p.tempId !== tempId));
  }

  // ── Set cover ─────────────────────────────────────────────────────────────
  async function handleSetCover(imageId) {
    await window.api.images.setCover(gameId, imageId);
    onCoverChange(imageId);
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────
  async function openZoom(imageId) {
    const full = await window.api.images.getFull(imageId);
    if (full) {
      setZoomImage(bufferToDataUrlPublic(full.data, full.mimeType));
      setZoomCondition(condition || null);
    }
  }

  function openZoomPending(previewSrc) {
    setZoomImage(previewSrc);
    setZoomCondition(null);
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
          ? 'Mengunggah & mengompres foto...'
          : 'Drag & drop foto di sini, atau klik untuk pilih file'}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Foto pending (belum disimpan ke DB) */}
      {pending.length > 0 && (
        <div>
          <div className="form-hint" style={{ marginTop: 8, marginBottom: 4, color: 'var(--color-warning, #d97706)' }}>
            ⏳ {pending.length} foto akan disimpan saat klik "Simpan"
          </div>
          <div className="image-thumb-list">
            {pending.map((p) => (
              <div key={p.tempId} className="image-thumb-item" style={{ opacity: 0.8 }}>
                <img
                  src={p.previewSrc}
                  alt={p.file.name}
                  onClick={() => openZoomPending(p.previewSrc)}
                  style={{ cursor: 'zoom-in' }}
                />
                <button
                  className="remove-btn"
                  onClick={() => handleRemovePending(p.tempId)}
                  title="Hapus foto"
                >×</button>
                <span className="cover-badge" style={{ background: 'rgba(180,120,0,0.7)' }}>
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foto tersimpan di DB */}
      {images.length > 0 && (
        <div className="image-thumb-list">
          {images.map((img) => (
            <div key={img.id} className={`image-thumb-item ${img.id === coverImageId ? 'is-cover' : ''}`}>
              {img.thumbSrc && (
                <img
                  src={img.thumbSrc}
                  alt={img.originalName || ''}
                  onClick={() => openZoom(img.id)}
                  style={{ cursor: 'zoom-in' }}
                />
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

      {/* Zoom overlay */}
      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <button className="zoom-close" onClick={() => setZoomImage(null)}>×</button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={zoomImage} alt="Zoom" onClick={(e) => e.stopPropagation()} />
            {zoomCondition && (
              <ConditionBadge condition={zoomCondition} size="large" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Komponen badge kondisi — dipakai di zoom view
export function ConditionBadge({ condition, size = 'normal' }) {
  const isSealed = condition === 'Sealed';
  const isSecond = ['Loose', 'CIB', 'CIB+'].includes(condition);
  if (!isSealed && !isSecond) return null;

  const label = isSealed ? 'Baru Segel' : 'Second';
  const bg = isSealed
    ? 'rgba(22, 163, 74, 0.82)'   // hijau untuk baru segel
    : 'rgba(30, 64, 175, 0.78)';  // biru untuk second

  const style = size === 'large'
    ? {
        position: 'absolute',
        bottom: 14,
        left: 14,
        background: bg,
        color: '#fff',
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '0.04em',
        padding: '5px 14px',
        borderRadius: 6,
        backdropFilter: 'blur(2px)',
        pointerEvents: 'none',
        userSelect: 'none',
        textTransform: 'uppercase',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
      }
    : {
        position: 'absolute',
        bottom: 5,
        left: 5,
        background: bg,
        color: '#fff',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.05em',
        padding: '2px 7px',
        borderRadius: 4,
        backdropFilter: 'blur(2px)',
        pointerEvents: 'none',
        userSelect: 'none',
        textTransform: 'uppercase',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      };

  return <div style={style}>{label}</div>;
}
