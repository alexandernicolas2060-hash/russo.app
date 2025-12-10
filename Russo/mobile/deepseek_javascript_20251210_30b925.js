import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import CountryPicker from 'react-native-country-picker-modal';

// Components
import { RussoHeader } from '../components/RussoHeader';
import { RussoInput } from '../components/common/RussoInput';
import { RussoToast } from '../components/common/RussoToast';
import { RussoLoader } from '../components/RussoLoader';

// Services
import { RussoAuth } from '../services/RussoAuth';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [step, setStep] = useState(1); // 1: Phone, 2: Code, 3: New Password
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Step 1
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('VE');
  const [callingCode, setCallingCode] = useState('58');
  
  // Step 2
  const [verificationCode, setVerificationCode] = useState('');
  
  // Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendCode = async () => {
    if (!phone.trim()) {
      RussoToast.show('Número de teléfono requerido', 'error');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+${callingCode}${phone.replace(/\D/g, '')}`;
      await RussoAuth.requestPasswordReset(fullPhone);
      
      setStep(2);
      startCountdown();
      RussoToast.show('Código de verificación enviado', 'success');
    } catch (error) {
      console.error('Send code error:', error);
      RussoToast.show(error.message || 'Error al enviar código', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      RussoToast.show('Código de 6 dígitos requerido', 'error');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+${callingCode}${phone.replace(/\D/g, '')}`;
      const isValid = await RussoAuth.verifyResetCode(fullPhone, verificationCode);
      
      if (isValid) {
        setStep(3);
        RussoToast.show('Código verificado', 'success');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      RussoToast.show(error.message || 'Código inválido', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      RussoToast.show('Contraseña requerida', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      RussoToast.show('Las contraseñas no coinciden', 'error');
      return;
    }

    if (newPassword.length < 6) {
      RussoToast.show('Mínimo 6 caracteres', 'error');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+${callingCode}${phone.replace(/\D/g, '')}`;
      await RussoAuth.resetPassword(fullPhone, verificationCode, newPassword);
      
      RussoToast.show('Contraseña restablecida exitosamente', 'success');
      navigation.navigate('Auth');
    } catch (error) {
      console.error('Reset password error:', error);
      RussoToast.show(error.message || 'Error al restablecer contraseña', 'error');
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
      await RussoAuth.requestPasswordReset(fullPhone);
      startCountdown();
      RussoToast.show('Código reenviado', 'success');
    } catch (error) {
      RussoToast.show('Error al reenviar código', 'error');
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCountrySelect = (country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.title}>Recuperar Contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresa tu número de teléfono para restablecer tu contraseña
      </Text>

      <View style={styles.countrySelector}>
        <CountryPicker
          withCallingCode
          withCallingCodeButton
          withFlag
          withFilter
          withAlphaFilter
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

      <RussoInput
        label="Número de teléfono"
        value={phone}
        onChangeText={setPhone}
        placeholder="04141234567"
        keyboardType="phone-pad"
        prefix={`+${callingCode}`}
        containerStyle={styles.input}
      />

      <TouchableWithoutFeedback onPress={handleSendCode} disabled={loading}>
        <View style={styles.continueButton}>
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.continueButtonText}>CONTINUAR</Text>
          )}
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
        <View style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#D4AF37" />
          <Text style={styles.backButtonText}>Volver al inicio de sesión</Text>
        </View>
      </TouchableWithoutFeedback>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.title}>Verificación</Text>
      <Text style={styles.subtitle}>
        Ingresa el código de 6 dígitos enviado a:
      </Text>
      <Text style={styles.phoneNumber}>+{callingCode} {phone}</Text>

      <RussoInput
        label="Código de verificación"
        value={verificationCode}
        onChangeText={setVerificationCode}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        containerStyle={styles.input}
      />

      <TouchableWithoutFeedback onPress={handleVerifyCode} disabled={loading}>
        <View style={styles.continueButton}>
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.continueButtonText}>VERIFICAR</Text>
          )}
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
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.title}>Nueva Contraseña</Text>
      <Text style={styles.subtitle}>
        Crea una nueva contraseña segura para tu cuenta
      </Text>

      <RussoInput
        label="Nueva Contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="••••••••"
        secureTextEntry
        containerStyle={styles.input}
      />

      <RussoInput
        label="Confirmar Contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="••••••••"
        secureTextEntry
        containerStyle={styles.input}
      />

      <Text style={styles.passwordRequirements}>
        • Mínimo 6 caracteres
        {'\n'}• Incluye mayúsculas y minúsculas
        {'\n'}• Usa números o símbolos
      </Text>

      <TouchableWithoutFeedback onPress={handleResetPassword} disabled={loading}>
        <View style={styles.continueButton}>
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.continueButtonText}>RESTABLECER CONTRASEÑA</Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </>
  );

  if (loading) {
    return <RussoLoader />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <RussoHeader showBack={true} />
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F5F5F5',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
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
  continueButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontFamily: 'Geist-Medium',
  },
  phoneNumber: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 30,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#D4AF37',
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
  },
  passwordRequirements: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#666666',
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
  },
});