// src/BackupApp.js
import React, { useEffect, useState, useCallback } from "react";

// ⛔️ Eliminado: no se usa aquí y causaba error de ruta
// import ProductivityDashboardScreen from "./screens/ProductivityDashboardScreen";

import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

/* =======================
   Paleta y utilidades
======================= */
const Colors = {
  green: "#1E5B3F",
  greenDark: "#15432F",
  beige: "#FFF7EA",
  text: "#0f172a",
  outline: "#1E5B3F",
  white: "#FFFFFF",
  muted: "#6b7280",
  card: "#F9F3E6",
};

function formatDateTime(d) {
  try {
    return new Date(d).toLocaleString("es-NI", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()} ${dt
      .getHours()
      .toString()
      .padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
  }
}

/* =======================
   Pantalla: Respaldos
======================= */
export function BackupScreen({ navigation }) {
  const [autoBackup, setAutoBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadState = useCallback(async () => {
    const [auto, last] = await Promise.all([
      AsyncStorage.getItem("autoBackupEnabled"),
      AsyncStorage.getItem("lastBackup"),
    ]);
    setAutoBackup(auto === "true");
    if (last) setLastBackup(last);
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const toggleAutoBackup = async (value) => {
    setAutoBackup(value);
    await AsyncStorage.setItem("autoBackupEnabled", value ? "true" : "false");
  };

  const doBackupNow = async () => {
    if (loading) return;
    setLoading(true);

    // Simulación de respaldo
    setTimeout(async () => {
      const timestamp = new Date().toISOString();

      await AsyncStorage.setItem("lastBackup", timestamp);
      setLastBackup(timestamp);

      const raw = await AsyncStorage.getItem("backupHistory");
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ id: timestamp, date: timestamp });
      await AsyncStorage.setItem("backupHistory", JSON.stringify(list));

      setLoading(false);
      Alert.alert("Listo", "Respaldo completado correctamente ✅");
    }, 1200);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.beige }]}>
      <View style={styles.headerSpacer} />

      {/* Avatar sin imagen local */}
      <View style={styles.avatarWrap}>
        <MaterialCommunityIcons name="pig" size={96} color="#ef7896" />
      </View>

      <Text style={styles.title}>
        Respaldos{"\n"}en la nube
      </Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Respaldos automáticos</Text>
        <Switch
          value={autoBackup}
          onValueChange={toggleAutoBackup}
          trackColor={{ true: Colors.green }}
          thumbColor={autoBackup ? Colors.white : "#f4f3f4"}
        />
      </View>

      <Text style={styles.helper}>
        Último respaldo:{"  "}
        <Text style={styles.helperBold}>
          {lastBackup ? formatDateTime(lastBackup) : "—"}
        </Text>
      </Text>

      <Pressable
        onPress={doBackupNow}
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && { backgroundColor: Colors.greenDark },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryBtnText}>Respaldar ahora</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("Historial")}
        style={({ pressed }) => [
          styles.outlineBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.outlineBtnText}>Ver respaldos anteriores</Text>
      </Pressable>
    </View>
  );
}

/* =======================
   Pantalla: Historial
======================= */
export function BackupHistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);

  const loadHistory = useCallback(async () => {
    const raw = await AsyncStorage.getItem("backupHistory");
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadHistory);
    return unsub;
  }, [navigation, loadHistory]);

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Ionicons name="cloud-done-outline" size={22} color={Colors.green} />
      <Text style={styles.historyText}>{formatDateTime(item.date)}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.beige }]}>
      {items.length === 0 ? (
        <Text style={styles.empty}>Aún no hay respaldos.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingTop: 8 }}
        />
      )}
    </View>
  );
}

/* =======================
   Navegación y App (opcional)
======================= */
const Stack = createNativeStackNavigator();

export default function BackupApp() {
  const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: Colors.beige },
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.green },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: Colors.beige },
        }}
      >
        <Stack.Screen
          name="Respaldos"
          component={BackupScreen}
          options={{ title: "Respaldo en la nube" }}
        />
        <Stack.Screen
          name="Historial"
          component={BackupHistoryScreen}
          options={{ title: "Respaldos anteriores" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* =======================
   Estilos
======================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerSpacer: { height: 4 },
  avatarWrap: {
    alignSelf: "center",
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  rowLabel: { fontSize: 16, fontWeight: "600", color: Colors.text },
  helper: { marginTop: 10, color: Colors.muted, fontSize: 14 },
  helperBold: { color: Colors.text, fontWeight: "700" },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: Colors.green,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.white, fontWeight: "800", fontSize: 16 },
  outlineBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.outline,
    backgroundColor: "transparent",
  },
  outlineBtnText: { color: Colors.outline, fontWeight: "800", fontSize: 16 },
  empty: { color: Colors.muted, fontSize: 14 },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  historyText: { fontSize: 15, color: Colors.text, fontWeight: "600" },
});
