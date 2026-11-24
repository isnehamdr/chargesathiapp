// import { Tabs } from "expo-router";
// import { C } from "../../lib/ui";

// export default function TabsLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: C.dark,
//         headerTitleStyle: { color: C.ink },
//       }}
//     >
//       <Tabs.Screen name="index" options={{ title: "Stations" }} />
//       <Tabs.Screen name="bookings" options={{ title: "My bookings" }} />
//     </Tabs>
//   );
// }


import { Tabs } from 'expo-router';
import { C } from '../../lib/ui';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: C.dark, headerTitleStyle: { color: C.ink } }}>
            <Tabs.Screen name="index" options={{ title: 'Stations' }} />
            <Tabs.Screen name="bookings" options={{ title: 'My bookings' }} />
            <Tabs.Screen name="account" options={{ title: 'Account' }} />
        </Tabs>
    );
}