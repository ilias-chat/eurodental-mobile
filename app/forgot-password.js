import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez entrer votre adresse e-mail.',
      });
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
    <View style={[styles.container, { backgroundColor: color.background }]}>
      <Text style={[styles.title, { color: color.text }]}>Mot de passe oublié</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={[styles.input, { borderColor: color.icon, color: color.text }]}
        placeholderTextColor={dark ? '#888' : '#AAA'}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: color.primary }]} onPress={handleForgotPassword} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={[styles.buttonText, { color: 'white' }]}>Envoyer</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={[styles.forgotText, { color: color.primary }]}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 24
  },
  input: {
    width: 300, height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16
  },
  button: {
    width: 300, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  buttonText: {
    fontSize: 18
  },
  forgotText: {
    fontSize: 16
  }
});
