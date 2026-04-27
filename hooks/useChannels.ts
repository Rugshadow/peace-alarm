import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Channel, AudioClip } from '../components/ChannelSheet';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch();
  }, []);

  const fetch = async () => {
    const [{ data: users }, { data: audioFiles }] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('audio_files').select('*').order('created_at', { ascending: false }),
    ]);

    if (!users || !audioFiles) { setLoading(false); return; }

    const mapped: Channel[] = users.map((user) => {
      const uploads: AudioClip[] = audioFiles
        .filter((f) => f.uploaded_by === user.user_id)
        .map((f) => ({
          id: f.audio_id,
          title: f.title,
          date: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          duration: f.duration ?? 0,
          audioUrl: f.audio_file,
          imageUrl: f.cover_photo,
        }));

      const genre = audioFiles.find((f) => f.uploaded_by === user.user_id)?.genre ?? 'general';

      return {
        id: user.user_id,
        name: user.username,
        genre,
        listeners: user.num_of_followers ?? 0,
        bio: user.bio ?? '',
        imageUrl: user.profile_photo,
        uploads,
      };
    });

    setChannels(mapped);
    setLoading(false);
  };

  return { channels, loading, refetch: fetch };
}
