import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, SIZES } from '../constants';

type QRScannerScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation<QRScannerScreenNavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.back);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (hasPermission === false) {
      console.warn('[QR] Camera permission denied', { platform: Platform.OS });
    }
  }, [hasPermission]);

  const getCameraPermissions = async () => {
    try {
      // Usa o pedido de permissão correto conforme a plataforma
      let status: string | undefined;
      if (Platform.OS === 'web') {
        const res = await BarCodeScanner.requestPermissionsAsync();
        status = res?.status;
        setHasPermission(status === 'granted');
      } else {
        const res = await Camera.requestCameraPermissionsAsync();
        status = res?.status;
        setHasPermission(status === 'granted');
      }
      console.log('[QR] Permission request', { platform: Platform.OS, status });
    } catch (e) {
      console.error('Falha ao solicitar permissão da câmera:', e);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    console.log('[QR] Scan event', { type, dataPreview: data?.slice(0, 80) });
    
    // Parse QR code data
    try {
      // Expected format: station://stationId or https://app.com/station/stationId
      let stationId = '';
      
      if (data.startsWith('station://')) {
        stationId = data.replace('station://', '');
      } else if (data.includes('/station/')) {
        const parts = data.split('/station/');
        stationId = parts[1];
      } else {
        // Try to parse as JSON for more complex data
        const parsed = JSON.parse(data);
        stationId = parsed.stationId || parsed.id;
      }

      if (stationId) {
        console.log('[QR] Parse result', { platform: Platform.OS, stationId });
        Alert.alert(
          'QR Code Escaneado',
          `Estação encontrada: ${stationId}`,
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => setScanned(false),
            },
            {
              text: 'Ver Detalhes',
              onPress: () => {
                console.log('[QR] Navigate to StationDetail', { stationId });
                navigation.navigate('StationDetail', { stationId });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'QR Code Inválido',
          'Este QR code não corresponde a uma estação de carregamento válida.',
          [
            {
              text: 'OK',
              onPress: () => setScanned(false),
            },
          ]
        );
      }
    } catch (error) {
      console.error('[QR] Scan error', error);
      Alert.alert(
        'Erro ao Escanear',
        'Não foi possível processar o QR code. Tente novamente.',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const flipCamera = () => {
    setCameraType(
      cameraType === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.gray} />
          <Text style={styles.permissionText}>Solicitando permissão da câmera...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off-outline" size={64} color={COLORS.error} />
          <Text style={styles.permissionTitle}>Permissão da Câmera Negada</Text>
          <Text style={styles.permissionText}>
            Para escanear QR codes, você precisa permitir o acesso à câmera.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={getCameraPermissions}>
            <Text style={styles.permissionButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {Platform.OS === 'web' ? (
        <BarCodeScanner
          style={styles.camera}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escanear QR Code</Text>
            <View style={styles.headerButton} />
          </View>

          {/* Scanning Area */}
          <View style={styles.scanningArea}>
            <View style={styles.overlay}>
              <View style={styles.unfocusedContainer}>
                <View style={styles.unfocused} />
              </View>
              
              <View style={styles.middleContainer}>
                <View style={styles.unfocused} />
                <View style={styles.focusedContainer}>
                  <View style={styles.scanFrame}>
                    {/* Corner borders */}
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                </View>
                <View style={styles.unfocused} />
              </View>
              
              <View style={styles.unfocusedContainer}>
                <View style={styles.unfocused} />
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>
                Posicione o QR code dentro do quadro
              </Text>
              <Text style={styles.instructionsText}>
                O código será escaneado automaticamente
              </Text>
            </View>
          </View>

          {/* Controls (sem flash/virar no web) */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="home" size={24} color={COLORS.white} />
              <Text style={styles.controlText}>Início</Text>
            </TouchableOpacity>
          </View>
        </BarCodeScanner>
      ) : (
        <Camera
          style={styles.camera}
          type={cameraType}
          flashMode={flashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
          }}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear QR Code</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Scanning Area */}
        <View style={styles.scanningArea}>
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer}>
              <View style={styles.unfocused} />
            </View>
            
            <View style={styles.middleContainer}>
              <View style={styles.unfocused} />
              <View style={styles.focusedContainer}>
                <View style={styles.scanFrame}>
                  {/* Corner borders */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
              <View style={styles.unfocused} />
            </View>
            
            <View style={styles.unfocusedContainer}>
              <View style={styles.unfocused} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              Posicione o QR code dentro do quadro
            </Text>
            <Text style={styles.instructionsText}>
              O código será escaneado automaticamente
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons 
              name={flashOn ? "flash" : "flash-off"} 
              size={24} 
              color={flashOn ? COLORS.primary : COLORS.white} 
            />
            <Text style={styles.controlText}>Flash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
            <Ionicons name="camera-reverse" size={24} color={COLORS.white} />
            <Text style={styles.controlText}>Virar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home" size={24} color={COLORS.white} />
            <Text style={styles.controlText}>Início</Text>
          </TouchableOpacity>
        </View>
      </Camera>
      )}

      {scanned && (
        <View style={styles.scannedOverlay}>
          <View style={styles.scannedContainer}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.scannedText}>QR Code Escaneado!</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h3,
    color: COLORS.white,
    fontWeight: '600',
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleContainer: {
    flexDirection: 'row',
    height: 250,
  },
  unfocused: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  focusedContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  instructionsTitle: {
    fontSize: SIZES.body2,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SIZES.base / 2,
  },
  instructionsText: {
    fontSize: SIZES.body3,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SIZES.padding * 1.5,
    paddingHorizontal: SIZES.padding,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  controlText: {
    fontSize: SIZES.caption,
    color: COLORS.white,
    marginTop: 4,
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedContainer: {
    alignItems: 'center',
  },
  scannedText: {
    fontSize: SIZES.h3,
    color: COLORS.white,
    fontWeight: '600',
    marginTop: SIZES.padding,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  permissionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.padding,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body3,
    fontWeight: '600',
  },
});

export default QRScannerScreen;