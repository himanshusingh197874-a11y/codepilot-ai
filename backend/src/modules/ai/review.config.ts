export const IGNORED_PATHS = [
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  'coverage/',
  '.turbo/',
  '.vercel/',
];

export const IGNORED_FILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];

export function shouldIgnoreFile(path: string): boolean {
  return (
    IGNORED_PATHS.some((p) => path.includes(p)) ||
    IGNORED_FILES.some((f) => path.endsWith(f))
  );
}