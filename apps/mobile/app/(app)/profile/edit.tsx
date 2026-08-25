import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { profileQueries, profileEditSchema, VEHICLE_TYPES, type VehicleType } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { useAuth } from '../../../src/lib/AuthProvider';
import { Input, } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { colors, radius } from '../../../src/lib/theme';

export default function EditProfileScreen() {
  const client = getSupabaseClient();
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setBio(profile.bio ?? '');
    setVehicleType(profile.vehicle_type ?? '');
    setAvatarUrl(profile.avatar_url);
  }, [profile]);

  if (!user) return null;

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const file = new File(asset.uri);
      const bytes = await file.arrayBuffer();
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = profileQueries.avatarPath(user.id, ext);
      const { error: uploadError } = await client.storage
        .from('avatars')
        .upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data } = client.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      await profileQueries.updateProfile(client, user.id, { avatar_url: data.publicUrl });
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const parsed = profileEditSchema.safeParse({ fullName, bio, vehicleType: vehicleType || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await profileQueries.updateProfile(client, user.id, {
        full_name: parsed.data.fullName,
        bio: parsed.data.bio ?? null,
        vehicle_type: parsed.data.vehicleType ?? null,
      });
      await refreshProfile();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.avatarRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.line }]} />
        )}
        <Pressable style={styles.avatarButton} onPress={pickAvatar} disabled={uploading}>
          {uploading ? <ActivityIndicator /> : <Text style={styles.avatarButtonText}>Change photo</Text>}
        </Pressable>
      </View>

      <View style={{ gap: 14 }}>
        <Input label="Full name" value={fullName} onChangeText={setFullName} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />

        <View>
          <Text style={styles.label}>Vehicle</Text>
          <View style={styles.chipRow}>
            <Pressable style={[styles.chip, vehicleType === '' && styles.chipActive]} onPress={() => setVehicleType('')}>
              <Text style={[styles.chipText, vehicleType === '' && styles.chipTextActive]}>Sender only</Text>
            </Pressable>
            {VEHICLE_TYPES.map((v) => (
              <Pressable
                key={v.value}
                style={[styles.chip, vehicleType === v.value && styles.chipActive]}
                onPress={() => setVehicleType(v.value)}
              >
                <Text style={[styles.chipText, vehicleType === v.value && styles.chipTextActive]}>{v.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        <Button loading={loading} onPress={submit}>
          Save
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, backgroundColor: colors.paper },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarButton: { borderWidth: 1, borderColor: colors.ink, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  avatarButtonText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  label: { fontSize: 14, fontWeight: '500', color: colors.ink, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.paper },
  error: { color: colors.accentDark, fontSize: 13 },
});
