import { spawn } from 'node:child_process';
export function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: options.cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => {
            const text = String(chunk);
            stdout += text;
            if (!options.quiet)
                process.stdout.write(text);
        });
        child.stderr.on('data', (chunk) => {
            const text = String(chunk);
            stderr += text;
            if (!options.quiet)
                process.stderr.write(text);
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0)
                resolve({ stdout, stderr });
            else
                reject(new Error(`${command} exited with code ${code}\n${stderr}`));
        });
    });
}
//# sourceMappingURL=process.js.map