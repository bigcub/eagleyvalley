export type ReviewSpot = {
  x: number;
  z: number;
  y: number;
  heading: number;
  mode: string;
  road: string;
};
export type ReviewFlag = ReviewSpot & {
  id: string;
  comment: string;
  version: string;
  createdAt: string;
};
export const FLAG_STORAGE = 'eagley-review-flags-v1';
export function isReviewFlag(v: unknown): v is ReviewFlag {
  if (!v || typeof v !== 'object') return false;
  const f = v as ReviewFlag;
  return (
    ['id', 'comment', 'version', 'createdAt', 'mode', 'road'].every(
      (k) => typeof (f as any)[k] === 'string',
    ) && ['x', 'y', 'z', 'heading'].every((k) => Number.isFinite((f as any)[k]))
  );
}
export function exportFlags(flags: ReviewFlag[]) {
  return [
    'EAGLEY VALLEY — LOCATION FEEDBACK',
    'Please add these comments to the project TODO list.',
    'Coordinates: metres, X east / Z south, origin 53.6138, -2.428. Bird-mode flags mark the ground directly below the player.',
    '',
    ...flags.map(
      (f, i) =>
        `${i + 1}. Flag ${f.id}\nWorld v${f.version} · ${f.createdAt}\nX ${f.x.toFixed(1)}, Z ${f.z.toFixed(1)} · ground Y ${f.y.toFixed(1)}\nLatitude ${(53.6138 - f.z / 111320).toFixed(6)}, longitude ${(-2.428 + f.x / (111320 * Math.cos((53.6138 * Math.PI) / 180))).toFixed(6)}\nHeading ${f.heading.toFixed(0)}° · ${f.mode} · ${f.road}\nComment: ${f.comment}\n`,
    ),
  ].join('\n');
}
