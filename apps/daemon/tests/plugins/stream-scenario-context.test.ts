import {test, expect} from 'vitest';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadPluginLocalSkill} from '../../src/plugins/local-skill.js';

for (const id of ['stream-alert-authoring', 'stream-overlay-authoring']) {
  test(`${id} injects its canonical workflow through the actual platform loader`, async () => {
    const root = fileURLToPath(new URL('../../../../plugins/stream-machine/' + id + '/', import.meta.url));
    const manifest = JSON.parse(await readFile(path.join(root, 'open-design.json'), 'utf8'));
    const skill = await loadPluginLocalSkill({
      id, title: manifest.title, version: manifest.version, sourceKind: 'local',
      source: root, trust: 'trusted', capabilitiesGranted: manifest.od.capabilities,
      manifest, fsPath: root, installedAt: 0, updatedAt: 0,
    });
    const raw = await readFile(path.join(root, 'SKILL.md'), 'utf8');
    const canonical = raw.replace(/^---[\s\S]*?\n---\s*/, '').trim();
    expect(skill).not.toBeNull();
    expect(skill?.relpath).toBe('SKILL.md');
    expect(skill?.body).toContain(canonical);
  });
}
