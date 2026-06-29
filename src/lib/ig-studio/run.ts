/**
 * Server-only spawn helper for ig-studio Node scripts.
 * Spawns `node <args>` with cwd=ig-studio/ and captures stdout/stderr.
 * Safe to import from server actions and route handlers — never from client components.
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

const IG_STUDIO_CWD = resolve(process.cwd(), 'ig-studio');
const DEFAULT_TIMEOUT_MS = 60_000;

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Run a Node.js script inside ig-studio/.
 * @param args - Passed directly to `node`: e.g. ['--env-file=.env', 'src/caption.js', '--photo', 'umai_057']
 * @param opts - Optional timeout override (ms). Default 60 s.
 */
export function runIgStudio(
  args: string[],
  opts?: { timeoutMs?: number },
): Promise<RunResult> {
  return new Promise((resolve_, reject) => {
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const proc = spawn('node', args, {
      cwd: IG_STUDIO_CWD,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`runIgStudio timed out after ${timeoutMs}ms\nstderr: ${stderr}`));
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve_({ code: code ?? 1, stdout, stderr });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
