import React, { memo, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Archive, Brain, ChevronRight, Command, Sparkles, TriangleAlert } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface CommandItem {
  id: string;
  label: string;
  route: '/assets' | '/content' | '/memory-log' | '/respondfall';
  icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  description: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'arsenal',
    label: 'Arsenal',
    route: '/assets',
    icon: Archive,
    description: 'Offers, scripts, funnels, DMs, followups',
  },
  {
    id: 'content-lab',
    label: 'Content Lab',
    route: '/content',
    icon: Sparkles,
    description: 'Video scripts, captions, outreach sequences',
  },
  {
    id: 'memory-log',
    label: 'Memory Log',
    route: '/memory-log',
    icon: Brain,
    description: 'What SKYFORGE knows about the business',
  },
  {
    id: 'respondfall',
    label: 'Respondfall',
    route: '/respondfall',
    icon: TriangleAlert,
    description: 'Missed revenue recovery workflows',
  },
];

/**
 * The command layer. It never asks for attention — a still handle at rest,
 * a quiet sheet when summoned.
 */
function CommandDrawer() {
  const router = useRouter();
  const [visible, setVisible] = useState<boolean>(false);
  const sheetAnim = useRef(new Animated.Value(340)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: 340, duration: 220, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const items = useMemo(() => COMMAND_ITEMS, []);

  return (
    <>
      <View style={styles.fabWrap} pointerEvents="box-none">
        <TouchableOpacity testID="command-drawer-button" activeOpacity={0.8} onPress={openDrawer} accessibilityLabel="Open command drawer">
          <View style={styles.fab}>
            <Command size={20} color={Colors.accent} strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={styles.handle} />
            <Text style={styles.title}>More</Text>
            <View style={styles.list}>
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.item, index < items.length - 1 && styles.itemHairline]}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeDrawer();
                      setTimeout(() => {
                        router.push(item.route as never);
                      }, 180);
                    }}
                    testID={`command-item-${item.id}`}
                  >
                    <View style={styles.itemLeft}>
                      <Icon size={19} color={Colors.text} strokeWidth={1.8} />
                      <View style={styles.itemTextWrap}>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  list: {},
  item: {
    minHeight: 68,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemHairline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  itemTextWrap: {
    flex: 1,
    gap: 3,
  },
  itemLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  itemDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 17,
  },
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    zIndex: 999,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tertiary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default memo(CommandDrawer);
