import { describe, expect, it } from 'vitest';
import { mealyMoore, type MooreMachine } from '../../algorithms/mealyMoore';
import { machineToGraph } from './graphData';

describe('mealyMoore graphData', () => {
  it('merges parallel Mealy edges into "input/output" labels', () => {
    const graph = machineToGraph(mealyMoore.exampleInput.machine);
    expect(graph.nodes).toEqual([
      { id: 'A', label: 'A', start: true, hidden: false, highlighted: false, isNew: false },
      { id: 'B', label: 'B', start: false, hidden: false, highlighted: false, isNew: false },
    ]);

    const bToB = graph.edges.find((e) => e.from === 'B' && e.to === 'B');
    expect(bToB?.label).toBe('1/1');
  });

  it('formats Moore node labels as two lines: state name and "out: <output>"', () => {
    const moore = mealyMoore.run(mealyMoore.exampleInput).result as MooreMachine;
    const graph = machineToGraph(moore);
    expect(graph.nodes.map((n) => n.label)).toEqual([
      'A/0\nout: 0',
      'B/0\nout: 0',
      'B/1\nout: 1',
    ]);
  });
});
