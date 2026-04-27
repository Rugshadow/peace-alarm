import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import ChannelAvatar from '../../components/ChannelAvatar';
import ChannelSheet, { type Channel } from '../../components/ChannelSheet';
import AlarmSheet from '../../components/AlarmSheet';
import { useChannels } from '../../hooks/useChannels';

function CarouselSection({
  title,
  channels,
  onPress,
}: {
  title: string;
  channels: Channel[];
  onPress: (ch: Channel) => void;
}) {
  if (channels.length === 0) return null;
  return (
    <View className="mb-6">
      <Text className="text-[18px] font-bold text-text-primary px-4 mb-3">{title}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={channels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onPress(item)}
            className="items-center"
            style={{ width: 120 }}
          >
            <ChannelAvatar id={item.id} name={item.name} size="carousel" imageUrl={item.imageUrl} />
            <Text className="text-[12px] text-text-secondary mt-2 text-center" numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function BrowseScreen() {
  const { channels, loading } = useChannels();
  const [searchText, setSearchText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [alarmSheetVisible, setAlarmSheetVisible] = useState(false);
  const openChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setSheetVisible(true);
  };

  const query = searchText.toLowerCase().trim();
  const filteredChannels = query
    ? channels.filter((c) => c.name.toLowerCase().includes(query))
    : null;

  const topByFollowers = [...channels].sort((a, b) => b.listeners - a.listeners);
  const genres = [...new Set(channels.map((c) => c.genre))];
  const genreSections = genres.map((genre) => ({
    title: genre.charAt(0).toUpperCase() + genre.slice(1),
    channels: channels.filter((c) => c.genre === genre),
  }));

  return (
    <>
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 gap-2">
            <Ionicons name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search & filter alarms..."
              placeholderTextColor={Colors.textSecondary}
              className="flex-1 text-[15px] text-text-primary"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View className="pt-4">
            {filteredChannels ? (
              filteredChannels.length > 0 ? (
                <CarouselSection title="Results" channels={filteredChannels} onPress={openChannel} />
              ) : (
                <View className="items-center py-16">
                  <Text className="text-text-secondary text-[15px]">No channels found for "{searchText}"</Text>
                </View>
              )
            ) : (
              <>
                <CarouselSection title="Most Followed" channels={topByFollowers} onPress={openChannel} />
                {genreSections.map((section) => (
                  <CarouselSection key={section.title} title={section.title} channels={section.channels} onPress={openChannel} />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      <ChannelSheet
        channel={selectedChannel}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSetAlarm={(channel) => {
          setSelectedChannel(channel);
          setSheetVisible(false);
          setAlarmSheetVisible(true);
        }}
      />

      <AlarmSheet
        visible={alarmSheetVisible}
        onClose={() => setAlarmSheetVisible(false)}
        onSave={() => setAlarmSheetVisible(false)}
        channels={channels}
      />
    </>
  );
}
