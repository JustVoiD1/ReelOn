'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AutoPlayVideoPlayerProps {
  src: string;
  className?: string;
  muted?: boolean;
  threshold?: number; // Percentage of video that needs to be visible to start playing
}

const AutoPlayVideoPlayer: React.FC<AutoPlayVideoPlayerProps> = ({ 
  src, 
  className = "", 
  muted = true,
  threshold = 0.5 // 50% of video needs to be visible
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Intersection Observer to detect when video is in viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting && entry.intersectionRatio >= threshold;
          setIsInView(inView);
          
          const video = videoRef.current;
          if (!video) return;

          if (inView && !isPlaying) {
            // Video is in view, reset to beginning and start playing
            // video.currentTime = 0;
            video.play().then(() => {
              setIsPlaying(true);
            }).catch(e => {
              console.error('Error playing video:', e);
              setHasError(true);
            });
          } else if (!inView && isPlaying) {
            // Video is out of view, pause it
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: threshold,
        rootMargin: '0px'
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [threshold, isPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      console.log('Video loaded successfully');
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setHasError(true);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    const handleEnded = () => {
      // Loop the video when it ends
      video.currentTime = 0;
      if (isInView) {
        video.play();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [isInView]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(e => {
        console.error('Error playing video:', e);
        setHasError(true);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <div className="text-gray-400 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-sm">Error loading video</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        preload="metadata"
        loop
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isLoading && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
            <Play className="w-6 h-6 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && !isLoading && (
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
          </div>
          
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            {/* In-view indicator */}
            <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">
              {isInView ? 'Playing' : 'Paused'}
            </div>
          </div>
        </div>
      )}

      {/* Video progress indicator */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: '0%' }} // This could be enhanced with actual progress tracking
          />
        </div>
      )}
    </div>
  );
};

export default AutoPlayVideoPlayer;
