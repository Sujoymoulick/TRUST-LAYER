/**
 * AvatarUploader
 * Drop zone + click-to-upload + remove button for profile images.
 * Uses the useProfileAvatar hook for all Supabase Storage operations.
 */
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Camera, Trash2, Loader2, Upload, CheckCircle, X } from 'lucide-react';
import { useProfileAvatar } from '../hooks/useProfileAvatar';

interface AvatarUploaderProps {
  userId: string | null;
  email?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm:  { wrap: 'w-16 h-16', img: 'w-16 h-16', text: 'text-[9px]' },
  md:  { wrap: 'w-24 h-24', img: 'w-24 h-24', text: 'text-[10px]' },
  lg:  { wrap: 'w-32 h-32', img: 'w-32 h-32', text: 'text-xs'     },
};

export function AvatarUploader({ userId, email = 'user', size = 'md' }: AvatarUploaderProps) {
  const { url, uploading, deleting, error, upload, remove, clearError } = useProfileAvatar(userId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [success,  setSuccess ] = useState(false);
  const sz = SIZES[size];

  const fallback = `https://api.dicebear.com/9.x/personas/svg?seed=${email}`;
  const displayUrl = url || fallback;
  const isCustom = !!url;
  const busy = uploading || deleting;

  async function handleFile(file: File) {
    setSuccess(false);
    await upload(file);
    if (!error) { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // reset so same file can be re-selected
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-5">
        {/* Avatar preview */}
        <div
          className={`relative flex-shrink-0 group cursor-pointer ${dragging ? 'opacity-60 scale-95' : ''} transition-all`}
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          title="Click or drop image to upload"
        >
          <img
            src={displayUrl}
            alt="Profile avatar"
            className={`${sz.wrap} border border-slate-200 dark:border-zinc-800 object-cover shadow-md ${busy ? 'opacity-50' : ''}`}
          />

          {/* Overlay */}
          <div className={`absolute inset-0 border border-slate-200 dark:border-zinc-800 flex items-center justify-center transition-opacity ${busy ? 'opacity-100 bg-white/80' : 'opacity-0 group-hover:opacity-100 bg-black/60'}`}>
            {busy ? (
              <Loader2 className="animate-spin text-black" size={22} />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Camera size={20} className="text-white" />
                <span className={`${sz.text} font-bold uppercase text-white`}>Change</span>
              </div>
            )}
          </div>

          {/* Drop indicator */}
          {dragging && (
            <div className="absolute inset-0 border-4 border-dashed border-brutal-yellow bg-brutal-yellow/20 flex items-center justify-center">
              <Upload size={20} className="text-black" />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="brutal-btn bg-brutal-yellow text-black px-4 py-2 text-[10px] font-bold uppercase flex items-center gap-2 w-full min-h-0"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? 'Uploading…' : 'Upload Photo'}
          </button>

          {isCustom && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="brutal-btn bg-white text-red-600 border-red-500 px-4 py-2 text-[10px] font-bold uppercase flex items-center gap-2 w-full min-h-0 hover:bg-red-50"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {deleting ? 'Removing…' : 'Remove Photo'}
            </button>
          )}

          <p className={`${sz.text} font-bold text-gray-500 uppercase leading-tight`}>
            JPEG, PNG, WebP · max 10 MB<br />
            Click or drag-and-drop to upload
          </p>
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-brutal-green text-black font-bold text-[10px] uppercase">
          <CheckCircle size={13} /> Profile photo updated!
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-brutal-pink text-white font-bold text-[10px] uppercase">
          <span>⚠ {error}</span>
          <button onClick={clearError}><X size={13} /></button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
