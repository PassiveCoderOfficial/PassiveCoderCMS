export interface BackupManifest {
  tenantId: string;
  tenantSlug: string;
  createdAt: string;
  version: string;
  tables: string[];
  imageCount: number;
}

export interface BackupSet {
  id: string;
  tenantId: string;
  createdAt: string;
  storagePath: string;
  sizeBytes: number;
  status: "running" | "complete" | "failed";
  files: BackupFile[];
}

export interface BackupFile {
  name: string;
  format: "json" | "csv" | "pdf" | "wxr" | "image";
  path: string;
  sizeBytes: number;
}
