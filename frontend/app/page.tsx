"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, File as FileIcon, Trash2, Download, LogOut, Loader2, FileText, Image as ImageIcon, Video, Music, Archive, LayoutGrid, List, X, Key, Eye, CheckSquare, Square } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type FileData = {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploaderName: string | null;
};

type UploadTask = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-400" />;
  if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-purple-400" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-pink-400" />;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return <Archive className="w-8 h-8 text-orange-400" />;
  if (mimeType.includes('pdf') || mimeType.includes('text/')) return <FileText className="w-8 h-8 text-green-400" />;
  return <FileIcon className="w-8 h-8 text-gray-400" />;
};

export default function Dashboard() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<{apiUrl: string, accessKey: string} | null>(null);

  const router = useRouter();

  const fetchFiles = async () => {
    try {
      setError(null);
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else if (res.status === 503) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Unable to connect to the database. Please ensure the database service is running.");
      } else {
        setError("Unable to connect to the server. Please try again later.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setAppConfig(data))
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleUploads(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleUploads(Array.from(e.target.files));
    }
  };

  const handleMultipleUploads = (files: File[]) => {
    const newTasks: UploadTask[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadTasks(prev => [...prev, ...newTasks]);

    newTasks.forEach(task => {
      uploadSingleFile(task);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadSingleFile = (task: UploadTask) => {
    const formData = new FormData();
    formData.append('file', task.file);
    formData.append('uploaderName', 'Web User');

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, progress: percent } : t
        ));
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'success', progress: 100 } : t
        ));
        await fetchFiles();
        
        setTimeout(() => {
          setUploadTasks(prev => prev.filter(t => t.id !== task.id));
        }, 500);
      } else {
        setUploadTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'error' } : t
        ));
        alert(`อัปโหลดไฟล์ ${task.file.name} ไม่สำเร็จ`);
      }
    });

    xhr.addEventListener('error', () => {
      setUploadTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'error' } : t
      ));
      alert(`อัปโหลดไฟล์ ${task.file.name} ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ`);
    });

    const uploadUrl = appConfig ? `${appConfig.apiUrl}/files/upload` : '/api/files/upload';
    xhr.open('POST', uploadUrl);
    
    if (appConfig?.accessKey) {
      xhr.setRequestHeader('x-access-key', appConfig.accessKey);
    }
    
    xhr.send(formData);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(files.filter(f => f.id !== id));
        if (selectedFiles.has(id)) {
          const newSelected = new Set(selectedFiles);
          newSelected.delete(id);
          setSelectedFiles(newSelected);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} items?`)) return;
    
    try {
      // Run deletions in parallel
      await Promise.all(
        Array.from(selectedFiles).map(id => fetch(`/api/files/${id}`, { method: 'DELETE' }))
      );
      
      setFiles(files.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
    } catch (error) {
      console.error(error);
      alert('Error deleting some files');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const handleActionRequest = async (type: 'download' | 'preview', file: FileData) => {
    try {
      const res = await fetch(`/api/files/${file.id}/request-access`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();

        if (type === 'download') {
          window.open(data.url, '_blank');
        } else if (type === 'preview') {
          setPreviewUrl(data.url);
          setPreviewModalOpen(true);
        }
      } else {
        alert('Failed to get file access token');
      }
    } catch (error) {
      console.error(error);
      alert('Error requesting file access');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <CloudUpload className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Keep Files</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div 
            className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 ${
              dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleChange}
            />
            <div className="py-20 px-10 text-center flex flex-col items-center justify-center">
              <div className={`w-20 h-20 rounded-full mb-6 flex items-center justify-center transition-transform duration-300 ${dragActive ? 'scale-110 bg-indigo-500/20' : 'bg-white/5 group-hover:scale-110'}`}>
                <CloudUpload className={`w-10 h-10 ${dragActive ? 'text-indigo-400' : 'text-gray-400'}`} />
              </div>
              <h3 className="text-2xl font-semibold mb-2">
                Drag & Drop your files here
              </h3>
              <p className="text-gray-500">
                or click to browse from your computer
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upload Progress Area */}
        {uploadTasks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col gap-3"
          >
            <h3 className="text-lg font-semibold mb-4 text-white/80">Uploading Files ({uploadTasks.filter(t => t.status === 'uploading').length} remaining)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadTasks.map(task => (
                <div key={task.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3 truncate pr-4">
                      <div className={`p-2 rounded-lg ${task.status === 'error' ? 'bg-red-500/10' : task.status === 'success' ? 'bg-green-500/10' : 'bg-indigo-500/10'}`}>
                        {task.status === 'uploading' ? (
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                        ) : task.status === 'success' ? (
                          <CloudUpload className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-sm font-medium truncate text-gray-200">{task.file.name}</span>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${task.status === 'success' ? 'text-green-400' : task.status === 'error' ? 'text-red-400' : 'text-indigo-400'}`}>
                      {task.status === 'success' ? 'Done' : task.status === 'error' ? 'Failed' : `${task.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${task.status === 'error' ? 'bg-red-500' : task.status === 'success' ? 'bg-green-500' : 'bg-indigo-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Files List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold flex items-center gap-3">
                Your Files
                <span className="text-sm font-normal text-gray-500 bg-white/10 px-3 py-1 rounded-full">
                  {files.length}
                </span>
              </h2>
              
              {files.length > 0 && (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {selectedFiles.size === files.length ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    Select All
                  </button>
                  
                  {selectedFiles.size > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete ({selectedFiles.size})
                    </motion.button>
                  )}
                </div>
              )}
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error ? (
            <div className="text-center py-20 border border-red-500/20 rounded-3xl bg-red-500/5">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">Connection Error</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
              <button 
                onClick={() => { setLoading(true); fetchFiles(); }}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
              <FileIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">No files uploaded yet.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={viewMode === 'grid' 
                      ? `relative group bg-white/5 border ${selectedFiles.has(file.id) ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'} rounded-2xl p-5 flex flex-col transition-all duration-300`
                      : `group bg-white/5 border ${selectedFiles.has(file.id) ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'} rounded-2xl p-4 flex items-center gap-4 transition-all duration-300`}
                  >
                    <div className={viewMode === 'grid' ? "flex items-start justify-between mb-4" : "flex items-center gap-4 flex-1"}>
                      <div className="flex items-center gap-3 shrink-0">
                        <button 
                          onClick={() => toggleSelection(file.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {selectedFiles.has(file.id) ? (
                            <CheckSquare className="w-5 h-5 text-indigo-400" />
                          ) : (
                            <Square className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                          )}
                        </button>
                        <div className="p-3 bg-black/30 rounded-xl">
                          {getFileIcon(file.mimeType)}
                        </div>
                      </div>
                      
                      <div className={viewMode === 'grid' ? "hidden" : "flex-1 min-w-0"}>
                        <h4 className="font-medium text-gray-200 truncate mb-1" title={file.originalName}>
                          {file.originalName}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatBytes(file.size)}</span>
                          <span>{formatDistanceToNow(new Date(file.uploadDate), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className={`flex gap-2 ${viewMode === 'grid' ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        {file.mimeType.startsWith('image/') && (
                          <button
                            onClick={() => handleActionRequest('preview', file)}
                            className="p-2 hover:bg-indigo-500/20 rounded-lg text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Preview Image"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleActionRequest('download', file)}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {viewMode === 'grid' && (
                      <>
                        <h4 className="font-medium text-gray-200 truncate mb-1" title={file.originalName}>
                          {file.originalName}
                        </h4>
                        
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                          <span className="text-xs text-gray-500">
                            {formatBytes(file.size)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(file.uploadDate), { addSuffix: true })}
                          </span>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewModalOpen && previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setPreviewModalOpen(false)}
          >
            <button 
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
