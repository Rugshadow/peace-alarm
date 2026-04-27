import React, { useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AlarmSheet, { type AlarmData } from '../../components/AlarmSheet';
import type { Channel } from '../../components/ChannelSheet';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOCK_CHANNELS: Channel[] = [
  {
    id: '1', name: 'Morning Mindset', genre: 'health', listeners: 12400,
    bio: '', uploads: [], imageUrl: 'https://picsum.photos/seed/mindset/300/300',
  },
  {
    id: '2', name: 'Daily Jazz', genre: 'music', listeners: 8900,
    bio: '', uploads: [], imageUrl: 'https://picsum.photos/seed/jazz/300/300',
  },
  {
    id: '3', name: 'News Brief', genre: 'news', listeners: 34000,
    bio: '', uploads: [], imageUrl: 'https://picsum.photos/seed/news/300/300',
  },
  {
    id: '4', name: 'Laugh Start', genre: 'comedy', listeners: 5600,
    bio: '', uploads: [], imageUrl: 'https://picsum.photos/seed/comedy/300/300',
  },
  {
    id: '5', name: 'Zen Morning', genre: 'ambient', listeners: 21000,
    bio: '', uploads: [], imageUrl: 'https://picsum.photos/seed/zen/300/300',
  },
  {
    id: '6', name: 'Word of Day', genre: 'education', listeners: 7800,
    bio: '', uploads: [], imageUrl: 'https://picsum.photos/seed/wordday/300/300',
  },
];

type SetAlarm = AlarmData & { id: string };

export default function ScheduleScreen() {
  const [alarms, setAlarms] = useState<SetAlarm[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  const addAlarm = (data: AlarmData) => {
    setAlarms((prev) => [...prev, { ...data, id: Date.now().toString() }]);
  };

  const removeAlarm = (id: string) => {
    Alert.alert('Remove Alarm', 'Are you sure you want to remove this alarm?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setAlarms((prev) => prev.filter((a) => a.id !== id)) },
    ]);
  };

  const formatTime = (alarm: SetAlarm) => {
    const h = alarm.hour % 12 || 12;
    const m = String(alarm.minute).padStart(2, '0');
    return `${h}:${m} ${alarm.ampm}`;
  };

  if (alarms.length === 0) {
    return (
      <>
        <View className="flex-1 bg-white items-center justify-center px-8">
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 24 }}
            resizeMode="cover"
          />
          <Text className="text-[20px] font-bold text-text-primary mb-2">No alarms yet</Text>
          <Text className="text-text-secondary text-[15px] text-center mb-8">
            Set your first alarm to wake up to your favorite creator
          </Text>
          <TouchableOpacity
            onPress={() => setSheetVisible(true)}
            className="rounded-full px-8 py-3.5"
            style={{ backgroundColor: Colors.primary }}
          >
            <Text className="font-bold text-[16px] text-text-primary">+ Add Alarm</Text>
          </TouchableOpacity>
        </View>

        <AlarmSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onSave={addAlarm}
          channels={MOCK_CHANNELS}
        />
      </>
    );
  }

  return (
    <>
      <View className="flex-1 bg-white">
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-2xl overflow-hidden flex-row items-center">
              {item.channelImageUrl ? (
                <Image
                  source={{ uri: item.channelImageUrl }}
                  style={{ alignSelf: 'stretch', aspectRatio: 1 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ alignSelf: 'stretch', aspectRatio: 1, backgroundColor: Colors.primaryLight }} />
              )}
              <View className="flex-1 px-4 py-3">
                <Text className="text-[26px] font-bold text-text-primary mb-0.5">
                  {formatTime(item)}
                </Text>
                <Text className="text-text-secondary text-[13px] mb-2">{item.channelName}</Text>
                <View className="flex-row gap-1">
                  {DAY_LABELS.map((day, idx) => {
                    const active = item.repeatDays.includes(idx);
                    return (
                      <View
                        key={day}
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: active ? Colors.primary : Colors.background,
                          borderWidth: 1,
                          borderColor: active ? Colors.primary : Colors.textSecondary,
                        }}
                      >
                        <Text
                          className="text-[10px] font-semibold"
                          style={{ color: active ? Colors.textPrimary : Colors.textSecondary }}
                        >
                          {day[0]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity onPress={() => removeAlarm(item.id)} className="pr-4">
                <Ionicons name="trash-outline" size={22} color={Colors.destructive} />
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity
              onPress={() => setSheetVisible(true)}
              className="rounded-full py-3.5 items-center mt-2"
              style={{ backgroundColor: Colors.primary }}
            >
              <Text className="font-bold text-[16px] text-text-primary">+ Add Alarm</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <AlarmSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSave={addAlarm}
        channels={MOCK_CHANNELS}
      />
    </>
  );
}
