import { Tabs } from "expo-router";
import { Home, Zap, User, BarChart3 } from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import CommandDrawer from "@/components/navigation/CommandDrawer";

export default function TabLayout() {
  return (
    <>
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
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="advisor"
          options={{
            title: "FORGE",
            tabBarIcon: ({ color, size }) => <Zap color={color} size={size} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: "INTEL",
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "HQ",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={1.8} />,
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
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.primary,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
  },
  header: {
    backgroundColor: Colors.primary,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    color: Colors.text,
    fontWeight: "600" as const,
    fontSize: 17,
  },
});
