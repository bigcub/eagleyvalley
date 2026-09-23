import * as T from 'three';

// Interpreted from the user's frontage photos: exposed stems, clipped spiral
// foliage and tapered ochre pots. Individual plant dimensions remain estimated.
export function createPottedTopiary(
  batch: (g: T.BufferGeometry, m: T.Material) => void,
) {
  const clay = new T.MeshStandardMaterial({
    color: '#a58b50',
    roughness: 0.88,
  });
  const soil = new T.MeshStandardMaterial({ color: '#38392c', roughness: 1 });
  const bark = new T.MeshStandardMaterial({ color: '#746b4e', roughness: 1 });
  const leaves = ['#263b25', '#344b2c', '#405832'].map(
    (color) =>
      new T.MeshStandardMaterial({
        color,
        roughness: 0.96,
        side: T.DoubleSide,
      }),
  );
  const leaf = new T.CircleGeometry(1, 6);
  function stem(a: T.Vector3, b: T.Vector3, r: number) {
    const delta = b.clone().sub(a),
      g = new T.CylinderGeometry(r * 0.6, r, delta.length(), 5);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.normalize(),
      ),
    );
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    batch(g, bark);
  }
  return (x: number, y: number, z: number, id: number, pruned = false) => {
    let seed = (12931 + id * 127) >>> 0;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const pot = new T.CylinderGeometry(0.26, 0.18, 0.48, 20, 1, true);
    pot.translate(x, y + 0.24, z);
    batch(pot, clay);
    const earth = new T.CircleGeometry(0.237, 20);
    earth.rotateX(-Math.PI / 2);
    earth.translate(x, y + 0.435, z);
    batch(earth, soil);
    for (const [height, radius, tube] of [
      [0.46, 0.253, 0.024],
      [0.41, 0.249, 0.01],
      [0.035, 0.19, 0.013],
    ]) {
      const rim = new T.TorusGeometry(radius, tube, 5, 24);
      rim.rotateX(Math.PI / 2);
      rim.translate(x, y + height, z);
      batch(rim, clay);
    }
    if (pruned) {
      stem(
        new T.Vector3(x, y + 0.43, z),
        new T.Vector3(x + 0.02, y + 0.68, z),
        0.033,
      );
      stem(
        new T.Vector3(x, y + 0.53, z),
        new T.Vector3(x - 0.08, y + 0.61, z + 0.025),
        0.018,
      );
      return;
    }
    const h = 1.42 + rand() * 0.2,
      phase = rand() * 6.28;
    stem(
      new T.Vector3(x, y + 0.43, z),
      new T.Vector3(x + 0.025, y + 0.48 + h, z - 0.015),
      0.026,
    );
    for (let tier = 0; tier < 22; tier++) {
      const t = tier / 21,
        a = phase + t * Math.PI * 6,
        r = 0.16 * (1 - t * 0.55);
      const centre = new T.Vector3(
        x + Math.cos(a) * r,
        y + 0.58 + t * h,
        z + Math.sin(a) * r,
      );
      if (tier % 3 === 0)
        stem(new T.Vector3(x, y + 0.5 + t * h, z), centre, 0.009);
      for (let j = 0; j < 65; j++) {
        const angle = rand() * 6.28,
          rad = Math.sqrt(rand()) * (0.14 - t * 0.055);
        const g = leaf.clone();
        g.scale(0.014 + rand() * 0.009, 0.027 + rand() * 0.015, 1);
        g.rotateX(rand() * Math.PI);
        g.rotateY(rand() * 6.28);
        g.rotateZ(rand() * 6.28);
        g.translate(
          centre.x + Math.cos(angle) * rad,
          centre.y + (rand() - 0.5) * 0.13,
          centre.z + Math.sin(angle) * rad,
        );
        batch(g, leaves[j % leaves.length]);
      }
    }
  };
}
