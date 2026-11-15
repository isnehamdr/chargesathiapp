import { Text, View } from "react-native";
import { s } from "../../lib/ui";

export default function Bookings() {
  return (
    <View
      style={[s.screen, { justifyContent: "center", alignItems: "center" }]}
    >
      <Text style={{ color: "rgba(11,26,22,0.5)" }}>
        Your bookings will appear here.
      </Text>
    </View>
  );
}
