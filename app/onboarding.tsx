import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

type OnboardingStep = 'SPLASH' | 'INFO_1' | 'INFO_2';

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

  // ETAPA 1: Splash Screen
  if (step === 'SPLASH') {
    return (
      <LinearGradient
        colors={[colors.cream, colors.coral]}
        locations={[0.42, 1.0]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Image 
          source={require('@/assets/images/cicla-logo.png')} 
          style={{ width: '40%', height: undefined, aspectRatio: 1, marginBottom: 120 }}
          resizeMode="contain"
        />
      </LinearGradient>
    );
  }

  // ETAPA 2: Info Screen 1 (Completa)
  if (step === 'INFO_1') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 32, paddingBottom: 40 }}>
            {/* Área da Imagem - flex-2 para ocupar mais espaço e aproximar do texto */}
            <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={require('@/assets/images/onboarding.png')} 
                style={{ width: width * 0.75, height: width * 0.75 }} 
                resizeMode="contain" 
              />
            </View>

            {/* Texto - diminuindo margin superior e aumentando margin inferior */}
            <View style={{ marginBottom: 80, marginTop: -20, alignItems: 'center' }}>
              <Text style={{ 
                color: colors.blue, 
                fontSize: 32, 
                fontWeight: '900', 
                textAlign: 'center',
                lineHeight: 38,
                marginBottom: 16
              }}>
                Acompanhe seu ciclo e preveja suas semanas.
              </Text>

              <Text style={{ 
                color: '#635957', 
                fontSize: 17, 
                textAlign: 'center',
                lineHeight: 24
              }}>
                Registre seus sintomas e entenda melhor o ritmo do seu corpo todos os meses.
              </Text>
            </View>

            {/* Botão no Fim */}
            <TouchableOpacity 
              onPress={() => setStep('INFO_2')}
              activeOpacity={0.8}
              style={{ 
                width: '100%', 
                backgroundColor: colors.coral, 
                height: 64, 
                borderRadius: 32, 
                alignItems: 'center', 
                justifyContent: 'center',
                shadowColor: colors.coral,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }


  // Placeholder para a próxima etapa (Imagem da Mulher)
  return (
    <SafeAreaView className="flex-1 bg-vera-cream items-center justify-center">
      <Text className="text-vera-blue text-xl font-bold">Próxima Etapa: Info 2 (Mulher)</Text>
    </SafeAreaView>
  );
}
