export type AppTab = 'training' | 'samples' | 'settings';

export enum DefectType {
  SCRATCH = 'SCRATCH', // 划痕
  SOLDERING = 'SOLDERING', // 开焊
  DEBRIS = 'DEBRIS' // 异物
}

export enum LineType {
  WIRELESS = 'WIRELESS', // 无线产线
  OPTICAL = 'OPTICAL' // 光电产线
}

export enum SampleStatus {
  LABELED = 'LABELED', // 已标注
  UNLABELED = 'UNLABELED' // 未标注
}

export interface Sample {
  id: string;
  filename: string;
  thumbnailUrl: string;
  line: LineType;
  defects: DefectType[];
  status: SampleStatus;
  uploadDate: string;
}

export interface GlobalClass {
  id: number;
  name: string;
  code: string; // Internal code like 'SCRATCH'
  color: string;
}

export interface TerminalLog {
  id: number;
  text: string;
}

export interface TrainingConfig {
  scenario: 'detection' | 'classification' | 'segmentation';
  hardware: 'gpu' | 'cpu';
  dataset: string;
  intensity: 'fast' | 'standard' | 'deep';
  imgSize: 320 | 640;
  engineerMode: boolean;
  augmentation: {
    rotation: boolean;
    mosaicProb: number;
  };
  hyperparameters: {
    learningRate: number;
    optimizer: string;
  };
}
