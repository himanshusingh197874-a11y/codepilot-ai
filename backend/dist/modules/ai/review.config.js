"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IGNORED_FILES = exports.IGNORED_PATHS = void 0;
exports.shouldIgnoreFile = shouldIgnoreFile;
exports.IGNORED_PATHS = [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '.turbo/',
    '.vercel/',
];
exports.IGNORED_FILES = [
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
];
function shouldIgnoreFile(path) {
    return (exports.IGNORED_PATHS.some((p) => path.includes(p)) ||
        exports.IGNORED_FILES.some((f) => path.endsWith(f)));
}
