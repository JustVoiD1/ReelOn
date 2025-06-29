'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Pause, Home, Search, Plus, Video, User } from 'lucide-react';
import { IVideo } from '@/models/video';

interface ReelsPlayerProps {
  video: IVideo;
  isActive: boolean;
  index: number;
  globalMuted?: boolean;
}

const ReelsPlayer: React.FC<ReelsPlayerProps> = ({ video, isActive, index, globalMuted = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(globalMuted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleLike = () => {
    console.log("Liked");
    
  }
  const handleComment = () => {
    console.log("Commented");
    
  }
  const handleShare = () => {
    console.log("Share triggered");
    
  }
  const handleOpt = () => {
    console.log("Options triggered");
    
  }
  

  // Update muted state when global muted changes
  useEffect(() => {
    setIsMuted(globalMuted);
    const video = videoRef.current;
    if (video) {
      video.muted = globalMuted;
    }
  }, [globalMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      // Reset video to beginning when it becomes active
      video.currentTime = 0;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error('Error playing video:', e);
        setHasError(true);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      console.log('Video loaded successfully');
    };

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
      // Loop the video
      video.currentTime = 0;
      video.play();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // Reset to beginning when manually playing
      video.currentTime = 0;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error('Error playing video:', e);
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
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p>Failed to load video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        preload="metadata"
        loop
        onClick={() => setShowControls(!showControls)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isLoading && !isPlaying && isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-black/50 text-white p-6 rounded-full hover:bg-black/70 transition-all"
          >
            <Play className="w-8 h-8 ml-1" fill="white" />
          </button>
        </div>
      )}

      {/* Right Side Action Buttons */}
      <div className="absolute right-4 bottom-25 flex flex-col items-center space-y-6 z-10">
        {/* Like */}
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform" onClick={handleLike}>
          <div className="bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors">
            <Heart className="w-6 h-6" />
          </div>
          <span className="text-xs mt-1 font-semibold">170K</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform " onClick={handleComment}>
          <div className="bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs mt-1 font-semibold">164</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform" onClick={handleShare}>
          <div className="bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors">
            <Share className="w-6 h-6" />
          </div>
        </button>

        {/* Options (3 dots) */}
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform" onClick={handleOpt}>
          <div className="bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </div>
        </button>

       
        
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-20 left-4 right-20 z-10 text-white">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                U
              </span>
            </div>
            <span className="text-white text-sm font-medium">@user</span>
            <button className="px-4 py-1 border border-white rounded-lg text-xs font-medium hover:bg-white hover:text-black transition-colors">
              Follow
            </button>
          </div>
          <h3 className="font-bold text-lg line-clamp-2">{video.title}</h3>
          <p className="text-sm opacity-90 line-clamp-3">{video.description}</p>
          <div className="text-xs opacity-75 mt-2">
            Follow @user for daily memes ...
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelsPlayer;
