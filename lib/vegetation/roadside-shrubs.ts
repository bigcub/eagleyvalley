import * as T from 'three';
// Preserve existing boundary planting locations; replace solid repeated crowns.
export function addRoadsideShrubs(
  scene: T.Scene,
  shrubs: { x: number; z: number; y: number; h: number; flowering?: boolean }[],
  leaf: T.Material,
) {
  let seed = 781;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cards = 108,
    leaves = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      leaf,
      shrubs.length * cards,
    );
  const stems = new T.InstancedMesh(
    new T.CylinderGeometry(0.016, 0.045, 1, 5),
    new T.MeshStandardMaterial({ color: '#645841', roughness: 1 }),
    shrubs.length * 7,
  );
  const flowering = shrubs.filter((s) => s.flowering);
  const petals = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 1),
    new T.MeshStandardMaterial({ color: '#a276b3', roughness: 0.95 }),
    flowering.length * 48 * 5,
  );
  const o = new T.Object3D(),
    up = new T.Vector3(0, 1, 0);
  shrubs.forEach((s, i) => {
    for (let k = 0; k < 7; k++) {
      const a = k * 2.399,
        r = 0.25 + rand() * 0.65,
        v = new T.Vector3(
          Math.cos(a) * r,
          s.h * (0.55 + rand() * 0.2),
          Math.sin(a) * r,
        );
      o.position.set(s.x + v.x / 2, s.y + v.y / 2, s.z + v.z / 2);
      o.quaternion.setFromUnitVectors(up, v.clone().normalize());
      o.scale.set(1, v.length(), 1);
      o.updateMatrix();
      stems.setMatrixAt(i * 7 + k, o.matrix);
    }
    for (let k = 0; k < cards; k++) {
      const a = rand() * Math.PI * 2,
        r = Math.sqrt(rand()),
        level = rand(),
        width = 1.9 * Math.sqrt(1 - Math.pow(level - 0.35, 2));
      o.position.set(
        s.x + Math.cos(a) * r * width,
        s.y + 0.18 + level * s.h,
        s.z + Math.sin(a) * r * 1.15,
      );
      o.rotation.set((rand() - 0.5) * 1.8, a, (rand() - 0.5) * 1.2);
      const size = 0.62 + rand() * 0.4;
      o.scale.set(size, size, 1);
      o.updateMatrix();
      leaves.setMatrixAt(i * cards + k, o.matrix);
      leaves.setColorAt(
        i * cards + k,
        new T.Color().setHSL(
          0.22 + rand() * 0.04,
          0.24 + rand() * 0.12,
          0.52 + rand() * 0.2,
        ),
      );
    }
  });
  leaves.castShadow =
    leaves.receiveShadow =
    stems.castShadow =
    stems.receiveShadow =
      true;
  scene.add(stems, leaves);
  // Clustered purple flowers observed in June 2024 at EAG-009..012.
  // Flower locations vary within each reference-led planting run, not surveyed individual blooms.
  flowering.forEach((s, i) => {
    for (let k = 0; k < 48; k++) {
      const a = rand() * Math.PI * 2,
        level = 0.18 + rand() * 0.8,
        r = 1.3 + rand() * 0.4;
      const cx = s.x + Math.cos(a) * r,
        cy = s.y + 0.18 + level * s.h,
        cz = s.z + Math.sin(a) * r * 0.64;
      for (let n = 0; n < 5; n++) {
        const t = (n * Math.PI * 2) / 5;
        o.position.set(cx + Math.cos(t) * 0.055, cy + Math.sin(t) * 0.055, cz);
        o.rotation.set(0.25, a, t);
        o.scale.set(0.055, 0.065, 0.012);
        o.updateMatrix();
        petals.setMatrixAt((i * 48 + k) * 5 + n, o.matrix);
      }
    }
  });
  petals.castShadow = false;
  petals.receiveShadow = true;
  scene.add(petals);
}
