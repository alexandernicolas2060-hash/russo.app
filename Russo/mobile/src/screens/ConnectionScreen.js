import React, { useState, useEffect } from 'react';
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
import RussoNetwork from '../services/RussoNetwork';

const ConnectionScreen = ({ navigation }) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [suggestedIPs, setSuggestedIPs] = useState([]);

  useEffect(() => {
    generateSuggestedIPs();
  }, []);

  const generateSuggestedIPs = async () => {
    const ips = await RussoNetwork.generatePossibleIPs();
    setSuggestedIPs(ips.slice(0, 5));
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    setTesting(true);
    
    // Asegurar formato correcto de URL
    let testUrl = url.trim();
    if (!testUrl.startsWith('http')) {
      testUrl = `http://${testUrl}`;
    }
    
    if (!testUrl.includes(':') && !testUrl.includes('https://')) {
      testUrl = `${testUrl}:3000`;
    }

    const result = await RussoNetwork.testConnection(testUrl);
    setTesting(false);

    if (result.success) {
      Alert.alert(
        '✅ Conexión Exitosa',
        '¡Backend encontrado y configurado!',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.replace('Home')
          }
        ]
      );
    } else {
      Alert.alert(
        '❌ Error de Conexión',
        result.message || 'No se pudo conectar al backend'
      );
    }
  };

  const handleAutoDiscover = async () => {
    setDiscovering(true);
    
    const result = await RussoNetwork.discoverBackend();
    setDiscovering(false);

    if (result.success) {
      setUrl(result.url);
      Alert.alert(
        '🎉 ¡Backend Encontrado!',
        `Se detectó automáticamente en:\n${result.url}\n\n¿Deseas conectarte ahora?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Conectar', 
            onPress: () => {
              setUrl(result.url);
              handleTestConnection();
            }
          }
        ]
      );
    } else {
      Alert.alert(
        '❌ No Encontrado',
        'No se pudo encontrar el backend automáticamente.'
      );
    }
  };

  const handleQuickConnect = (ip) => {
    const quickUrl = `http://${ip}:3000`;
    setUrl(quickUrl);
    Alert.alert(
      'Conectar Rápidamente',
      `¿Intentar conectar a:\n${quickUrl}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Conectar', 
          onPress: () => handleTestConnection()
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="wifi" size={60} color="#FFF" />
        <Text style={styles.title}>Configurar Conexión</Text>
        <Text style={styles.subtitle}>Conecta tu app al backend Russo</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>URL del Backend</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="Ej: http://192.168.1.100:3000"
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleTestConnection}
          disabled={testing || !url.trim()}
        >
          {testing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Icon name="connection" size={20} color="#000" />
              <Text style={styles.buttonTextPrimary}>Probar Conexión</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Descubrimiento Automático</Text>
        <Text style={styles.cardDescription}>
          Escanea la red en busca del backend Russo.
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleAutoDiscover}
          disabled={discovering}
        >
          {discovering ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="radar" size={20} color="#FFF" />
              <Text style={styles.buttonTextSecondary}>Buscar Automáticamente</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {suggestedIPs.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>IPs Sugeridas</Text>
          <Text style={styles.cardDescription}>
            Estas son IPs comunes en redes locales:
          </Text>
          
          <View style={styles.ipsContainer}>
            {suggestedIPs.map((ip, index) => (
              <TouchableOpacity
                key={index}
                style={styles.ipButton}
                onPress={() => handleQuickConnect(ip)}
              >
                <Text style={styles.ipText}>{ip}:3000</Text>
                <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>💡 Ayuda para la Configuración</Text>
        
        <View style={styles.helpItem}>
          <Icon name="wifi" size={20} color="#FFF" />
          <Text style={styles.helpText}>
            Ambos dispositivos deben estar en la <Text style={styles.helpBold}>misma red WiFi</Text>
          </Text>
        </View>
        
        <View style={styles.helpItem}>
          <Icon name="server" size={20} color="#FFF" />
          <Text style={styles.helpText}>
            El backend debe estar ejecutándose con <Text style={styles.helpBold}>npm start</Text>
          </Text>
        </View>
        
        <View style={styles.helpItem}>
          <Icon name="shield" size={20} color="#FFF" />
          <Text style={styles.helpText}>
            Asegúrate que el <Text style={styles.helpBold}>puerto 3000</Text> esté abierto
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonTextPrimary: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ipsContainer: {
    gap: 10,
  },
  ipButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ipText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  helpCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 15,
  },
  helpTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  helpText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default ConnectionScreen;
