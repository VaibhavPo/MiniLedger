import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  fontRegular: '400' as const,
  fontMedium: '500' as const,
  fontSemiBold: '600' as const,
  fontBold: '700' as const,
};

export const commonStyles = StyleSheet.create({
  // Textbox / Input details
  inputLabel: {
    fontSize: typography.sm,
    fontWeight: typography.fontMedium,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.xs,
    color: colors.error,
    marginTop: 4,
  },

  // Common Button details
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: typography.base,
    fontWeight: typography.fontSemiBold,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.fontSemiBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Container & Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
