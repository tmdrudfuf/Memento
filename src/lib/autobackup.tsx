import * as Network from 'expo-network';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getSetting, setSetting } from './db';
import { backupToDrive, driveAvailable } from './drive';
import { shouldAutoBackup } from './plan';
import { usePremium } from './premium';

let running = false;

/** Weekly Google Drive backup while the app is open (on launch and when it returns to the foreground). */
export function AutoBackup() {
  const db = useSQLiteContext();
  const { isPremium } = usePremium();

  useEffect(() => {
    if (!driveAvailable()) return;
    const check = async () => {
      if (running) return;
      const [email, last, net] = await Promise.all([
        getSetting(db, 'driveEmail'),
        getSetting(db, 'lastDriveBackup'),
        Network.getNetworkStateAsync(),
      ]);
      const wifi = net.type === Network.NetworkStateType.WIFI && net.isInternetReachable !== false;
      if (!shouldAutoBackup({ premium: isPremium, connected: !!email, last: Number(last) || 0, now: Date.now(), wifi }))
        return;
      running = true;
      try {
        await backupToDrive(db);
        await setSetting(db, 'lastDriveBackup', String(Date.now()));
        await setSetting(db, 'driveLastError', '');
      } catch (e) {
        console.warn('Auto backup failed', e);
        await setSetting(db, 'driveLastError', String(Date.now()));
      } finally {
        running = false;
      }
    };
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [db, isPremium]);

  return null;
}
