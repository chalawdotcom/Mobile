import { Tabs } from "expo-router";
import { Activity, AlertCircle, Info, Settings, StopCircle } from "lucide-react-native";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#090d16",
          borderTopColor: "rgba(255,255,255,0.08)",
        },
        tabBarActiveTintColor: "#f8fafc",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alertes"
        options={{
          title: "Alertes",
          tabBarIcon: ({ color, size }) => (
            <AlertCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          title: "Historique",
          tabBarIcon: ({ color, size }) => (
            <StopCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="registre"
        options={{
          title: "Registre",
          tabBarIcon: ({ color, size }) => <Info size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Paramètres",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
