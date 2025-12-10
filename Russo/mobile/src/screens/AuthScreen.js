
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import RussoHeader from '../components/common/RussoHeader';
import RussoButton from '../components/common/RussoButton';
import RussoInput from '../components/common/RussoInput';
import PhoneInput from 'react-native-phone-number-input';
import CountryPicker from 'react-native-country-picker-modal';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AUTH_STEPS = {
  WELCOME: 'welcome',
  PHONE: 'phone',
  VERIFICATION: 'verification',
  PASSWORD: 'password',
  PROFILE: 'profile',
  COMPLETE: 'complete'
};

export default function AuthScreen({ route }) {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  const { 
    login, 
    register, 
    verifyPhone, 
    resendVerificationCode,
    loading: authLoading,
    error: authError
  } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(AUTH_STEPS.WELCOME);
  const [formData, setFormData] = useState({
    phone: '',
    countryCode: 'VE',
    callingCode: '58',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    verificationCode: ''
  });
  const [errors, setErrors] = useState({});
  const [isLogin, setIsLogin] = useState(route.params?.mode === 'login');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneInputRef, setPhoneInputRef] = useState(null);
  
  // Animaciones
  const stepAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animación inicial
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        delay: 300
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  useEffect(() => {
    // Animar transición de pasos
    Animated.spring(stepAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20
    }).start();
  }, [currentStep]);
  
  useEffect(() => {
    // Manejar errores de autenticación
    if (authError) {
      Alert.alert('Error', authError);
    }
  }, [authError]);
  
  useEffect(() => {
    // Contador para reenviar código
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case AUTH_STEPS.PHONE:
        if (!formData.phone.trim()) {
          newErrors.phone = 'Número de teléfono requerido';
        } else if (formData.phone.length < 10) {
          newErrors.phone = 'Número de teléfono inválido';
        }
        break;
        
      case AUTH_STEPS.PASSWORD:
        if (!formData.password) {
          newErrors.password = 'Contraseña requerida';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Mínimo 8 caracteres';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password = 'Debe incluir mayúsculas, minúsculas y números';
        }
        
        if (!isLogin && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        break;
        
      case AUTH_STEPS.VERIFICATION:
        if (!formData.verificationCode.trim()) {
          newErrors.verificationCode = 'Código requerido';
        } else if (formData.verificationCode.length !== 6) {
          newErrors.verificationCode = 'Código debe tener 6 dígitos';
        }
        break;
        
      case AUTH_STEPS.PROFILE:
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'Nombre requerido';
        } else if (formData.firstName.length < 2) {
          newErrors.firstName = 'Nombre muy corto';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = async () => {
    if (!validateStep(currentStep)) return;
    
    switch (currentStep) {
      case AUTH_STEPS.WELCOME:
        setCurrentStep(AUTH_STEPS.PHONE);
        break;
        
      case AUTH_STEPS.PHONE:
        if (isLogin) {
          // Iniciar sesión
          try {
            await login({
              phone: formData.phone,
              password: formData.password,
              countryCode: formData.countryCode
            });
            // Navegar al home si login es exitoso
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }]
            });
          } catch (error) {
            // El error ya se maneja en el contexto
          }
        } else {
          // Registrar usuario
          try {
            await register({
              phone: formData.phone,
              countryCode: formData.countryCode
            });
            setCurrentStep(AUTH_STEPS.VERIFICATION);
            startResendCooldown();
          } catch (error) {
            // El error ya se maneja en el contexto
          }
        }
        break;
        
      case AUTH_STEPS.VERIFICATION:
        try {
          await verifyPhone({
            phone: formData.phone,
            code: formData.verificationCode
          });
          setCurrentStep(AUTH_STEPS.PASSWORD);
        } catch (error) {
          // El error ya se maneja en el contexto
        }
        break;
        
      case AUTH_STEPS.PASSWORD:
        setCurrentStep(AUTH_STEPS.PROFILE);
        break;
        
      case AUTH_STEPS.PROFILE:
        try {
          // Completar registro
          await register({
            phone: formData.phone,
            password: formData.password,
            countryCode: formData.countryCode,
            firstName: formData.firstName,
            lastName: formData.lastName
          });
          setCurrentStep(AUTH_STEPS.COMPLETE);
        } catch (error) {
          // El error ya se maneja en el contexto
        }
        break;
        
      case AUTH_STEPS.COMPLETE:
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }]
        });
        break;
    }
  };
  
  const handleBack = () => {
    if (currentStep === AUTH_STEPS.WELCOME) {
      navigation.goBack();
    } else if (currentStep === AUTH_STEPS.PHONE) {
      setCurrentStep(AUTH_STEPS.WELCOME);
    } else if (currentStep === AUTH_STEPS.VERIFICATION) {
      setCurrentStep(AUTH_STEPS.PHONE);
    } else if (currentStep === AUTH_STEPS.PASSWORD) {
      setCurrentStep(isLogin ? AUTH_STEPS.PHONE : AUTH_STEPS.VERIFICATION);
    } else if (currentStep === AUTH_STEPS.PROFILE) {
      setCurrentStep(AUTH_STEPS.PASSWORD);
    }
  };
  
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    try {
      await resendVerificationCode({ phone: formData.phone });
      startResendCooldown();
      Alert.alert('Éxito', 'Código reenviado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo reenviar el código');
    }
  };
  
  const startResendCooldown = () => {
    setResendCooldown(60); // 60 segundos
  };
  
  const handleCountrySelect = (country) => {
    setFormData(prev => ({
      ...prev,
      countryCode: country.cca2,
      callingCode: country.callingCode[0]
    }));
  };
  
  const stepTranslateX = stepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });
  
  const stepOpacity = stepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const logoTranslateY = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0]
  });
  
  const logoOpacity = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const renderWelcomeStep = () => (
    <Animated.View style={[
      styles.stepContainer,
      {
        opacity: stepOpacity,
        transform: [{ translateX: stepTranslateX }]
      }
    ]}>
      <View style={styles.welcomeContent}>
        <Animated.Text style={[styles.welcomeTitle, { color: colors.text }]}>
          Bienvenido a
        </Animated.Text>
        
        <Animated.View style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }]
          }
        ]}>
          <LinearGradient
            colors={[colors.secondary, '#F7EF8A', colors.secondary]}
            style={styles.logoGradient}
          >
            <View style={styles.logoInner}>
              <View style={[styles.logoRVertical, { backgroundColor: colors.primary }]} />
              <View style={[
                styles.logoRCurve,
                { borderColor: colors.primary, borderLeftWidth: 0 }
              ]} />
              <View style={[styles.logoRDiagonal, { backgroundColor: colors.primary }]} />
            </View>
          </LinearGradient>
          
          <Animated.Text style={[styles.logoText, { color: colors.text }]}>
            usso
          </Animated.Text>
        </Animated.View>
        
        <Animated.Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          Lo exclusivo. Lo elegante. Tuyo.
        </Animated.Text>
        
        <View style={styles.welcomeButtons}>
          <RussoButton
            title="Crear cuenta"
            onPress={() => {
              setIsLogin(false);
              setCurrentStep(AUTH_STEPS.PHONE);
            }}
            gradient
            style={styles.welcomeButton}
            icon={<Feather name="user-plus" size={20} color={colors.primary} />}
          />
          
          <RussoButton
            title="Iniciar sesión"
            onPress={() => {
              setIsLogin(true);
              setCurrentStep(AUTH_STEPS.PHONE);
            }}
            variant="outline"
            style={styles.welcomeButton}
            icon={<Feather name="log-in" size={20} color={colors.text} />}
          />
        </View>
        
        <Animated.Text style={[styles.termsText, { color: colors.textTertiary }]}>
          Al continuar, aceptas nuestros{'\n'}
          <Animated.Text 
            style={{ color: colors.secondary }}
            onPress={() => navigation.navigate('Terms')}
          >
            Términos y Condiciones
          </Animated.Text>{' '}
          y{' '}
          <Animated.Text 
            style={{ color: colors.secondary }}
            onPress={() => navigation.navigate('Privacy')}
          >
            Política de Privacidad
          </Animated.Text>
        </Animated.Text>
      </View>
    </Animated.View>
  );
  
  const renderPhoneStep = () => (
    <Animated.View style={[
      styles.stepContainer,
      {
        opacity: stepOpacity,
        transform: [{ translateX: stepTranslateX }]
      }
    ]}>
      <View style={styles.formContainer}>
        <Animated.Text style={[styles.stepTitle, { color: colors.text }]}>
          {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </Animated.Text>
        
        <Animated.Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {isLogin 
            ? 'Ingresa tu número de teléfono para continuar'
            : 'Comienza registrando tu número de teléfono'
          }
        </Animated.Text>
        
        <View style={styles.phoneInputContainer}>
          <View style={styles.countryPickerContainer}>
            <CountryPicker
              countryCode={formData.countryCode}
              withFilter
              withFlag
              withCallingCode
              withAlphaFilter
              withCallingCodeButton
              withEmoji
              onSelect={handleCountrySelect}
              visible={false}
              containerButtonStyle={styles.countryPickerButton}
            />
            <Feather name="chevron-down" size={20} color={colors.text} />
          </View>
          
          <View style={styles.phoneInputWrapper}>
            <Animated.Text style={[styles.callingCode, { color: colors.text }]}>
              +{formData.callingCode}
            </Animated.Text>
            
            <RussoInput
              placeholder="Número de teléfono"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
              error={errors.phone}
              autoFocus
              style={styles.phoneInput}
            />
          </View>
        </View>
        
        {isLogin && (
          <RussoInput
            placeholder="Contraseña"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
            error={errors.password}
            icon={<Feather name="lock" size={20} color={colors.textSecondary} />}
            style={styles.passwordInput}
          />
        )}
        
        {isLogin && (
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Animated.Text style={[styles.forgotPasswordText, { color: colors.secondary }]}>
              ¿Olvidaste tu contraseña?
            </Animated.Text>
          </TouchableOpacity>
        )}
        
        <RussoButton
          title={isLogin ? "Iniciar sesión" : "Continuar"}
          onPress={handleNextStep}
          gradient
          loading={authLoading}
          style={styles.nextButton}
          icon={<Feather name={isLogin ? "log-in" : "arrow-right"} size={20} color={colors.primary} />}
        />
        
        {!isLogin && (
          <Animated.Text style={[styles.alternativeText, { color: colors.textTertiary }]}>
            ¿Ya tienes cuenta?{' '}
            <Animated.Text 
              style={{ color: colors.secondary }}
              onPress={() => setIsLogin(true)}
            >
              Iniciar sesión
            </Animated.Text>
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
  
  const renderVerificationStep = () => (
    <Animated.View style={[
      styles.stepContainer,
      {
        opacity: stepOpacity,
        transform: [{ translateX: stepTranslateX }]
      }
    ]}>
      <View style={styles.formContainer}>
        <View style={styles.verificationHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.verificationTitleContainer}>
            <Animated.Text style={[styles.stepTitle, { color: colors.text }]}>
              Verifica tu teléfono
            </Animated.Text>
            <Animated.Text style={[styles.phoneNumber, { color: colors.secondary }]}>
              +{formData.callingCode} {formData.phone}
            </Animated.Text>
          </View>
        </View>
        
        <Animated.Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Te hemos enviado un código SMS de 6 dígitos
        </Animated.Text>
        
        <View style={styles.codeContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View 
              key={index} 
              style={[
                styles.codeDigitContainer,
                { 
                  borderColor: errors.verificationCode ? colors.error : colors.accent,
                  backgroundColor: formData.verificationCode[index] 
                    ? 'rgba(212, 175, 55, 0.1)' 
                    : 'transparent'
                }
              ]}
            >
              <Animated.Text style={[
                styles.codeDigit,
                { color: colors.text }
              ]}>
                {formData.verificationCode[index] || ''}
              </Animated.Text>
            </View>
          ))}
        </View>
        
        <RussoInput
          placeholder="Código de 6 dígitos"
          value={formData.verificationCode}
          onChangeText={(text) => {
            if (text.length <= 6 && /^\d*$/.test(text)) {
              setFormData(prev => ({ ...prev, verificationCode: text }));
            }
          }}
          keyboardType="number-pad"
          error={errors.verificationCode}
          autoFocus
          style={styles.codeInput}
          maxLength={6}
        />
        
        <View style={styles.resendContainer}>
          <Animated.Text style={[styles.resendText, { color: colors.textSecondary }]}>
            ¿No recibiste el código?
          </Animated.Text>
          
          <TouchableOpacity 
            onPress={handleResendCode}
            disabled={resendCooldown > 0 || authLoading}
          >
            <Animated.Text style={[
              styles.resendButtonText,
              { 
                color: resendCooldown > 0 ? colors.textTertiary : colors.secondary,
                opacity: resendCooldown > 0 ? 0.5 : 1
              }
            ]}>
              {resendCooldown > 0 
                ? `Reenviar en ${resendCooldown}s` 
                : 'Reenviar código'
              }
            </Animated.Text>
          </TouchableOpacity>
        </View>
        
        <RussoButton
          title="Verificar"
          onPress={handleNextStep}
          gradient
          loading={authLoading}
          style={styles.nextButton}
          icon={<Feather name="check-circle" size={20} color={colors.primary} />}
        />
      </View>
    </Animated.View>
  );
  
  const renderPasswordStep = () => (
    <Animated.View style={[
      styles.stepContainer,
      {
        opacity: stepOpacity,
        transform: [{ translateX: stepTranslateX }]
      }
    ]}>
      <View style={styles.formContainer}>
        <View style={styles.verificationHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Animated.Text style={[styles.stepTitle, { color: colors.text }]}>
            Crea tu contraseña
          </Animated.Text>
        </View>
        
        <Animated.Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Usa una contraseña segura para proteger tu cuenta
        </Animated.Text>
        
        <RussoInput
          placeholder="Contraseña"
          value={formData.password}
          onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
          secureTextEntry
          error={errors.password}
          icon={<Feather name="lock" size={20} color={colors.textSecondary} />}
          style={styles.input}
        />
        
        <RussoInput
          placeholder="Confirmar contraseña"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
          secureTextEntry
          error={errors.confirmPassword}
          icon={<Feather name="lock" size={20} color={colors.textSecondary} />}
          style={styles.input}
        />
        
        <View style={styles.passwordRequirements}>
          <Animated.Text style={[styles.requirementsTitle, { color: colors.textSecondary }]}>
            Tu contraseña debe incluir:
          </Animated.Text>
          
          {[
            { text: 'Mínimo 8 caracteres', valid: formData.password.length >= 8 },
            { text: 'Al menos una mayúscula', valid: /[A-Z]/.test(formData.password) },
            { text: 'Al menos una minúscula', valid: /[a-z]/.test(formData.password) },
            { text: 'Al menos un número', valid: /\d/.test(formData.password) }
          ].map((req, index) => (
            <View key={index} style={styles.requirementRow}>
              <Feather 
                name={req.valid ? "check-circle" : "circle"} 
                size={16} 
                color={req.valid ? colors.success : colors.textTertiary} 
              />
              <Animated.Text style={[
                styles.requirementText,
                { 
                  color: req.valid ? colors.success : colors.textTertiary,
                  opacity: req.valid ? 1 : 0.6
                }
              ]}>
                {req.text}
              </Animated.Text>
            </View>
          ))}
        </View>
        
        <RussoButton
          title="Continuar"
          onPress={handleNextStep}
          gradient
          loading={authLoading}
          style={styles.nextButton}
          icon={<Feather name="arrow-right" size={20} color={colors.primary} />}
        />
      </View>
    </Animated.View>
  );
  
  const renderProfileStep = () => (
    <Animated.View style={[
      styles.stepContainer,
      {
        opacity: stepOpacity,
        transform: [{ translateX: stepTranslateX }]
      }
    ]}>
      <View style={styles.formContainer}>
        <View style={styles.verificationHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Animated.Text style={[styles.stepTitle, { color: colors.text }]}>
            Completa tu perfil
          </Animated.Text>
        </View>
        
        <Animated.Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Cuéntanos un poco sobre ti (opcional)
        </Animated.Text>
        
        <RussoInput
          placeholder="Nombre"
          value={formData.firstName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
          error={errors.firstName}
          icon={<Feather name="user" size={20} color={colors.textSecondary} />}
          style={styles.input}
          autoFocus
        />
        
        <RussoInput
          placeholder="Apellido"
          value={formData.lastName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
          icon={<Feather name="user" size={20} color={colors.textSecondary} />}
          style={styles.input}
        />
        
        <RussoButton
          title="Completar registro"
          onPress={handleNextStep}
          gradient
          loading={authLoading}
          style={styles.nextButton}
          icon={<Feather name="check" size={20} color={colors.primary} />}
        />
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleNextStep}
          disabled={authLoading}
        >
          <Animated.Text style={[styles.skipText, { color: colors.textTertiary }]}>
            Completar más tarde
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
  
  const renderCompleteStep = () => (
    <Animated.View style={[
      styles.stepContainer,
      {
        opacity: stepOpacity,
        transform: [{ translateX: stepTranslateX }]
      }
    ]}>
      <View style={styles.completeContainer}>
        <View style={styles.completeIconContainer}>
          <LinearGradient
            colors={[colors.secondary, '#F7EF8A', colors.secondary]}
            style={styles.completeIconGradient}
          >
            <Feather name="check" size={60} color={colors.primary} />
          </LinearGradient>
          
          <View style={styles.completeConfetti}>
            {[...Array(12)].map((_, i) => (
              <View 
                key={i}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: ['#D4AF37', '#F7EF8A', '#FFFFFF'][i % 3],
                    transform: [
                      { rotate: `${(i * 30)}deg` },
                      { translateX: 80 }
                    ]
                  }
                ]}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.completeTextContainer}>
          <Animated.Text style={[styles.completeTitle, { color: colors.text }]}>
            ¡Cuenta creada con éxito!
          </Animated.Text>
          
          <Animated.Text style={[styles.completeDescription, { color: colors.textSecondary }]}>
            Bienvenido a la familia Russo{'\n'}
            {formData.firstName ? `, ${formData.firstName}` : ''}
          </Animated.Text>
        </View>
        
        <View style={styles.completeFeatures}>
          {[
            { icon: 'shopping-bag', text: 'Compras exclusivas' },
            { icon: 'truck', text: 'Envío prioritario' },
            { icon: 'gift', text: 'Ofertas VIP' },
            { icon: 'shield', text: 'Seguridad garantizada' }
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[
                styles.featureIconContainer,
                { backgroundColor: 'rgba(212, 175, 55, 0.1)' }
              ]}>
                <Feather name={feature.icon} size={20} color={colors.secondary} />
              </View>
              <Animated.Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {feature.text}
              </Animated.Text>
            </View>
          ))}
        </View>
        
        <RussoButton
          title="Comenzar a explorar"
          onPress={handleNextStep}
          gradient
          style={styles.completeButton}
          icon={<Feather name="arrow-right" size={20} color={colors.primary} />}
        />
      </View>
    </Animated.View>
  );
  
  const renderStep = () => {
    switch (currentStep) {
      case AUTH_STEPS.WELCOME:
        return renderWelcomeStep();
      case AUTH_STEPS.PHONE:
        return renderPhoneStep();
      case AUTH_STEPS.VERIFICATION:
        return renderVerificationStep();
      case AUTH_STEPS.PASSWORD:
        return renderPasswordStep();
      case AUTH_STEPS.PROFILE:
        return renderProfileStep();
      case AUTH_STEPS.COMPLETE:
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={theme === 'dark' 
          ? ['#0A0A0A', '#1A1A1A', '#0A0A0A'] 
          : ['#F5F5F5', '#FFFFFF', '#F5F5F5']}
        style={styles.background}
      />
      
      {/* Fondo decorativo */}
      <View style={styles.decorativeBackground}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.decorativeDot,
              {
                backgroundColor: colors.secondary,
                opacity: 0.05,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2
              }
            ]}
          />
        ))}
      </View>
      
      {currentStep !== AUTH_STEPS.WELCOME && (
        <View style={styles.headerContainer}>
          <RussoHeader
            showLogo={false}
            title={isLogin ? "Iniciar sesión" : "Crear cuenta"}
            onMenuPress={currentStep === AUTH_STEPS.WELCOME ? () => navigation.navigate('Menu') : undefined}
          />
        </View>
      )}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>
      
      {/* Indicador de progreso */}
      {currentStep !== AUTH_STEPS.WELCOME && currentStep !== AUTH_STEPS.COMPLETE && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[colors.secondary, '#F7EF8A', colors.secondary]}
              style={[
                styles.progressFill,
                {
                  width: `${(Object.keys(AUTH_STEPS).indexOf(currentStep) / Object.keys(AUTH_STEPS).length) * 100}%`
                }
              ]}
            />
          </View>
          <Animated.Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Paso {Object.keys(AUTH_STEPS).indexOf(currentStep)} de {Object.keys(AUTH_STEPS).length - 2}
          </Animated.Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  decorativeBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  decorativeDot: {
    position: 'absolute',
    borderRadius: 9999
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40
  },
  stepContainer: {
    width: '100%'
  },
  welcomeContent: {
    alignItems: 'center',
    gap: 32
  },
  welcomeTitle: {
    fontFamily: 'ElegantSans',
    fontSize: 18,
    letterSpacing: 3,
    opacity: 0.8
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  logoGradient: {
    width: 80,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20
  },
  logoInner: {
    width: 50,
    height: 70,
    position: 'relative'
  },
  logoRVertical: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 10,
    height: 58,
    borderRadius: 5
  },
  logoRCurve: {
    position: 'absolute',
    left: 16,
    top: 6,
    width: 28,
    height: 28,
    borderWidth: 10,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28
  },
  logoRDiagonal: {
    position: 'absolute',
    left: 16,
    top: 34,
    width: 20,
    height: 12,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3
  },
  logoText: {
    fontFamily: 'ElegantSerif',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: -12
  },
  welcomeSubtitle: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    opacity: 0.7
  },
  welcomeButtons: {
    width: '100%',
    gap: 16
  },
  welcomeButton: {
    width: '100%'
  },
  termsText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6
  },
  formContainer: {
    gap: 24
  },
  stepTitle: {
    fontFamily: 'ElegantSerif',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 1
  },
  stepDescription: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12
  },
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(44, 44, 44, 0.3)'
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  callingCode: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    fontWeight: '500',
    minWidth: 40
  },
  phoneInput: {
    flex: 1
  },
  passwordInput: {
    marginTop: 8
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -12
  },
  forgotPasswordText: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '500'
  },
  nextButton: {
    marginTop: 8
  },
  alternativeText: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(44, 44, 44, 0.3)'
  },
  verificationTitleContainer: {
    flex: 1
  },
  phoneNumber: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20
  },
  codeDigitContainer: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  codeDigit: {
    fontFamily: 'ElegantSans',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2
  },
  codeInput: {
    opacity: 0,
    height: 0,
    position: 'absolute'
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  resendText: {
    fontFamily: 'ElegantSans',
    fontSize: 14
  },
  resendButtonText: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '600'
  },
  input: {
    marginTop: 8
  },
  passwordRequirements: {
    gap: 8,
    marginTop: 8
  },
  requirementsTitle: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  requirementText: {
    fontFamily: 'ElegantSans',
    fontSize: 13
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12
  },
  skipText: {
    fontFamily: 'ElegantSans',
    fontSize: 14,
    fontWeight: '500'
  },
  completeContainer: {
    alignItems: 'center',
    gap: 32
  },
  completeIconContainer: {
    position: 'relative'
  },
  completeIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20
  },
  completeConfetti: {
    position: 'absolute',
    width: 120,
    height: 120
  },
  confettiPiece: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 4,
    height: 12,
    borderRadius: 2,
    marginLeft: -2,
    marginTop: -6
  },
  completeTextContainer: {
    alignItems: 'center',
    gap: 12
  },
  completeTitle: {
    fontFamily: 'ElegantSerif',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center'
  },
  completeDescription: {
    fontFamily: 'ElegantSans',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8
  },
  completeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginHorizontal: 20
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
    width: 100
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  featureText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16
  },
  completeButton: {
    width: '100%',
    marginTop: 8
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5
  },
  progressText: {
    fontFamily: 'ElegantSans',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1
  }
});
