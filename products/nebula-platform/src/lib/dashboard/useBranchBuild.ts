import { useEffect, useState } from "react";
import { subscribeBuilds, type BuildDoc } from "./firestore";

/**
 * Live mirror of the latest webhook-written build doc for one specific
 * branch on one specific repo. Used by the editor's Preview button to
 * decide whether a preview channel exists, whether it's currently
 * deploying, and what URL it lives at.
 *
 * Return values:
 *   `undefined` — first snapshot from Firestore hasn't arrived yet (loading)
 *   `null`      — snapshot arrived, no build doc exists for this branch
 *   `BuildDoc`  — latest build doc for this branch
 *
 * The differentiation between loading and "no build ever" matters for
 * UX — the button should show a skeleton during initial load and a
 * "Save changes first" tooltip once we know nothing's been deployed.
 *
 * Reuses `subscribeBuilds` (which filters server-side by `repo.fullName`)
 * and does the branch filter + latest-by-receivedAt pick client-side.
 * Avoids needing a composite Firestore index per branch.
 */
export function useBranchBuild(args: {
  repoFullName: string | null;
  branch: string | null;
}): BuildDoc | null | undefined {
  const [build, setBuild] = useState<BuildDoc | null | undefined>(undefined);

  useEffect(() => {
    if (!args.repoFullName || !args.branch) {
      setBuild(null);
      return;
    }
    setBuild(undefined);
    const unsub = subscribeBuilds(
      { repoFullName: args.repoFullName },
      (builds) => {
        const matches = builds.filter((b) => b.branch === args.branch);
        if (matches.length === 0) {
          setBuild(null);
          return;
        }
        // Pick the latest. `receivedAt` is a Firestore serverTimestamp;
        // fall back to `runId` (a monotonic int) when timestamps are
        // missing on a freshly-written doc.
        const latest = matches.reduce((a, b) => {
          const aT = a.receivedAt?.toMillis() ?? a.runId;
          const bT = b.receivedAt?.toMillis() ?? b.runId;
          return bT > aT ? b : a;
        });
        setBuild(latest);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn("[useBranchBuild]", err);
        setBuild(null);
      },
    );
    return unsub;
  }, [args.repoFullName, args.branch]);

  return build;
}
