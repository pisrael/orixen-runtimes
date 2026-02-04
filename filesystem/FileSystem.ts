import { CopyOptions, ListOptions, FileInfo } from './types';

export interface FileSystem {
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  sendToTrash(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;

  // Directory operations
  mkdir(path: string, recursive?: boolean): Promise<void>;
  list(path: string, options?: ListOptions): Promise<FileInfo[]>;
  copy(source: string, destination: string, options?: CopyOptions): Promise<void>;
  move(source: string, destination: string): Promise<void>;

  // Path utilities
  join(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string): string;
  resolve(...paths: string[]): string;
}
