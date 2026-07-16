import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { AdvancedDiagnosticError, createCodeFrame } from './diagnostics.js';
const require = createRequire(import.meta.url);
const runtimePackages = [
    '@revideo/core',
    '@revideo/2d',
    '@revideo/renderer',
    '@revideo/ui',
    '@revideo/vite-plugin',
    'three',
    'flubber',
    'opentype.js',
    'postprocessing',
    'simplex-noise',
];
const relevantSemanticCodes = new Set([
    2300, // Duplicate identifier.
    2304, // Cannot find name.
    2305, // Module has no exported member.
    2307, // Cannot find module.
    2339, // Property does not exist.
    2440, // Import declaration conflicts with local declaration.
    2451, // Cannot redeclare block-scoped variable.
    2459, // Module declares name locally but does not export it.
    2503, // Cannot find namespace.
    2551, // Property does not exist; did you mean...
    2552, // Cannot find name; did you mean...
    2614, // Module has no exported member; did you mean default import...
    2694, // Namespace has no exported member.
    2724, // Module has no exported member; did you mean...
    2792, // Cannot find module under the selected module resolution.
]);
const virtualDeclarationsFile = resolve(dirname(fileURLToPath(import.meta.url)), '__ai_promo_asset_modules__.d.ts');
const virtualDeclarations = `
declare module '*.glsl' { const source: string; export default source; }
declare module '*.glsl?raw' { const source: string; export default source; }
declare module '*.css' { const classes: Record<string, string>; export default classes; }
declare module '*.svg' { const source: string; export default source; }
declare module '*.svg?raw' { const source: string; export default source; }
declare module '*.png' { const url: string; export default url; }
declare module '*.jpg' { const url: string; export default url; }
declare module '*.jpeg' { const url: string; export default url; }
declare module '*.webp' { const url: string; export default url; }
declare module '*.gif' { const url: string; export default url; }
declare module '*.mp4' { const url: string; export default url; }
declare module '*.webm' { const url: string; export default url; }
declare module '*.wav' { const url: string; export default url; }
declare module '*.mp3' { const url: string; export default url; }
declare module '*.woff' { const url: string; export default url; }
declare module '*.woff2' { const url: string; export default url; }
`;
function packageDirectory(name) {
    let current = dirname(require.resolve(name));
    while (!existsSync(join(current, 'package.json'))) {
        const parent = dirname(current);
        if (parent === current)
            throw new Error(`Could not locate package directory for ${name}`);
        current = parent;
    }
    return current;
}
function runtimePackagePaths() {
    const paths = {};
    for (const name of runtimePackages) {
        const directory = packageDirectory(name);
        paths[name] = [directory];
        paths[`${name}/*`] = [`${directory}/*`];
    }
    return paths;
}
function createVirtualCompilerHost(options) {
    const host = ts.createCompilerHost(options, true);
    const getSourceFile = host.getSourceFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    const readFile = host.readFile.bind(host);
    host.fileExists = (fileName) => fileName === virtualDeclarationsFile || fileExists(fileName);
    host.readFile = (fileName) => fileName === virtualDeclarationsFile ? virtualDeclarations : readFile(fileName);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
        if (fileName === virtualDeclarationsFile) {
            return ts.createSourceFile(fileName, virtualDeclarations, languageVersion, true, ts.ScriptKind.TS);
        }
        return getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };
    return host;
}
function diagnosticFile(projectFile, diagnostic) {
    if (!diagnostic.file || diagnostic.start === undefined)
        return {};
    const file = resolve(diagnostic.file.fileName);
    const location = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const line = location.line + 1;
    const column = location.character + 1;
    return {
        file,
        relativeFile: relative(dirname(projectFile), file) || file,
        line,
        column,
        codeFrame: createCodeFrame(diagnostic.file.text, line, column),
    };
}
function toAdvancedDiagnostic(projectFile, diagnostic) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const suggestion = /Did you mean ['“](.+?)['”]\??/i.exec(message)?.[1];
    return {
        stage: 'typecheck-preflight',
        severity: diagnostic.category === ts.DiagnosticCategory.Warning ? 'warning' : 'error',
        code: `TS${diagnostic.code}`,
        message,
        ...diagnosticFile(projectFile, diagnostic),
        ...(suggestion ? { suggestion: `Check whether '${suggestion}' is the intended name or export.` } : {}),
        helpTarget: 'tool:render_advanced_video',
    };
}
export function validateAdvancedProjectTypes(projectFileInput) {
    const startedAt = performance.now();
    const projectFile = resolve(projectFileInput);
    const projectRoot = dirname(projectFile);
    const options = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        jsxImportSource: '@revideo/2d/lib',
        baseUrl: projectRoot,
        paths: runtimePackagePaths(),
        noEmit: true,
        skipLibCheck: true,
        strict: false,
        noImplicitAny: false,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        allowArbitraryExtensions: true,
        resolveJsonModule: true,
        types: [],
    };
    const host = createVirtualCompilerHost(options);
    const program = ts.createProgram({ rootNames: [projectFile, virtualDeclarationsFile], options, host });
    const syntactic = program.getSyntacticDiagnostics();
    const semantic = program.getSemanticDiagnostics().filter((diagnostic) => relevantSemanticCodes.has(diagnostic.code));
    const diagnostics = [...syntactic, ...semantic]
        .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
        .map((diagnostic) => toAdvancedDiagnostic(projectFile, diagnostic));
    const filesChecked = program.getSourceFiles()
        .map((sourceFile) => resolve(sourceFile.fileName))
        .filter((file) => file !== virtualDeclarationsFile && !file.includes(`${sep}node_modules${sep}`) && /\.[cm]?[jt]sx?$/.test(file))
        .map((file) => relative(projectRoot, file) || file)
        .sort();
    return {
        valid: diagnostics.length === 0,
        projectFile,
        elapsedMs: Math.round((performance.now() - startedAt) * 10) / 10,
        filesChecked,
        diagnostics,
    };
}
export class AdvancedTypecheckError extends AdvancedDiagnosticError {
    validation;
    constructor(validation) {
        const report = {
            ok: false,
            phase: 'preflight',
            summary: `TypeScript name/import preflight failed before renderer startup (${validation.elapsedMs} ms).`,
            diagnostics: validation.diagnostics,
        };
        super(report);
        this.name = 'AdvancedTypecheckError';
        this.validation = validation;
    }
}
//# sourceMappingURL=typecheck.js.map