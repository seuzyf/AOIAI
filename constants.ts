import { GlobalClass, Sample, Dataset, AIModel } from './types';

// 提供选项给前端组件使用
export const DEVICE_BRANDS = ['BENCHUANG', 'SAKI', 'SHENZHOU', 'JUTZE', 'KOH_YOUNG'];
export const PROCESS_TYPES = ['SPI', 'PRE_REFLOW', 'POST_REFLOW', 'DIP', 'SMT'];
export const LINE_TYPES = ['WIRELESS', 'OPTICAL'];

// Mock 基础数据省略（已迁移至后端统一管理），如果前端直接依赖这些变量也可以保留空数组或示例数据
export const GLOBAL_CLASSES: GlobalClass[] = [];
export const MOCK_SAMPLES: Sample[] = [];
export const MOCK_DATASETS: Dataset[] = [];

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

export const MOCK_MODELS: AIModel[] = [];