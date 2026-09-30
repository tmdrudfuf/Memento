import { FlexWidget, ImageWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';

// Home-screen widget: one pinned polaroid on a little cork board. Android RemoteViews only support
// these primitives, so it's a simplified version of the in-app board.
export type WidgetMemory = { id: number; caption: string; image: `data:image${string}` };

const CORK = require('../../assets/board-cork.png');
const INK = '#2B2622';
const MUTED = '#6F665F';

export function RememberWidget({
  width,
  height,
  memory,
  label,
  empty,
}: {
  width: number;
  height: number;
  memory: WidgetMemory | null;
  label: string;
  empty: string;
}) {
  const photo = Math.max(48, Math.min(width, height) - 64);
  return (
    <OverlapWidget
      style={{ height: 'match_parent', width: 'match_parent', borderRadius: 18 }}
      clickAction={memory ? 'OPEN_URI' : 'OPEN_APP'}
      clickActionData={memory ? { uri: `memento://memory/${memory.id}` } : undefined}
    >
      <ImageWidget image={CORK} imageWidth={width} imageHeight={height} radius={18} />
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
        }}
      >
        {memory ? (
          <FlexWidget
            style={{
              backgroundColor: '#FFFFFF',
              padding: 5,
              paddingBottom: 6,
              borderRadius: 2,
              alignItems: 'center',
              rotation: -3,
            }}
          >
            <FlexWidget
              style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#D9483B', marginBottom: 3 }}
            />
            <ImageWidget image={memory.image} imageWidth={photo} imageHeight={photo} radius={1} />
            <TextWidget
              text={memory.caption}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 11, color: INK, marginTop: 4, width: photo, textAlign: 'center' }}
            />
            <TextWidget text={label} maxLines={1} style={{ fontSize: 9, color: MUTED, marginTop: 1 }} />
          </FlexWidget>
        ) : (
          <FlexWidget
            style={{ backgroundColor: '#FFFFFF', padding: 10, borderRadius: 2, rotation: -2, alignItems: 'center' }}
          >
            <TextWidget text={empty} maxLines={3} style={{ fontSize: 12, color: INK, textAlign: 'center' }} />
          </FlexWidget>
        )}
      </FlexWidget>
    </OverlapWidget>
  );
}
