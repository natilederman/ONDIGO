import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Input } from './Input';
import { searchPlaces, type PlaceResult } from '../lib/geocode';
import { colors } from '../lib/theme';

export function LocationInput({
  label,
  placeholder,
  onSelect,
}: {
  label: string;
  placeholder?: string;
  onSelect: (place: PlaceResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setResults(await searchPlaces(query));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <View>
      <Input label={label} placeholder={placeholder} value={query} onChangeText={setQuery} />
      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <Pressable
              key={i}
              style={styles.item}
              onPress={() => {
                setQuery(r.label);
                setResults([]);
                onSelect(r);
              }}
            >
              <Text style={styles.itemText} numberOfLines={2}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.paper,
    overflow: 'hidden',
  },
  item: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  itemText: { fontSize: 14, color: colors.ink },
});
