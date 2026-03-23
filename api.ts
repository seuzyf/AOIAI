import { Sample, AIModel, Dataset } from './types';

// 直接使用相对路径，Vite 会自动代理到 http://localhost:3001
const API_BASE = '/api';

export const api = {
  // 样本接口
  getSamples: (): Promise<Sample[]> => fetch(`${API_BASE}/samples`).then(res => res.json()),
  uploadSample: (file: File): Promise<Sample> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/samples/upload`, { method: 'POST', body: formData }).then(res => res.json());
  },
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
  mergeDatasets: (newName: string, selectedIds: string[]): Promise<Dataset> => 
    fetch(`${API_BASE}/datasets/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName, selectedIds })
    }).then(res => res.json()),
  deleteDatasets: (ids: string[]): Promise<{success: boolean}> => 
    fetch(`${API_BASE}/datasets/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    }).then(res => res.json()),
};