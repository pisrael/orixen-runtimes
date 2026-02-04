export interface CopyOptions {
  exclude?: string[];
}

export interface ListOptions {
  recursive?: boolean;
  onlyFiles?: boolean;
  onlyDirectories?: boolean;
}

export interface FileInfo {
  path: string;
  name: string;
  isFile: boolean;
  isDirectory: boolean;
}
