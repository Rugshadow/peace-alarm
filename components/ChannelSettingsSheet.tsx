import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import AppAlert from './AppAlert';
import { useAppAlert } from '../hooks/useAppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Colors } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

type ListeningOrder = 'newest' | 'oldest';

type Props = {
  visible: boolean;
  onClose: () => void;
  channelId: string;
  currentCoverUrl: string | null;
  listeningOrder: ListeningOrder;
  onCoverUpdated: (newUrl: string) => void;
  onOrderChanged: (order: ListeningOrder) => void;
};

export default function ChannelSettingsSheet({
  visible,
  onClose,
  channelId,
  currentCoverUrl,
  listeningOrder,
  onCoverUpdated,
  onOrderChanged,
}: Props) {
  const { session } = useAuth();
  const { bg, surface, text, textSecondary } = useTheme();
  const { showAlert, alertProps } = useAppAlert();
  const [uploading, setUploading] = useState(false);
  const [order, setOrder] = useState<ListeningOrder>(listeningOrder);

  useEffect(() => {
    if (visible) setOrder(listeningOrder);
  }, [visible, channelId]);

  const handleOrderChange = async (newOrder: ListeningOrder) => {
    setOrder(newOrder);
    onOrderChanged(newOrder);
    const { error } = await supabase
      .from('channels')
      .update({ listening_order: newOrder } as any)
      .eq('channel_id', channelId);
    if (error) console.error('[ChannelSettingsSheet] listening_order update failed:', error.message, error.code);
    else console.log('[ChannelSettingsSheet] listening_order updated to:', newOrder);
  };

  const pickAndUploadCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !session) return;

    const asset = result.assets[0];
    if (!asset.base64) return;

    setUploading(true);
    try {
      // Delete old cover from storage if it exists
      if (currentCoverUrl) {
        const oldPath = currentCoverUrl.split('/channel-covers/')[1];
        if (oldPath) {
          await supabase.storage.from('channel-covers').remove([oldPath]);
        }
      }

      // Upload new cover
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${session.user.id}-${Date.now()}.${ext}`;
      const arrayBuffer = decode(asset.base64);
      const { error: uploadError } = await supabase.storage
        .from('channel-covers')
        .upload(fileName, arrayBuffer, { contentType: `image/${ext}` });

      if (uploadError) {
        showAlert('Upload failed', uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from('channel-covers').getPublicUrl(fileName);
      const newUrl = urlData.publicUrl;

      // Update channel row
      await supabase
        .from('channels')
        .update({ cover_photo: newUrl } as any)
        .eq('channel_id', channelId);

      onCoverUpdated(newUrl);
      showAlert('Done', 'Cover photo updated.');
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <AppAlert {...alertProps} />
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['left', 'right']}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.primary }}>
          <View className="px-6 pt-2 pb-3">
            <Text className="text-[17px] font-semibold text-text-primary text-center">
              Channel Settings
            </Text>
          </View>
        </SafeAreaView>

        <View className="flex-1 px-6 pt-8">
          {/* Current cover preview */}
          <View className="items-center mb-8">
            {currentCoverUrl ? (
              <Image
                source={{ uri: currentCoverUrl }}
                style={{ width: 160, height: 160, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{ width: 160, height: 160, borderRadius: 12, backgroundColor: Colors.primaryLight }}
                className="items-center justify-center"
              >
                <Ionicons name="radio-outline" size={48} color={Colors.primary} />
              </View>
            )}
          </View>

          {/* Upload button */}
          <TouchableOpacity
            onPress={pickAndUploadCover}
            disabled={uploading}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
            style={{ backgroundColor: Colors.primary, opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="image-outline" size={20} color={Colors.textPrimary} />
                <Text className="font-semibold text-[15px] text-text-primary">
                  Upload New Cover Photo
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Listening order */}
          <Text style={{ color: textSecondary }} className="text-[12px] font-semibold tracking-wider mt-8 mb-3">
            DEFAULT LISTENING ORDER
          </Text>
          <View style={{ backgroundColor: surface }} className="rounded-2xl p-1 flex-row">
            {(['newest', 'oldest'] as ListeningOrder[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => handleOrderChange(mode)}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: order === mode ? Colors.primary : 'transparent' }}
              >
                <Text
                  className="font-semibold text-[14px]"
                  style={{ color: order === mode ? Colors.textPrimary : textSecondary }}
                >
                  {mode === 'newest' ? 'Newest content always' : 'Play from beginning'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color: textSecondary }} className="text-[13px] mt-3 leading-5">
            Choose whether daily listeners always receive your newest content by default (good for news and current events), or if they start from your oldest content first (good for storytelling and educational content). You may determine the dafault setting for the channel, but listeners may adjust this to their own listening needs.
          </Text>
        </View>

        <View style={{ backgroundColor: Colors.primary, height: 56 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            <Text className="font-medium text-[15px] text-text-primary">Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
