export interface TreeNode {
  type: 'file' | 'dir';
  name: string;
  fullPath: string;
  children?: TreeNode[];
}

/**
 * Convert a flat list of full paths into a hierarchical tree, optionally
 * rooted at `rootPrefix`. The root prefix is stripped from displayed names
 * but retained in `fullPath` so callers can pass it to GitHub APIs.
 */
export function buildTree(paths: string[], rootPrefix = ''): TreeNode[] {
  const root: TreeNode = { type: 'dir', name: '', fullPath: '', children: [] };
  const prefix = rootPrefix ? rootPrefix.replace(/\/+$/, '') : '';

  for (const fullPath of paths) {
    if (prefix && !fullPath.startsWith(`${prefix}/`)) continue;
    const rel = prefix ? fullPath.slice(prefix.length + 1) : fullPath;
    if (!rel) continue;
    const parts = rel.split('/');
    let node = root;
    let cumulative = prefix;
    for (let i = 0; i < parts.length; i++) {
      const isFile = i === parts.length - 1;
      const part = parts[i]!;
      cumulative = cumulative ? `${cumulative}/${part}` : part;
      let child = node.children!.find((c) => c.name === part);
      if (!child) {
        child = {
          type: isFile ? 'file' : 'dir',
          name: part,
          fullPath: cumulative,
          children: isFile ? undefined : [],
        };
        node.children!.push(child);
      }
      node = child;
    }
  }

  function sortRec(n: TreeNode): void {
    if (!n.children) return;
    n.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortRec);
  }
  sortRec(root);
  return root.children!;
}
