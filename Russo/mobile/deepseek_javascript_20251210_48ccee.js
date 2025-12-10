import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';

// Components
import { RussoHeader } from '../components/RussoHeader';
import { RussoLoader } from '../components/RussoLoader';
import { RussoToast } from '../components/common/RussoToast';
import { RussoInput } from '../components/common/RussoInput';

// Services
import { RussoAuth } from '../services/RussoAuth';
import { RussoAPI } from '../services/RussoAPI';

export default function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await RussoAuth.getCurrentUser();
      setUser(userData);
      
      // Set form values
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      RussoToast.show('Error al cargar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
    setEditing(!editing);
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      RussoToast.show('Nombre y apellido son requeridos', 'error');
      return;
    }

    setUpdating(true);

    try {
      await RussoAuth.updateProfile({
        firstName,
        lastName,
        email,
      });

      // Reload user data
      await loadUserProfile();
      
      setEditing(false);
      RussoToast.show('Perfil actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      RussoToast.show('Error al actualizar perfil', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      'Selecciona una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar foto',
          onPress: () => takePhoto(),
        },
        {
          text: 'Elegir de galería',
          onPress: () => pickImage(),
        },
      ]
    );
  };

  const takePhoto = async () => {
    const options = {
      mediaType: 'photo',
      cameraType: 'front',
      quality: 1,
      maxWidth: 500,
      maxHeight: 500,
    };

    ImagePicker.launchCamera(options, async (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        RussoToast.show('Error al tomar foto', 'error');
        return;
      }

      await uploadAvatar(response.assets[0]);
    });
  };

  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      maxWidth: 500,
      maxHeight: 500,
      selectionLimit: 1,
    };

    ImagePicker.launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        RussoToast.show('Error al seleccionar imagen', 'error');
        return;
      }

      await uploadAvatar(response.assets[0]);
    });
  };

  const uploadAvatar = async (imageAsset) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        name: imageAsset.fileName || 'avatar.jpg',
      });

      await RussoAPI.uploadAvatar(formData);
      
      // Reload user data
      await loadUserProfile();
      
      RussoToast.show('Foto de perfil actualizada', 'success');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      RussoToast.show('Error al actualizar foto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const StatsItem = ({ label, value, icon }) => (
    <View style={styles.statItem}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={24} color="#D4AF37" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ProfileMenuItem = ({ icon, label, value, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Icon name={icon} size={22} color="#D4AF37" />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        <Icon name="chevron-right" size={20} color="#666666" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <RussoLoader />;
  }

  return (
    <View style={styles.container}>
      <RussoHeader 
        title="Mi Perfil" 
        showBack={true}
        rightAction={
          <TouchableOpacity onPress={handleEditToggle}>
            <Text style={styles.editButton}>
              {editing ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado del perfil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={editing ? handleChangeAvatar : null}
            disabled={!editing}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="account" size={60} color="#0A0A0A" />
              </View>
            )}
            
            {editing && (
              <View style={styles.avatarOverlay}>
                <Icon name="camera" size={24} color="#F5F5F5" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.firstName
                ? `${user.firstName} ${user.lastName || ''}`
                : 'Usuario Russo'}
            </Text>
            <Text style={styles.profilePhone}>{user?.phone}</Text>
            <Text style={styles.profileTier}>MIEMBRO EXCLUSIVO</Text>
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <StatsItem label="Pedidos" value="12" icon="package-variant" />
          <StatsItem label="Favoritos" value="24" icon="heart" />
          <StatsItem label="Reseñas" value="8" icon="star" />
          <StatsItem label="Puntos" value="1,240" icon="trophy" />
        </View>

        {/* Formulario de edición */}
        {editing ? (
          <View style={styles.editForm}>
            <RussoInput
              label="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Tu nombre"
              containerStyle={styles.input}
            />
            
            <RussoInput
              label="Apellido"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Tu apellido"
              containerStyle={styles.input}
            />
            
            <RussoInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              containerStyle={styles.input}
            />
            
            <RussoInput
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="+58 414 1234567"
              keyboardType="phone-pad"
              editable={false}
              containerStyle={styles.input}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                updating && styles.saveButtonDisabled,
              ]}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Menú del perfil */
          <View style={styles.menuContainer}>
            <ProfileMenuItem
              icon="package-variant"
              label="Mis Pedidos"
              value="Ver historial"
              onPress={() => navigation.navigate('Orders')}
            />
            
            <ProfileMenuItem
              icon="heart"
              label="Favoritos"
              value="24 productos"
              onPress={() => navigation.navigate('Favorites')}
            />
            
            <ProfileMenuItem
              icon="map-marker"
              label="Direcciones"
              value="3 guardadas"
              onPress={() => navigation.navigate('Addresses')}
            />
            
            <ProfileMenuItem
              icon="credit-card"
              label="Métodos de Pago"
              value="2 guardados"
              onPress={() => navigation.navigate('PaymentMethods')}
            />
            
            <ProfileMenuItem
              icon="shield-check"
              label="Verificación"
              value="Verificado ✓"
              onPress={() => navigation.navigate('Verification')}
            />
            
            <ProfileMenuItem
              icon="bell"
              label="Notificaciones"
              onPress={() => navigation.navigate('Notifications')}
            />
            
            <ProfileMenuItem
              icon="gift"
              label="Recompensas"
              value="1,240 puntos"
              onPress={() => navigation.navigate('Rewards')}
            />
            
            <ProfileMenuItem
              icon="cog"
              label="Configuración"
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        )}

        {/* Actividad reciente */}
        {!editing && (
          <View style={styles.activityContainer}>
            <Text style={styles.activityTitle}>ACTIVIDAD RECIENTE</Text>
            
            {[
              {
                id: 1,
                type: 'order',
                title: 'Pedido #RUSSO-2024-001',
                description: 'Reloj de lujo - Entregado',
                date: 'Hace 2 días',
                icon: 'package-variant',
                color: '#4ECDC4',
              },
              {
                id: 2,
                type: 'review',
                title: 'Reseña publicada',
                description: 'Bolso exclusivo - ⭐⭐⭐⭐⭐',
                date: 'Hace 3 días',
                icon: 'star',
                color: '#FFD93D',
              },
              {
                id: 3,
                type: 'wishlist',
                title: 'Agregado a favoritos',
                description: 'Joyas premium',
                date: 'Hace 5 días',
                icon: 'heart',
                color: '#FF6B6B',
              },
            ].map((activity) => (
              <TouchableOpacity key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                  <Icon name={activity.icon} size={20} color="#0A0A0A" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityItemTitle}>{activity.title}</Text>
                  <Text style={styles.activityItemDescription}>
                    {activity.description}
                  </Text>
                </View>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  editButton: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    color: '#D4AF37',
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F5F5F5',
    marginBottom: 5,
    textAlign: 'center',
  },
  profilePhone: {
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    marginBottom: 10,
  },
  profileTier: {
    fontSize: 14,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
    letterSpacing: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    width: '23%',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Geist-Bold',
    color: '#F5F5F5',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    color: '#888888',
    textAlign: 'center',
  },
  editForm: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuValue: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
  },
  activityContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Geist-Bold',
    color: '#D4AF37',
    letterSpacing: 1,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  activityInfo: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    marginBottom: 2,
  },
  activityItemDescription: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    color: '#888888',
  },
  activityDate: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    color: '#666666',
  },
  bottomSpace: {
    height: 30,
  },
});