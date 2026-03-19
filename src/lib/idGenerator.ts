let counter = 0;

export function generateNodeId(): string {
  counter += 1;
  return `drop_${Date.now()}_${counter}`;
}
