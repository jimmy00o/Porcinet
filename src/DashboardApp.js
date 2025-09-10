// src/DashboardApp.js
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Colors = {
  green: "#1E5B3F",
  beige: "#FFF7EA",
  text: "#0f172a",
  white: "#FFFFFF",
  muted: "#6b7280",
  card: "#F1E9D6",
  border: "rgba(0,0,0,0.08)",
  ok: "#16a34a",
  warn: "#eab308",
  bad: "#dc2626",
};

const sampleHerd = { total: 235, sows: 120, boars: 8, growers: 107 };
const sampleProduction = [
  { month: "Jul", farrowings: 36, weaned: 398, mortality: 12 },
  { month: "Aug", farrowings: 34, weaned: 381, mortality: 10 },
  { month: "Sep", farrowings: 38, weaned: 412, mortality: 11 },
  { month: "Oct", farrowings: 37, weaned: 405, mortality: 9 },
  { month: "Nov", farrowings: 39, weaned: 420, mortality: 9 },
  { month: "Dec", farrowings: 40, weaned: 432, mortality: 10 },
];

// === Cálculo de métricas ===
function computeMetrics(herd, production) {
  const months = production.length;
  const totalWeaned = production.reduce((a, b) => a + b.weaned, 0);
  const totalFarrows = production.reduce((a, b) => a + b.farrowings, 0);
  const totalMortality = production.reduce((a, b) => a + b.mortality, 0);

  const weanedPerSowMonth = herd.sows > 0 ? (totalWeaned / herd.sows) / months : 0;
  const productivityPct = Math.min(100, Math.round((weanedPerSowMonth / 4.5) * 100));
  const farrowRate = herd.sows > 0 ? Math.round(((totalFarrows / months) / herd.sows) * 100) : 0;
  const avgMortality = Math.round(totalMortality / months);

  return {
    herd,
    totals: { totalWeaned, totalFarrows, totalMortality },
    kpis: { productivityPct, farrowRate, avgMortality },
    trends: {
      trendWeaned: production.map((p) => p.weaned),
      trendFarrow: production.map((p) => p.farrowings),
      trendMort: production.map((p) => p.mortality),
      labels: production.map((p) => p.month),
    },
  };
}

function runAccuracyTests(herd, production, kpis) {
  return [
    {
      name: "Coherencia del hato (sumas)",
      pass: herd.sows + herd.boars + herd.growers === herd.total,
    },
    {
      name: "Valores no negativos",
      pass: herd.total >= 0 && production.every((p) => p.farrowings >= 0 && p.weaned >= 0 && p.mortality >= 0),
    },
    {
      name: "Productividad en rango",
      pass: kpis.productivityPct >= 0 && kpis.productivityPct <= 100,
      info: `${kpis.productivityPct}%`,
    },
    {
      name: "Mortalidad razonable",
      pass: kpis.avgMortality < 50,
      info: `prom. ${kpis.avgMortality}/mes`,
    },
  ];
}

function MiniBars({ data = [], maxHeight = 42 }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
      {data.map((v, i) => {
        const h = Math.max(4, (v / max) * maxHeight);
        return <View key={i} style={{ width: 10, height: h, backgroundColor: Colors.green, borderRadius: 3 }} />;
      })}
    </View>
  );
}

export function ProductivityDashboardScreen() {
  const [herd, setHerd] = useState(sampleHerd);
  const [production, setProduction] = useState(sampleProduction);

  const metrics = useMemo(() => computeMetrics(herd, production), [herd, production]);
  const tests = useMemo(() => runAccuracyTests(herd, production, metrics.kpis), [herd, production, metrics.kpis]);

  const regenerate = () => {
    const next = production.map((p, i) => ({
      ...p,
      weaned: Math.max(0, p.weaned + (i % 2 === 0 ? 4 : -3)),
    }));
    setProduction(next);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.beige }}
      contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={true}
      bounces={true}   // 👉 permite deslizar hacia arriba y abajo con rebote
    >
      <View style={styles.rowChips}>
        <KpiCard label="Cerdos totales" value={herd.total} />
        <KpiCard label="Productividad" value={`${metrics.kpis.productivityPct}%`} />
        <KpiCard label="Madres" value={herd.sows} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Resumen de productividad</Text>

        <View style={styles.itemRow}>
          <Info label="Tasa de partos" value={`${metrics.kpis.farrowRate}%`} />
          <MiniGraph title="Partos" data={metrics.trends.trendFarrow} labels={metrics.trends.labels} />
        </View>

        <View style={styles.itemRow}>
          <Info label="Lechones destetados (6m)" value={metrics.totals.totalWeaned} />
          <MiniGraph title="Destetados" data={metrics.trends.trendWeaned} labels={metrics.trends.labels} />
        </View>

        <View style={styles.itemRow}>
          <Info label="Mortalidad prom./mes" value={metrics.kpis.avgMortality} />
          <MiniGraph title="Mortalidad" data={metrics.trends.trendMort} labels={metrics.trends.labels} />
        </View>

        <TouchableOpacity style={styles.btn} onPress={regenerate}>
          <MaterialCommunityIcons name="refresh" size={18} color={Colors.white} />
          <Text style={styles.btnText}>Regenerar métricas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Pruebas de exactitud</Text>
        {tests.map((t, i) => (
          <View key={i} style={styles.testRow}>
            <MaterialCommunityIcons
              name={t.pass ? "check-circle" : "close-circle"}
              size={18}
              color={t.pass ? Colors.ok : Colors.bad}
            />
            <Text style={[styles.testText, { color: t.pass ? Colors.ok : Colors.bad }]}>
              {t.pass ? "PASA" : "FALLA"} – {t.name}
              {t.info ? ` (${t.info})` : ""}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function KpiCard({ label, value }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: Colors.muted, fontWeight: "800" }}>{label}</Text>
      <Text style={{ color: Colors.text, fontWeight: "900", fontSize: 18 }}>{value}</Text>
    </View>
  );
}

function MiniGraph({ title, data, labels }) {
  return (
    <View style={{ alignItems: "flex-end", gap: 6 }}>
      <Text style={{ color: Colors.muted, fontWeight: "800" }}>{title}</Text>
      <MiniBars data={data} />
      <Text style={{ color: Colors.muted, fontSize: 11 }}>{labels.join("  ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowChips: { flexDirection: "row", justifyContent: "space-between" },
  kpiCard: {
    width: "32%", backgroundColor: Colors.card, borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: Colors.border,
  },
  kpiLabel: { fontSize: 12, color: Colors.muted, fontWeight: "800" },
  kpiValue: { fontSize: 18, fontWeight: "900", color: Colors.text, marginBottom: 4 },

  panel: {
    backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, padding: 14, marginTop: 14, gap: 14,
  },
  panelTitle: { fontSize: 16, fontWeight: "900", color: Colors.text },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  btn: {
    marginTop: 8, alignSelf: "flex-start", backgroundColor: Colors.green,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  btnText: { color: Colors.white, fontWeight: "900" },

  testRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  testText: { fontWeight: "800" },
});
