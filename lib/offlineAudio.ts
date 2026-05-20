import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { supabase } from './supabase';

const { IntentData } = NativeModules;

const MANIFEST_KEY = '@offline_audio_manifest';
const ENABLED_KEY = '@offline_audio_channels';
const HEARD_KEY = '@local_heard_audio';

export type OfflineAudioEntry = {
  path: string;
  title: string;
  duration: number;
  createdAt: string;
};

// { [channelId]: { [audioId]: OfflineAudioEntry } }
type Manifest = Record<string, Record<string, OfflineAudioEntry>>;
type EnabledChannels = string[];

let _docDir: string | null = null;
async function getAudioDir(): Promise<string> {
  if (!_docDir) _docDir = await IntentData.getDocumentDirectory();
  return _docDir + '/offline_audio/';
}

async function readManifest(): Promise<Manifest> {
  try {
    const raw = await AsyncStorage.getItem(MANIFEST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function writeManifest(manifest: Manifest) {
  await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
}

async function readEnabled(): Promise<EnabledChannels> {
  try {
    const raw = await AsyncStorage.getItem(ENABLED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function writeEnabled(channels: EnabledChannels) {
  await AsyncStorage.setItem(ENABLED_KEY, JSON.stringify(channels));
}

export async function isOfflineEnabled(channelId: string): Promise<boolean> {
  const enabled = await readEnabled();
  return enabled.includes(channelId);
}

async function downloadChannelAudio(channelId: string): Promise<void> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('audio_files')
    .select('audio_id, audio_file, title, duration_seconds, created_at')
    .eq('channel_id', channelId)
    .or(`release_at.is.null,release_at.lte.${now}`);

  if (error || !data?.length) return;

  const manifest = await readManifest();
  const channelFiles = manifest[channelId] ?? {};
  const audioDir = await getAudioDir();
  const dir = audioDir + channelId + '/';

  for (const row of data) {
    const audioId = row.audio_id as string;
    const remoteUrl = row.audio_file as string;
    if (channelFiles[audioId]) continue;

    try {
      const ext = remoteUrl.split('?')[0].split('.').pop() ?? 'mp3';
      const dest = `${dir}${audioId}.${ext}`;
      const localUri: string = await IntentData.downloadFile(remoteUrl, dest);
      channelFiles[audioId] = {
        path: localUri,
        title: (row.title as string) ?? '',
        duration: (row.duration_seconds as number) ?? 30,
        createdAt: (row.created_at as string) ?? now,
      };
    } catch {}
  }

  manifest[channelId] = channelFiles;
  await writeManifest(manifest);

  // Mirror to SharedPreferences so AlarmService can use local files without JS
  try {
    const entries = Object.entries(channelFiles).map(([audioId, e]) => ({
      audioId, path: e.path, createdAt: e.createdAt, title: e.title, duration: e.duration,
    }));
    await IntentData?.saveOfflineManifest?.(channelId, JSON.stringify(entries));
  } catch {}
}

async function deleteChannelAudio(channelId: string): Promise<void> {
  try {
    const audioDir = await getAudioDir();
    await IntentData.deleteDir(audioDir + channelId);
  } catch {}

  const manifest = await readManifest();
  delete manifest[channelId];
  await writeManifest(manifest);
  try { await IntentData?.clearOfflineManifest?.(channelId); } catch {}
}

export async function enableOffline(channelId: string): Promise<void> {
  const enabled = await readEnabled();
  if (!enabled.includes(channelId)) await writeEnabled([...enabled, channelId]);
  await downloadChannelAudio(channelId);
}

export async function disableOffline(channelId: string): Promise<void> {
  const enabled = await readEnabled();
  await writeEnabled(enabled.filter(id => id !== channelId));
  await deleteChannelAudio(channelId);
}

export async function syncOfflineAudio(): Promise<void> {
  const enabled = await readEnabled();
  for (const channelId of enabled) {
    try { await downloadChannelAudio(channelId); } catch {}
  }
}

// Returns the local path for a given audioId, or null if not cached.
export async function getLocalAudioPath(channelId: string, audioId: string): Promise<string | null> {
  const manifest = await readManifest();
  return manifest[channelId]?.[audioId]?.path ?? null;
}

// Returns all cached entries for a channel.
export async function getLocalChannelAudio(channelId: string): Promise<Record<string, OfflineAudioEntry>> {
  const manifest = await readManifest();
  return manifest[channelId] ?? {};
}

// ── Heard audio local store ──────────────────────────────────────────────────

export async function getLocalHeardAudio(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HEARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addLocalHeardAudio(audioId: string): Promise<void> {
  const current = await getLocalHeardAudio();
  if (!current.includes(audioId)) {
    await AsyncStorage.setItem(HEARD_KEY, JSON.stringify([...current, audioId]));
  }
}

export async function removeLocalHeardAudio(audioIds: string[]): Promise<void> {
  const toRemove = new Set(audioIds);
  const current = await getLocalHeardAudio();
  await AsyncStorage.setItem(HEARD_KEY, JSON.stringify(current.filter(id => !toRemove.has(id))));
}

export async function setLocalHeardAudio(audioIds: string[]): Promise<void> {
  await AsyncStorage.setItem(HEARD_KEY, JSON.stringify(audioIds));
}

// Merges local + remote heard_audio and writes the union back to Supabase.
export async function syncHeardAudioToSupabase(userId: string): Promise<void> {
  const local = await getLocalHeardAudio();
  const { data } = await supabase.from('users').select('heard_audio').eq('user_id', userId).single();
  const remote: string[] = (data?.heard_audio as string[]) ?? [];
  const merged = Array.from(new Set([...local, ...remote]));
  await supabase.from('users').update({ heard_audio: merged } as any).eq('user_id', userId);
  await setLocalHeardAudio(merged);
}
