"use client" // This component must be a client component

import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";
import { Upload, Video, X, Loader2, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
    onUploadComplete?: (response: IKUploadResponse, title: string, description: string) => void;
    onClose?: () => void;
    isModal?: boolean;
}

// FileUpload component demonstrates file uploading using ImageKit's Next.js SDK.
const FileUpload = ({ onUploadComplete, onClose, isModal = false }: FileUploadProps) => {
    // State to keep track of the current upload progress (percentage)
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleStartUpload = () => {
        setUploading(true);
        setError(null);
        setProgress(0);
    };

    const handleProgress = (evt: ProgressEvent) => {
        const percentComplete = (evt.loaded / evt.total) * 100;
        setProgress(percentComplete);
    };

    const handleSuccess = (response: IKUploadResponse) => {
        console.log("Upload successful:", response);
        setUploading(false);
        setUploadSuccess(true);
        setError(null);
        
        // Call the callback if provided
        if (onUploadComplete) {
            onUploadComplete(response, title, description);
        }
        
        // Auto close after 2 seconds if it's a modal
        if (isModal) {
            setTimeout(() => {
                onClose?.();
            }, 2000);
        }
    };

    const validateFile = (file: File) => {
        // Reset error state
        setError(null);
        
        if (!file.type.startsWith("video/")) {
            setError("Please upload a video file");
            return false;
        }
        
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            setError("Video must be less than 100MB");
            return false;
        }
        
        // Additional video format validation
        const validVideoTypes = ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov"];
        if (!validVideoTypes.includes(file.type)) {
            setError("Please upload a valid video format (MP4, WebM, OGG, AVI, MOV)");
            return false;
        }
        
        return true;
    };

    const handleFileSelect = (file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file);
            
            // Create preview URL for video
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
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
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setProgress(0);
        setError(null);
        setUploadSuccess(false);
        setUploading(false);
        setTitle("");
        setDescription("");
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    };

    // Create a ref for the file input element to access its files easily
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create an AbortController instance to provide an option to cancel the upload if needed.
    const abortController = new AbortController();

    /**
     * Authenticates and retrieves the necessary upload credentials from the server.
     *
     * This function calls the authentication API endpoint to receive upload parameters like signature,
     * expire time, token, and publicKey.
     *
     * @returns {Promise<{signature: string, expire: string, token: string, publicKey: string}>} The authentication parameters.
     * @throws {Error} Throws an error if the authentication request fails.
     */
    const authenticator = async () => {
        try {
            // Perform the request to the upload authentication endpoint.
            const response = await fetch("/api/imagekit_auth");
            if (!response.ok) {
                // If the server response is not successful, extract the error text for debugging.
                const errorText = await response.text();
                throw new Error(`Request failed with status ${response.status}: ${errorText}`);
            }

            // Parse and destructure the response JSON for upload credentials.
            const data = await response.json();
            const { signature, expire, token, publicKey } = data;
            return { signature, expire, token, publicKey };
        } catch (error) {
            // Log the original error for debugging before rethrowing a new error.
            console.error("Authentication error:", error);
            throw new Error("Authentication request failed");
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select a file to upload");
            return;
        }

        if (!title.trim()) {
            setError("Please enter a title for your reel");
            return;
        }

        if (!description.trim()) {
            setError("Please enter a description for your reel");
            return;
        }

        if (!validateFile(selectedFile)) {
            return;
        }

        handleStartUpload();

        // Retrieve authentication parameters for the upload.
        let authParams;
        try {
            authParams = await authenticator();
        } catch (authError) {
            console.error("Failed to authenticate for upload:", authError);
            setError("Failed to authenticate for upload");
            setUploading(false);
            return;
        }
        
        const { signature, expire, token, publicKey } = authParams;

        // Call the ImageKit SDK upload function with the required parameters and callbacks.
        try {
            const uploadResponse = await upload({
                // Authentication parameters
                expire,
                token,
                signature,
                publicKey,
                file: selectedFile,
                fileName: selectedFile.name,
                // Progress callback to update upload progress state
                onProgress: (event) => {
                    setProgress((event.loaded / event.total) * 100);
                },
                // Abort signal to allow cancellation of the upload if needed.
                abortSignal: abortController.signal,
            });
            
            handleSuccess(uploadResponse as IKUploadResponse);
        } catch (error) {
            setUploading(false);
            // Handle specific error types provided by the ImageKit SDK.
            if (error instanceof ImageKitAbortError) {
                setError("Upload was cancelled");
            } else if (error instanceof ImageKitInvalidRequestError) {
                setError("Invalid request: " + error.message);
            } else if (error instanceof ImageKitUploadNetworkError) {
                setError("Network error: " + error.message);
            } else if (error instanceof ImageKitServerError) {
                setError("Server error: " + error.message);
            } else {
                setError("Upload failed: " + (error as Error).message);
            }
        }
    };

    const containerClass = isModal 
        ? "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-4"
        : "w-full max-w-2xl mx-auto";

    return (
        <div className={containerClass}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-2xl shadow-2xl ${isModal ? 'w-full max-w-sm xs:max-w-lg modal-mobile' : 'w-full'} relative overflow-hidden`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 xs:px-6 py-3 xs:py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 xs:w-5 xs:h-5" />
                            <h3 className="font-semibold text-sm xs:text-base">Upload Your Reel</h3>
                        </div>
                        {isModal && onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 xs:w-5 xs:h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 xs:p-6">
                    <AnimatePresence mode="wait">
                        {uploadSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-6 xs:py-8"
                            >
                                <CheckCircle2 className="w-12 h-12 xs:w-16 xs:h-16 text-green-500 mx-auto mb-3 xs:mb-4" />
                                <h4 className="text-lg xs:text-xl font-semibold text-gray-800 mb-2">Upload Successful!</h4>
                                <p className="text-gray-600 text-sm xs:text-base">Your reel has been uploaded successfully.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Upload Area */}
                                <div
                                    className={`border-2 border-dashed rounded-xl p-4 xs:p-8 text-center transition-all duration-200 ${
                                        dragActive
                                            ? 'border-purple-500 bg-purple-50'
                                            : selectedFile
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {selectedFile ? (
                                        <div className="space-y-3 xs:space-y-4">
                                            {previewUrl && (
                                                <video
                                                    src={previewUrl}
                                                    className="w-24 h-24 xs:w-32 xs:h-32 object-cover rounded-lg mx-auto"
                                                    controls={false}
                                                    muted
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm xs:text-base">{selectedFile.name}</p>
                                                <p className="text-xs xs:text-sm text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button
                                                onClick={resetUpload}
                                                className="text-xs xs:text-sm text-purple-600 hover:text-purple-700 transition-colors"
                                            >
                                                Choose different file
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 xs:w-12 xs:h-12 text-gray-400 mx-auto mb-3 xs:mb-4" />
                                            <h4 className="text-base xs:text-lg font-medium text-gray-800 mb-2">
                                                Drop your video here
                                            </h4>
                                            <p className="text-gray-500 mb-3 xs:mb-4 text-sm xs:text-base">
                                                or click to browse files
                                            </p>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="video/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleFileSelect(e.target.files[0]);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-gradient-to-br from-purple-600 via-pink-700 to-orange-600 hover:bg-pink-700 text-white px-4 xs:px-6 py-1.5 xs:py-2 rounded-lg font-medium transition-colors text-sm xs:text-base"
                                            >
                                                Browse Files
                                            </button>
                                            <p className="text-xs text-gray-400 mt-2">
                                                MP4, WebM, OGG, AVI, MOV up to 100MB
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Title and Description Form */}
                                {selectedFile && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6 space-y-4"
                                    >
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                                Title *
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Enter a catchy title for your reel"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                maxLength={100}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {title.length}/100 characters
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                                Caption *
                                            </label>
                                            <textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Write a caption that describes your reel..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                                                maxLength={500}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {description.length}/500 characters
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                                        >
                                            <p className="text-red-700 text-sm">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Progress Bar */}
                                <AnimatePresence>
                                    {uploading && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Uploading... {Math.round(progress)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className="h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Upload Button */}
                                {selectedFile && !uploading && title.trim() && description.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6"
                                    >
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            Upload Reel
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default FileUpload;