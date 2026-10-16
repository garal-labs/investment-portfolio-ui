import { readFile } from 'node:fs/promises'
import path from 'node:path'

const METODOLOGIA_PATH = path.join(process.cwd(), 'docs', 'metodologia-markowitz.md')

// Server-only: reads the analyst methodology document shown at /markowitz/metodologia.
export function readMetodologia(): Promise<string> {
  return readFile(METODOLOGIA_PATH, 'utf-8')
}
