import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../api/axios';
import { useAuth } from '../components/AuthContext';
import { Colors } from '../constants/Colors';

export default function Login() {
  const router = useRouter();
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login: saveUser } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }
  
    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
  
      const { token, user } = response.data;
  
      // Save both user and token globally
      saveUser(user, token);
  
      router.replace('/clients');
    } catch (error) {
      console.log(error);
      Alert.alert('Erreur de connexion', 'Veuillez vérifier votre email et mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: color.background }]}>
      <Text style={[styles.title, { color: color.text }]}>Connexion</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={[styles.input, { borderColor: color.icon, color: color.text }]}
        placeholderTextColor={dark ? '#888' : '#AAA'}
      />

      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={[styles.input, { borderColor: color.icon, color: color.text }]}
        placeholderTextColor={dark ? '#888' : '#AAA'}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: color.primary }]} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={[styles.buttonText, { color: 'white' }]}>Se connecter</Text>
        )}
      </TouchableOpacity>
  
      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text style={[styles.forgotText, { color: color.primary }]}>
          Mot de passe oublié ?
        </Text>
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
});
