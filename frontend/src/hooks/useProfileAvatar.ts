/**
 * useProfileAvatar — manages upload, delete, and real-time sync
 * for the profile images via Cloudinary.
 *
 * DB column: profiles.avatar_url
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export interface AvatarState {
  url: string | null;         // current public URL
  uploading: boolean;
  deleting: boolean;
  error: string | null;
  upload: (file: File) => Promise<void>;
  remove: () => Promise<void>;
  clearError: () => void;
}

export function useProfileAvatar(userId: string | null): AvatarState {
  const [url,       setUrl      ] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting ] = useState(false);
  const [error,     setError    ] = useState<string | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load initial avatar_url from profiles table ───────────────────────
  const fetchAvatar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();
    setUrl(data?.avatar_url ?? null);
  }, [userId]);

  // ── Subscribe to real-time profile updates ────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetchAvatar();

    const channelName = `profile-avatar-${userId}-${Math.random().toString(36).substring(7)}`;

    const ch = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload: any) => {
          const newUrl = payload.new?.avatar_url ?? null;
          setUrl(newUrl);
        }
      )
      .subscribe();

    realtimeRef.current = ch;
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [userId, fetchAvatar]);

  // ── Upload ─────────────────────────────────────────────────────────────
  const upload = useCallback(async (file: File) => {
    if (!userId) return;
    setError(null);

    // Validate
    if (!ALLOWED.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be smaller than 10 MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiFetch('/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.success && response.url) {
        setUrl(response.url);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [userId]);

  // ── Delete / Remove ────────────────────────────────────────────────────
  const remove = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setDeleting(true);
    try {
      const response = await apiFetch('/upload/avatar', {
        method: 'DELETE',
      });

      if (response.success) {
        setUrl(null);
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [userId]);

  return {
    url,
    uploading,
    deleting,
    error,
    upload,
    remove,
    clearError: () => setError(null),
  };
}
