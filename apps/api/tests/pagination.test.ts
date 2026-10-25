import { describe, expect, it } from 'vitest';
import { cursorArgs, toPage } from '../src/utils/pagination';

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `id-${i}` }));

describe('pagination', () => {
  it('fetches one extra row and skips the cursor row', () => {
    expect(cursorArgs(undefined, 10)).toEqual({ take: 11 });
    expect(cursorArgs('abc', 10)).toEqual({ take: 11, cursor: { id: 'abc' }, skip: 1 });
  });

  it('returns a cursor only when there is another page', () => {
    expect(toPage(rows(11), 10)).toMatchObject({ nextCursor: 'id-9' });
    expect(toPage(rows(11), 10).items).toHaveLength(10);
    expect(toPage(rows(10), 10).nextCursor).toBeNull();
    expect(toPage([], 10)).toEqual({ items: [], nextCursor: null });
  });
});
