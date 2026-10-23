import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { loanService } from '../services/loanService';
import { colors } from '../styles/colors';
import { commonStyles, typography } from '../styles/common';

interface AddEntryFormProps {
  onEntryAdded: () => void;
}

export function AddEntryForm({ onEntryAdded }: AddEntryFormProps) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!friendName.trim()) {
      Alert.alert('Validation Error', 'Please enter friend name.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive amount.');
      return;
    }
    if (!dueDate.trim()) {
      Alert.alert('Validation Error', 'Please enter a due date (YYYY-MM-DD).');
      return;
    }

    try {
      setSubmitting(true);
      await loanService.addLoan({
        friend_name: friendName.trim(),
        amount: numAmount,
        due_date: dueDate.trim(),
        notes: notes.trim() || undefined,
      });

      // Reset form
      setFriendName('');
      setAmount('');
      setDueDate('');
      setNotes('');
      setExpanded(false);
      onEntryAdded();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add entry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <TouchableOpacity
        style={[commonStyles.buttonPrimary, styles.toggleBtn]}
        onPress={() => setExpanded(true)}
      >
        <Text style={commonStyles.buttonPrimaryText}>+ Add New Entry</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[commonStyles.card, styles.container]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Add New Loan Entry</Text>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={commonStyles.inputLabel}>Friend Name</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="e.g. Rahul"
          placeholderTextColor={colors.textMuted}
          value={friendName}
          onChangeText={setFriendName}
          editable={!submitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={commonStyles.inputLabel}>Amount (₹)</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="e.g. 1500"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          editable={!submitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={commonStyles.inputLabel}>Due Date (YYYY-MM-DD)</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="YYYY-MM-DD (e.g. 2026-11-01)"
          placeholderTextColor={colors.textMuted}
          value={dueDate}
          onChangeText={setDueDate}
          editable={!submitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={commonStyles.inputLabel}>Notes (optional)</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="e.g. Dinner split, concert tickets"
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          editable={!submitting}
        />
      </View>

      <TouchableOpacity
        style={[commonStyles.buttonPrimary, submitting && commonStyles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={commonStyles.buttonPrimaryText}>Save Entry</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    marginBottom: 16,
  },
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
  },
  cancelText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  field: {
    marginBottom: 12,
  },
});
