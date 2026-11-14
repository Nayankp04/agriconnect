import React, { useState, useRef } from 'react';
import API from '../services/api';
import { UploadCloud, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ImageUploader = ({
  images = [],
  onImagesChange,
  maxImages = 4,
  label = 'Upload Images',
  helperText = 'PNG, JPG, WEBP up to 5MB',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError('');
    setSuccessMsg('');

    // Check max limits
    const currentCount = Array.isArray(images) ? images.length : (images ? 1 : 0);
    if (currentCount + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images in total.`);
      return;
    }

    // Validate each file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError(`"${file.name}" is not a supported format. Please upload JPEG, PNG, or WEBP.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 5MB maximum file size limit.`);
        return;
      }
    }

    setUploading(true);

    try {
      const formData = new FormData();
      if (files.length === 1) {
        formData.append('image', files[0]);
        const res = await API.post('/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.success && res.data.url) {
          const updated = Array.isArray(images) ? [...images, res.data.url] : [res.data.url];
          onImagesChange(updated);
          setSuccessMsg('Image uploaded successfully!');
        }
      } else {
        files.forEach((f) => formData.append('images', f));
        const res = await API.post('/upload/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.success && res.data.urls) {
          const updated = Array.isArray(images) ? [...images, ...res.data.urls] : res.data.urls;
          onImagesChange(updated);
          setSuccessMsg(`${res.data.urls.length} images uploaded successfully!`);
        }
      }
    } catch (err) {
      console.error('[ImageUploader] Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    if (!Array.isArray(images)) {
      onImagesChange([]);
      return;
    }
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
    setError('');
  };

  const imageList = Array.isArray(images) ? images : (images ? [images] : []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        <span className="text-[11px] font-semibold text-slate-400">
          {imageList.length} / {maxImages} uploaded
        </span>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      {imageList.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            uploading
              ? 'border-agri-400 bg-agri-50/50 cursor-wait'
              : 'border-slate-300 hover:border-agri-600 hover:bg-agri-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple={maxImages > 1}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-agri-100 group-hover:text-agri-700">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-agri-600" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {uploading ? 'Uploading image...' : 'Click or drag photos to upload'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Images Preview Thumbnails */}
      {imageList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {imageList.map((url, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-100"
            >
              <img
                src={url}
                alt={`Uploaded ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-80 group-hover:opacity-100 transition-all shadow"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

