import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { HeartAccent } from "../components/HeartAccent";
import { auth, db, isFirebaseConfigured } from "../services/firebase";

// Account & pairing screen. See spec section 5.1 (invite-only, no public
// directory) and functions/src/index.ts for the matching Cloud Function
// side of invite validation.

function randomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I -- easy to read aloud
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function PairScreen() {
  const { colors } = useTheme();

  if (!isFirebaseConfigured) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>Account & pairing</Text>
        <Card style={{ gap: 8 }}>
          <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.text }}>Firebase isn't connected yet</Text>
          <Text style={{ fontSize: 12.5, color: colors.textDim, lineHeight: 18 }}>
            Copy .env.example to .env and fill in your Firebase project's web config (Firebase console → Project
            settings → General → Your apps) to enable sign-in and pairing. Every other screen keeps working with
            sample data in the meantime.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return <PairScreenLive />;
}

function PairScreenLive() {
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  async function handleAuth() {
    if (!auth) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "signUp") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (db) {
          await setDoc(doc(db, "users", cred.user.uid), {
            displayName: email.split("@")[0],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e: any) {
      setError(e?.message?.replace("Firebase: ", "") ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateInvite() {
    if (!auth?.currentUser || !db) return;
    setBusy(true);
    setError(null);
    try {
      const code = randomInviteCode();
      await setDoc(doc(db, "invites", code), { createdBy: auth.currentUser.uid, createdAt: serverTimestamp() });
      setInviteCode(code);
    } catch (e: any) {
      setError(e?.message?.replace("Firebase: ", "") ?? "Couldn't create an invite code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!auth?.currentUser || !db || !joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const inviteSnap = await getDoc(doc(db, "invites", joinCode.trim().toUpperCase()));
      if (!inviteSnap.exists()) {
        setError("That invite code wasn't found.");
        return;
      }
      const partnerId = inviteSnap.data().createdBy as string;
      if (partnerId === auth.currentUser.uid) {
        setError("That's your own invite code.");
        return;
      }
      const coupleId = [partnerId, auth.currentUser.uid].sort().join("_");
      await setDoc(doc(db, "couples", coupleId), { memberIds: [partnerId, auth.currentUser.uid], pairedAt: serverTimestamp() });
      await setDoc(doc(db, "users", auth.currentUser.uid), { coupleId }, { merge: true });
      await setDoc(doc(db, "users", partnerId), { coupleId }, { merge: true });
    } catch (e: any) {
      setError(e?.message?.replace("Firebase: ", "") ?? "Couldn't join with that code.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>
          {mode === "signUp" ? "Create your account" : "Sign in"}
        </Text>
        <Card style={{ gap: spacing.sm }}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { borderColor: colors.line, color: colors.text }]}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { borderColor: colors.line, color: colors.text }]}
          />
          {error && <Text style={{ fontSize: 12, color: "#c0392b" }}>{error}</Text>}
          {busy ? (
            <ActivityIndicator color={colors.pink} />
          ) : (
            <Button label={mode === "signUp" ? "Sign up" : "Sign in"} onPress={handleAuth} />
          )}
          <Pressable onPress={() => setMode(mode === "signUp" ? "signIn" : "signUp")}>
            <Text style={{ fontSize: 12.5, color: colors.textDim, textAlign: "center" }}>
              {mode === "signUp" ? "Already have an account? Sign in" : "New here? Create an account"}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>Pair up</Text>
      <Text style={{ fontSize: 13, color: colors.textDim, lineHeight: 19 }}>
        Signed in as {user.email}. Share a code with your partner, or enter theirs below — pairing is invite-only,
        never a public directory.
      </Text>

      <Card style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.text }}>Your invite code</Text>
        {inviteCode ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <HeartAccent size={14} color={colors.pink} />
            <Text style={{ fontSize: 24, fontWeight: "700", letterSpacing: 4, color: colors.pink, fontFamily: typography.headline }}>
              {inviteCode}
            </Text>
          </View>
        ) : busy ? (
          <ActivityIndicator color={colors.pink} />
        ) : (
          <Button label="Generate a code" onPress={handleGenerateInvite} />
        )}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.text }}>Have their code?</Text>
        <TextInput
          placeholder="ABC123"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
          style={[styles.input, { borderColor: colors.line, color: colors.text }]}
        />
        {error && <Text style={{ fontSize: 12, color: "#c0392b" }}>{error}</Text>}
        {busy ? <ActivityIndicator color={colors.pink} /> : <Button label="Pair up" onPress={handleJoin} />}
      </Card>

      <Pressable onPress={() => auth && signOut(auth)}>
        <Text style={{ fontSize: 12.5, color: colors.textFaint, textAlign: "center" }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "600" },
  input: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, fontSize: 14 },
});
