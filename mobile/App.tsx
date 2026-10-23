import React, { useState } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServerConfigScreen } from './src/screens/ServerConfigScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { User } from './src/services/authService';
import { setAuthToken } from './src/utils/api';
import { colors } from './src/styles/colors';

type Screen = 'SERVER_CONFIG' | 'LOGIN' | 'OTP' | 'HOME';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SERVER_CONFIG');
  const [hasConfiguredServer, setHasConfiguredServer] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleServerConnected = (_url: string) => {
    setHasConfiguredServer(true);
    setCurrentScreen('LOGIN');
  };

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
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {currentScreen === 'SERVER_CONFIG' && (
          <ServerConfigScreen
            onConnected={handleServerConnected}
            canCancel={hasConfiguredServer}
            onCancel={() => setCurrentScreen('LOGIN')}
          />
        )}

        {currentScreen === 'LOGIN' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onChangeServer={() => setCurrentScreen('SERVER_CONFIG')}
          />
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
