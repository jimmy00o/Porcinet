// App.js
import "react-native-gesture-handler";
import React, { useEffect } from "react";
import HomeApp from "./src/HomeApp";
import { testFirebaseSimple } from "./database/testSimple";

export default function App() {
  useEffect(() => {
    // Test simple de Firebase al iniciar la app
    console.log('🚀 Iniciando Porcinet...');
    const result = testFirebaseSimple();
    console.log('🎯 Resultado del test:', result);
  }, []);

  return <HomeApp />;
}
