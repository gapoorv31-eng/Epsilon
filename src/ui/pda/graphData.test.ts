import { describe, expect, it } from 'vitest';
import { EPSILON, pda } from '../../algorithms/pda';
import { formatPdaEdgeLabel, pdaToGraph } from './graphData';

describe('pda graphData', () => {
  it('formats transitions as "input, top / push" with ε for empty push', () => {
    expect(
      formatPdaEdgeLabel({ from: 'q0', input: 'a', top: 'Z', to: 'q0', push: 'AZ' })
    ).toBe('a, Z / AZ');
    expect(
      formatPdaEdgeLabel({ from: 'q1', input: 'b', top: 'A', to: 'q1', push: '' })
    ).toBe(`b, A / ${EPSILON}`);
  });

  it('merges parallel edges between the same two states with newline separators', () => {
    const graph = pdaToGraph(pda.exampleInput.machine, 'q0');
    const q0Loop = graph.edges.find((e) => e.from === 'q0' && e.to === 'q0');
    expect(q0Loop?.label).toBe('a, Z / AZ\na, A / AA');
    expect(graph.nodes.find((n) => n.id === 'q0')?.highlighted).toBe(true);
    expect(graph.nodes.find((n) => n.id === 'q2')?.accepting).toBe(true);
  });
});
