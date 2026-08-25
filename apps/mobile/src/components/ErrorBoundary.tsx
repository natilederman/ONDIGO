import { Component, type ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.wrap}>
          <Text style={styles.title}>Something crashed</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Text style={styles.stack}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, backgroundColor: colors.paper, padding: 24, paddingTop: 60, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.accentDark },
  message: { fontSize: 15, color: colors.ink },
  stack: { fontSize: 11, color: colors.muted, marginTop: 12 },
});
