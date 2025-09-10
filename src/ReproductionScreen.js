// src/ReproductionScreen.js
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Colors = {
  green: "#1E5B3F",
  beige: "#FFF7EA",
  text: "#0f172a",
  white: "#FFFFFF",
  muted: "#6b7280",
  card: "#F1E9D6",
};

export default function ReproductionScreen({ navigation }) {
  const [selected, setSelected] = useState("");
  const [events, setEvents] = useState([]);

  // ---------- helpers de fecha ----------
  const toDate = (iso) => {
    // iso: "YYYY-MM-DD"
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  };
  const fmt = (date) =>
    date.toISOString().slice(0, 10); // YYYY-MM-DD
  const daysBetween = (a, b) => {
    const MS = 24 * 60 * 60 * 1000;
    return Math.round((toDate(fmt(b)) - toDate(fmt(a))) / MS);
  };

  // ---------- acciones ----------
  const addEvent = (type) => {
    if (!selected) {
      Alert.alert("Selecciona una fecha", "Debes elegir un día en el calendario.");
      return;
    }
    const newEvent = {
      id: Date.now(),
      date: selected,
      type,
      desc:
        type === "Celo"
          ? "Detección de celo"
          : type === "Parto"
          ? "Parto registrado"
          : "Monta registrada",
    };
    setEvents((prev) => [...prev, newEvent]);
    Alert.alert("Evento agregado", `${newEvent.desc} en ${selected}`);
  };

  const deleteEvent = (id) => setEvents((prev) => prev.filter((ev) => ev.id !== id));

  // ---------- derivaciones ----------
  const eventsOfDay = useMemo(
    () => events.filter((ev) => ev.date === selected),
    [events, selected]
  );

  // Validación de alertas basada en “selected”
  const alerts = useMemo(() => {
    if (!selected) return [];
    const sel = toDate(selected);
    const beforeOrOnSelected = (ev) => toDate(ev.date) <= sel;

    const celos = events.filter((e) => e.type === "Celo" && beforeOrOnSelected(e));
    const montas = events.filter((e) => e.type === "Monta" && beforeOrOnSelected(e));
    const partos = events.filter((e) => e.type === "Parto" && beforeOrOnSelected(e));

    const latest = (arr) =>
      arr.length ? arr.reduce((a, b) => (toDate(a.date) > toDate(b.date) ? a : b)) : null;

    const lastCelo = latest(celos);
    const lastMonta = latest(montas);
    const msgs = [];

    // Regla 1: ventana de monta tras celo (0–2 días). Si ya pasaron >2 días sin monta → alerta.
    if (lastCelo) {
      const limiteMonta = addDays(toDate(lastCelo.date), 2);
      const huboMontaPosteriorAlCelo = montas.some(
        (m) => toDate(m.date) >= toDate(lastCelo.date) && toDate(m.date) <= limiteMonta
      );
      if (!huboMontaPosteriorAlCelo && sel > limiteMonta) {
        msgs.push(
          `No se registró **Monta** posterior al celo del ${lastCelo.date} (ventana recomendada: 0–2 días).`
        );
      }
    }

    // Regla 2: recordatorio/atraso de parto según última monta (gestación ≈114 días)
    if (lastMonta) {
      const expected = addDays(toDate(lastMonta.date), 114);
      const diff = daysBetween(expected, sel); // >0 si hoy es después del esperado
      const huboParto = partos.some((p) => toDate(p.date) >= addDays(expected, -7));

      if (!huboParto) {
        if (diff >= -7 && diff <= 0) {
          msgs.push(
            `Parto esperado alrededor del **${fmt(expected)}** (preparar corrales/atención).`
          );
        } else if (diff > 3) {
          msgs.push(
            `Parto **atrasado** desde ~${fmt(expected)} y no hay registro de parto. Verificar estado.`
          );
        }
      }
    }

    return msgs;
  }, [events, selected]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.beige }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Control de reproducción</Text>
        <TouchableOpacity onPress={() => {}} style={styles.hBtn}>
          <MaterialCommunityIcons name="magnify" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Calendario */}
        <Calendar
          onDayPress={(day) => setSelected(day.dateString)}
          markedDates={{
            [selected]: { selected: true, marked: true, selectedColor: Colors.green },
          }}
          theme={{
            selectedDayBackgroundColor: Colors.green,
            selectedDayTextColor: Colors.white,
            arrowColor: Colors.green,
            todayTextColor: "#d14343",
            textDayFontWeight: "600",
          }}
          style={styles.calendar}
        />

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => addEvent("Celo")}>
            <Text style={styles.actionText}>Registrar celo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => addEvent("Monta")}>
            <Text style={styles.actionText}>Monta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => addEvent("Parto")}>
            <Text style={styles.actionText}>Parto</Text>
          </TouchableOpacity>
        </View>

        {/* Alertas */}
        <View style={styles.alertBox}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <MaterialCommunityIcons name="alert-circle" size={18} color="#b45309" />
            <Text style={styles.alertTitle}>  Validación de alertas</Text>
          </View>
          {!selected ? (
            <Text style={styles.alertText}>Selecciona un día para ver alertas.</Text>
          ) : alerts.length === 0 ? (
            <Text style={styles.alertText}>Sin alertas para esta fecha.</Text>
          ) : (
            alerts.map((msg, idx) => (
              <Text key={idx} style={styles.alertItem}>
                • {msg}
              </Text>
            ))
          )}
        </View>

        {/* Cronología */}
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Cronología</Text>

          {!selected ? (
            <Text style={styles.timelineText}>Selecciona un día en el calendario</Text>
          ) : eventsOfDay.length === 0 ? (
            <Text style={styles.timelineText}>No hay información</Text>
          ) : (
            eventsOfDay.map((ev) => (
              <View key={ev.id} style={styles.timelineRow}>
                <View>
                  <Text style={styles.timelineDate}>{ev.date}</Text>
                  <Text style={styles.timelineText}>{ev.desc}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEvent(ev.id)}>
                  <MaterialCommunityIcons name="delete" size={22} color="#b91c1c" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.green,
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  hBtn: { padding: 8 },
  hTitle: {
    flex: 1,
    textAlign: "left",
    color: Colors.white,
    fontWeight: "800",
    fontSize: 18,
    marginLeft: 6,
  },

  calendar: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    elevation: 1,
    marginBottom: 12,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#d9fdd3",
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  actionText: { fontWeight: "800", color: Colors.text },

  alertBox: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  alertTitle: { fontWeight: "800", color: "#b45309" },
  alertText: { color: "#7c2d12" },
  alertItem: { color: "#7c2d12", marginTop: 2 },

  timeline: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginTop: 6,
  },
  timelineTitle: { fontWeight: "900", marginBottom: 6, color: Colors.text },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  timelineDate: { fontWeight: "700", color: Colors.text },
  timelineText: { color: Colors.muted },
  deleteBtn: { padding: 6, borderRadius: 6 },
});

