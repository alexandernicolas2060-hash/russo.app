import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RussoAPI from '../services/RussoAPI';

const AuthScreen = ({ navigation }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'verify'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await RussoAPI.login(phone, password);
      
      if (response.success) {
        if (response.requires_verification) {
          setMode('verify');
          Alert.alert(
            'Verificación Requerida',
            'Se ha enviado un código a tu teléfono.'
          );
        } else {
          Alert.alert('✅ Inicio de Sesión Exitoso', '¡Bienvenido a Russo!');
          navigation.replace('Home');
        }
      } else {
        Alert.alert('Error', response.error || 'Error en el inicio de sesión');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!phone || !name || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const response = await RussoAPI.register(phone, name, password);
      
      if (response.success) {
        setMode('verify');
        Alert.alert(
          '✅ Registro Exitoso',
          'Se ha enviado un código de verificación a tu teléfono.'
        );
      } else {
        Alert.alert('Error', response.error || 'Error en el registro');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    try {
      const response = await RussoAPI.verifyOTP(phone, code);
      
      if (response.success) {
        Alert.alert(
          '✅ Verificación Exitosa',
          'Tu cuenta ha sido verificada exitosamente.',
          [{ text: 'Continuar', onPress: () => navigation.replace('Home') }]
        );
      } else {
        Alert.alert('Error', response.error || 'Código incorrecto');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await RussoAPI.resendOTP(phone);
      
      if (response.success) {
        Alert.alert('✅ Código Reenviado', 'Se ha enviado un nuevo código a tu teléfono.');
      } else {
        Alert.alert('Error', response.error || 'No se pudo reenviar el código');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
  };

  const renderLogin = () => (
    <>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <Text style={styles.subtitle}>Accede a tu cuenta Russo</Text>
      
      <View style={styles.inputContainer}>
        <Icon name="phone" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.input}
          placeholder="Número de teléfono"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Icon name="login" size={20} color="#000" />
            <Text style={styles.buttonTextPrimary}>Iniciar Sesión</Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setMode('register')}>
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </>
  );

  const renderRegister = () => (
    <>
      <Text style={styles.title}>Crear Cuenta</Text>
      <Text style={styles.subtitle}>Únete a Russo</Text>
      
      <View style={styles.inputContainer}>
        <Icon name="phone" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.input}
          placeholder="Número de teléfono"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Icon name="account" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={name}
          onChangeText={setName}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.input}
          placeholder="Contraseña (mínimo 6 caracteres)"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Icon name="account-plus" size={20} color="#000" />
            <Text style={styles.buttonTextPrimary}>Registrarse</Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setMode('login')}>
        <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </>
  );

  const renderVerify = () => (
    <>
      <Text style={styles.title}>Verificar Teléfono</Text>
      <Text style={styles.subtitle}>
        Ingresa el código de 6 dígitos enviado a:
      </Text>
      <Text style={styles.phoneText}>{phone}</Text>
      
      <View style={styles.inputContainer}>
        <Icon name="shield-check" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.input}
          placeholder="Código de verificación"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Icon name="check-circle" size={20} color="#000" />
            <Text style={styles.buttonTextPrimary}>Verificar</Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleResendCode}>
        <Text style={styles.linkText}>Reenviar código</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setMode('login')}>
        <Text style={styles.linkText}>Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Scroll
