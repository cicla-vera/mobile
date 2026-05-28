import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Image } from 'react-native';

type OnboardingStep = 'SPLASH' | 'INFO_1';

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('SPLASH');

  useEffect(() => {
    if (step === 'SPLASH') {
      const timer = setTimeout(() => {
        setStep('INFO_1');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // ETAPA 1: Splash Screen (Frame 1028)
  if (step === 'SPLASH') {
    return (
      <View className="flex-1 bg-vera-cream items-center justify-center">
        <Image 
          source={require('@/assets/images/cicla-logo.png')} 
          style={{ width: '45%', height: undefined, aspectRatio: 1, marginBottom: 120 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Placeholder para a próxima etapa
  return (
    <SafeAreaView className="flex-1 bg-vera-cream items-center justify-center">
      <Text className="text-vera-blue text-xl font-bold">Próxima Etapa: Info 1</Text>
    </SafeAreaView>
  );
}
