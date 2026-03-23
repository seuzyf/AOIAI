import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// 1. 定义 D 盘本地存储路径，并按功能分类
const BASE_DIR = 'D:\\AOIplatform';
const DB_DIR = path.join(BASE_DIR, 'db');           
const IMG_DIR = path.join(BASE_DIR, 'images');      
const MODEL_DIR = path.join(BASE_DIR, 'models');    
const DATASET_DIR = path.join(BASE_DIR, 'datasets'); 

// 确保所有目录存在
[BASE_DIR, DB_DIR, IMG_DIR, MODEL_DIR, DATASET_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 2. JSON 数据库辅助函数
const readDB = (filename) => {
  const filepath = path.join(DB_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return []; }
};

const writeDB = (filename, data) => {
  fs.writeFileSync(path.join(DB_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
};

// 初始化空数据库
if (!fs.existsSync(path.join(DB_DIR, 'samples.json'))) writeDB('samples.json', []);
if (!fs.existsSync(path.join(DB_DIR, 'models.json'))) writeDB('models.json', []);
if (!fs.existsSync(path.join(DB_DIR, 'datasets.json'))) writeDB('datasets.json', []);

// 3. 静态文件服务
app.use('/images', express.static(IMG_DIR));
app.use('/models', express.static(MODEL_DIR));

// 4. 配置 Multer 文件上传
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMG_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Buffer.from(file.originalname, 'latin1').toString('utf8'))
});
const uploadImage = multer({ storage: imageStorage });

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MODEL_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-model-' + Buffer.from(file.originalname, 'latin1').toString('utf8'))
});
const uploadModel = multer({ storage: modelStorage });

// ================= API 路由 =================

// 【样本】获取列表
app.get('/api/samples', (req, res) => {
  res.json(readDB('samples.json'));
});

// 【样本】上传真实的图片
app.post('/api/samples/upload', uploadImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const samples = readDB('samples.json');
  const newSample = {
    id: `PCB-${Date.now()}`,
    filename: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
    // 使用相对路径，Vite 会代理到后端，最终返回 D 盘的图片
    thumbnailUrl: `/images/${req.file.filename}`,
    line: 'WIRELESS',
    process: 'SMT',
    device: 'VCTA',
    defects: [],       
    annotations: [],   
    status: 'UNLABELED',
    uploadDate: new Date().toISOString().split('T')[0]
  };
  
  samples.unshift(newSample);
  writeDB('samples.json', samples);
  res.json(newSample);
});

// 【样本】保存真实坐标标注
app.put('/api/samples/:id/annotate', (req, res) => {
  const { annotations } = req.body;
  const samples = readDB('samples.json');
  const sampleIndex = samples.findIndex(s => s.id === req.params.id);
  
  if (sampleIndex > -1) {
    samples[sampleIndex].annotations = annotations;
    samples[sampleIndex].defects = [...new Set(annotations.map(a => a.label))];
    samples[sampleIndex].status = annotations.length > 0 ? 'LABELED' : 'UNLABELED';
    writeDB('samples.json', samples);
    res.json(samples[sampleIndex]);
  } else {
    res.status(404).json({ error: 'Sample not found' });
  }
});

// 【模型】获取列表
app.get('/api/models', (req, res) => {
  res.json(readDB('models.json'));
});

// 【模型】上传模型文件
app.post('/api/models/upload', uploadModel.single('file'), (req, res) => {
  const { name, target, desc } = req.body;
  const models = readDB('models.json');
  
  const newModel = {
    id: `m-${Date.now()}`,
    name: name,
    uploader: '当前用户',
    target: target,
    version: 'v1.0.0',
    size: req.file ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB` : '未知大小',
    uploadDate: new Date().toISOString().split('T')[0],
    description: desc,
    filePath: req.file ? req.file.path : null,
    metrics: { precision: 85, recall: 80, map50: 88 },
    chartUrl: 'https://placehold.co/600x400/png?text=Generated+PR+Curve',
    csvData: []
  };

  models.unshift(newModel);
  writeDB('models.json', models);
  res.json(newModel);
});

// 【数据集】获取列表
app.get('/api/datasets', (req, res) => {
  res.json(readDB('datasets.json'));
});

// 【数据集】合并
app.post('/api/datasets/merge', (req, res) => {
  const { newName, selectedIds } = req.body;
  const datasets = readDB('datasets.json');
  
  const selected = datasets.filter(d => selectedIds.includes(d.id));
  const totalCount = selected.reduce((acc, curr) => acc + curr.count, 0);
  const allTags = Array.from(new Set(selected.flatMap(d => d.tags)));
  
  const newDataset = {
    id: `ds-${Date.now()}`,
    name: newName,
    count: totalCount,
    tags: [...allTags, '合并'],
    creator: '当前用户',
    createDate: new Date().toISOString().split('T')[0],
    description: `由 ${selected.map(d => d.name).join(', ')} 合并而成`
  };
  
  datasets.unshift(newDataset);
  writeDB('datasets.json', datasets);
  res.json(newDataset);
});

// 【数据集】删除
app.post('/api/datasets/delete', (req, res) => {
  const { ids } = req.body;
  let datasets = readDB('datasets.json');
  datasets = datasets.filter(d => !ids.includes(d.id));
  writeDB('datasets.json', datasets);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
  console.log(`Data Directory: ${BASE_DIR}`);
});