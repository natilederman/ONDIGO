import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../../src/lib/AuthProvider';
import { ProfileScreenBody } from '../../../src/components/ProfileScreenBody';
import { colors } from '../../../src/lib/theme';

export default function ProfileTabScreen() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ProfileScreenBody userId={user.id} />
      <View style={styles.footer}>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'center' },
  signOut: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
