import React from 'react';
import { Modal, View,TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../constants/colors';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
  onDismiss?: () => void;
};

export default function AppAlert({ visible, title, message, buttons, onDismiss }: Props) {
  const { surface, text, textSecondary, isDark } = useTheme();

  const btns: AppAlertButton[] = buttons?.length ? buttons : [{ text: 'OK' }];

  const handlePress = (btn: AppAlertButton) => {
    onDismiss?.();
    btn.onPress?.();
  };

  const buttonColor = (btn: AppAlertButton) => {
    if (btn.style === 'destructive') return Colors.destructive;
    if (btn.style === 'cancel') return textSecondary;
    return Colors.primary === '#DFFF00' ? (isDark ? '#DFFF00' : Colors.textPrimary) : Colors.primary;
  };

  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableWithoutFeedback>
            <View style={{
              width: 292,
              backgroundColor: surface,
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}>
              {/* Title + message */}
              <View style={{ paddingHorizontal: 24, paddingTop: 22, paddingBottom: 16 }}>
                <Text style={{ color: text, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: message ? 6 : 0 }}>
                  {title}
                </Text>
                {message ? (
                  <Text style={{ color: textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                    {message}
                  </Text>
                ) : null}
              </View>

              {/* Button row */}
              <View style={{ borderTopWidth: 1, borderTopColor: dividerColor, flexDirection: btns.length === 2 ? 'row' : 'column' }}>
                {btns.map((btn, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <View style={{
                        width: btns.length === 2 ? 1 : undefined,
                        height: btns.length === 2 ? undefined : 1,
                        backgroundColor: dividerColor,
                      }} />
                    )}
                    <TouchableOpacity
                      onPress={() => handlePress(btn)}
                      style={{ flex: btns.length === 2 ? 1 : undefined, alignItems: 'center', paddingVertical: 15 }}
                      activeOpacity={0.6}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: btn.style === 'cancel' ? '400' : '600',
                        color: buttonColor(btn),
                      }}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
