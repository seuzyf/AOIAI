import { Sample, GlobalClass, TerminalLog, Dataset, AIModel } from './types';

const API_BASE = '/api';

export const api = {
  getClasses: async (): Promise<GlobalClass[]> => (await fetch(`${API_BASE}/classes`)).json(),
  addClass: async (data: Omit<GlobalClass, 'id'>) => {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteClass: async (id: number) => (await fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' })).json(),

  getSamples: async (): Promise<Sample[]> => (await fetch(`${API_BASE}/samples`)).json(),
  uploadBatch: async (files: FileList, meta: any) => {
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    Object.keys(meta).forEach(k => formData.append(k, meta[k]));
    const res = await fetch(`${API_BASE}/samples/upload-batch`, { method: 'POST', body: formData });
    return res.json();
  },
  uploadZip: async (file: File, meta: any) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(meta).forEach(k => formData.append(k, meta[k]));
    const res = await fetch(`${API_BASE}/samples/upload-zip`, { method: 'POST', body: formData });
    return res.json();
  },
  deleteSample: async (id: string) => (await fetch(`${API_BASE}/samples/${id}`, { method: 'DELETE' })).json(),
  annotateSample: async (id: string, annotations: any[]) => {
    const res = await fetch(`${API_BASE}/samples/${id}/annotate`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ annotations })
    });
    return res.json();
  },

  createDataset: async (data: any) => {
    const res = await fetch(`${API_BASE}/datasets/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    return res.json();
  },
  getDatasets: async (): Promise<Dataset[]> => (await fetch(`${API_BASE}/datasets`)).json(),
  deleteDatasets: async (ids: string[]) => {
    const res = await fetch(`${API_BASE}/datasets/delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids })
    });
    return res.json();
  },

  getModels: async (): Promise<AIModel[]> => (await fetch(`${API_BASE}/models`)).json(),
  uploadModel: async (data: { name: string; target: string; desc: string; uploader: string; file: File }) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('target', data.target);
    formData.append('desc', data.desc);
    formData.append('uploader', data.uploader);
    formData.append('file', data.file);
    const res = await fetch(`${API_BASE}/models/upload`, { method: 'POST', body: formData });
    return res.json();
  },
  updateModelInfo: async (id: string, data: { name: string; description: string }) => {
    const res = await fetch(`${API_BASE}/models/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    return res.json();
  },
  updateModelFile: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/models/${id}/update-file`, {
      method: 'PUT', body: formData
    });
    return res.json();
  },
  deleteModel: async (id: string) => {
    const res = await fetch(`${API_BASE}/models/${id}`, { method: 'DELETE' });
    return res.json();
  }
};
