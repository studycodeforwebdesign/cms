"use client";

import { useState, useEffect, useRef } from "react";
import { uploadImage, listStorageImages, deleteStorageImage } from "@/lib/supabase";
import { MediaFile } from "@/lib/types";
import {
    X, Upload, Trash2, Check, Loader2, Search, Image as ImageIcon, Copy
} from "lucide-react";

interface MediaLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    bucket?: string;
}

export default function MediaLibrary({ isOpen, onClose, onSelect, bucket = 'post-images' }: MediaLibraryProps) {
    const [images, setImages] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) loadImages();
    }, [isOpen]);

    async function loadImages() {
        setLoading(true);
        const data = await listStorageImages(bucket);
        setImages(data);
        setLoading(false);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        setUploading(true);
        for (const file of Array.from(files)) {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} quá lớn (tối đa 5MB)`);
                continue;
            }
            await uploadImage(file, bucket);
        }
        await loadImages();
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleDelete(fileName: string) {
        if (!confirm('Xóa ảnh này?')) return;
        const success = await deleteStorageImage(fileName, bucket);
        if (success) {
            setImages(images.filter(img => img.name !== fileName));
            if (selectedImage === fileName) setSelectedImage(null);
        }
    }

    const filteredImages = images.filter(img =>
        img.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function formatFileSize(bytes: number) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Thư viện ảnh</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{images.length} ảnh</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleUpload} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {uploading ? 'Đang tải...' : 'Upload'}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm ảnh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Image Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 mb-2">Chưa có ảnh nào</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm text-gray-900 font-medium hover:text-emerald-600 transition-colors"
                            >
                                Upload ảnh đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {filteredImages.map((img) => (
                                <div
                                    key={img.name}
                                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 transition-all ${selectedImage === img.url
                                        ? 'border-gray-900 ring-2 ring-gray-900/20'
                                        : 'border-transparent hover:border-gray-300'
                                        }`}
                                    onClick={() => setSelectedImage(img.url)}
                                >
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                                    {selectedImage === img.url && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-[10px] truncate">{img.name}</p>
                                        <p className="text-white/70 text-[9px]">{formatFileSize(img.size)}</p>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(img.name); }}
                                        className="absolute top-2 left-2 p-1.5 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {selectedImage && (
                    <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img src={selectedImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            <p className="text-sm text-gray-600 truncate">{selectedImage.split('/').pop()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { navigator.clipboard.writeText(selectedImage); }}
                                className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                            >
                                <Copy size={14} />
                                Copy URL
                            </button>
                            <button
                                onClick={() => { onSelect(selectedImage); onClose(); }}
                                className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Chọn ảnh
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
