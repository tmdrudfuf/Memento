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
  frameWood: '#B89068', // board frame
  frameWoodDark: '#9C7550',
  board: 'cork' as 'cork' | 'felt',
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
  frameWood: '#5A4A3C',
  frameWoodDark: '#453829',
  board: 'felt',
};

export type Colors = typeof light;

// Push-pin heads; picked per memory so a board looks hand-pinned but stays stable.
export const PINS = ['#D9483B', '#E8B53A', '#3D7BD9', '#3FA46A', '#D96BA8'];
export const pinColor = (id: number) => PINS[(id * 7) % PINS.length];

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
