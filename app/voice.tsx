import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Card } from "../components/Card";
import { HeartAccent } from "../components/HeartAccent";
import { DEMO_VOICE_NOTES, DemoVoiceNote } from "../lib/demoData";

// Voice notes screen. See spec section 5.3 and services/notifications.ts.
// Recording/playback is real (expo-av, local-only for now); uploading to
// Cloud Storage and wiring a clip as the actual push-notification sound are
// still TODO once Firebase + pairing exist -- see the comments below.
export default function VoiceScreen() {
  const { colors } = useTheme();
  const [notes, setNotes] = useState<DemoVoiceNote[]>(DEMO_VOICE_NOTES);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const localUriRef = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch {
      setPermissionDenied(true);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationSec = Math.round((status.durationMillis ?? 0) / 1000);
      const id = "vn-" + Date.now();
      if (uri) localUriRef.current[id] = uri;
      setNotes((prev) => [
        { id, senderName: "you", durationSec, createdLabel: "Just now", isNotificationSound: false },
        ...prev,
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // TODO once paired + Firebase is live: upload the file at `uri` to
      // Cloud Storage under couples/{coupleId}/voiceNotes/{noteId} and write
      // the Firestore doc, instead of keeping the clip local-only.
    } catch {
      // Recording failed to finalize -- drop it silently rather than crash.
    } finally {
      setRecording(null);
    }
  }

  async function togglePlay(note: DemoVoiceNote) {
    const uri = localUriRef.current[note.id];
    if (!uri) return; // sample notes ship with no local audio to play
    try {
      if (playingId === note.id) {
        await soundRef.current?.stopAsync();
        setPlayingId(null);
        return;
      }
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(note.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlayingId(null);
      });
    } catch {
      setPlayingId(null);
    }
  }

  function toggleNotificationSound(id: string) {
    setNotes((prev) => prev.map((n) => ({ ...n, isNotificationSound: n.id === id ? !n.isNotificationSound : false })));
    // TODO: persist to couples/{coupleId}/voiceNotes/{noteId}.setAsNotificationSound
    // and bundle the clip as Heartlines' own push-notification sound (spec 5.3)
    // -- neither platform lets a third-party app override the real ringtone.
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
    >
      <View style={{ gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HeartAccent size={13} color={colors.pink} />
          <Text style={{ fontSize: 12, color: colors.textFaint }}>Their voice, on your phone</Text>
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>Voice Notes</Text>
        <Text style={{ fontSize: 13, color: colors.textDim, lineHeight: 19 }}>
          Record a clip and set it as your notification sound for each other. Phones don't let apps swap the actual
          ringtone — this changes Heartlines' own notification sound instead.
        </Text>
      </View>

      <Pressable onPress={isRecording ? stopRecording : startRecording}>
        {({ pressed }) => (
          <Card
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              opacity: pressed ? 0.85 : 1,
              borderColor: isRecording ? colors.pink : colors.line,
            }}
          >
            <View style={[styles.recordCircle, { backgroundColor: isRecording ? colors.pink : colors.pinkSoft }]}>
              <View
                style={[
                  styles.recordDot,
                  { backgroundColor: isRecording ? colors.surface : colors.pink, borderRadius: isRecording ? 4 : 999 },
                ]}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "700", color: colors.text }}>
                {isRecording ? "Recording… tap to stop" : "Record a new voice note"}
              </Text>
              {permissionDenied && (
                <Text style={{ fontSize: 12, color: colors.textDim }}>Microphone access is needed to record.</Text>
              )}
            </View>
          </Card>
        )}
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        {notes.map((note) => (
          <Card key={note.id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Pressable onPress={() => togglePlay(note)} style={[styles.playButton, { backgroundColor: colors.lavSoft }]}>
              <Text style={{ fontSize: 14, color: colors.lav }}>{playingId === note.id ? "⏸" : "▶"}</Text>
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.text }}>
                {note.senderName === "you" ? "You" : note.senderName} · {note.durationSec}s
              </Text>
              <Text style={{ fontSize: 11.5, color: colors.textFaint }}>{note.createdLabel}</Text>
            </View>
            <Pressable
              onPress={() => toggleNotificationSound(note.id)}
              style={[
                styles.soundTag,
                {
                  backgroundColor: note.isNotificationSound ? colors.pink : colors.bg,
                  borderColor: note.isNotificationSound ? colors.pink : colors.line,
                },
              ]}
            >
              <Text style={{ fontSize: 10.5, fontWeight: "700", color: note.isNotificationSound ? colors.surface : colors.textDim }}>
                {note.isNotificationSound ? "Notification sound" : "Set as sound"}
              </Text>
            </Pressable>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "600" },
  recordCircle: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  recordDot: { width: 16, height: 16 },
  playButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  soundTag: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
});
