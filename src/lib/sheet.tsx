import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from './ui';

export type SheetAction = { label: string; onPress: () => void; destructive?: boolean };

// Bottom action list (Android alerts allow only 3 buttons).
export function Sheet({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {actions.map((a) => (
          <Pressable
            key={a.label}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.paper }]}
            onPress={() => {
              onClose();
              a.onPress();
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.rowText, a.destructive && { color: C.accent }]}>{a.label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.row} onPress={onClose} accessibilityRole="button">
          <Text style={[styles.rowText, { color: C.muted }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

type NameDialogProps = {
  visible: boolean;
  title: string;
  initial?: string;
  placeholder?: string;
  confirmLabel?: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
};

// Cross-platform text prompt (Alert.prompt is iOS-only).
export function NameDialog(props: NameDialogProps) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      {/* Mounted per opening, so the field always starts from `initial`. */}
      {props.visible && <DialogBody {...props} />}
    </Modal>
  );
}

function DialogBody({ title, initial = '', placeholder, confirmLabel = 'Save', onSubmit, onClose }: NameDialogProps) {
  const [name, setName] = useState(initial);
  const ok = name.trim().length > 0;
  const submit = () => {
    if (!ok) return;
    onClose();
    onSubmit(name.trim());
  };
  return (
    <KeyboardAvoidingView style={styles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.dialog}>
        <Text style={styles.dialogTitle}>{title}</Text>
        <TextInput
          autoFocus
          value={name}
          onChangeText={setName}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          onSubmitEditing={submit}
          returnKeyType="done"
          maxLength={40}
          style={styles.input}
        />
        <View style={styles.buttons}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.btn, { color: C.muted }]}>Cancel</Text>
          </Pressable>
          <Pressable onPress={submit} hitSlop={8} accessibilityRole="button" disabled={!ok}>
            <Text style={[styles.btn, !ok && { opacity: 0.4 }]}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 8 },
  title: { color: C.muted, fontSize: 13, textAlign: 'center', paddingVertical: 10 },
  row: { paddingVertical: 16, paddingHorizontal: 24 },
  rowText: { fontSize: 17, color: C.ink, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.35)' },
  dialog: { backgroundColor: C.card, borderRadius: 16, padding: 20, gap: 16 },
  dialogTitle: { fontSize: 18, fontWeight: '600', color: C.ink },
  input: {
    fontSize: 16,
    backgroundColor: C.paper,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.ink,
  },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 28 },
  btn: { fontSize: 16, fontWeight: '600', color: C.accent },
});
