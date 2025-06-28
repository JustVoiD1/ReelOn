'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { IVideo } from '@/models/video';
import React, { useEffect, useState } from 'react';
import FileUpload from './components/FileUpload';
import VideoPlayer from './components/VideoPlayer';
import { IKUploadResponse } from 'imagekitio-next/dist/types/components/IKUpload/props';
import { Plus, Heart, MessageCircle, Share2, User } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadComplete = async (response: IKUploadResponse, title: string, description: string) => {
    try {
      console.log('Upload completed:', response);
      console.log('Video URL:', response.url);
      console.log('Title:', title);
      console.log('Description:', description);
      
      // Create video record in the database
      const videoData = {
        title: title,
        description: description,
        videoUrl: response.url,
        thumbnailUrl: response.thumbnailUrl || response.url,
        transformation: {
          height: 1920,
          width: 1080,
          quality: 80
        }
      };

      console.log('Saving video data:', videoData);
      const newVideo = await apiClient.createVideo(videoData);
      console.log('Video saved:', newVideo);
      
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center"
              >
                <h1 className="text-2xl font-bold text-white">🎬 Reel-On</h1>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-4"
              >
                <Link
                  href="/login"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </motion.div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Share Your Stories
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                Through Reels
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Create, share, and discover amazing short videos. Join the community and express yourself through engaging reels.
            </p>
            
            <div className="space-y-4">
              <Link
                href="/register"
                className="inline-block bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors transform hover:scale-105"
              >
                Get Started
              </Link>
              <p className="text-white/60">
                Already have an account?{' '}
                <Link href="/login" className="text-white hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 grid md:grid-cols-3 gap-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold text-white mb-2">Create</h3>
              <p className="text-white/70">
                Record and edit stunning vertical videos with our intuitive tools.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold text-white mb-2">Share</h3>
              <p className="text-white/70">
                Share your creativity with the world and build your audience.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Discover</h3>
              <p className="text-white/70">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎬 Reel-On
              </h1>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session.user?.email}</span>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : videos.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No reels yet</h2>
            <p className="text-gray-600 mb-6">Be the first to share an amazing reel!</p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Reel
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Reels</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video: IVideo, index: number) => (
                <motion.div
                  key={video._id?.toString() || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gray-200 flex items-center justify-center relative overflow-hidden rounded-t-lg">
                    {video.videoUrl ? (
                      <VideoPlayer
                        src={video.videoUrl}
                        className="w-full h-full"
                        autoPlay={false}
                        muted={true}
                      />
                    ) : (
                      <div className="text-gray-400">
                        <div className="text-4xl mb-2">🎬</div>
                        <p>Video Preview</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{video.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{video.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-4 text-gray-500">
                        <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                          <span>❤️</span>
                          <span className="text-sm">0</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                          <span>💬</span>
                          <span className="text-sm">0</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                          <span>🔗</span>
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

      {/* Floating Action Button for Create Reel */}
      {session && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all z-40"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

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
    </div>
  );
}