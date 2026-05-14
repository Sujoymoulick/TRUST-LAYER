/**
 * useProfileAvatar — manages upload, delete, and real-time sync
 * for the profile-images Supabase Storage bucket.
 *
 * Storage path:  profile-images/{userId}/avatar.{ext}
 * DB column:     profiles.avatar_url
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET = 'profile-images';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (matches bucket limit)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export interface AvatarState {
  url: string | null;         // current public URL (storage or fallback)
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

  // ── Resolve secure URL from a private storage path ────────────────────────
  async function getSecureUrl(path: string): Promise<string> {
    // Create a signed URL valid for 10 years
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (error || !data) throw new Error('Failed to generate secure URL');
    // Cache-bust so browser immediately reflects changes
    return data.signedUrl + '&t=' + Date.now();
  }

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

    // Use a unique channel name per hook instance to prevent
    // "cannot add callbacks after subscribe" when multiple components use this hook.
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
    return () => { supabase.removeChannel(ch); };
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
      // Build a stable path so each upload overwrites the previous
      const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/avatar.${ext}`;

      // Remove old file first (ignore errors — may not exist)
      const { data: listData } = await supabase.storage.from(BUCKET).list(userId);
      if (listData && listData.length > 0) {
        const oldPaths = listData.map((f: { name: string }) => `${userId}/${f.name}`);
        await supabase.storage.from(BUCKET).remove(oldPaths);
      }

      // Upload new file
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      const secureUrl = await getSecureUrl(path);

      // Update profiles table — real-time will propagate
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: secureUrl })
        .eq('id', userId);

      if (dbErr) throw dbErr;

      // Also update Supabase auth metadata so DashboardLayout picks it up
      await supabase.auth.updateUser({ data: { avatar_url: secureUrl } });

      setUrl(secureUrl);
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
      // List all files in the user's folder and delete them
      const { data: listData, error: listErr } = await supabase.storage
        .from(BUCKET)
        .list(userId);

      if (listErr) throw listErr;

      if (listData && listData.length > 0) {
        const paths = listData.map((f: { name: string }) => `${userId}/${f.name}`);
        const { error: removeErr } = await supabase.storage.from(BUCKET).remove(paths);
        if (removeErr) throw removeErr;
      }

      // Clear avatar_url in profiles — real-time will propagate
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (dbErr) throw dbErr;

      // Clear from auth metadata too
      await supabase.auth.updateUser({ data: { avatar_url: null } });

      setUrl(null);
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
