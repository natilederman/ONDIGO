import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { messageQueries, type Message } from '@ondigo/shared';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthProvider';
import { colors, radius } from '../lib/theme';

export function Chat({ deliveryId }: { deliveryId: string }) {
  const { user } = useAuth();
  const client = getSupabaseClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    messageQueries.listMessages(client, deliveryId).then(setMessages);
    const unsubscribe = messageQueries.subscribeToMessages(client, deliveryId, (m) =>
      setMessages((prev) => [...prev, m])
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId]);

  const send = async () => {
    if (!body.trim() || !user) return;
    const text = body.trim();
    setBody('');
    await messageQueries.sendMessage(client, deliveryId, user.id, text);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender_id === user?.id ? styles.bubbleMine : styles.bubbleTheirs,
            ]}
          >
            <Text style={item.sender_id === user?.id ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
              {item.body}
            </Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Message about pickup/dropoff…"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable style={styles.sendButton} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 380, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  bubble: { maxWidth: '75%', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  bubbleMine: { backgroundColor: colors.ink, alignSelf: 'flex-end' },
  bubbleTheirs: { backgroundColor: '#F0EEEC', alignSelf: 'flex-start' },
  bubbleTextMine: { color: colors.paper, fontSize: 14 },
  bubbleTextTheirs: { color: colors.ink, fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sendButton: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 16 },
  sendText: { color: colors.paper, fontWeight: '600', fontSize: 13 },
});
