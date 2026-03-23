export type AppTab = 'training' | 'samples' | 'datasets' | 'models' | 'settings';

export interface Annotation {
  id: string;
  label: string;
  bbox: { x: number, y: number, width: number, height: number };
}

export interface Sample {
  id: string;
  filename: string;
  thumbnailUrl: string;
  line: string;
  process: string;
  device: string;
  defects: string[];
  annotations?: Annotation[];
  status: string;
  uploadDate: string;
}

export interface Dataset {
  id: string;
  name: string;
  count: number;
  tags: string[];
  lines?: string[];
  processes?: string[];
  devices?: string[];
  creator: string;
  createDate: string;
  version?: string;
  description?: string;
  sampleIds?: string[];
}

export interface GlobalClass { 
  id: number; 
  name: string; 
  code: string; 
  color: string; 
}

export interface TerminalLog { id: number; text: string; }
export interface ModelMetrics { precision: number; recall: number; map50: number; }
export interface TrainingResultRow { epoch: number; trainBoxLoss: number; trainClsLoss: number; valPrecision: number; valRecall: number; valBgLoss: number; }

export interface AIModel {
  id: string;
  name: string;
  uploader: string;
  target: string;
  metrics: ModelMetrics;
  uploadDate: string;
  description: string;
  version: string;
  size: string;
  csvData: TrainingResultRow[];
  chartUrl: string;
  filePath?: string;
}