"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, File as FileIcon, Trash2, Download, LogOut, Loader2, FileText, Image as ImageIcon, Video, Music, Archive, LayoutGrid, List, X, Key, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type FileData = {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploaderName: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderName', 'Web User');

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchFiles();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(files.filter(f => f.id !== id));
      }
    } catch (error) {
      console.error(error);
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
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleChange}
              disabled={uploading}
            />
            <div className="py-20 px-10 text-center flex flex-col items-center justify-center">
              <div className={`w-20 h-20 rounded-full mb-6 flex items-center justify-center transition-transform duration-300 ${dragActive ? 'scale-110 bg-indigo-500/20' : 'bg-white/5 group-hover:scale-110'}`}>
                {uploading ? (
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                ) : (
                  <CloudUpload className={`w-10 h-10 ${dragActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                )}
              </div>
              <h3 className="text-2xl font-semibold mb-2">
                {uploading ? 'Uploading...' : 'Drag & Drop your files here'}
              </h3>
              <p className="text-gray-500">
                or click to browse from your computer
              </p>
            </div>
          </div>
        </motion.div>

        {/* Files List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-3">
              Your Files
              <span className="text-sm font-normal text-gray-500 bg-white/10 px-3 py-1 rounded-full">
                {files.length}
              </span>
            </h2>
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
                      ? "group bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col transition-all duration-300 hover:bg-white/[0.07]"
                      : "group bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:bg-white/[0.07]"}
                  >
                    <div className={viewMode === 'grid' ? "flex items-start justify-between mb-4" : "flex items-center gap-4 flex-1"}>
                      <div className="p-3 bg-black/30 rounded-xl shrink-0">
                        {getFileIcon(file.mimeType)}
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
