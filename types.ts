export type AppTab = 'training' | 'samples' | 'settings' | 'models';

export enum DefectType {
  SCRATCH = 'SCRATCH', 
  SOLDERING = 'SOLDERING', 
  DEBRIS = 'DEBRIS' 
}

export enum LineType { WIRELESS = 'WIRELESS', OPTICAL = 'OPTICAL' }
export enum SampleStatus { LABELED = 'LABELED', UNLABELED = 'UNLABELED' }
export enum ProcessType { SPI = 'SPI', PRE_REFLOW = 'PRE_REFLOW', POST_REFLOW = 'POST_REFLOW', DIP = 'DIP', SMT = 'SMT' }
export enum DeviceBrand { BENCHUANG = 'BENCHUANG', SAKI = 'SAKI', SHENZHOU = 'SHENZHOU', JUTZE = 'JUTZE', KOH_YOUNG = 'KOH_YOUNG' }

export interface Annotation {
  id: string;
  label: string;
  bbox: { x: number, y: number, width: number, height: number };
}

export interface Sample {
  id: string;
  filename: string;
  thumbnailUrl: string;
  line: LineType;
  process: ProcessType;
  device: DeviceBrand;
  defects: string[];
  annotations?: Annotation[]; // 【新增】存储真实的画框坐标
  status: SampleStatus;
  uploadDate: string;
}

export interface Dataset {
  id: string;
  name: string;
  count: number;
  tags: string[];
  creator: string;
  createDate: string;
  description?: string;
}

export interface GlobalClass { id: number; name: string; code: string; color: string; }
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
  filePath?: string; // 【新增】展示真实文件路径
}