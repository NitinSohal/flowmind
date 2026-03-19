import { ParsedNode, ParsedEdge, NodeType } from '@/types/flow';

/**
 * FlowMind DSL Format:
 *
 * Node definitions:
 *   [Label]         → start/end node (square brackets)
 *   {Label}         → decision node (curly braces)
 *   Label           → process node (plain text)
 *   >Label<         → I/O node (angle brackets)
 *
 * Edge definitions (must come after blank line or be on own line):
 *   A --> B
 *   A --Label--> B
 *
 * Example:
 *   [Start]
 *   Collect User Input
 *   {Is Input Valid?}
 *   Process Data
 *   Show Error
 *   [End]
 *
 *   [Start] --> Collect User Input
 *   Collect User Input --> {Is Input Valid?}
 *   {Is Input Valid?} --Yes--> Process Data
 *   {Is Input Valid?} --No--> Show Error
 *   Process Data --> [End]
 *   Show Error --> [End]
 */

function detectNodeType(raw: string): { nodeType: NodeType; label: string } {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const label = raw.slice(1, -1).trim();
    const lower = label.toLowerCase();
    const endKeywords = ['end', 'finish', 'stop', 'done', 'complete', 'completed', 'success', 'failure', 'fail', 'error', 'terminate', 'exit'];
    const isEnd = endKeywords.includes(lower) || lower.startsWith('end ') || lower.endsWith(' end');
    return { nodeType: isEnd ? 'end' : 'start', label };
  }
  if (raw.startsWith('{') && raw.endsWith('}')) {
    return { nodeType: 'decision', label: raw.slice(1, -1).trim() };
  }
  if (raw.startsWith('>') && raw.endsWith('<')) {
    return { nodeType: 'io', label: raw.slice(1, -1).trim() };
  }
  return { nodeType: 'process', label: raw.trim() };
}

function labelToId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40) || 'node';
}

export function parseDSL(dsl: string): { nodes: ParsedNode[]; edges: ParsedEdge[] } {
  const lines = dsl.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  const nodeMap = new Map<string, ParsedNode>();
  const edges: ParsedEdge[] = [];

  // Edge pattern: source --label--> target  OR  source --> target
  const edgePattern = /^(.+?)\s+--([^-]*)?-->\s*(.+)$|^(.+?)\s+-->\s*(.+)$/;

  const ensureNode = (raw: string): ParsedNode => {
    const { nodeType, label } = detectNodeType(raw.trim());
    let id = labelToId(label);
    // Avoid id collisions
    if (nodeMap.has(id) && nodeMap.get(id)!.label !== label) {
      id = id + '_' + nodeMap.size;
    }
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, nodeType, label });
    }
    return nodeMap.get(id)!;
  };

  for (const line of lines) {
    const match = line.match(edgePattern);
    if (match) {
      const [, src1, lbl, tgt1, src2, tgt2] = match;
      const sourceRaw = (src1 || src2).trim();
      const targetRaw = (tgt1 || tgt2).trim();
      const edgeLabel = lbl?.trim() || undefined;

      const sourceNode = ensureNode(sourceRaw);
      const targetNode = ensureNode(targetRaw);

      edges.push({
        id: `e_${sourceNode.id}_${targetNode.id}_${edges.length}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: edgeLabel,
      });
    } else {
      // Standalone node declaration
      ensureNode(line);
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

export function serializeDSL(
  nodes: Array<{ id: string; data: { label: string; nodeType: NodeType } }>,
  edges: Array<{ source: string; target: string; label?: string }>
): string {
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const formatNodeLabel = (node: { data: { label: string; nodeType: NodeType } }): string => {
    const { label, nodeType } = node.data;
    if (nodeType === 'start' || nodeType === 'end') return `[${label}]`;
    if (nodeType === 'decision') return `{${label}}`;
    if (nodeType === 'io') return `>${label}<`;
    return label;
  };

  const lines: string[] = [];

  // Standalone node lines for nodes not referenced in edges
  const referencedIds = new Set(edges.flatMap(e => [e.source, e.target]));
  for (const node of nodes) {
    if (!referencedIds.has(node.id)) {
      lines.push(formatNodeLabel(node));
    }
  }

  // Edge lines
  for (const edge of edges) {
    const src = nodeById.get(edge.source);
    const tgt = nodeById.get(edge.target);
    if (!src || !tgt) continue;
    const srcLabel = formatNodeLabel(src);
    const tgtLabel = formatNodeLabel(tgt);
    if (edge.label) {
      lines.push(`${srcLabel} --${edge.label}--> ${tgtLabel}`);
    } else {
      lines.push(`${srcLabel} --> ${tgtLabel}`);
    }
  }

  return lines.join('\n');
}
