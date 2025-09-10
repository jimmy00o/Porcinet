// src/CostsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Colors = {
  green: "#1E5B3F",
  greenDark: "#15432F",
  beige: "#FFF7EA",
  white: "#FFFFFF",
  text: "#0f172a",
  muted: "#6b7280",
  card: "#F1E9D6",
  brown: "#A57A3D",
};

const DEFAULT_GASTOS = {
  alimentacion: 800,
  medicamentos: 450,
  mantenimiento: 300,
  otros: 150,
  ingresos: 2500,
};

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const monthKey = (d) =>
  `costs:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function monthLabel(date = new Date()) {
  const m = MONTHS_ES[date.getMonth()];
  return `${m} ${date.getFullYear()}`;
}

/* ====== Formateo a Córdobas (NIO) ====== */
let nioFmt;
try {
  nioFmt = new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
} catch {}
function formatNIO(v) {
  if (nioFmt) return nioFmt.format(v);
  const n = Math.round(Number(v) || 0).toLocaleString("es-NI");
  return `C$ ${n}`;
}

/* Mini chart sin librerías */
function MiniBars({ costos, ingresos }) {
  const max = Math.max(costos, ingresos, 1);
  const hC = (costos / max) * 90;
  const hI = (ingresos / max) * 90;
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ height: 110, alignItems: "center", justifyContent: "flex-end" }}>
        <View style={{ flexDirection: "row", gap: 30, alignItems: "flex-end" }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 34, height: hC, backgroundColor: Colors.brown, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
            <Text style={styles.barLabel}>Costos</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 34, height: hI, backgroundColor: Colors.green, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
            <Text style={styles.barLabel}>Ingresos</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function CostsScreen({ navigation }) {
  const [cursor, setCursor] = useState(new Date());
  const [gastos, setGastos] = useState(DEFAULT_GASTOS);

  const totalGastos =
    gastos.alimentacion + gastos.medicamentos + gastos.mantenimiento + gastos.otros;

  // Modales
  const [showForm, setShowForm] = useState(false);
  const [fAlim, setFAlim] = useState("");
  const [fMeds, setFMeds] = useState("");
  const [fMant, setFMant] = useState("");

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [fIngreso, setFIngreso] = useState("");

  // Nuevo: selector de mes/año
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(cursor.getFullYear());

  /* ---------- Persistencia por mes ---------- */
  const loadForMonth = async (date) => {
    try {
      const raw = await AsyncStorage.getItem(monthKey(date));
      if (raw) {
        setGastos(JSON.parse(raw));
      } else {
        await AsyncStorage.setItem(monthKey(date), JSON.stringify(DEFAULT_GASTOS));
        setGastos(DEFAULT_GASTOS);
      }
    } catch (e) {
      console.warn("No se pudo cargar costos:", e);
      setGastos(DEFAULT_GASTOS);
    }
  };

  const saveForMonth = async (date, data) => {
    try {
      await AsyncStorage.setItem(monthKey(date), JSON.stringify(data));
    } catch (e) {
      console.warn("No se pudo guardar costos:", e);
    }
  };

  useEffect(() => {
    loadForMonth(cursor);
  }, [cursor]);

  /* ---------- Acciones: gastos ---------- */
  const openForm = () => {
    setFAlim("");
    setFMeds("");
    setFMant("");
    setShowForm(true);
  };

  const saveForm = async () => {
    const alim = parseFloat((fAlim || "0").replace(",", ".")) || 0;
    const meds = parseFloat((fMeds || "0").replace(",", ".")) || 0;
    const mant = parseFloat((fMant || "0").replace(",", ".")) || 0;

    if (alim < 0 || meds < 0 || mant < 0) {
      Alert.alert("Datos inválidos", "Los valores no pueden ser negativos.");
      return;
    }

    const next = {
      ...gastos,
      alimentacion: gastos.alimentacion + alim,
      medicamentos: gastos.medicamentos + meds,
      mantenimiento: gastos.mantenimiento + mant,
    };

    setGastos(next);
    await saveForMonth(cursor, next);

    setShowForm(false);
    Alert.alert("Guardado", "Gasto agregado y total actualizado ✅");
  };

  /* ---------- Acciones: ingresos ---------- */
  const openIncomeForm = () => {
    setFIngreso("");
    setShowIncomeForm(true);
  };

  const saveIncome = async () => {
    const ingreso = parseFloat((fIngreso || "0").replace(",", ".")) || 0;
    if (ingreso < 0) {
      Alert.alert("Dato inválido", "El ingreso no puede ser negativo.");
      return;
    }

    const next = {
      ...gastos,
      ingresos: gastos.ingresos + ingreso,
    };

    setGastos(next);
    await saveForMonth(cursor, next);

    setShowIncomeForm(false);
    Alert.alert("Guardado", "Ingreso agregado ✅");
  };

  /* ---------- Acciones: selector de mes ---------- */
  const openMonthPicker = () => {
    setPickerYear(cursor.getFullYear());
    setShowMonthPicker(true);
  };
  const selectMonth = (monthIndex) => {
    const d = new Date(pickerYear, monthIndex, 1);
    setCursor(d);
    setShowMonthPicker(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.beige }}>
      {/* Header como en el diseño */}
      <View style={styles.greenTop}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" color={Colors.white} size={22} />
          </Pressable>
          <Text style={styles.title}>Gestión de costos{"\n"}y gastos</Text>
          <Pressable onPress={() => {}} hitSlop={10}>
            <MaterialCommunityIcons name="magnify" color={Colors.white} size={22} />
          </Pressable>
        </View>
      </View>

      {/* Tarjeta */}
      <View style={styles.card}>
        {/* Selector de mes (abre modal de selección) */}
        <Pressable onPress={openMonthPicker} style={styles.monthChip}>
          <Text style={styles.monthText}>{monthLabel(cursor)}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={Colors.text} />
        </Pressable>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons name="pig" size={66} color="#ef7896" />
        </View>

        {/* Botones agregar */}
        <Pressable
          onPress={openForm}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { backgroundColor: Colors.greenDark },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Agregar gasto</Text>
        </Pressable>

        <Pressable
          onPress={openIncomeForm}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={Colors.green} />
          <Text style={styles.secondaryBtnText}>Agregar ingreso</Text>
        </Pressable>

        {/* Tabla (con C$) */}
        <View style={{ marginTop: 10 }}>
          <Row label="Alimentación" value={gastos.alimentacion} money />
          <Divider />
          <Row label="Medicamentos" value={gastos.medicamentos} money />
          <Divider />
          <Row label="Mantenimiento" value={gastos.mantenimiento} money />
          <Divider />
          <Row label="Otros" value={gastos.otros} money />
          <Divider />
          <Row label="Total:" bold value={totalGastos} money />
          <Row label="Ingresos:" bold value={gastos.ingresos} money />
        </View>

        <MiniBars costos={totalGastos} ingresos={gastos.ingresos} />
      </View>

      {/* ===== Modal: GASTOS ===== */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalWrap}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowForm(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Agregar gasto</Text>

            <Field label="Alimentación (C$)" value={fAlim} onChangeText={setFAlim} placeholder="0" />
            <Field label="Medicamentos (C$)" value={fMeds} onChangeText={setFMeds} placeholder="0" />
            <Field label="Mantenimiento (C$)" value={fMant} onChangeText={setFMant} placeholder="0" />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable onPress={() => setShowForm(false)} style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.9 }, { flex: 1 }]}>
                <Text style={styles.outlineBtnText}>Cancelar</Text>
              </Pressable>

              <Pressable onPress={saveForm} style={({ pressed }) => [styles.primaryBtn, pressed && { backgroundColor: Colors.greenDark }, { flex: 1, justifyContent: "center" }]}>
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Modal: INGRESO ===== */}
      <Modal visible={showIncomeForm} transparent animationType="slide" onRequestClose={() => setShowIncomeForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalWrap}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowIncomeForm(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Agregar ingreso</Text>

            <Field label="Ingreso (C$)" value={fIngreso} onChangeText={setFIngreso} placeholder="0" />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable onPress={() => setShowIncomeForm(false)} style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.9 }, { flex: 1 }]}>
                <Text style={styles.outlineBtnText}>Cancelar</Text>
              </Pressable>

              <Pressable onPress={saveIncome} style={({ pressed }) => [styles.primaryBtn, pressed && { backgroundColor: Colors.greenDark }, { flex: 1, justifyContent: "center" }]}>
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Modal: SELECTOR DE MES/AÑO ===== */}
      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <View style={styles.monthPickerBackdrop}>
          <View style={styles.monthPickerCard}>
            <View style={styles.monthPickerHeader}>
              <Pressable onPress={() => setPickerYear((y) => y - 1)} style={styles.yearBtn}>
                <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.green} />
              </Pressable>
              <Text style={styles.monthPickerTitle}>{pickerYear}</Text>
              <Pressable onPress={() => setPickerYear((y) => y + 1)} style={styles.yearBtn}>
                <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.green} />
              </Pressable>
            </View>

            <View style={styles.monthGrid}>
              {MONTHS_ES.map((m, idx) => {
                const isSelected = pickerYear === cursor.getFullYear() && idx === cursor.getMonth();
                return (
                  <Pressable
                    key={m}
                    onPress={() => selectMonth(idx)}
                    style={[
                      styles.monthCell,
                      isSelected && { backgroundColor: Colors.green },
                    ]}
                  >
                    <Text style={[styles.monthCellText, isSelected && { color: Colors.white }]}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={() => setShowMonthPicker(false)} style={[styles.outlineBtn, { marginTop: 8 }]}>
              <Text style={styles.outlineBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Subcomponentes ---------- */
function Row({ label, value, bold, money }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { fontWeight: "800" }]}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: "900" }]}>
        {money ? formatNIO(value) : value}
      </Text>
    </View>
  );
}
function Divider() {
  return <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />;
}
function Field({ label, value, onChangeText, placeholder }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: Colors.text, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor="#9aa0a6"
        style={styles.input}
      />
    </View>
  );
}

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  greenTop: {
    backgroundColor: Colors.green,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: Colors.white, fontWeight: "800", fontSize: 22, textAlign: "center", flex: 1 },

  card: {
    backgroundColor: Colors.beige,
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  monthChip: {
    alignSelf: "flex-start",
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  monthText: { color: Colors.text, fontWeight: "700" },

  avatarWrap: {
    alignSelf: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.card,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtn: {
    alignSelf: "center",
    marginTop: 12,
    backgroundColor: Colors.green,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryBtnText: { color: Colors.white, fontWeight: "800" },

  secondaryBtn: {
    alignSelf: "center",
    marginTop: 8,
    borderWidth: 2,
    borderColor: Colors.green,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
  },
  secondaryBtnText: { color: Colors.green, fontWeight: "800" },

  outlineBtn: {
    borderWidth: 2,
    borderColor: Colors.green,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { color: Colors.green, fontWeight: "800" },

  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  rowLabel: { color: Colors.text, fontSize: 15, fontWeight: "600" },
  rowValue: { color: Colors.text, fontSize: 15, fontWeight: "700" },

  barLabel: { marginTop: 6, color: Colors.muted, fontSize: 13 },

  /* Modal genérico */
  modalWrap: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  formCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  formTitle: { fontSize: 18, fontWeight: "800", color: Colors.text, marginBottom: 10 },
  input: {
    backgroundColor: "#f2f4f7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },

  /* Month picker */
  monthPickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  monthPickerCard: {
    backgroundColor: Colors.white,
    width: "100%",
    borderRadius: 16,
    padding: 14,
  },
  monthPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthPickerTitle: { fontSize: 18, fontWeight: "800", color: Colors.green },
  yearBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#eef3ef",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  monthCell: {
    width: "30%",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eef3ef",
    alignItems: "center",
  },
  monthCellText: { fontWeight: "800", color: Colors.green },
});

export default CostsScreen;





