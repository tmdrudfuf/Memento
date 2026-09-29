import { StyleSheet, useColorScheme } from 'react-native';

const light = {
  paper: '#F4EFE6', // screen background
  card: '#FFFFFF', // cards, sheets, inputs
  ink: '#2B2622', // text, primary button
  onInk: '#FFFFFF', // text on primary button / selected chip
  muted: '#8A8078',
  accent: '#C8553D',
  line: '#E3DBCD',
  frame: '#FFFFFF', // polaroid border: stays a real print in both themes
  frameInk: '#2B2622', // caption on the print
  scrim: 'rgba(0,0,0,0.35)',
};

const dark: typeof light = {
  paper: '#1B1815',
  card: '#282420',
  ink: '#F2ECE4',
  onInk: '#1B1815',
  muted: '#A39A91',
  accent: '#E58B72',
  line: '#3A3430',
  frame: '#EFE9E1',
  frameInk: '#2B2622',
  scrim: 'rgba(0,0,0,0.55)',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Defines styles once per theme: `const useStyles = makeStyles((c) => ({...}))`, then `useStyles()` in a component. */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(fn: (c: Colors) => T) {
  const cache = new Map<Colors, T>();
  return function useStyles(): T {
    const c = useColors();
    let s = cache.get(c);
    if (!s) cache.set(c, (s = StyleSheet.create(fn(c))));
    return s;
  };
}

/**
 * Header + background colors for a screen's <Stack.Screen options>. Set per screen (not in the
 * root screenOptions) because only per-screen options repaint live when the phone switches theme.
 */
export function useChrome() {
  const c = useColors();
  return {
    headerStyle: { backgroundColor: c.paper },
    headerTintColor: c.ink,
    headerTitleStyle: { color: c.ink },
    contentStyle: { backgroundColor: c.paper },
  };
}
