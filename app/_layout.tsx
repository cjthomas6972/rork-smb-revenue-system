import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { BusinessProvider, useBusiness } from "@/store/BusinessContext";
import Colors from "@/constants/colors";
import { CinematicSplash } from "@/components/brand";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function OnboardingRouter() {
  const router = useRouter();
  const segments = useSegments();
  const { isOnboardingComplete, isLoading } = useBusiness();

  useEffect(() => {
    if (isLoading || isOnboardingComplete === null) {
      return;
    }

    const inOnboarding = segments[0] === ('onboarding' as string);

    console.log('[OnboardingRouter] State:', { 
      isOnboardingComplete, 
      inOnboarding,
      segments 
    });

    if (isOnboardingComplete === false) {
      if (!inOnboarding) {
        console.log('[OnboardingRouter] First-time user, redirecting to onboarding');
        router.replace('/onboarding' as never);
      }
    } else if (inOnboarding) {
      console.log('[OnboardingRouter] Onboarding complete, redirecting to dashboard');
      router.replace('/' as never);
    }
  }, [isOnboardingComplete, isLoading, segments, router]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <OnboardingRouter />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.primary }}>
        <BusinessProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
          {showSplash && <CinematicSplash onComplete={handleSplashComplete} />}
        </BusinessProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
