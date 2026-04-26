import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import AccountSheet from '../../components/AccountSheet';

function Header({ title }: { title: string }) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [showAccount, setShowAccount] = useState(false);

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.primary }}>
        <View className="flex-row items-center px-4 pb-2" style={{ height: 44 }}>
          <View className="flex-1">
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 36, height: 36, borderRadius: 8 }}
              resizeMode="contain"
            />
          </View>

          <Text className="text-[17px] font-semibold text-text-primary absolute left-0 right-0 text-center">
            {title}
          </Text>

          {isLoggedIn ? (
            <TouchableOpacity
              onPress={() => setShowAccount(true)}
              className="rounded-full px-4 py-1.5 bg-black/10"
            >
              <Text className="font-semibold text-[14px] text-text-primary">Account</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              className="rounded-full px-4 py-1.5 bg-white"
            >
              <Text className="font-semibold text-[14px] text-text-primary">Log In</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
      <AccountSheet visible={showAccount} onClose={() => setShowAccount(false)} />
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => {
          const titles: Record<string, string> = {
            browse: 'Browse Alarm Feeds',
            favorites: 'Favorites',
            schedule: 'Scheduled Alarms',
            uploads: 'Uploads',
          };
          return <Header title={titles[route.name] ?? ''} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: '#E5E5E5',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => <Ionicons name="heart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <Ionicons name="alarm" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="uploads"
        options={{
          title: 'Uploads',
          tabBarIcon: ({ color }) => <Ionicons name="cloud-upload" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
