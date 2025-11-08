import React from 'react';
import { View, Pressable, Text, Alert } from 'react-native';
import * as Location from 'expo-location';
import { GalileoWebSocket } from '../services/galileo';

const victimId = "test-victim-123";

export default function SOSButton() {

  const handleSOSPress = async () => {
    try {
      // Poproś o uprawnienia do lokalizacji
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Nie można uzyskać lokalizacji.');
        return;
      }

      // Pobierz aktualną pozycję GPS
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Utwórz połączenie WebSocket
      const ws = new GalileoWebSocket(victimId, () => {}, console.error);
      ws.connect();

      // Wyślij lokalizację po krótkiej chwili (żeby ws zdążył się połączyć)
      setTimeout(() => {
        ws.sendVictimLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          alt: position.coords.altitude,
          accuracy: position.coords.accuracy ?? 0,
          timestamp: position.timestamp,
        });
        ws.disconnect();
        Alert.alert('SOS wysłane', 'Twoja lokalizacja została przesłana do ratownika.');
      }, 500);

    } catch (error) {
      console.error('Błąd wysyłania lokalizacji SOS:', error);
      Alert.alert('Błąd', 'Nie udało się wysłać lokalizacji.');
    }
  };

  return (
    <View style={{ position: 'absolute', bottom: 30, right: 20 }}>
      <Pressable
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: '#ff3b30',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={handleSOSPress}
      >
      </Pressable>
    </View>
  );
}
