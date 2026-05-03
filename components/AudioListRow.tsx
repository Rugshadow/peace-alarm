import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import ChannelAvatar from './ChannelAvatar';
import { useTheme } from '../hooks/useTheme';

type Props = {
  id: string;
  title: string;
  channelName: string;
  channelId: string;
  date: string;
  duration: number;
  isPlaying: boolean;
  isFavorited?: boolean;
  isHeard?: boolean;
  releaseDate?: Date;
  imageUrl?: string;
  onPress: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatReleaseDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function AudioListRow({
  id,
  title,
  channelName,
  channelId,
  date,
  duration,
  isPlaying,
  isFavorited,
  isHeard,
  releaseDate,
  imageUrl,
  onPress,
  onFavorite,
  onDelete,
}: Props) {
  const { bg, surface, text, textSecondary } = useTheme();
  const isScheduled = !!releaseDate && releaseDate > new Date();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ backgroundColor: bg, borderBottomWidth: 1, borderBottomColor: surface }} className="flex-row items-center py-3 px-4">
      <View style={{ width: 50, height: 50 }} className="items-center justify-center mr-3">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: 50, height: 50, borderRadius: 0 }} resizeMode="cover" />
        ) : (
          <ChannelAvatar id={channelId} name={channelName} size="list" />
        )}
        {isPlaying && (
          <View className="absolute inset-0 items-center justify-center bg-black/30">
            <Ionicons name="pause" size={20} color="white" />
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text style={{ color: text }} className="font-medium text-[15px]" numberOfLines={1}>
          {title}
        </Text>
        {isScheduled ? (
          <Text style={{ color: '#E53935', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            Set to release: {formatReleaseDate(releaseDate!)}
          </Text>
        ) : (
          <Text style={{ color: textSecondary }} className="text-[13px] mt-0.5">
            {date} · {formatDuration(duration)}
          </Text>
        )}
      </View>

      {onFavorite && isHeard === false && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 4 }} />
      )}

      {onFavorite && (
        <TouchableOpacity onPress={onFavorite} className="px-2">
          <Ionicons
            name={isFavorited ? 'star' : 'star-outline'}
            size={20}
            color={isFavorited ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      {onDelete && (
        <TouchableOpacity onPress={onDelete} className="px-2" hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
