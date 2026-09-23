import * as T from 'three';
import type { Kit } from '../core/kit';

/** Simple box-bodied hatchback. Placeholder; not a specific model. */
export function carModel(kit: Kit, color: string) {
  const { mat } = kit;
  const g = new T.Group();
  const body = new T.MeshStandardMaterial({
    color,
    metalness: 0.48,
    roughness: 0.28,
  });
  const window = new T.MeshStandardMaterial({
    color: '#27434c',
    metalness: 0.35,
    roughness: 0.12,
  });
  function part(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  }
  part(1.82, 0.55, 4.2, 0, 0.7, 0, body);
  part(1.6, 0.55, 1.9, 0, 1.23, -0.17, window);
  part(1.65, 0.12, 1.85, 0, 1.54, -0.2, body);
  part(1.68, 0.1, 4.23, 0, 0.46, 0, kit.m.dark);
  part(1.84, 0.12, 1.3, 0, 1.02, 1.37, body);
  part(1.84, 0.13, 0.45, 0, 1.01, -1.78, body);
  for (const x of [-0.73, 0.73]) {
    part(
      0.37,
      0.17,
      0.06,
      x,
      0.83,
      2.12,
      new T.MeshStandardMaterial({
        color: '#fff7d0',
        emissive: '#ffecb4',
        emissiveIntensity: 0.7,
      }),
    );
    part(
      0.38,
      0.14,
      0.06,
      x,
      0.83,
      -2.12,
      new T.MeshStandardMaterial({
        color: '#c94731',
        emissive: '#9c2319',
        emissiveIntensity: 0.25,
      }),
    );
    part(0.12, 0.52, 0.12, x, 1.23, -0.3, body);
    part(0.2, 0.12, 0.3, x * 1.24, 1.2, 0.65, body);
  }
  part(0.44, 0.12, 0.035, 0, 0.62, -2.135, mat('plate', '#edcf58'));
  const wheels: T.Mesh[] = [];
  for (const x of [-0.94, 0.94])
    for (const z of [-1.37, 1.38]) {
      const wheel = new T.Mesh(
        new T.CylinderGeometry(0.36, 0.36, 0.23, 16),
        mat('rubber', '#202924'),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.38, z);
      wheel.castShadow = true;
      g.add(wheel);
      wheels.push(wheel);
      const hub = new T.Mesh(
        new T.CylinderGeometry(0.2, 0.2, 0.245, 12),
        mat('hub', '#b5c3be', 0.32),
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      g.add(hub);
    }
  return { g, wheels };
}
