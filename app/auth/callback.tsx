import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const accessToken = params.access_token as string;
    const refreshToken = params.refresh_token as string;
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(async ({ data }) => {
        const user = data.user;
        if (user) {
          const { data: userData } = await supabase.from('users').select('user_id').eq('user_id', user.id).maybeSingle();
          router.replace(userData ? '/(tabs)/browse' : '/auth/create-username');
        } else {
          router.replace('/(tabs)/browse');
        }
      });
    } else {
      router.replace('/(tabs)/browse');
    }
  }, []);

  return null;
}
