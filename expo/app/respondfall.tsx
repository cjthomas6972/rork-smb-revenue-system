import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquareWarning, PhoneMissed, TimerReset } from 'lucide-react-native';
import Colors from '@/constants/colors';

const sequence = [
  { day: 'Send in 4 min', text: 'Hey — sorry we missed your call. What are you needing help with today? I can text you pricing, availability, or get you booked right here.' },
  { day: 'Day 1', text: 'Circling back in case you still need help. If you want, send me a quick photo/details and I can point you to the best next step.' },
  { day: 'Day 3', text: 'Quick follow-up — we still have availability this week. Want me to hold a slot for you?' },
  { day: 'Day 7', text: 'Last follow-up from us — if timing is better later, reply anytime and we’ll jump back in.' },
];

export default function RespondfallScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'RESPONDFALL', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.text }} />
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]} style={styles.hero}>
          <PhoneMissed size={26} color={Colors.text} />
          <Text style={styles.heroTitle}>Recover missed revenue fast</Text>
          <Text style={styles.heroText}>Use FORGE to generate business-specific missed-call sequences. This module is ready for the next integration pass.</Text>
        </LinearGradient>
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <TimerReset size={18} color={Colors.accent} />
            <Text style={styles.rowTitle}>Recommended response window</Text>
          </View>
          <Text style={styles.rowText}>Best recovery happens when the first text goes out within 4 minutes of the missed call.</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <MessageSquareWarning size={18} color={Colors.accent} />
            <Text style={styles.rowTitle}>Default 4-part sequence</Text>
          </View>
          {sequence.map((item) => (
            <View key={item.day} style={styles.sequenceItem}>
              <Text style={styles.sequenceDay}>{item.day}</Text>
              <Text style={styles.sequenceText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  hero: { borderRadius: 18, padding: 18, gap: 10 },
  heroTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  heroText: { color: Colors.text, fontSize: 14, lineHeight: 20, opacity: 0.9 },
  infoCard: { backgroundColor: Colors.secondary, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rowTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  rowText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  sequenceItem: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12 },
  sequenceDay: { color: Colors.accent, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  sequenceText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
});
