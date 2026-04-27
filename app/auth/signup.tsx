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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !username || !password) return;
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from('users').insert({
        user_id: data.user.id,
        username,
      });
    }
    if (!data.session) {
      setError('Please check your email to confirm your account.');
      setLoading(false);
      return;
    }
    router.replace('/(tabs)/browse');
    setLoading(false);
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
            <Text className="text-[26px] font-bold text-text-primary">Create account</Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-3 bg-surface rounded-2xl py-4 mb-4"
          >
            <FontAwesome name="google" size={20} color="#4285F4" />
            <Text className="font-semibold text-[16px] text-text-primary">Sign up with Google</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-4 mb-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-text-secondary text-[14px]">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-surface rounded-2xl px-4 py-4 text-[15px] text-text-primary mb-3"
          />

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            className="bg-surface rounded-2xl px-4 py-4 text-[15px] text-text-primary mb-3"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry
            className="bg-surface rounded-2xl px-4 py-4 text-[15px] text-text-primary mb-2"
          />

          {error ? (
            <Text className="text-destructive text-[14px] mb-3">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className="rounded-full py-4 items-center mt-4 mb-8"
            style={{ backgroundColor: Colors.primary }}
          >
            <Text className="font-bold text-[16px] text-text-primary">
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ backgroundColor: Colors.primary }}>
        <TouchableOpacity
          onPress={() => router.back()}
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
