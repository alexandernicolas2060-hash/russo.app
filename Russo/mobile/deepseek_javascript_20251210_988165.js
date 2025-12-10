import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import CountryPicker from 'react-native-country-picker-modal';

// Components
import { RussoInput } from '../components/common/RussoInput';
import { RussoToast } from '../components/common/RussoToast';
import { RussoLoader } from '../components/RussoLoader';

// Services
import { RussoAuth } from '../services/RussoAuth';

export default function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('VE');
  const [callingCode, setCallingCode] = useState('58');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleAuth = async () => {
    if (loading) return;

    // Validaciones
    if (!phone.trim()) {
      RussoToast.show('Número de teléfono requerido', 'error');
      return;
    }

    if (!password.trim()) {
      RussoToast.show('Contraseña requerida', 'error');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      RussoToast.show('Las contraseñas no coinciden', 'error');
      return;
    }

    if (!isLogin && (!firstName.trim() || !lastName.trim())) {
      RussoToast.show('Nombre y apellido requeridos', 'error');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+${callingCode}${phone.replace(/\D/g, '')}`;

      if (isLogin) {
        // Login
        const result = await RussoAuth.login(fullPhone, password);
        
        if (result.verificationRequired) {
          setShowVerification(true);
          startCountdown();
          RussoToast.show('Verifica tu teléfono para continuar', 'info');
        } else {
          navigation.replace('MainApp');
          RussoToast.show('Bienvenido a Russo', 'success');
        }
      } else {
        // Registro
        const result = await RussoAuth.register({
          phone: fullPhone,
          countryCode,
          password,
          firstName,
          lastName,
        });

        if (result.success) {
          setShowVerification(true);
          startCountdown();
          RussoToast.show('Código de verificación enviado', 'success');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      RussoToast.show(error.message || 'Error de autenticación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      RussoToast.show('Código de 6 dígitos requerido', 'error');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+${callingCode}${phone.replace(/\D/g, '')}`;
      const result = await RussoAuth.verify(fullPhone, verificationCode);

      if (result.success) {
        navigation.replace('MainApp');
        RussoToast.show('Teléfono verificado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Verification error:', error);
      RussoToast.show(error.message || 'Error de verificación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) {
      RussoToast.show(`Espere ${countdown} segundos`, 'info');
      return;
    }

    try {
      const fullPhone = `+${callingCode}${phone.replace(/\D/g, '')}`;
      await RussoAuth.resendCode(fullPhone);
      startCountdown();
      RussoToast.show('Código reenviado', 'success');
    } catch (error) {
      RussoToast.show('Error al reenviar código', 'error');
    }
  };

  const startCountdown = () => {
    setCountdown(60);
  };

  const handleCountrySelect = (country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  if (loading) {
    return <RussoLoader />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <View style={styles.logoInner}>
                <View style={styles.logoLetterR}>
                  <View style={styles.logoRLine1} />
                  <View style={styles.logoRLine2} />
                  <View style={styles.logoRCurve} />
                </View>
              </View>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {!showVerification ? (
              <>
                {/* Selector de país */}
                <View style={styles.countrySelector}>
                  <CountryPicker
                    withCallingCode
                    withCallingCodeButton
                    withFlag
                    withFilter
                    withAlphaFilter
                    withEmoji
                    countryCode={countryCode}
                    onSelect={handleCountrySelect}
                    translation="spa"
                    theme={{
                      primaryColor: theme.colors.secondary,
                      primaryColorVariant: theme.colors.secondary,
                      backgroundColor: theme.colors.surface,
                      onBackgroundTextColor: theme.colors.text,
                      fontSize: 14,
                      fontFamily: 'Geist-Regular',
                    }}
                    containerButtonStyle={styles.countryButton}
                  />
                </View>

                {/* Teléfono */}
                <RussoInput
                  label="Número de teléfono"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="04141234567"
                  keyboardType="phone-pad"
                  prefix={`+${callingCode}`}
                  containerStyle={styles.input}
                />

                {/* Contraseña */}
                <RussoInput
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  containerStyle={styles.input}
                />

                {!isLogin && (
                  <>
                    {/* Confirmar contraseña */}
                    <RussoInput
                      label="Confirmar contraseña"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      secureTextEntry
                      containerStyle={styles.input}
                    />

                    {/* Nombre */}
                    <RussoInput
                      label="Nombre"
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Tu nombre"
                      containerStyle={styles.input}
                    />

                    {/* Apellido */}
                    <RussoInput
                      label="Apellido"
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Tu apellido"
                      containerStyle={styles.input}
                    />
                  </>
                )}

                {/* Botón de acción */}
                <TouchableWithoutFeedback onPress={handleAuth}>
                  <View style={styles.authButton}>
                    <Text style={styles.authButtonText}>
                      {isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>

                {/* Cambiar entre login/registro */}
                <TouchableWithoutFeedback
                  onPress={() => setIsLogin(!isLogin)}
                >
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                      {isLogin
                        ? '¿No tienes cuenta? '
                        : '¿Ya tienes cuenta? '}
                      <Text style={styles.toggleHighlight}>
                        {isLogin ? 'Regístrate' : 'Inicia sesión'}
                      </Text>
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </>
            ) : (
              /* Verificación */
              <View style={styles.verificationContainer}>
                <Text style={styles.verificationTitle}>
                  Verificación por SMS
                </Text>
                <Text style={styles.verificationSubtitle}>
                  Ingresa el código de 6 dígitos enviado a:
                </Text>
                <Text style={styles.verificationPhone}>
                  +{callingCode} {phone}
                </Text>

                <RussoInput
                  label="Código de verificación"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  containerStyle={styles.verificationInput}
                />

                <TouchableWithoutFeedback onPress={handleVerification}>
                  <View style={styles.verifyButton}>
                    <Text style={styles.verifyButtonText}>
                      VERIFICAR
                    </Text>
                  </View>
                </TouchableWithoutFeedback>

                <TouchableWithoutFeedback onPress={resendCode}>
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                      {countdown > 0
                        ? `Reenviar código en ${countdown}s`
                        : 'Reenviar código'}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            )}

            {/* Términos */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Al continuar, aceptas nuestros{' '}
                <Text style={styles.termsLink}>Términos de Servicio</Text>{' '}
                y{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  logoInner: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetterR: {
    width: 40,
    height: 60,
    position: 'relative',
  },
  logoRLine1: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 12,
    height: 60,
    backgroundColor: '#D4AF37',
    borderRadius: 6,
  },
  logoRLine2: {
    position: 'absolute',
    left: 6,
    top: 10,
    width: 20,
    height: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 6,
    transform: [{ rotate: '-30deg' }],
  },
  logoRCurve: {
    position: 'absolute',
    left: 8,
    top: 25,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#D4AF37',
    borderRadius: 12,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  countrySelector: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  countryButton: {
    padding: 16,
  },
  input: {
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  authButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  toggleText: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
  toggleHighlight: {
    color: '#D4AF37',
    fontFamily: 'Geist-SemiBold',
  },
  verificationContainer: {
    alignItems: 'center',
  },
  verificationTitle: {
    color: '#F5F5F5',
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  verificationSubtitle: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    marginBottom: 5,
  },
  verificationPhone: {
    color: '#D4AF37',
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    marginBottom: 30,
    textAlign: 'center',
  },
  verificationInput: {
    marginBottom: 30,
    width: '100%',
  },
  verifyButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    color: '#D4AF37',
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
  },
  termsContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#D4AF37',
    fontFamily: 'Geist-SemiBold',
  },
});