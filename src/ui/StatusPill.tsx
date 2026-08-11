import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from './theme';

type StatusPillProps = {
  status: string;
};

const statusStyles: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
  New: {
    backgroundColor: '#edf1f5',
    borderColor: '#cdd7df',
    color: colors.text,
  },
  'Site Visit': {
    backgroundColor: colors.amberSoft,
    borderColor: '#e5c783',
    color: '#5a4530',
  },
  Estimating: {
    backgroundColor: colors.successSoft,
    borderColor: '#abd4c9',
    color: colors.success,
  },
  'Quote Ready': {
    backgroundColor: '#edf7df',
    borderColor: '#bed890',
    color: '#385414',
  },
  Won: {
    backgroundColor: '#dff3ec',
    borderColor: '#8fc9ba',
    color: '#13473e',
  },
  Lost: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#e3b0a8',
    color: colors.danger,
  },
  Draft: {
    backgroundColor: '#edf1f5',
    borderColor: '#cdd7df',
    color: colors.text,
  },
  Ready: {
    backgroundColor: '#edf7df',
    borderColor: '#bed890',
    color: '#385414',
  },
  Sent: {
    backgroundColor: colors.amberSoft,
    borderColor: '#e5c783',
    color: '#5a4530',
  },
  Approved: {
    backgroundColor: '#dff3ec',
    borderColor: '#8fc9ba',
    color: '#13473e',
  },
  Rejected: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#e3b0a8',
    color: colors.danger,
  },
  Superseded: {
    backgroundColor: '#f1f3f2',
    borderColor: colors.border,
    color: colors.muted,
  },
  Archived: {
    backgroundColor: '#f1f3f2',
    borderColor: colors.border,
    color: colors.muted,
  },
};

export function StatusPill({ status }: StatusPillProps) {
  const palette = statusStyles[status] ?? statusStyles.New;

  return (
    <View style={[styles.pill, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <Text style={[styles.text, { color: palette.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '900',
  },
});
