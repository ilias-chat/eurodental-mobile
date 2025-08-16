import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import { Colors } from '../constants/Colors';

export default function ForgotPassword() {
  const router = useRouter();
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse e-mail.');
      return;
    }
  
    setLoading(true);
    try {
      const response = await api.post('/forgot-password', { email });
      if (response.data.success) {
        Alert.alert(
          'Succès',
          'Un nouveau mot de passe a été envoyé à votre adresse e-mail.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Erreur',
          response.data?.message || 'Une erreur est survenue.'
        );        
      }
    } catch (error) {
      Alert.alert('Erreur serveur', 'Impossible de traiter la demande.');
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: color.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://eurodental.ma/storage/uploads/page_blocks/cvHUbpQ5qSVioTrcPJB4go5oZvnKLeY4vAg7bHjl.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            
            <Text style={[styles.title, { color: color.text }]}>Mot de passe oublié</Text>
            <Text style={[styles.subtitle, { color: color.icon }]}>Entrez votre email pour récupérer votre mot de passe</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                placeholder="Entrez votre email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { 
                  borderColor: color.icon, 
                  color: color.text,
                  backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                }]}
                placeholderTextColor={dark ? '#666' : '#999'}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: color.primary }]} 
              onPress={handleForgotPassword} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Envoyer</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.replace('/login')}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.backText, { color: color.primary }]}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 250,
    height: 150,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '400',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    letterSpacing: -0.3,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  }
});
