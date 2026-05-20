import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Channel, AudioClip } from '../components/ChannelSheet';

export function useChannels(language?: string) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [language]);

  const load = async () => {
    let channelsQuery = supabase.from('channels').select('channel_id, name, genre, bio, cover_photo, listening_order, active_alarms');
    if (language) channelsQuery = (channelsQuery as any).or(`language.cs.{"${language}"},language.cs.{"all"}`);

    const [{ data: channelRows }, { data: audioFiles }] = await Promise.all([
      channelsQuery,
      supabase.from('audio_files').select('*').order('created_at', { ascending: false }),
    ]);

    if (!channelRows) { setLoading(false); return; }

    const files = audioFiles ?? [];

    const mapped: Channel[] = channelRows.map((ch: any) => {
      const now = new Date();
      const uploads: AudioClip[] = files
        .filter((f: any) => f.channel_id === ch.channel_id && (!f.release_at || new Date(f.release_at) <= now))
        .map((f: any) => ({
          id: f.audio_id,
          title: f.title,
          date: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          duration: f.duration_seconds ?? 0,
          audioUrl: f.audio_file,
          imageUrl: f.cover_photo,
        }));

      return {
        id: ch.channel_id,
        name: ch.name,
        genre: ch.genre ?? 'general',
        listeners: ch.active_alarms ?? 0,
        bio: ch.bio ?? '',
        imageUrl: ch.cover_photo ?? undefined,
        uploads,
        listeningOrder: (ch.listening_order as 'newest' | 'oldest' | 'shuffle') ?? 'newest',
      };
    });

    setChannels(mapped.filter((ch) => ch.uploads.length > 0));
    setLoading(false);
  };

  return { channels, loading, refetch: load };
}
