import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import admZip from 'adm-zip';
import seven from 'node-7z';
import sevenBin from '7zip-bin';

const app = express();
app.use(cors());
app.use(express.json());

const BASE_DIR = 'D:\\AOIplatform';
const DB_DIR = path.join(BASE_DIR, 'db');           
const IMG_DIR = path.join(BASE_DIR, 'images');      
const MODEL_DIR = path.join(BASE_DIR, 'models');    
const DATASET_DIR = path.join(BASE_DIR, 'datasets'); 
const TEMP_DIR = path.join(BASE_DIR, 'temp');

[BASE_DIR, DB_DIR, IMG_DIR, MODEL_DIR, DATASET_DIR, TEMP_DIR].forEach(dir => {
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

const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
};

const getSevenBinPath = () => {
  if (process.platform === 'win32') {
    const full7z = 'C:\\Program Files\\7-Zip\\7z.exe';
    if (fs.existsSync(full7z)) return full7z;
  }
  return sevenBin.path7za;
};

const extractArchive = async (archivePath, destDir) => {
  const ext = path.extname(archivePath).toLowerCase();
  if (ext === '.zip') {
    const zip = new admZip(archivePath);
    zip.extractAllTo(destDir, true);
    return;
  }
  return new Promise((resolve, reject) => {
    const binPath = getSevenBinPath();
    const stream = seven.extractFull(archivePath, destDir, { $bin: binPath });
    stream.on('end', resolve);
    stream.on('error', (err) => {
      if (err.message.includes('Cannot open the file as archive') && ext === '.rar' && binPath === sevenBin.path7za) {
        reject(new Error('内置解压引擎不支持RAR5。请在服务器安装完整的 7-Zip 软件。'));
      } else {
        reject(err);
      }
    });
  });
};

// 提取共用的模型解析逻辑
const parseModelArchive = async (archivePath, targetModel) => {
  const tempExtractedDir = path.join(TEMP_DIR, `model-${Date.now()}`);
  fs.mkdirSync(tempExtractedDir, { recursive: true });
  
  try {
    await extractArchive(archivePath, tempExtractedDir);
    const allFiles = getAllFiles(tempExtractedDir);
    
    const bestPtPath = allFiles.find(f => f.endsWith('best.pt'));
    const argsPath = allFiles.find(f => f.endsWith('args.yaml'));
    const resultsPath = allFiles.find(f => f.endsWith('results.csv'));
    const prPath = allFiles.find(f => f.endsWith('PR_curve.png'));

    if (bestPtPath) {
       const destPtPath = path.join(MODEL_DIR, `${Date.now()}-best.pt`);
       fs.copyFileSync(bestPtPath, destPtPath);
       targetModel.filePath = destPtPath;
    }

    if (prPath) {
       const destPrPath = path.join(IMG_DIR, `${Date.now()}-pr_curve.png`);
       fs.copyFileSync(prPath, destPrPath);
       targetModel.chartUrl = `/images/${path.basename(destPrPath)}`;
    }

    if (argsPath) {
       const argsText = fs.readFileSync(argsPath, 'utf8');
       const argsObj = {};
       argsText.split('\n').forEach(line => {
          const [k, v] = line.split(':');
          if (k && v) argsObj[k.trim()] = v.trim();
       });
       targetModel.args = argsObj;
    }

    if (resultsPath) {
       const csvText = fs.readFileSync(resultsPath, 'utf8');
       const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
       if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim());
          const idxEpoch = headers.findIndex(h => h.includes('epoch'));
          const idxBoxLoss = headers.findIndex(h => h.includes('train/box_loss'));
          const idxClsLoss = headers.findIndex(h => h.includes('train/cls_loss'));
          const idxDflLoss = headers.findIndex(h => h.includes('train/dfl_loss'));
          const idxP = headers.findIndex(h => h.includes('metrics/precision'));
          const idxR = headers.findIndex(h => h.includes('metrics/recall'));
          const idxMap50 = headers.findIndex(h => h.includes('metrics/mAP50(B)'));

          const csvData = [];
          for(let i = Math.max(1, lines.length - 5); i < lines.length; i++) {
             const parts = lines[i].split(',').map(p => Number(p.trim()));
             csvData.push({
                epoch: parts[idxEpoch] || 0,
                trainBoxLoss: parts[idxBoxLoss] || 0,
                trainClsLoss: parts[idxClsLoss] || 0,
                trainDflLoss: parts[idxDflLoss] || 0,
                valPrecision: parts[idxP] || 0,
                valRecall: parts[idxR] || 0,
                valMap50: parts[idxMap50] || 0
             });
          }
          targetModel.csvData = csvData;
          
          const lastRow = csvData[csvData.length - 1];
          if (lastRow) {
             const p = lastRow.valPrecision > 1 ? lastRow.valPrecision : lastRow.valPrecision * 100;
             const r = lastRow.valRecall > 1 ? lastRow.valRecall : lastRow.valRecall * 100;
             const m50 = lastRow.valMap50 > 1 ? lastRow.valMap50 : lastRow.valMap50 * 100;
             targetModel.metrics = { precision: p || 0, recall: r || 0, map50: m50 || 0 };
          }
       }
    }
  } finally {
    if (fs.existsSync(tempExtractedDir)) {
      fs.rmSync(tempExtractedDir, { recursive: true, force: true });
    }
  }
};


// API 路由
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
      line: line || '无线',
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

app.post('/api/samples/upload-zip', uploadImage.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { device, process, line } = req.body;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.zip', '.rar', '.7z'].includes(ext)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: '仅支持 .zip, .rar, .7z 格式' });
  }

  const tempExtractedDir = path.join(TEMP_DIR, `samples-${Date.now()}`);
  fs.mkdirSync(tempExtractedDir, { recursive: true });

  try {
    await extractArchive(req.file.path, tempExtractedDir);
    const allFiles = getAllFiles(tempExtractedDir);
    const imageFiles = allFiles.filter(f => ['.jpg', '.png', '.jpeg'].includes(path.extname(f).toLowerCase()));
    const labelFiles = allFiles.filter(f => f.endsWith('.txt'));
    const classes = readDB('classes.json');
    const samples = readDB('samples.json');
    let addedCount = 0;

    for (let imgPath of imageFiles) {
      const imgName = path.basename(imgPath);
      const newFilename = Date.now() + '-' + imgName.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const destPath = path.join(IMG_DIR, newFilename);
      fs.copyFileSync(imgPath, destPath);

      let dim = { width: 800, height: 600 };
      try { dim = sizeOf(destPath); } catch(e) {}
      
      const baseName = path.parse(imgName).name;
      const labelPath = labelFiles.find(f => path.basename(f) === `${baseName}.txt`);
      let annotations = [];
      let defects = [];

      if (labelPath) {
        const txt = fs.readFileSync(labelPath, 'utf8');
        const lines = txt.split('\n').map(l => l.trim()).filter(l => l);
        lines.forEach((l, i) => {
          const parts = l.split(' ').map(Number);
          if (parts.length >= 5) {
            const [clsIndex, x_c, y_c, w, h] = parts;
            const clsObj = classes.find(c => c.id === clsIndex || classes.indexOf(c) === clsIndex) || classes[0];
            const labelCode = clsObj ? clsObj.code : `CLASS_${clsIndex}`;
            annotations.push({
              id: `ann-${Date.now()}-${i}`, label: labelCode,
              bbox: { x: (x_c - w/2) * dim.width, y: (y_c - h/2) * dim.height, width: w * dim.width, height: h * dim.height }
            });
          }
        });
        defects = [...new Set(annotations.map(a => a.label))];
      }

      samples.unshift({
        id: `PCB-ARCHIVE-${Date.now()}-${Math.floor(Math.random()*1000)}`, filename: imgName, thumbnailUrl: `/images/${newFilename}`,
        line: line || '无线', process: process || 'SMT', device: device || 'BENCHUANG',
        defects, annotations, status: annotations.length > 0 ? 'LABELED' : 'UNLABELED', uploadDate: new Date().toISOString().split('T')[0]
      });
      addedCount++;
    }

    writeDB('samples.json', samples);
    res.json({ success: true, count: addedCount });
  } catch (error) {
    res.status(500).json({ error: error.message || '压缩包解析失败' });
  } finally {
    if (fs.existsSync(tempExtractedDir)) fs.rmSync(tempExtractedDir, { recursive: true, force: true });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
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
  } else res.status(404).json({ error: 'Sample not found' });
});

app.post('/api/datasets/create', (req, res) => { 
  const { name, sampleIds, version, date, creator } = req.body;
  const datasets = readDB('datasets.json');
  const samples = readDB('samples.json').filter(s => sampleIds.includes(s.id));
  const ds = {
    id: `ds-${Date.now()}`, name, count: sampleIds.length,
    tags: [...new Set(samples.flatMap(s => s.defects))], lines: [...new Set(samples.map(s => s.line))],
    processes: [...new Set(samples.map(s => s.process))], devices: [...new Set(samples.map(s => s.device))],
    creator: creator || '当前用户', createDate: date || new Date().toISOString().split('T')[0],
    version: version || 'v1.0', sampleIds
  };
  datasets.unshift(ds); writeDB('datasets.json', datasets); res.json(ds);
});
app.get('/api/datasets', (req, res) => res.json(readDB('datasets.json')));
app.post('/api/datasets/delete', (req, res) => {
  const { ids } = req.body;
  let datasets = readDB('datasets.json');
  datasets = datasets.filter(d => !ids.includes(d.id));
  writeDB('datasets.json', datasets); res.json({ success: true });
});

app.get('/api/models', (req, res) => res.json(readDB('models.json')));

app.post('/api/models/upload', uploadModel.single('file'), async (req, res) => {
  const { name, target, desc, uploader } = req.body;
  const models = readDB('models.json');
  
  let newModel = { 
    id: `m-${Date.now()}`, name, uploader: uploader || '当前用户', target, version: 'v1.0.0', 
    size: req.file ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB` : '未知大小', 
    uploadDate: new Date().toISOString().split('T')[0], description: desc, 
    filePath: null, metrics: { precision: 0, recall: 0, map50: 0 }, chartUrl: null, csvData: [], args: {}
  };

  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (['.zip', '.rar', '.7z'].includes(ext)) {
      try {
        await parseModelArchive(req.file.path, newModel);
      } catch(e) {
        console.error("Archive parse error:", e);
      } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }
  }

  models.unshift(newModel);
  writeDB('models.json', models);
  res.json(newModel);
});

// 修改模型信息
app.put('/api/models/:id', (req, res) => {
  const { name, description } = req.body;
  const models = readDB('models.json');
  const idx = models.findIndex(m => m.id === req.params.id);
  
  if (idx > -1) {
    models[idx].name = name || models[idx].name;
    models[idx].description = description || models[idx].description;
    writeDB('models.json', models);
    res.json(models[idx]);
  } else {
    res.status(404).json({ error: 'Model not found' });
  }
});

// 更新模型文件 (重新解析并版本+1)
app.put('/api/models/:id/update-file', uploadModel.single('file'), async (req, res) => {
  const models = readDB('models.json');
  const idx = models.findIndex(m => m.id === req.params.id);
  
  if (idx === -1) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Model not found' });
  }

  let targetModel = models[idx];
  
  // 版本号递增逻辑 v1.0.0 -> v1.0.1
  let newVersion = targetModel.version;
  const match = newVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    newVersion = `v${match[1]}.${match[2]}.${parseInt(match[3]) + 1}`;
  } else {
    newVersion = newVersion + '.1';
  }
  
  targetModel.version = newVersion;
  targetModel.uploadDate = new Date().toISOString().split('T')[0];

  if (req.file) {
    targetModel.size = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (['.zip', '.rar', '.7z'].includes(ext)) {
      try {
        await parseModelArchive(req.file.path, targetModel);
      } catch(e) {
        console.error("Archive update parse error:", e);
        return res.status(500).json({ error: '模型文件解析失败' });
      } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }
  }

  models[idx] = targetModel;
  writeDB('models.json', models);
  res.json(targetModel);
});

// 删除模型
app.delete('/api/models/:id', (req, res) => {
  let models = readDB('models.json');
  models = models.filter(m => m.id !== req.params.id);
  writeDB('models.json', models);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
