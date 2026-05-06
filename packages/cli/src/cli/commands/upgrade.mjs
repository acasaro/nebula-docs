export async function runUpgrade() {
  process.stderr.write(
    `nebula upgrade: not implemented yet (Phase 0 stub).\n` +
      `\n` +
      `Planned behavior: bump @nebula-docs/cli to the latest tagged release in\n` +
      `the tenant's package.json, then run any registered codemods against\n` +
      `docs.json / theme.json. Codemod ordering is keyed by the previous schema\n` +
      `version (read from docs.json $schema URL).\n`,
  );
  process.exit(1);
}
