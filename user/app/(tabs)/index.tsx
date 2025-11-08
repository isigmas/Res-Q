import { StyleSheet, View, Pressable, Text, Animated, Modal, Vibration } from 'react-native';
import { useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [isHolding, setIsHolding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const vibrateInterval = useRef<NodeJS.Timeout | null>(null);

  const startHold = () => {
    setIsHolding(true);

    // Animacja postępu (5 sekund)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    // Animacja pulsowania
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wibracje co 500ms
    vibrateInterval.current = setInterval(() => {
      Vibration.vibrate(100);
    }, 500);

    // Timer na 5 sekund
    holdTimer.current = setTimeout(() => {
      handleSOSComplete();
    }, 5000);
  };

  const cancelHold = () => {
    setIsHolding(false);

    // Zatrzymaj wszystkie animacje i timery
    progressAnim.stopAnimation();
    scaleAnim.stopAnimation();

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (vibrateInterval.current) {
      clearInterval(vibrateInterval.current);
      vibrateInterval.current = null;
    }

    // Reset animacji
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSOSComplete = () => {
    // Zatrzymaj wibracje i animacje
    if (vibrateInterval.current) {
      clearInterval(vibrateInterval.current);
      vibrateInterval.current = null;
    }

    // Końcowa mocna wibracja
    Vibration.vibrate([0, 200, 100, 200]);

    setIsHolding(false);
    setShowSuccessModal(true);

    // Reset animacji
    progressAnim.setValue(0);
    scaleAnim.setValue(1);

    // Przejdź do ekranu śledzenia ratownika po 2 sekundach
    setTimeout(() => {
      setShowSuccessModal(false);
      router.push('/rescue-tracking');
    }, 2000);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#bd382f', '#ff6b6b', '#4caf50'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.outerShadow}>
          <Pressable
            style={styles.sosButton}
            onPressIn={startHold}
            onPressOut={cancelHold}
          >
            <View style={styles.innerShadowLight} />
            <View style={styles.innerShadowDark} />

            {isHolding && (
              <Animated.View
                style={[
                  styles.progressRing,
                  {
                    width: progressWidth,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            )}
            <LinearGradient
              colors={['#FFAD59', '#FF7E7B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sosContent}
            >
              <Text style={styles.sosText}>SOS</Text>
              {isHolding && (
                <Text style={styles.holdText}>Przytrzymaj...</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>✓</Text>
            <Text style={styles.modalTitle}>Pomoc wezwana!</Text>
            <Text style={styles.modalText}>Ratownicy zostali powiadomieni</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerShadow: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: -8,
      height: -8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F5F5FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#AAAACC',
    shadowOffset: {
      width: 8,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  innerShadowLight: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  innerShadowDark: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(170, 170, 204, 0.15)',
  },
  progressRing: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
    borderRadius: 80,
  },
  sosContent: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#AAAACC',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 62,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  holdText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.95,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 280,
  },
  modalIcon: {
    fontSize: 64,
    color: '#4caf50',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
