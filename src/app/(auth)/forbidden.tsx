import { useRouter } from "expo-router";
import { ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

export default function ForbiddenScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleSignOut() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signOut();
      router.replace("/login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <ShieldAlert size={32} color="#fb7185" />
        </View>

        <Text style={styles.title}>Accès non autorisé</Text>
        <Text style={styles.description}>
          Ce rôle n'a pas accès à cette section. Si vous pensez qu'il s'agit
          d'une erreur, contactez votre superviseur.
        </Text>

        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
          >
            <Text style={styles.backText}>Retour</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Se déconnecter"
            onPress={handleSignOut}
            disabled={submitting}
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && styles.signOutBtnPressed,
              submitting && styles.signOutBtnDisabled,
            ]}
          >
            {submitting ? (
              <View style={styles.signOutRow}>
                <ActivityIndicator size="small" color="#94a3b8" />
                <Text style={styles.signOutText}>Déconnexion…</Text>
              </View>
            ) : (
              <Text style={styles.signOutText}>Se déconnecter</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#090d16" },
  container: {
    flex: 1,
    backgroundColor: "#090d16",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(251, 113, 133, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  buttons: { width: "100%", gap: 10, marginTop: 12 },
  backBtn: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#3b5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: { opacity: 0.9 },
  backText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  signOutBtn: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutBtnPressed: { opacity: 0.85 },
  signOutBtnDisabled: { backgroundColor: "#1e293b" },
  signOutText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  signOutRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
