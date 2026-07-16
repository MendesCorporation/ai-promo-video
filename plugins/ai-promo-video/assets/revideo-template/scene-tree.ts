import type {Node} from '@revideo/2d';

export type SceneNodeCollection =
  | Node
  | false
  | null
  | undefined
  | readonly SceneNodeCollection[];

/** Recursively flatten JSX fragments or nested node arrays before scene insertion. */
export function flattenSceneNodes(...collections: readonly SceneNodeCollection[]): Node[] {
  const result: Node[] = [];
  const visit = (collection: SceneNodeCollection): void => {
    if (Array.isArray(collection)) {
      collection.forEach(visit);
    } else if (collection !== false && collection !== null && collection !== undefined) {
      result.push(collection as Node);
    }
  };
  collections.forEach(visit);
  return result;
}

/** Map one item to one or many nodes without leaking nested arrays to Revideo 0.11. */
export function mapSceneNodes<T>(
  items: readonly T[],
  mapper: (item: T, index: number) => SceneNodeCollection,
): Node[] {
  return flattenSceneNodes(items.map(mapper));
}

/** Add a recursively flattened collection to an existing Revideo parent. */
export function addSceneNodes(parent: Node, ...collections: readonly SceneNodeCollection[]): Node[] {
  const nodes = flattenSceneNodes(...collections);
  parent.add(nodes);
  return nodes;
}

/** Fail loudly when a ref exists but its node was never attached to the visual tree. */
export function assertSceneNodeMounted(node: Node, label = 'scene node'): Node {
  if (node.parent() === null) {
    throw new Error(
      `${label} exists but is detached from the Revideo scene tree. ` +
      'Avoid Fragment/array values returned from map(), or mount them with mapSceneNodes/addSceneNodes.',
    );
  }
  return node;
}

export function assertSceneNodesMounted(nodes: SceneNodeCollection, label = 'scene nodes'): Node[] {
  return flattenSceneNodes(nodes).map((node, index) => assertSceneNodeMounted(node, `${label}[${index}]`));
}
