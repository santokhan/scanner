import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ScanResult = string;

const SCAN_TYPES: BarcodeType[] = [
  'aztec',
  'ean13',
  'ean8',
  'qr',
  'pdf417',
  'upc_e',
  'datamatrix',
  'code39',
  'code93',
  'itf14',
  'codabar',
  'code128',
  'upc_a',
];

function extractImei(value: string) {
  const compact = value.replace(/[^\d]/g, '');
  if (compact.length === 15) {
    return compact;
  }

  const match = value.match(/(\d{15})/);
  return match?.[1];
}

export default function ScannerScreen() {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult | null>(null);
  const scanLocked = useRef(false);
  const redirectStarted = useRef(false);

  const canScan = Boolean(permission?.granted && isFocused);
  const scannerSettings = useMemo(
    () => ({
      barcodeTypes: SCAN_TYPES,
    }),
    []
  );

  useEffect(() => {
    if (!result || redirectStarted.current) {
      return;
    }

    redirectStarted.current = true;
    const timeout = setTimeout(() => {
      void Linking.openURL(`https://mobiledokan.pro/store/scanner/${result}`);
    }, 600);

    return () => clearTimeout(timeout);
  }, [result]);

  if (!permission) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.centered}>
          <ThemedText type="subtitle">Loading camera</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.permissionContainer} edges={['top', 'bottom']}>
          <View style={styles.permissionCard}>
            <ThemedText type="smallBold">Camera access</ThemedText>
            <ThemedText style={styles.permissionText} themeColor="textSecondary">
              We need the camera to scan the IMEI and open the matching page.
            </ThemedText>
            <Pressable onPress={requestPermission} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Allow camera</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        </View>

        <View style={styles.cameraFrame}>
          {canScan ? (
            <CameraView
              style={styles.camera}
              facing="back"
              active={canScan}
              barcodeScannerSettings={scannerSettings}
              onBarcodeScanned={event => {
                if (scanLocked.current) {
                  return;
                }

                const imei = extractImei(event.data);
                if (!imei) {
                  return;
                }

                scanLocked.current = true;
                setResult(imei);
              }}
            />
          ) : (
            <View style={styles.cameraPlaceholder} />
          )}

          <View pointerEvents="none" style={styles.scanOverlay}>
            <View style={styles.scanWindow}>
              <ThemedText style={styles.scanHint}>IMEI</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <ThemedText style={styles.statusText} themeColor="textSecondary">
              {result ? `Opening ${result}` : 'Waiting for IMEI'}
            </ThemedText>
          </View>
          {result ? (
            <Pressable
              onPress={() => {
                scanLocked.current = false;
                redirectStarted.current = false;
                setResult(null);
              }}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Rescan</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.one,
    paddingBottom: Spacing.one,
  },
  logo: {
    width: 200,
    height: 48,
  },
  cameraFrame: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanWindow: {
    width: '70%',
    aspectRatio: 1.08,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.88)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHint: {
    fontSize: 12,
    lineHeight: 16,
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: 1.8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  statusPill: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 22,
    paddingHorizontal: Spacing.four,
    paddingVertical: 0,
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  permissionCard: {
    gap: Spacing.two,
    borderRadius: 28,
    padding: Spacing.five,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  permissionText: {
    lineHeight: 22,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    backgroundColor: '#0284c7',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: Spacing.four,
    paddingVertical: 0,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
});
