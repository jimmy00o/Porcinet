// src/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Colors = {
  green: "#1E5B3F",
  beige: "#FFF7EA",
  text: "#0f172a",
  white: "#FFFFFF",
  muted: "#6b7280",
  input: "#F6EFE0",
  border: "rgba(0,0,0,0.12)",
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [secure, setSecure] = useState(true);
  const [remember, setRemember] = useState(false);

  const goToTabs = () => {
    navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.beige }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {}} style={{ padding: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Ingresar a mi granja</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Icono de cerdo */}
        <View style={styles.avatarWrap}>
          <View style={styles.pigIconCircle}>
            <MaterialCommunityIcons name="pig" size={100} color={Colors.green} />
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor={Colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>

        <View style={styles.inputBox}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor={Colors.muted}
              secureTextEntry={secure}
              value={pass}
              onChangeText={setPass}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)} style={{ paddingHorizontal: 8 }}>
              <MaterialCommunityIcons name={secure ? "eye-off" : "eye"} size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Checkbox Olvidaste tu contraseña? */}
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setRemember(!remember)} activeOpacity={0.8}>
          <MaterialCommunityIcons
            name={remember ? "checkbox-marked" : "checkbox-blank-outline"}
            size={22}
            color={Colors.green}
          />
          <Text style={styles.checkboxText}>Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Botones */}
        <TouchableOpacity style={styles.primaryBtn} onPress={goToTabs}>
          <Text style={styles.primaryText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Registro")}>
          <Text style={styles.secondaryText}>Registrarse</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.green,
    height: 56,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  hTitle: { flex: 1, textAlign: "center", color: Colors.white, fontWeight: "800", fontSize: 18 },

  content: { padding: 16, gap: 14 },
  avatarWrap: { alignItems: "center", marginTop: 8, marginBottom: 8 },
  pigIconCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    borderColor: Colors.beige,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  inputBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#D6D3C8",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.text,
    fontWeight: "700",
  },

  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  checkboxText: { marginLeft: 8, color: Colors.text, fontWeight: "700" },

  primaryBtn: {
    backgroundColor: Colors.green,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: { color: Colors.white, fontWeight: "900", fontSize: 16 },

  secondaryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.3,
    borderColor: "#2B5E42",
  },
  secondaryText: { color: Colors.text, fontWeight: "900", fontSize: 16 },
});
