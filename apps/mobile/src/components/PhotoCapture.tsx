import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { getSupabaseClient } from '../lib/supabaseClient';
import { colors, radius } from '../lib/theme';

export function PhotoCapture({
  deliveryId,
  kind,
  existingPath,
  onUploaded,
}: {
  deliveryId: string;
  kind: 'pickup' | 'dropoff';
  existingPath: string | null;
  onUploaded: (path: string) => void;
}) {
  const client = getSupabaseClient();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!existingPath) return;
    client.storage
      .from('delivery-photos')
      .createSignedUrl(existingPath, 3600)
      .then(({ data }) => setPreviewUrl(data?.signedUrl ?? null));
  }, [existingPath, client]);

  const capture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Enable camera access in Settings to take a verification photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const file = new File(asset.uri);
      const bytes = await file.arrayBuffer();
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `${deliveryId}/${kind}-${Date.now()}.${ext}`;
      const { error } = await client.storage
        .from('delivery-photos')
        .upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
      if (error) throw error;

      const { data } = await client.storage.from('delivery-photos').createSignedUrl(path, 3600);
      setPreviewUrl(data?.signedUrl ?? null);
      onUploaded(path);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{kind === 'pickup' ? 'Pickup photo' : 'Drop-off photo'}</Text>
      {previewUrl ? (
        <Image source={{ uri: previewUrl }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo yet</Text>
        </View>
      )}
      <Pressable style={styles.button} onPress={capture} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text style={styles.buttonText}>{existingPath ? 'Retake photo' : 'Take photo'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, textTransform: 'capitalize' },
  preview: { width: '100%', height: 160, borderRadius: 10 },
  placeholder: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 13, color: colors.muted },
  button: {
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.ink },
});
