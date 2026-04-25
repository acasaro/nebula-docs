import { Note } from '../Callout';

interface BitrisePrereqProps {
  feature?: string;
}

export function BitrisePrereq({ feature }: BitrisePrereqProps) {
  return (
    <Note title="Prerequisite">
      Your project must be fully migrated to Bitrise CI before {feature ? `using ${feature}` : 'proceeding'}.
      If you haven't migrated yet, see <a href="/developers/mobile-ci/migrate-github-to-bitrise">Migrating from GitHub to Bitrise</a>.
    </Note>
  );
}
