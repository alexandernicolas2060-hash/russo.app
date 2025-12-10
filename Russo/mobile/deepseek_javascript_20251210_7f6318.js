import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RussoAPI } from '../RussoAPI';

// Configurar notificaciones push
export const configurePushNotifications = () => {
  PushNotification.configure({
    // (requerido) Función llamada cuando se recibe una notificación remota o local
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);

      // Procesar la acción de la notificación
      processNotification(notification);

      // Necesario para iOS
      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },

    // (opcional) Llamado cuando el token de registro es generado o actualizado
    onRegister: function (token) {
      console.log('TOKEN:', token);
      saveDeviceToken(token.token);
    },

    // (opcional) Permisos
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // (opcional) Solicitar permisos al iniciar
    requestPermissions: Platform.OS === 'ios',
    
    // ID del remitente para Android
    senderID: 'YOUR_SENDER_ID',
    
    // Configuración popup para Android
    popInitialNotification: true,
  });

  // Configurar canal para Android Oreo+
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'russo-channel',
        channelName: 'Russo Notifications',
        channelDescription: 'Notifications for Russo app',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }
};

// Guardar token del dispositivo
const saveDeviceToken = async (token) => {
  try {
    await AsyncStorage.setItem('@russo_device_token', token);
    
    // Enviar token al servidor
    await RussoAPI.registerDeviceToken(token);
  } catch (error) {
    console.error('Error saving device token:', error);
  }
};

// Programar notificación local
export const scheduleLocalNotification = ({
  title,
  message,
  date = new Date(),
  channelId = 'russo-channel',
  data = {},
}) => {
  PushNotification.localNotificationSchedule({
    channelId,
    title,
    message,
    date,
    allowWhileIdle: true,
    data,
    soundName: 'default',
    vibrate: true,
  });
};

// Enviar notificación inmediata
export const sendLocalNotification = ({
  title,
  message,
  channelId = 'russo-channel',
  data = {},
  bigText = '',
  subText = '',
}) => {
  PushNotification.localNotification({
    channelId,
    title,
    message,
    data,
    bigText,
    subText,
    playSound: true,
    soundName: 'default',
    vibrate: true,
    vibration: 300,
    priority: 'high',
    importance: 'high',
  });
};

// Procesar notificación recibida
const processNotification = (notification) => {
  const { data, userInteraction } = notification;
  
  if (!userInteraction) return;

  // Navegar según el tipo de notificación
  switch (data?.type) {
    case 'new_product':
      // Navegar a nuevo producto
      // navigation.navigate('ProductDetail', { productId: data.productId });
      break;
      
    case 'order_update':
      // Navegar a detalles del pedido
      // navigation.navigate('OrderDetail', { orderId: data.orderId });
      break;
      
    case 'promotion':
      // Navegar a promoción
      // navigation.navigate('Promotion', { promotionId: data.promotionId });
      break;
      
    default:
      // Navegar a notificaciones
      // navigation.navigate('Notifications');
      break;
  }
};

// Configurar notificaciones en segundo plano
export const setupBackgroundNotifications = async () => {
  try {
    // Solicitar permisos
    if (Platform.OS === 'ios') {
      const { status } = await PushNotificationIOS.requestPermissions([
        'alert',
        'badge',
        'sound',
      ]);
      return status === 'granted';
    }
    
    return true;
  } catch (error) {
    console.error('Setup background notifications error:', error);
    return false;
  }
};

// Limpiar todas las notificaciones
export const clearAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
  if (Platform.OS === 'ios') {
    PushNotificationIOS.setApplicationIconBadgeNumber(0);
  }
};

// Obtener permisos
export const getNotificationPermissions = async () => {
  try {
    if (Platform.OS === 'ios') {
      const permissions = await PushNotificationIOS.checkPermissions();
      return permissions;
    }
    
    return { alert: true, badge: true, sound: true };
  } catch (error) {
    console.error('Get permissions error:', error);
    return null;
  }
};

// Sincronizar notificaciones con el servidor
export const syncNotifications = async () => {
  try {
    const notifications = await RussoAPI.getNotifications();
    
    // Programar notificaciones locales
    notifications.forEach(notification => {
      if (notification.scheduled) {
        scheduleLocalNotification({
          title: notification.title,
          message: notification.message,
          date: new Date(notification.scheduledAt),
          data: notification.data,
        });
      }
    });
    
    return notifications;
  } catch (error) {
    console.error('Sync notifications error:', error);
    return [];
  }
};