'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { IVideo } from '@/models/video';
import React, { useEffect, useState } from 'react';
import FileUpload from './components/FileUpload';
import AutoPlayVideoPlayer from './components/AutoPlayVideoPlayer';
import ReelsView from './components/ReelsView';
import BottomNavigation from './components/BottomNavigation';
// import PlanLimitNotification from './components/PlanLimitNotification';
import { IKUploadResponse } from 'imagekitio-next/dist/types/components/IKUpload/props';
import { Plus, Play, Heart, MessageCircleIcon, Share2Icon } from 'lucide-react';
import { VideoFormData } from '@/lib/types';
import { checkLiked, likeVideo } from '@/lib/api-action-helpers';



export default function Home() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReelsView, setShowReelsView] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'reels'>('home');
  const [showPlanLimitNotification, setShowPlanLimitNotification] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [likingVideos, setLikingVideos] = useState<Set<string>>(new Set())

  const handleLike = async (videoId: string) => {
    if (!session?.user) {
      console.log('Login to continue')
      return;
    }

    if (likingVideos.has(videoId)) return;
    setLikingVideos(c => new Set(c).add(videoId))

    try {
      const result = await likeVideo(videoId)
      if (result.liked !== undefined) {
        setLikedVideos(c => {
          const newSet = new Set(c);
          if (result.liked) {
            newSet.add(videoId)
          }
          else {
            newSet.delete(videoId)
          }
          return newSet
        })


        setVideos(c => c.map(video =>
          video._id?.toString() === videoId
            ? {
              ...video,
              likesCount: result.liked
                ? (video.likesCount || 0) + 1
                : Math.max((video.likesCount || 0) - 1, 0)
            }
            : video
        ));

      }
    } catch (err) {
      console.error('Error liking video: ', err)
    } finally {
      setLikingVideos(c => {
        const newSet = new Set(c)
        newSet.delete(videoId)
        return newSet
      })
    }
  }


  useEffect(() => {
    const checkLikeStatuses = async () => {
      if (session?.user && videos.length > 0) {
        const likeStatuses = await Promise.all(
          videos.map(async (video) => {
            if (video._id) {
              try {
                const result = await checkLiked(video._id.toString());
                return { videoId: video._id.toString(), isLiked: result.isLiked };
              } catch (err) {
                console.error('Error checking like status:', err);
                return { videoId: video._id.toString(), isLiked: false };
              }
            }
            return null;
          })
        );

        const likedVideoIds = likeStatuses
          .filter(status => status?.isLiked)
          .map(status => status!.videoId);

        setLikedVideos(new Set(likedVideoIds));
      }
    };

    checkLikeStatuses();
  }, [session, videos]);




  // Handle upload attempt - show notification and then allow upload
  const handleUploadAttempt = () => {
    setShowPlanLimitNotification(true);
    setShowUploadModal(true);
    // Auto-hide notification after 8 seconds
    setTimeout(() => {
      setShowPlanLimitNotification(false);
    }, 15000);
  };

  const handleUploadComplete = async (response: IKUploadResponse, title: string, description: string) => {
    try {
      // console.log('Upload completed:', response);
      // console.log('Video URL:', response.url);
      // console.log('Title:', title);
      // console.log('Description:', description);

      // Create video record in the database
      const videoData: VideoFormData = {
        title: title,
        description: description,
        videoUrl: response.url,
        thumbnailUrl: response.thumbnailUrl || response.url
      };

      // console.log('Saving video data:', videoData);
      const newVideo = await apiClient.createVideo(videoData);
      // console.log('Video saved:', newVideo);

      setVideos(prev => [newVideo, ...prev]);
      setShowUploadModal(false);
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

    if (session) {
      fetchVideos();
    } else {
      setLoading(false);
    }
  }, [session]);

  // Show Reels View
  if ((showReelsView || currentView === 'reels') && session) {
    return (
      <>
        <ReelsView onBackToHome={() => {
          setShowReelsView(false);
          setCurrentView('home');
        }} />
        <BottomNavigation
          currentView="reels"
          onNavigate={(view) => {
            if (view === 'home') {
              setShowReelsView(false);
              setCurrentView('home');
            }
          }}
          onShowUpload={handleUploadAttempt}
        />
      </>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Unauthenticated landing page
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600">
        {/* Navigation */}
        <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex flex-col xs:flex-row justify-between items-center py-3 xs:py-4 gap-2 xs:gap-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center"
              >
                <h1 className="text-xl xs:text-2xl font-bold text-white">🎬 Reel-On</h1>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 xs:space-x-4"
              >


              </motion.div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-10 xs:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl xs:text-4xl md:text-6xl font-bold text-white mb-4 xs:mb-6 leading-tight">
              Share Your Stories
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                Through Reels
              </span>
            </h1>
            <p className="text-base xs:text-xl text-white/80 mb-6 xs:mb-8 max-w-3xl mx-auto px-2">
              Create, share, and discover amazing short videos. Join the community and express yourself through engaging reels.
            </p>

            <div className="space-y-3 xs:space-y-4">
              <Link
                href="/register"
                className="inline-block bg-white text-purple-600 hover:bg-gray-100 px-6 xs:px-8 py-2.5 xs:py-3 rounded-lg font-semibold text-base xs:text-lg transition-colors transform hover:scale-105"
              >
                Sign Up
              </Link>
              <p className="text-white/60 text-sm xs:text-base">
                Already have an account?{' '}

              </p>
            </div>
            <div className='my-2 mx-2'>
              <Link
                href="/login"
                className="bg-white text-black hover:text-orange-700 hover:bg-gray-100 px-4 xs:px-4 py-2 xs:py-4 rounded-lg transition-colors font-medium text-sm xs:text-base"
              >
                Sign in
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 xs:mt-20 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 xs:gap-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 xs:p-6 border border-white/20">
              <div className="text-2xl xs:text-3xl mb-3 xs:mb-4">🎬</div>
              <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Create</h3>
              <p className="text-white/70 text-sm xs:text-base">
                Record and edit stunning vertical videos with our intuitive tools.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 xs:p-6 border border-white/20">
              <div className="text-2xl xs:text-3xl mb-3 xs:mb-4">🌟</div>
              <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Share</h3>
              <p className="text-white/70 text-sm xs:text-base">
                Share your creativity with the world and build your audience.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 xs:p-6 border border-white/20 xs:col-span-2 md:col-span-1">
              <div className="text-2xl xs:text-3xl mb-3 xs:mb-4">🚀</div>
              <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Discover</h3>
              <p className="text-white/70 text-sm xs:text-base">
                Explore trending content and discover new creators daily.
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Authenticated user feed
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 xs:py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center"
            >
              <h1 className="text-xl xs:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎬 Reel-On
              </h1>
            </motion.div>

            <div className="flex items-center">
              <span className="text-gray-700 text-sm xs:text-base">
                Welcome, {(session.user as any)?.username || session.user?.email?.split('@')[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="ml-4 border-2 border-slate-300 px-2 py-2 rounded-lg text-gray-600 hover:text-white transition-colors text-sm xs:text-base hover:bg-red-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-4 xs:py-8 px-3 sm:px-4 lg:px-8 pb-20">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 xs:py-20 px-4"
          >
            <div className="text-4xl xs:text-6xl mb-3 xs:mb-4">📹</div>
            <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-2">No reels yet</h2>
            <p className="text-gray-600 mb-4 xs:mb-6 text-sm xs:text-base">Be the first to share an amazing reel!</p>
            <button
              onClick={handleUploadAttempt}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 xs:px-6 py-2.5 xs:py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto text-sm xs:text-base"
            >
              <Plus className="w-4 h-4 xs:w-5 xs:h-5" />
              Create Your First Reel
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6 xs:space-y-8">
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4 px-1">
              {/* <h2 className="text-xl xs:text-2xl font-bold text-gray-900">Latest Reels</h2> */}
              {videos.length > 0 && (
                <button
                  onClick={() => setShowReelsView(true)}
                  className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  <Play className="w-4 h-4" />
                  Latest Reels
                </button>
              )}
            </div>
            <div className="grid gap-4 xs:gap-6 grid-cols-1 sm:grid-cols-1 lg:grid-cols-1">
              {videos.map((video: IVideo, index: number) => (
                <motion.div
                  key={video._id?.toString() || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className=' sticky flex gap-2 justify-start  items-center bg-white  text-black py-3 px-4'>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {typeof video.creator === 'object' && (video.creator as any).username
                          ? (video.creator as any).username[0].toUpperCase()
                          : 'U'}
                      </span>
                    </div>
                    <span className="text-black text-sm font-semibold">{typeof video.creator === 'object' && (video.creator as any).username
                      ? (video.creator as any).username
                      : 'User'}</span>
                  </div>
                  <div className="aspect-video bg-gray-200 flex items-center justify-center relative overflow-hidden rounded-t-lg group cursor-pointer"
                    onClick={() => setShowReelsView(true)}>
                    {video.videoUrl ? (
                      <AutoPlayVideoPlayer
                        src={video.videoUrl}
                        className="w-full h-full"
                        muted={true}
                        threshold={0.6}
                      />
                    ) : (
                      <div className="text-gray-400">
                        <div className="text-4xl mb-2">🎬</div>
                        <p>Video Preview</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 xs:p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 text-lg xs:text-base line-clamp-1">{video.title}</h3>
                    <p className="text-gray-600 text-mdm xs:text-sm line-clamp-2">{video.description}</p>
                    <div className="flex items-center justify-between mt-2 xs:mt-3">
                      <div className="flex space-x-3 xs:space-x-4 text-gray-500">
                        <button className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                          onClick={() => handleLike(video._id?.toString() || '')}>
                          <span className="text-lg xs:text-base"><Heart
                            className={`transition-colors ${likedVideos.has(video._id?.toString() || '')
                              ? 'fill-red-500 text-red-500'
                              : 'fill-transparent hover:text-red-500'
                              }`}
                          /></span>
                          <span className="text-lg xs:text-sm">{video.likesCount}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-pink-500 transition-colors"

                        >
                          <span className="text-lg xs:text-base"><MessageCircleIcon /></span>
                          <span className="text-lg xs:text-sm">{video.commentsCount}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                          <span className="text-lg xs:text-base"><Share2Icon /></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'reels') {
            setShowReelsView(true);
          }
        }}
        onShowUpload={handleUploadAttempt}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onClose={() => setShowUploadModal(false)}
            isModal={true}
          />
        )}
      </AnimatePresence>

      {/* Plan Limit Notification */}
      {/* <PlanLimitNotification
        isVisible={showPlanLimitNotification}
        onClose={() => setShowPlanLimitNotification(false)}
      /> */}
    </div>
  );
}