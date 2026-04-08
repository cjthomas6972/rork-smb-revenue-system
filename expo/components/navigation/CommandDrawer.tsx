import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Archive, Brain, ChevronRight, Sparkles, TriangleAlert } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface CommandItem {
  id: string;
  label: string;
  route: '/assets' | '/content' | '/memory-log' | '/respondfall';
  icon: React.ComponentType<{ color?: string; size?: number }>;
  description: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'arsenal',
    label: 'ARSENAL',
    route: '/assets',
    icon: Archive,
    description: 'Offers, scripts, funnels, DMs, followups',
  },
  {
    id: 'content-lab',
    label: 'CONTENT LAB',
    route: '/content',
    icon: Sparkles,
    description: 'Video scripts, captions, outreach sequences',
  },
  {
    id: 'memory-log',
    label: 'MEMORY LOG',
    route: '/memory-log',
    icon: Brain,
    description: 'What SKYFORGE knows about the business',
  },
  {
    id: 'respondfall',
    label: 'RESPONDFALL',
    route: '/respondfall',
    icon: TriangleAlert,
    description: 'Missed revenue recovery workflows',
  },
];

function CommandDrawer() {
  const router = useRouter();
  const [visible, setVisible] = useState<boolean>(false);
  const sheetAnim = useRef(new Animated.Value(340)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(8000),
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 450, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulseAnim]);

  const openDrawer = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }),
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
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]} pointerEvents="box-none">
        <TouchableOpacity testID="command-drawer-button" activeOpacity={0.9} onPress={openDrawer}>
          <LinearGradient
            colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Text style={styles.fabText}>⚡</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={visible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={styles.handle} />
            <Text style={styles.kicker}>COMMAND LAYER</Text>
            <Text style={styles.title}>SKYFORGE</Text>
            <View style={styles.list}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.item}
                    activeOpacity={0.85}
                    onPress={() => {
                      closeDrawer();
                      setTimeout(() => {
                        router.push(item.route as never);
                      }, 180);
                    }}
                    testID={`command-item-${item.id}`}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.iconWrap}>
                        <Icon size={18} color={Colors.accent} />
                      </View>
                      <View style={styles.itemTextWrap}>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 16,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.textMuted,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 18,
  },
  list: {
    gap: 12,
  },
  item: {
    minHeight: 72,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.tertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextWrap: {
    flex: 1,
    gap: 4,
  },
  itemLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    zIndex: 999,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brandGradient.middle,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  fabText: {
    fontSize: 24,
  },
});

export default memo(CommandDrawer);
