import { File, Directory, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as SQLite from 'expo-sqlite';
import { requestWidgetUpdate, type WidgetTaskHandlerProps } from 'react-native-android-widget';
import { allMemoriesLite, migrate } from '../lib/db';
import { t } from '../lib/i18n';
import { rememberThis } from '../lib/rediscover';
import { formatDate } from '../lib/format';
import { RememberWidget, type WidgetMemory } from './RememberWidget';

export const WIDGET = 'Remember';

// Runs headless (no UI): picks today's "Remember this?" memory and shrinks its cover for the widget.
async function pick(): Promise<WidgetMemory | null> {
  // Own connection: this also runs inside the app process, and the default shared connection would be
  // closed under the app's feet when this one is released.
  const db = await SQLite.openDatabaseAsync('memento.db', { useNewConnection: true });
  let rows;
  try {
    await migrate(db);
    rows = await allMemoriesLite(db);
  } finally {
    await db.closeAsync();
  }
  const m = rememberThis(rows, Date.now()) ?? [...rows].sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!m) return null;
  const file = new File(new Directory(Paths.document, 'media'), m.cover);
  if (!file.exists) return null;
  // Square crop + small JPEG: widget bitmaps are size-limited, and full photos would exceed it.
  const full = await ImageManipulator.manipulate(file.uri).renderAsync();
  const side = Math.min(full.width, full.height);
  const img = await ImageManipulator.manipulate(file.uri)
    .crop({ originX: (full.width - side) / 2, originY: (full.height - side) / 2, width: side, height: side })
    .resize({ width: 360, height: 360 })
    .renderAsync();
  const saved = await img.saveAsync({ base64: true, compress: 0.75, format: SaveFormat.JPEG });
  return {
    id: m.id,
    caption: m.title || formatDate(m.memoryDate),
    image: `data:image/jpeg;base64,${saved.base64}`,
  };
}

async function render(width: number, height: number) {
  let memory: WidgetMemory | null = null;
  try {
    memory = await pick();
  } catch (e) {
    console.warn('Widget: could not load a memory', e);
  }
  return <RememberWidget width={width} height={height} memory={memory} label={t.rememberThis} empty={t.widgetEmpty} />;
}

export async function widgetTaskHandler({ widgetAction, widgetInfo, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  renderWidget(await render(widgetInfo.width, widgetInfo.height));
}

/** Called when the app goes to the background, so the widget never shows a deleted memory for long. */
export function refreshWidget() {
  requestWidgetUpdate({ widgetName: WIDGET, renderWidget: (info) => render(info.width, info.height) }).catch(() => {});
}
