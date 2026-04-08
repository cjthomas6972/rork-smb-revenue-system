import { Tabs } from "expo-router";
import { Home, Zap, User, BarChart3 } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import CommandDrawer from "@/components/navigation/CommandDrawer";

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: Colors.text,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "TODAY",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="advisor"
          options={{
            title: "FORGE",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Zap color={color} size={size} fill={focused ? color : 'transparent'} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: "INTEL",
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "HQ",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="assets"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="content"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <CommandDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  tabBar: {
    backgroundColor: Colors.secondary,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  header: {
    backgroundColor: Colors.primary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  headerTitle: {
    color: Colors.text,
    fontWeight: "600" as const,
    fontSize: 18,
  },
  activeIconContainer: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
});
