import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { markOnboardingSeen } from '@/services/onboarding-storage';

const { width } = Dimensions.get('window');

type OnboardingStep = 'SPLASH' | 'INFO_1' | 'INFO_2';

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('SPLASH');
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (step === 'SPLASH') {
      timer = setTimeout(() => {
        setStep('INFO_1');
      }, 4000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step]);

  const handleFinish = async () => {
    try {
      await markOnboardingSeen();
      router.replace('/welcome');
    } catch (error) {
      console.error('Failed to mark onboarding as seen:', error);
      router.replace('/welcome');
    }
  };

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

  // ETAPA 2: Info Screen 1 (Flor)
  if (step === 'INFO_1') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 32, paddingBottom: 40 }}>
            <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={require('@/assets/images/onboarding.png')} 
                style={{ width: width * 0.75, height: width * 0.75 }} 
                resizeMode="contain" 
              />
            </View>

            <View style={{ marginBottom: 80, marginTop: -20, alignItems: 'center' }}>
              <Text style={{ color: colors.blue, fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, marginBottom: 16 }}>
                Acompanhe seu ciclo e preveja suas semanas.
              </Text>
              <Text style={{ color: '#635957', fontSize: 17, textAlign: 'center', lineHeight: 24 }}>
                Registre seus sintomas e entenda melhor o ritmo do seu corpo todos os meses.
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => setStep('INFO_2')}
              activeOpacity={0.8}
              style={{ width: '100%', backgroundColor: colors.coral, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: colors.coral, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ETAPA 3: Info Screen 2 (Mulher)
  if (step === 'INFO_2') {
    return (
      <LinearGradient
        colors={['#FFDAE2', '#E892A3']}
        style={{ flex: 1 }}
      >
        <View 
          style={{ 
            position: 'absolute', 
            bottom: -1, 
            left: 0, 
            right: 0, 
            alignItems: 'center',
            zIndex: 0 
          }}
          pointerEvents="none"
        >
          <Image 
            source={require('@/assets/images/woman-onboarding.png')} 
            style={{ width: width, height: width * 1.7 }} 
            resizeMode="contain" 
          />
        </View>

        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 32, paddingBottom: 40, justifyContent: 'flex-end' }}>
            <View style={{ marginBottom: 120 }}>
              <Text style={{ 
                color: colors.white, 
                fontSize: 30, 
                fontWeight: '900', 
                lineHeight: 44,
                textAlign: 'left'
              }}>
                Seu corpo,{"\n"}
                Sua segurança,{"\n"}
                Tudo em um só lugar.
              </Text>
            </View>

            <TouchableOpacity 
              onPress={handleFinish}
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
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 5
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
}
