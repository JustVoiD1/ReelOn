'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { IVideo } from '@/models/video';
import ReelsPlayer from './ReelsPlayer';
import FileUpload from './FileUpload';
import { IKUploadResponse } from 'imagekitio-next/dist/types/components/IKUpload/props';
import { Plus, Home, ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface ReelsViewProps {
  onBackToHome: () => void;
  showUploadModal?: boolean;
  onCloseUpload?: () => void;
  onUploadComplete?: (response: IKUploadResponse, title: string, description: string) => void;
}

const ReelsView: React.FC<ReelsViewProps> = ({ 
  onBackToHome, 
  showUploadModal: externalShowUploadModal = false, 
  onCloseUpload, 
  onUploadComplete 
}) => {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(externalShowUploadModal);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Update local state when external prop changes
  useEffect(() => {
    setShowUploadModal(externalShowUploadModal);
  }, [externalShowUploadModal]);

  const handleUploadComplete = async (response: IKUploadResponse, title: string, description: string) => {
    try {
      const videoData = {
        title: title,
        description: description,
        videoUrl: response.url,
        thumbnailUrl: response.thumbnailUrl || response.url
      };

      const newVideo = await apiClient.createVideo(videoData);
      setVideos(prev => [newVideo, ...prev]);
      setShowUploadModal(false);
      
      // Call external handler if provided
      if (onUploadComplete) {
        onUploadComplete(response, title, description);
      }
      if (onCloseUpload) {
        onCloseUpload();
      }
    } catch (error) {
      console.error("Error creating video record:", error);
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await apiClient.getVideos();
        setVideos(data);
      } catch (error) {
        console.error("Error fetching videos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleScroll = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 800);

    const direction = e.deltaY > 0 ? 1 : -1;
    
    setCurrentVideoIndex(prevIndex => {
      const newIndex = prevIndex + direction;
      
      if (newIndex < 0) return 0;
      if (newIndex >= videos.length) return videos.length - 1;
      
      return newIndex;
    });
  }, [videos.length]);

  const handleTouchStart = useRef<number>(0);
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const startY = handleTouchStart.current;
    const currentY = touch.clientY;
    const diff = startY - currentY;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (isScrolling.current) return;
      
      isScrolling.current = true;
      
      setTimeout(() => {
        isScrolling.current = false;
      }, 800);

      const direction = diff > 0 ? 1 : -1;
      
      setCurrentVideoIndex(prevIndex => {
        const newIndex = prevIndex + direction;
        
        if (newIndex < 0) return 0;
        if (newIndex >= videos.length) return videos.length - 1;
        
        return newIndex;
      });
    }
  }, [videos.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse wheel events
    container.addEventListener('wheel', handleScroll, { passive: false });
    
    // Touch events
    const handleTouchStartEvent = (e: TouchEvent) => {
      handleTouchStart.current = e.touches[0].clientY;
    };
    
    container.addEventListener('touchstart', handleTouchStartEvent);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleScroll);
      container.removeEventListener('touchstart', handleTouchStartEvent);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleScroll, handleTouchMove]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentVideoIndex(prev => 
          prev < videos.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentVideoIndex(prev => prev > 0 ? prev - 1 : prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videos.length]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-8">
        <div className="text-6xl mb-6">📹</div>
        <h2 className="text-2xl font-bold mb-4 text-center">No Reels Yet</h2>
        <p className="text-gray-300 mb-8 text-center">Be the first to create an amazing reel!</p>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Your First Reel
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full bg-black overflow-hidden relative"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Reels</h1>
          <button
            onClick={() => setGlobalMuted(!globalMuted)}
            className={`p-2 rounded-full transition-colors ${
              globalMuted 
                ? 'bg-red-500/80 text-white hover:bg-red-600/80' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {globalMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Videos Container */}
      <div className="relative w-full h-full">
        {videos.map((video, index) => (
          <motion.div
            key={video._id?.toString() || index}
            className="absolute inset-0 w-fit mx-auto h-full"
            initial={{ 
              y: index === 0 ? 0 : '100%',
              opacity: index === 0 ? 1 : 0 
            }}
            animate={{ 
              y: index === currentVideoIndex ? 0 : 
                 index < currentVideoIndex ? '-100%' : '100%',
              opacity: index === currentVideoIndex ? 1 : 0 
            }}
            transition={{ 
              duration: 0.6, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
          >
            <ReelsPlayer
              video={video}
              isActive={index === currentVideoIndex}
              index={index}
              globalMuted={globalMuted}
            />
          </motion.div>
        ))}
      </div>

      {/* Video Progress Indicators */}
      {/* <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-2">
        {videos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentVideoIndex(index)}
            className={`w-1 h-8 rounded-full transition-all ${
              index === currentVideoIndex 
                ? 'bg-white' 
                : index < currentVideoIndex 
                  ? 'bg-white/50' 
                  : 'bg-white/20'
            }`}
          />
        ))}
      </div> */}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onClose={() => {
              setShowUploadModal(false);
              if (onCloseUpload) {
                onCloseUpload();
              }
            }}
            isModal={true}
          />
        )}
      </AnimatePresence>

      {/* Navigation Help */}
      {videos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 text-white text-center">
          <p className="text-xs opacity-70">Swipe up/down or use arrow keys to navigate</p>
        </div>
      )}
    </div>
  );
};

export default ReelsView;
