import { DefectType, GlobalClass, LineType, Sample, SampleStatus, ProcessType, DeviceBrand, Dataset, AIModel } from './types';

// ... 保持 GLOBAL_CLASSES 不变 ...
export const GLOBAL_CLASSES: GlobalClass[] = [
  { id: 101, name: '划痕 (Scratch)', code: DefectType.SCRATCH, color: 'bg-red-500' },
  { id: 102, name: '开焊 (Soldering)', code: DefectType.SOLDERING, color: 'bg-yellow-500' },
  { id: 103, name: '异物 (Debris)', code: DefectType.DEBRIS, color: 'bg-orange-500' },
];

// 更新 Sample Mock 数据，增加 process 和 device
export const MOCK_SAMPLES: Sample[] = [
  {
    id: 'PCB-001',
    filename: 'PCB_Layer1_001.jpg',
    thumbnailUrl: '/images/1 (1).jpg',
    line: LineType.WIRELESS,
    process: ProcessType.POST_REFLOW,
    device: DeviceBrand.VCTA,
    defects: [DefectType.SCRATCH],
    status: SampleStatus.LABELED,
    uploadDate: '2023-10-26',
  },
  {
    id: 'PCB-002',
    filename: 'PCB_Layer1_002.jpg',
    thumbnailUrl: '/images/1 (2).jpg',
    line: LineType.OPTICAL,
    process: ProcessType.PRE_REFLOW,
    device: DeviceBrand.KOH_YOUNG,
    defects: [],
    status: SampleStatus.UNLABELED,
    uploadDate: '2023-10-26',
  },
  {
    id: 'PCB-003',
    filename: 'PCB_Layer2_015.jpg',
    thumbnailUrl: '/images/1 (3).jpg',
    line: LineType.WIRELESS,
    process: ProcessType.SMT,
    device: DeviceBrand.SAKI,
    defects: [DefectType.SOLDERING, DefectType.DEBRIS],
    status: SampleStatus.LABELED,
    uploadDate: '2023-10-25',
  },
  {
    id: 'PCB-004',
    filename: 'PCB_Layer1_018.jpg',
    thumbnailUrl: '/images/1 (4).jpg',
    line: LineType.OPTICAL,
    process: ProcessType.DIP,
    device: DeviceBrand.JUTZE,
    defects: [DefectType.SCRATCH],
    status: SampleStatus.UNLABELED,
    uploadDate: '2023-10-25',
  },
  {
    id: 'PCB-005',
    filename: 'PCB_Final_099.jpg',
    thumbnailUrl: '/images/1 (5).jpg',
    line: LineType.WIRELESS,
    process: ProcessType.POST_REFLOW,
    device: DeviceBrand.SHENZHOU,
    defects: [],
    status: SampleStatus.UNLABELED,
    uploadDate: '2023-10-24',
  },
   {
    id: 'PCB-006',
    filename: 'PCB_Raw_102.jpg',
    thumbnailUrl: '/images/1 (6).jpg',
    line: LineType.OPTICAL,
    process: ProcessType.SPI,
    device: DeviceBrand.KOH_YOUNG,
    defects: [DefectType.DEBRIS],
    status: SampleStatus.LABELED,
    uploadDate: '2023-10-24',
  },
];

// [新增] Mock Datasets
export const MOCK_DATASETS: Dataset[] = [
  { id: 'ds-001', name: '2026-无线产线-划痕专项', count: 500, tags: ['无线', '划痕', '炉后'], creator: '周工程师', createDate: '2023-10-25', description: '包含最近一周VCTA设备采集的划痕样本' },
  { id: 'ds-002', name: '2026-全量测试集-Verified', count: 1200, tags: ['全产线', '多缺陷'], creator: '王研究员', createDate: '2023-10-20' },
  { id: 'ds-003', name: 'Saki设备-误报数据清洗', count: 150, tags: ['光电', 'Saki'], creator: '系统自动', createDate: '2023-10-18' },
  { id: 'ds-004', name: '10月第一周-炉前AOI数据', count: 320, tags: ['炉前', '未标注'], creator: '李工', createDate: '2023-10-08' },
];

export const TERMINAL_LOGS = [
  '> 正在加载数据集快照 [无线产线-划痕专项]...',
  '> 验证数据完整性... Hash校验通过 (MD5: 8d7a...)',
  '> 将数据库坐标转换为 YOLO 物理格式 (.txt)...',
  '> 检测到目标硬件: CPU, 生成 requirements.txt (torch-cpu)...',
  '> 正在渲染 train.py 训练脚本...',
  '> 优化器配置: AdamW (lr=0.001)',
  '> 打包资源文件... 压缩比 34%',
  '> 构建完成 (Training_Package.zip).'
];

export const MOCK_MODELS: AIModel[] = [
  {
    id: 'm-001',
    name: 'YOLOv8-S-Wireless-V1',
    uploader: '周',
    target: '无线产线-划痕检测',
    version: 'v1.0.2',
    size: '24.5 MB',
    uploadDate: '2023-10-27',
    description: '基于 YOLOv8-Small 训练的基线模型，针对金属表面细微划痕进行了增强训练。',
    metrics: { precision: 92.5, recall: 88.3, map50: 94.1 },
    chartUrl: 'https://placehold.co/600x400/png?text=PR+Curve+Graph',
    csvData: [
      { epoch: 1, trainBoxLoss: 1.2, trainClsLoss: 2.5, valPrecision: 0.45, valRecall: 0.50, valBgLoss: 1.1 },
      { epoch: 10, trainBoxLoss: 0.8, trainClsLoss: 1.5, valPrecision: 0.65, valRecall: 0.70, valBgLoss: 0.9 },
      { epoch: 50, trainBoxLoss: 0.3, trainClsLoss: 0.5, valPrecision: 0.92, valRecall: 0.88, valBgLoss: 0.4 },
    ]
  },
  {
    id: 'm-002',
    name: 'Optical-Solder-Net',
    uploader: '王',
    target: '光电-开焊缺陷',
    version: 'v2.1.0-beta',
    size: '45.1 MB',
    uploadDate: '2023-10-25',
    description: '针对高反光环境下的开焊检测模型，使用了 Mosaic 增强。',
    metrics: { precision: 85.4, recall: 78.2, map50: 82.0 },
    chartUrl: 'https://placehold.co/600x400/png?text=Confusion+Matrix',
    csvData: []
  },
  {
    id: 'm-003',
    name: 'Debris-Fast-Detector',
    uploader: '系统自动',
    target: '通用-异物检测',
    version: 'v0.9.5',
    size: '12.0 MB',
    uploadDate: '2023-10-20',
    description: '轻量级异物检测模型，适用于边缘设备快速推理。',
    metrics: { precision: 76.5, recall: 72.0, map50: 75.8 },
    chartUrl: 'https://placehold.co/600x400/png?text=F1+Score+Curve',
    csvData: []
  }
];