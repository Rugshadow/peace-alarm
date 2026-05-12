import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateUsernameScreen() {
  const router = useRouter();
  const { setUsername: setContextUsername } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('users').insert({
      user_id: user.id,
      username: trimmed,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setContextUsername(trimmed);
    router.replace('/(tabs)/browse');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-10">
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16 }}
              resizeMode="cover"
            />
            <Text className="text-text-secondary text-[15px] text-center mt-2">
              Choose a username for your account
            </Text>
          </View>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            className="bg-surface rounded-2xl px-4 py-4 text-[15px] text-text-primary mb-2"
          />

          {error ? (
            <Text className="text-destructive text-[14px] mb-3">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleComplete}
            disabled={loading || !username.trim()}
            className="rounded-full py-4 items-center mt-4"
            style={{ backgroundColor: username.trim() ? Colors.primary : Colors.surface }}
          >
            <Text
              className="font-bold text-[16px]"
              style={{ color: username.trim() ? Colors.textPrimary : Colors.textSecondary }}
            >
              {loading ? 'Creating account...' : 'Complete New Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ backgroundColor: Colors.primary }}>
        <TouchableOpacity
          onPress={() => { supabase.auth.signOut(); router.replace('/auth/login'); }}
          className="flex-row items-center justify-center gap-1 py-4"
          style={{ paddingBottom: 24 }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          <Text className="font-medium text-[15px] text-text-primary">Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
