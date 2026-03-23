export type AppTab = 'training' | 'samples' | 'settings' | 'models';

// ... 保持原有 DefectType, LineType 定义 ...
export enum DefectType {
  SCRATCH = 'SCRATCH', 
  SOLDERING = 'SOLDERING', 
  DEBRIS = 'DEBRIS' 
}

export enum LineType {
  WIRELESS = 'WIRELESS', 
  OPTICAL = 'OPTICAL' 
}

export enum SampleStatus {
  LABELED = 'LABELED', 
  UNLABELED = 'UNLABELED' 
}

// [新增] 工序枚举
export enum ProcessType {
  SPI = 'SPI',          // 锡膏检测
  PRE_REFLOW = 'PRE_REFLOW', // 炉前
  POST_REFLOW = 'POST_REFLOW', // 炉后
  DIP = 'DIP',          // 插件后
  SMT = 'SMT'           // SMT通用
}

// [新增] 设备品牌枚举
export enum DeviceBrand {
  VCTA = 'VCTA',       // 奔创
  SAKI = 'SAKI',       // Saki
  SHENZHOU = 'SHENZHOU', // 神州
  JUTZE = 'JUTZE',     // 矩子
  KOH_YOUNG = 'KOH_YOUNG' // Kyoung
}

export interface Sample {
  id: string;
  filename: string;
  thumbnailUrl: string;
  line: LineType;
  process: ProcessType; // [新增]
  device: DeviceBrand;  // [新增]
  defects: DefectType[];
  status: SampleStatus;
  uploadDate: string;
}

// [新增] 数据集接口
export interface Dataset {
  id: string;
  name: string;
  count: number;
  tags: string[]; // e.g., ["无线", "炉后"]
  creator: string;
  createDate: string;
  description?: string;
}

// ... 保持 GlobalClass, TerminalLog, AIModel 等其他接口不变 ...
export interface GlobalClass {
  id: number;
  name: string;
  code: string; 
  color: string;
}

export interface TerminalLog {
  id: number;
  text: string;
}

export interface ModelMetrics {
  precision: number;
  recall: number;
  map50: number;
}

export interface TrainingResultRow {
  epoch: number;
  trainBoxLoss: number;
  trainClsLoss: number;
  valPrecision: number;
  valRecall: number;
  valBgLoss: number;
}

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
}