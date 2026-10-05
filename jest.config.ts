/**
 * Console Ninja (extensión de VS Code) reescribe archivos dentro de
 * node_modules para engancharse. En algún momento dejó
 * `jest-runner/build/testWorker.js` reducido a su propio hook de 602 bytes:
 * el worker de Jest quedó sin exportar `worker`, así que en paralelo cada
 * suite moría con "Cannot read properties of undefined (reading 'apply')" y
 * Jest las reintentaba sin fin. En banda no se notaba porque ese archivo ni
 * se carga — de ahí que el --runInBand pareciera "la forma de correrlo".
 *
 * Se arregló reinstalando node_modules. Esta línea es el seguro para que no
 * vuelva a instrumentar: cubre cualquier forma de invocar Jest (pnpm test,
 * npx jest, el runner del editor) y los workers la heredan del padre.
 *
 * Si algún día las suites vuelven a fallar en paralelo con ese TypeError:
 *   grep -rl "wallabyjs.console-ninja" node_modules
 * y si aparece algo, `rm -rf node_modules && pnpm install --frozen-lockfile`.
 */
process.env.NINJA_ENV = 'parentDisabled';

export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
        '^@/(.*)$': '<rootDir>/src/$1',
        // Paquetes ESM que Jest no puede transformar desde node_modules.
        '^@react-pdf/renderer$': '<rootDir>/__mocks__/reactPdfMock.js',
    },
    transform: {
        // ts-jest envuelto para que entienda `import.meta.env` de Vite.
        '^.+\\.tsx?$': '<rootDir>/jest/viteEnvTransformer.cjs',
    },
};
