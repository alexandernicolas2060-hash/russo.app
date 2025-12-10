import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import { RussoHeader } from '../components/RussoHeader';
import { RussoToast } from '../components/common/RussoToast';
import { RussoModal } from '../components/common/RussoModal';

// Services
import { RussoAuth } from '../services/RussoAuth';

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('es-VE');
  const [selectedTheme, setSelectedTheme] = useState('dark-luxe');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('@russo_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setDarkMode(parsed.darkMode ?? true);
        setNotifications(parsed.notifications ?? true);
        setBiometricAuth(parsed.biometricAuth ?? false);
        setAutoSync(parsed.autoSync ?? true);
        setSelectedLanguage(parsed.language ?? 'es-VE');
        setSelectedTheme(parsed.theme ?? 'dark-luxe');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        darkMode,
        notifications,
        biometricAuth,
        autoSync,
        language: selectedLanguage,
        theme: selectedTheme,
      };
      await AsyncStorage.setItem('@russo_settings', JSON.stringify(settings));
      RussoToast.show('Configuración guardada', 'success');
    } catch (error) {
      RussoToast.show('Error al guardar configuración', 'error');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await RussoAuth.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es permanente. ¿Estás completamente seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await RussoAuth.deleteAccount();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
              RussoToast.show('Cuenta eliminada', 'success');
            } catch (error) {
              RussoToast.show('Error al eliminar cuenta', 'error');
            }
          },
        },
      ]
    );
  };

  const languages = [
    { code: 'es-VE', name: 'Español (Venezuela)', flag: '🇻🇪' },
    { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
    { code: 'pt-BR', name: 'Portugués (Brasil)', flag: '🇧🇷' },
    { code: 'fr-FR', name: 'Francés', flag: '🇫🇷' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'de-DE', name: 'Alemán', flag: '🇩🇪' },
    { code: 'ja-JP', name: 'Japonés', flag: '🇯🇵' },
    { code: 'zh-CN', name: 'Chino', flag: '🇨🇳' },
    { code: 'ru-RU', name: 'Ruso', flag: '🇷🇺' },
    { code: 'ar-SA', name: 'Árabe', flag: '🇸🇦' },
    { code: 'ko-KR', name: 'Coreano', flag: '🇰🇷' },
  ];

  const themes = [
    { id: 'dark-luxe', name: 'Lujo Oscuro', color: '#0A0A0A' },
    { id: 'black-diamond', name: 'Diamante Negro', color: '#000000' },
    { id: 'platinum', name: 'Platino', color: '#E5E4E2' },
    { id: 'midnight-gold', name: 'Oro Medianoche', color: '#1A1A1A' },
    { id: 'obsidian', name: 'Obsidiana', color: '#0B0B0B' },
  ];

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    type = 'switch', 
    value, 
    onValueChange, 
    onPress,
    danger = false 
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.settingIcon,
          danger && styles.settingIconDanger
        ]}>
          <Icon 
            name={icon} 
            size={24} 
            color={danger ? '#FF4757' : theme.colors.secondary} 
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            danger && styles.settingTitleDanger
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#2C2C2C', true: '#D4AF37' }}
          thumbColor="#F5F5F5"
        />
      ) : (
        <Icon name="chevron-right" size={24} color="#888888" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <RussoHeader title="Configuración" showBack={true} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <SettingItem
            icon="palette"
            title="Tema"
            subtitle={themes.find(t => t.id === selectedTheme)?.name}
            type="arrow"
            onPress={() => setShowThemeModal(true)}
          />
          
          <SettingItem
            icon="translate"
            title="Idioma"
            subtitle={languages.find(l => l.code === selectedLanguage)?.name}
            type="arrow"
            onPress={() => setShowLanguageModal(true)}
          />
          
          <SettingItem
            icon="bell-outline"
            title="Notificaciones"
            type="switch"
            value={notifications}
            onValueChange={setNotifications}
          />
          
          <SettingItem
            icon="fingerprint"
            title="Autenticación biométrica"
            type="switch"
            value={biometricAuth}
            onValueChange={setBiometricAuth}
          />
          
          <SettingItem
            icon="sync"
            title="Sincronización automática"
            subtitle="Mantener datos actualizados"
            type="switch"
            value={autoSync}
            onValueChange={setAutoSync}
          />
        </View>

        {/* Privacidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          
          <SettingItem
            icon="shield-check-outline"
            title="Política de privacidad"
            type="arrow"
            onPress={() => navigation.navigate('Privacy')}
          />
          
          <SettingItem
            icon="file-document-outline"
            title="Términos de servicio"
            type="arrow"
            onPress={() => navigation.navigate('Terms')}
          />
          
          <SettingItem
            icon="cookie"
            title="Preferencias de cookies"
            type="arrow"
            onPress={() => navigation.navigate('Cookies')}
          />
          
          <SettingItem
            icon="delete-outline"
            title="Eliminar datos en caché"
            type="arrow"
            onPress={async () => {
              try {
                await AsyncStorage.clear();
                RussoToast.show('Caché limpiado', 'success');
              } catch (error) {
                RussoToast.show('Error al limpiar caché', 'error');
              }
            }}
          />
        </View>

        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <SettingItem
            icon="logout"
            title="Cerrar sesión"
            type="arrow"
            danger
            onPress={handleLogout}
          />
          
          <SettingItem
            icon="delete-forever"
            title="Eliminar cuenta permanentemente"
            subtitle="Esta acción no se puede deshacer"
            type="arrow"
            danger
            onPress={handleDeleteAccount}
          />
        </View>

        {/* Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <SettingItem
            icon="information-outline"
            title="Acerca de Russo"
            type="arrow"
            onPress={() => navigation.navigate('About')}
          />
          
          <SettingItem
            icon="star-outline"
            title="Calificar la aplicación"
            type="arrow"
            onPress={() => {
              // Abrir tienda de aplicaciones
            }}
          />
          
          <SettingItem
            icon="help-circle-outline"
            title="Centro de ayuda"
            type="arrow"
            onPress={() => navigation.navigate('Help')}
          />
          
          <SettingItem
            icon="email-outline"
            title="Contactar soporte"
            type="arrow"
            onPress={() => navigation.navigate('Contact')}
          />
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Russo v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Russo. Todos los derechos reservados.</Text>
        </View>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de idiomas */}
      <RussoModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title="Seleccionar idioma"
      >
        <ScrollView style={styles.modalContent}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                selectedLanguage === lang.code && styles.languageItemSelected,
              ]}
              onPress={() => {
                setSelectedLanguage(lang.code);
                setShowLanguageModal(false);
              }}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text style={styles.languageName}>{lang.name}</Text>
              {selectedLanguage === lang.code && (
                <Icon name="check" size={24} color="#D4AF37" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RussoModal>

      {/* Modal de temas */}
      <RussoModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Seleccionar tema"
      >
        <View style={styles.themesGrid}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeItem,
                selectedTheme === theme.id && styles.themeItemSelected,
              ]}
              onPress={() => {
                setSelectedTheme(theme.id);
                setShowThemeModal(false);
              }}
            >
              <View
                style={[
                  styles.themeColor,
                  { backgroundColor: theme.color },
                ]}
              />
              <Text style={styles.themeName}>{theme.name}</Text>
              {selectedTheme === theme.id && (
                <View style={styles.themeCheck}>
                  <Icon name="check" size={20} color="#0A0A0A" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </RussoModal>
    </View>
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
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 15,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingIconDanger: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
  },
  settingTitleDanger: {
    color: '#FF4757',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#666666',
    marginBottom: 5,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    color: '#444444',
    textAlign: 'center',
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  modalContent: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  languageItemSelected: {
    backgroundColor: '#1A1A1A',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  themeItem: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    padding: 15,
    alignItems: 'center',
    position: 'relative',
  },
  themeItemSelected: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  themeColor: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  themeName: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
  },
  themeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
});