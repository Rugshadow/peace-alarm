import React from 'react';
import { View, Text, Image } from 'react-native';
import { getChannelColor } from '../constants/colors';

type Props = {
  id: string;
  name: string;
  size?: 'carousel' | 'list' | 'large';
  imageUrl?: string;
};

const SIZE_MAP = {
  carousel: { container: 120, text: 36, radius: 0 },
  list: { container: 60, text: 20, radius: 0 },
  large: { container: 220, text: 40, radius: 0 },
};

export default function ChannelAvatar({ id, name, size = 'carousel', imageUrl }: Props) {
  const { container, text, radius } = SIZE_MAP[size];
  const bgColor = getChannelColor(id);
  const monogram = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: container, height: container, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: container,
        height: container,
        borderRadius: radius,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: text }}>
        {monogram}
      </Text>
    </View>
  );
}
