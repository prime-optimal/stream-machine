import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { InstalledPluginRecord, PluginManifest } from '@open-design/contracts';
import { manifestSourceDigest, resolveContext, type RegistryView } from '@open-design/plugin-runtime';
import { doctorPlugin } from '../src/plugins/doctor.js';
import { loadPluginLocalSkill } from '../src/plugins/local-skill.js';

const registry: RegistryView = { skills: [], designSystems: [], craft: [], atoms: [] };
let temporaryRoot: string;
let folder: string;

beforeEach(async () => {
  temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'od-doctor-local-'));
  folder = path.join(temporaryRoot, 'plugin');
  await mkdir(folder);
});

afterEach(async () => { await rm(temporaryRoot, { recursive: true, force: true }); });

function plugin(skills: Array<{ path?: string; ref?: string }>): InstalledPluginRecord {
  const manifest: PluginManifest = {
    name: 'local-skill-fixture',
    version: '1.0.0',
    od: { context: { skills }, capabilities: ['prompt:inject'] },
  };
  return {
    id: manifest.name,
    title: 'Local skill fixture',
    version: manifest.version,
    sourceKind: 'local',
    source: folder,
    fsPath: folder,
    trust: 'trusted',
    capabilitiesGranted: ['prompt:inject'],
    manifest,
    installedAt: 0,
    updatedAt: 0,
  };
}

describe('plugin doctor local skill diagnostics', () => {
  it.each(['./SKILL.md', 'instructions/SKILL.md'])('accepts a loadable %s without changing digest semantics', async (ref) => {
    const filename = path.join(folder, ref);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, '---\nname: local-skill-fixture\n---\n# Follow this workflow\n');
    const record = plugin([{ path: ref }]);
    const local = await loadPluginLocalSkill(record);
    expect(local?.body).toContain('Follow this workflow');
    const baseline = resolveContext(record.manifest, { registry, warnOnMissing: true });
    const expectedDigest = manifestSourceDigest({
      manifest: record.manifest,
      inputs: {},
      resolvedContextRefs: baseline.digestRefs,
    });

    const report = await doctorPlugin(record, registry);

    expect(report.ok).toBe(true);
    expect(report.issues.filter((issue) => issue.code === 'context.unresolved')).toEqual([]);
    expect(report.freshDigest).toBe(expectedDigest);
    expect(record.manifest.od?.context?.skills).toEqual([{ path: ref }]);
  });

  it.each([
    { ref: './missing.md', contents: null },
    { ref: './SKILL.md', contents: '' },
    { ref: './SKILL.md', contents: '---\nname: empty\n---\n \n' },
    { ref: '../SKILL.md', contents: '# Outside plugin\n' },
    { ref: 'SKILL.md', contents: '# Bare path is a global reference\n' },
  ])('preserves unresolved warning for $ref with unusable local content', async ({ ref, contents }) => {
    if (contents !== null) await writeFile(path.join(folder, ref), contents);
    const record = plugin([{ path: ref }]);
    expect(await loadPluginLocalSkill(record)).toBeNull();

    const report = await doctorPlugin(record, registry);

    expect(report.issues).toContainEqual({
      severity: 'warning', code: 'context.unresolved', message: `Unknown skill ref: '${ref}'`,
    });
  });

  it('preserves unknown global refs even when their string matches a valid local path', async () => {
    await writeFile(path.join(folder, 'SKILL.md'), '# Local instructions\n');
    const record = plugin([
      { path: './SKILL.md' },
      { ref: './SKILL.md' },
      { ref: 'unknown-global' },
    ]);

    const report = await doctorPlugin(record, registry);

    expect(report.issues.filter((issue) => issue.code === 'context.unresolved').map((issue) => issue.message)).toEqual([
      "Unknown skill ref: './SKILL.md'",
      "Unknown skill ref: 'unknown-global'",
    ]);
  });

  it('keeps the missing-ref warning opt-out', async () => {
    const report = await doctorPlugin(plugin([{ path: './missing.md' }, { ref: 'unknown-global' }]), registry, {
      warnOnMissingRefs: false,
    });
    expect(report.issues.filter((issue) => issue.code === 'context.unresolved')).toEqual([]);
  });

  it('retains original resolved digest refs when diagnostic filtering removes a local path', async () => {
    await writeFile(path.join(folder, 'SKILL.md'), '# Local instructions\n');
    const record = plugin([{ path: './SKILL.md' }, { ref: 'unknown-global' }]);
    const collidingRegistry = { ...registry, skills: [{ id: './SKILL.md', title: 'Registry entry' }] };
    const baseline = resolveContext(record.manifest, { registry: collidingRegistry, warnOnMissing: true });
    expect(baseline.digestRefs).toEqual([{ kind: 'skill', ref: './SKILL.md' }]);

    const report = await doctorPlugin(record, collidingRegistry);

    expect(report.freshDigest).toBe(manifestSourceDigest({
      manifest: record.manifest, inputs: {}, resolvedContextRefs: baseline.digestRefs,
    }));
    expect(report.issues.filter((issue) => issue.code === 'context.unresolved').map((issue) => issue.message)).toEqual([
      "Unknown skill ref: 'unknown-global'",
    ]);
  });
});
