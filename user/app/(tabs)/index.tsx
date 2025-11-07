import { StyleSheet, View } from 'react-native';
import MapView from '@/components/MapView';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <MapView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
