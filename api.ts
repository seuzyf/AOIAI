import { Sample, AIModel, Dataset, GlobalClass } from './types';

const API_BASE = '/api';

export const api = {
  // 分类与字典接口
  getClasses: (): Promise<GlobalClass[]> => fetch(`${API_BASE}/classes`).then(res => res.json()),
  addClass: (data: Partial<GlobalClass>): Promise<GlobalClass> => 
    fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  deleteClass: (id: string): Promise<{success: boolean}> => 
    fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' }).then(res => res.json()),

  // 样本接口
  getSamples: (): Promise<Sample[]> => fetch(`${API_BASE}/samples`).then(res => res.json()),
  
  uploadBatch: (files: FileList | File[], meta: any): Promise<Sample[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('device', meta.device);
    formData.append('process', meta.process);
    formData.append('line', meta.line);
    return fetch(`${API_BASE}/samples/upload-batch`, { method: 'POST', body: formData }).then(res => res.json());
  },

  uploadZip: (file: File, meta: any): Promise<{success: boolean, count: number}> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('device', meta.device);
    formData.append('process', meta.process);
    formData.append('line', meta.line);
    return fetch(`${API_BASE}/samples/upload-zip`, { method: 'POST', body: formData }).then(res => res.json());
  },

  deleteSample: (id: string): Promise<{success: boolean}> => 
    fetch(`${API_BASE}/samples/${id}`, { method: 'DELETE' }).then(res => res.json()),

  annotateSample: (id: string, annotations: any[]): Promise<Sample> => 
    fetch(`${API_BASE}/samples/${id}/annotate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annotations })
    }).then(res => res.json()),

  // 模型接口 
  getModels: (): Promise<AIModel[]> => fetch(`${API_BASE}/models`).then(res => res.json()),
  uploadModel: (data: { name: string, target: string, desc: string, file: File | null }): Promise<AIModel> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('target', data.target);
    formData.append('desc', data.desc);
    if (data.file) formData.append('file', data.file);
    return fetch(`${API_BASE}/models/upload`, { method: 'POST', body: formData }).then(res => res.json());
  },

  // 数据集接口
  getDatasets: (): Promise<Dataset[]> => fetch(`${API_BASE}/datasets`).then(res => res.json()),
  createDataset: (data: { name: string, sampleIds: string[], version: string, date: string }): Promise<Dataset> => 
    fetch(`${API_BASE}/datasets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  deleteDatasets: (ids: string[]): Promise<{success: boolean}> =>
    fetch(`${API_BASE}/datasets/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    }).then(res => res.json()),
};