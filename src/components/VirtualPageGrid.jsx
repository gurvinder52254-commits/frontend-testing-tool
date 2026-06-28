import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import PageCard from './PageCard';

const CARD_ESTIMATE_HEIGHT = 90; // px — estimated height of a collapsed Accordion item
const OVERSCAN = 5; // number of cards to render above/below viewport

/**
 * VirtualPageGrid
 * ─────────────────────────────────────────────────────────────
 * Renders a list of PageCards using DOM virtualization.
 * Only the cards currently visible in the viewport (plus overscan)
 * are mounted in the DOM, keeping memory usage flat regardless of
 * how many pages are in the dataset.
 *
 * Props:
 *   pages             - array of page result objects
 *   onScreenshotClick - callback(url) for image modal
 *   title             - optional section heading (default: "Tested Pages")
 */
function VirtualPageGrid({ pages, onScreenshotClick, title }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: pages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_ESTIMATE_HEIGHT,
    overscan: OVERSCAN,
  });

  const items = virtualizer.getVirtualItems();

  if (pages.length === 0) return null;

  return (
    <section className="results">
      <h2 className="results__title">
        📄 {title || `Tested Pages (${pages.length})`}
      </h2>

      {/* Scrollable viewport — height matches a reasonable visible area */}
      <div
        ref={parentRef}
        style={{
          height: '80vh',
          overflowY: 'auto',
          contain: 'strict',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,240,255,0.3) rgba(255,255,255,0.04)',
        }}
      >
        {/* Total scroll height container */}
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Render visible items in a vertical list stack for Accordion layout */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${items[0]?.start ?? 0}px)`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {items.map((virtualRow) => {
              const page = pages[virtualRow.index];
              return (
                <div
                  key={page.url || virtualRow.index}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                >
                  <PageCard
                    page={page}
                    onScreenshotClick={onScreenshotClick}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(VirtualPageGrid);
