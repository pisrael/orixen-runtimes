import * as fs from 'fs/promises';
import * as path from 'path';
import { FileSystem } from './FileSystem';
import { CopyOptions, ListOptions, FileInfo } from './types';

export class NodeFileSystem implements FileSystem {
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
  }

  private resolvePath(filePath: string): string {
    return path.isAbsolute(filePath) ? filePath : path.join(this.basePath, filePath);
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(this.resolvePath(filePath), 'utf-8');
  }

  async writeFile(filePath: string, contents: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, contents, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.rm(this.resolvePath(filePath), { recursive: true, force: true });
  }

  async sendToTrash(filePath: string): Promise<void> {
    await this.deleteFile(filePath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(dirPath: string, recursive: boolean = true): Promise<void> {
    await fs.mkdir(this.resolvePath(dirPath), { recursive });
  }

  async list(dirPath: string, options?: ListOptions): Promise<FileInfo[]> {
    const fullPath = this.resolvePath(dirPath);
    const results: FileInfo[] = [];

    const listRecursive = async (currentPath: string, relativeTo: string): Promise<void> => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(relativeTo, entryPath);

        const fileInfo: FileInfo = {
          path: relativePath,
          name: entry.name,
          isFile: entry.isFile(),
          isDirectory: entry.isDirectory(),
        };

        if (options?.onlyFiles && !entry.isFile()) continue;
        if (options?.onlyDirectories && !entry.isDirectory()) continue;

        results.push(fileInfo);

        if (options?.recursive && entry.isDirectory()) {
          await listRecursive(entryPath, relativeTo);
        }
      }
    };

    await listRecursive(fullPath, fullPath);
    return results;
  }

  async copy(source: string, destination: string, options?: CopyOptions): Promise<void> {
    const sourcePath = this.resolvePath(source);
    const destPath = this.resolvePath(destination);

    const stat = await fs.lstat(sourcePath);

    if (stat.isSymbolicLink()) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await this.copySymlink(sourcePath, destPath);
      return;
    }

    if (stat.isFile()) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(sourcePath, destPath);
      return;
    }

    await this.copyDirectory(sourcePath, destPath, options);
  }

  async move(source: string, destination: string): Promise<void> {
    const sourcePath = this.resolvePath(source);
    const destPath = this.resolvePath(destination);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.rename(sourcePath, destPath);
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  basename(filePath: string): string {
    return path.basename(filePath);
  }

  resolve(...paths: string[]): string {
    return path.resolve(this.basePath, ...paths);
  }

  private async copyDirectory(source: string, destination: string, options?: CopyOptions): Promise<void> {
    await fs.mkdir(destination, { recursive: true });

    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (this.shouldExclude(sourcePath, options?.exclude)) {
        continue;
      }

      if (entry.isSymbolicLink()) {
        await this.copySymlink(sourcePath, destPath);
      } else if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath, options);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  private async copySymlink(sourcePath: string, destPath: string): Promise<void> {
    const linkTarget = await fs.readlink(sourcePath);
    await fs.symlink(linkTarget, destPath);
  }

  private shouldExclude(filePath: string, patterns?: string[]): boolean {
    if (!patterns || patterns.length === 0) return false;

    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of patterns) {
      if (this.matchPattern(normalizedPath, pattern)) {
        return true;
      }
    }

    return false;
  }

  private matchPattern(filePath: string, pattern: string): boolean {
    const normalizedPattern = pattern.replace(/\\/g, '/');

    if (normalizedPattern.includes('**')) {
      const parts = normalizedPattern.split('**');

      if (parts.length === 2) {
        return this.matchDoubleStarPattern(filePath, parts[0], parts[1]);
      }

      if (parts.length === 3) {
        return this.matchWrappedDoubleStarPattern(filePath, parts[0], parts[1], parts[2]);
      }
    }

    if (normalizedPattern.startsWith('*')) {
      return filePath.endsWith(normalizedPattern.slice(1));
    }

    return filePath.includes(normalizedPattern);
  }

  private matchDoubleStarPattern(filePath: string, prefix: string, suffix: string): boolean {
    const prefixMatch = !prefix || filePath.includes(prefix.replace(/\/$/, ''));
    const suffixMatch = !suffix || filePath.endsWith(suffix.replace(/^\//, ''));
    return prefixMatch && suffixMatch;
  }

  private matchWrappedDoubleStarPattern(
    filePath: string,
    prefix: string,
    middle: string,
    suffix: string
  ): boolean {
    const prefixMatch = !prefix || filePath.includes(prefix.replace(/\/$/, ''));
    const suffixMatch = !suffix || filePath.endsWith(suffix.replace(/^\//, ''));
    const segment = middle.replace(/^\//, '').replace(/\/$/, '');
    const segmentMatch = filePath.includes('/' + segment + '/') || filePath.endsWith('/' + segment);
    return prefixMatch && suffixMatch && segmentMatch;
  }
}
