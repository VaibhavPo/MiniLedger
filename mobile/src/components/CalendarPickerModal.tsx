import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors } from '../styles/colors';
import { fonts } from '../styles/common';
import { ChevronLeft, ChevronRight, X, Calendar, Check } from 'lucide-react-native';

interface CalendarPickerModalProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarPickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}: CalendarPickerModalProps) {
  // Parse initial date
  const parseDate = (str: string) => {
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const initial = parseDate(selectedDate);
  const [viewYear, setViewYear] = useState<number>(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initial.getMonth()); // 0-11
  const [activeDate, setActiveDate] = useState<string>(selectedDate);

  useEffect(() => {
    if (visible) {
      const parsed = parseDate(selectedDate);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      setActiveDate(selectedDate);
    }
  }, [visible, selectedDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Quick preset helper
  const setRelativeDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    setActiveDate(dateStr);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const setEndOfMonth = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dateStr = end.toISOString().split('T')[0];
    setActiveDate(dateStr);
    setViewYear(end.getFullYear());
    setViewMonth(end.getMonth());
  };

  // Helper to format YYYY-MM-DD
  const formatDateStr = (year: number, month: number, day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Days calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSelectDay = (day: number) => {
    const formatted = formatDateStr(viewYear, viewMonth, day);
    setActiveDate(formatted);
  };

  const handleConfirm = () => {
    onSelectDate(activeDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.calendarIconBox}>
                    <Calendar size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.headerMonthYear}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                </View>

                <View style={styles.navButtonsRow}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handlePrevMonth}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={20} color={colors.onSurface} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handleNextMonth}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={20} color={colors.onSurface} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navButton, styles.closeNavButton]}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day of Week Headers */}
              <View style={styles.weekDaysRow}>
                {WEEK_DAYS.map((day, idx) => (
                  <Text key={idx} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Dates Grid */}
              <View style={styles.daysGrid}>
                {/* Empty cells before 1st day */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
                ))}

                {/* Days of the month */}
                {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateStr = formatDateStr(viewYear, viewMonth, day);
                  const isSelected = activeDate === dateStr;
                  const isToday = todayStr === dateStr;

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.dayCell,
                        isToday && styles.todayCell,
                        isSelected && styles.selectedCell,
                      ]}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isToday && styles.todayText,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Presets */}
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setRelativeDays(7)}
                >
                  <Text style={styles.presetChipText}>+1 Week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setRelativeDays(14)}
                >
                  <Text style={styles.presetChipText}>+2 Weeks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={setEndOfMonth}
                >
                  <Text style={styles.presetChipText}>End of Month</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setRelativeDays(30)}
                >
                  <Text style={styles.presetChipText}>+1 Month</Text>
                </TouchableOpacity>
              </View>

              {/* Confirm / Select Button */}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.confirmButtonText}>
                  Set Payback Date • {activeDate}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 60, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMonthYear: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.onSurface,
  },
  navButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeNavButton: {
    marginLeft: 4,
    backgroundColor: colors.surfaceContainer,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.onSurfaceVariant,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 40,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 1,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  selectedCell: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  dayText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.onSurface,
  },
  todayText: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  selectedText: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  presetChip: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
});
