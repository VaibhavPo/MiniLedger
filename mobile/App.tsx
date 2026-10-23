import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { User } from './src/services/authService';
import { setAuthToken } from './src/utils/api';
import { colors } from './src/styles/colors';

type Screen = 'LOGIN' | 'OTP' | 'HOME';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (email: string) => {
    setPendingEmail(email);
    setCurrentScreen('OTP');
  };

  const handleOtpSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('HOME');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setPendingEmail('');
    setCurrentScreen('LOGIN');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {currentScreen === 'LOGIN' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {currentScreen === 'OTP' && (
        <OtpScreen
          email={pendingEmail}
          onVerifySuccess={handleOtpSuccess}
          onBack={() => setCurrentScreen('LOGIN')}
        />
      )}

      {currentScreen === 'HOME' && currentUser && (
        <HomeScreen user={currentUser} onLogout={handleLogout} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
