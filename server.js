import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import admZip from 'adm-zip';
import sizeOf from 'image-size';

const app = express();
app.use(cors());
app.use(express.json());

const BASE_DIR = 'D:\\AOIplatform';
const DB_DIR = path.join(BASE_DIR, 'db');           
const IMG_DIR = path.join(BASE_DIR, 'images');      
const MODEL_DIR = path.join(BASE_DIR, 'models');    
const DATASET_DIR = path.join(BASE_DIR, 'datasets'); 

[BASE_DIR, DB_DIR, IMG_DIR, MODEL_DIR, DATASET_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const readDB = (filename) => {
  const filepath = path.join(DB_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return []; }
};

const writeDB = (filename, data) => {
  fs.writeFileSync(path.join(DB_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
};

// 初始化数据库
if (!fs.existsSync(path.join(DB_DIR, 'samples.json'))) writeDB('samples.json', []);
if (!fs.existsSync(path.join(DB_DIR, 'models.json'))) writeDB('models.json', []);
if (!fs.existsSync(path.join(DB_DIR, 'datasets.json'))) writeDB('datasets.json', []);
if (!fs.existsSync(path.join(DB_DIR, 'classes.json'))) {
  writeDB('classes.json', [
    { id: 101, name: '划痕 (Scratch)', code: 'SCRATCH', color: '#ef4444' },
    { id: 102, name: '开焊 (Soldering)', code: 'SOLDERING', color: '#eab308' },
    { id: 103, name: '异物 (Debris)', code: 'DEBRIS', color: '#f97316' }
  ]);
}

app.use('/images', express.static(IMG_DIR));
app.use('/models', express.static(MODEL_DIR));

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMG_DIR),
  filename: (req, file, cb) => {
    const utf8Name = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, Date.now() + '-' + utf8Name);
  }
});
const uploadImage = multer({ storage: imageStorage });

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MODEL_DIR),
  filename: (req, file, cb) => {
    const utf8Name = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, Date.now() + '-model-' + utf8Name);
  }
});
const uploadModel = multer({ storage: modelStorage });


// ================= API 路由 =================
app.get('/api/classes', (req, res) => res.json(readDB('classes.json')));
app.post('/api/classes', (req, res) => {
  const classes = readDB('classes.json');
  const newClass = { id: Date.now(), ...req.body };
  classes.push(newClass);
  writeDB('classes.json', classes);
  res.json(newClass);
});
app.delete('/api/classes/:id', (req, res) => {
  let classes = readDB('classes.json');
  classes = classes.filter(c => String(c.id) !== req.params.id);
  writeDB('classes.json', classes);
  res.json({ success: true });
});

app.get('/api/samples', (req, res) => res.json(readDB('samples.json')));
app.delete('/api/samples/:id', (req, res) => {
  let samples = readDB('samples.json');
  samples = samples.filter(s => s.id !== req.params.id);
  writeDB('samples.json', samples);
  res.json({ success: true });
});

app.post('/api/samples/upload-batch', uploadImage.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files' });
  const { device, process, line } = req.body;
  const samples = readDB('samples.json');
  
  const newSamples = req.files.map(file => {
    const originalUtf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
    return {
      id: `PCB-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      filename: originalUtf8,
      thumbnailUrl: `/images/${file.filename}`,
      line: line || 'WIRELESS',
      process: process || 'SMT',
      device: device || 'BENCHUANG',
      defects: [], annotations: [],
      status: 'UNLABELED',
      uploadDate: new Date().toISOString().split('T')[0]
    };
  });
  
  samples.unshift(...newSamples);
  writeDB('samples.json', samples);
  res.json(newSamples);
});

app.post('/api/samples/upload-zip', uploadImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { device, process, line } = req.body;
  try {
    const zip = new admZip(req.file.path);
    const zipEntries = zip.getEntries();
    const images = {};
    const labels = {};

    zipEntries.forEach(entry => {
      if (entry.isDirectory) return;
      const ext = path.extname(entry.entryName).toLowerCase();
      if (['.jpg', '.png', '.jpeg'].includes(ext)) {
        images[entry.entryName] = entry;
      } else if (ext === '.txt') {
        labels[entry.entryName] = entry;
      }
    });

    const classes = readDB('classes.json');
    const samples = readDB('samples.json');
    let addedCount = 0;

    for (let imgName in images) {
      const entry = images[imgName];
      const newFilename = Date.now() + '-' + imgName.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const destPath = path.join(IMG_DIR, newFilename);
      fs.writeFileSync(destPath, entry.getData());

      let dim = { width: 800, height: 600 };
      try { dim = sizeOf(destPath); } catch(e) {}
      
      const baseName = path.parse(imgName).name;
      const labelName = baseName + '.txt';
      let annotations = [];
      let defects = [];

      if (labels[labelName] || labels[`obj_train_data/${labelName}`]) { 
        const txtEntry = labels[labelName] || labels[`obj_train_data/${labelName}`];
        const txt = txtEntry.getData().toString('utf8');
        const lines = txt.split('\n').map(l => l.trim()).filter(l => l);
        
        lines.forEach((l, i) => {
          const parts = l.split(' ').map(Number);
          if (parts.length >= 5) {
            const [clsIndex, x_c, y_c, w, h] = parts;
            const clsObj = classes.find(c => c.id === clsIndex || classes.indexOf(c) === clsIndex) || classes[0];
            const labelCode = clsObj ? clsObj.code : `CLASS_${clsIndex}`;
            
            annotations.push({
              id: `ann-${Date.now()}-${i}`,
              label: labelCode,
              bbox: {
                x: (x_c - w/2) * dim.width,
                y: (y_c - h/2) * dim.height,
                width: w * dim.width,
                height: h * dim.height
              }
            });
          }
        });
        defects = [...new Set(annotations.map(a => a.label))];
      }

      samples.unshift({
        id: `PCB-ZIP-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        filename: imgName,
        thumbnailUrl: `/images/${newFilename}`,
        line: line || 'WIRELESS',
        process: process || 'SMT',
        device: device || 'BENCHUANG',
        defects, annotations,
        status: annotations.length > 0 ? 'LABELED' : 'UNLABELED',
        uploadDate: new Date().toISOString().split('T')[0]
      });
      addedCount++;
    }

    writeDB('samples.json', samples);
    fs.unlinkSync(req.file.path); 
    res.json({ success: true, count: addedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'ZIP 解析失败' });
  }
});

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

app.post('/api/datasets/create', (req, res) => {
  const { name, sampleIds, version, date } = req.body;
  const datasets = readDB('datasets.json');
  const samples = readDB('samples.json').filter(s => sampleIds.includes(s.id));
  
  const ds = {
    id: `ds-${Date.now()}`,
    name,
    count: sampleIds.length,
    tags: [...new Set(samples.flatMap(s => s.defects))],
    lines: [...new Set(samples.map(s => s.line))],
    processes: [...new Set(samples.map(s => s.process))],
    devices: [...new Set(samples.map(s => s.device))],
    creator: '当前用户',
    createDate: date || new Date().toISOString().split('T')[0],
    version: version || 'v1.0',
    sampleIds
  };
  
  datasets.unshift(ds);
  writeDB('datasets.json', datasets);
  res.json(ds);
});

app.get('/api/datasets', (req, res) => res.json(readDB('datasets.json')));
app.post('/api/datasets/delete', (req, res) => {
  const { ids } = req.body;
  let datasets = readDB('datasets.json');
  datasets = datasets.filter(d => !ids.includes(d.id));
  writeDB('datasets.json', datasets);
  res.json({ success: true });
});

// 新增：打包下载数据集 ZIP
app.get('/api/datasets/:id/download', (req, res) => {
  const datasets = readDB('datasets.json');
  const samples = readDB('samples.json');
  const classes = readDB('classes.json');

  const ds = datasets.find(d => d.id === req.params.id);
  if (!ds) return res.status(404).json({ error: '数据集不存在' });

  const zip = new admZip();
  const dsSamples = samples.filter(s => ds.sampleIds.includes(s.id));

  // 写入 classes.txt
  const classesText = classes.map(c => c.code).join('\n');
  zip.addFile('classes.txt', Buffer.from(classesText, 'utf8'));

  // 遍历样本提取图片和生成对应坐标文件
  dsSamples.forEach(sample => {
    const imgFilename = path.basename(sample.thumbnailUrl);
    const imgPath = path.join(IMG_DIR, imgFilename);
    let imgDim = { width: 1, height: 1 };
    
    if (fs.existsSync(imgPath)) {
       zip.addLocalFile(imgPath, 'images');
       try { imgDim = sizeOf(imgPath); } catch(e) {}
    }

    const baseName = path.parse(sample.filename).name;
    let labelContent = '';
    (sample.annotations || []).forEach(ann => {
      const clsIdx = classes.findIndex(c => c.code === ann.label);
      if (clsIdx > -1) {
        const x_c = (ann.bbox.x + ann.bbox.width / 2) / imgDim.width;
        const y_c = (ann.bbox.y + ann.bbox.height / 2) / imgDim.height;
        const w = ann.bbox.width / imgDim.width;
        const h = ann.bbox.height / imgDim.height;
        
        const norm = (val) => Math.max(0, Math.min(1, val)).toFixed(6);
        labelContent += `${clsIdx} ${norm(x_c)} ${norm(y_c)} ${norm(w)} ${norm(h)}\n`;
      }
    });
    zip.addFile(`labels/${baseName}.txt`, Buffer.from(labelContent, 'utf8'));
  });

  const zipBuffer = zip.toBuffer();
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(ds.name)}.zip`);
  res.send(zipBuffer);
});

app.get('/api/models', (req, res) => res.json(readDB('models.json')));
app.post('/api/models/upload', uploadModel.single('file'), (req, res) => {
  const { name, target, desc } = req.body;
  const models = readDB('models.json');
  const newModel = { id: `m-${Date.now()}`, name, uploader: '当前用户', target, version: 'v1.0.0', size: req.file ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB` : '未知大小', uploadDate: new Date().toISOString().split('T')[0], description: desc, filePath: req.file ? req.file.path : null, metrics: { precision: 85, recall: 80, map50: 88 }, chartUrl: 'https://placehold.co/600x400/png?text=Generated+PR+Curve', csvData: [] };
  models.unshift(newModel);
  writeDB('models.json', models);
  res.json(newModel);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));