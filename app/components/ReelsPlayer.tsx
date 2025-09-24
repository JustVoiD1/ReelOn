'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, X, HeartIcon } from 'lucide-react';
import { IVideo } from '@/models/video';
import { useSession } from 'next-auth/react';
import { addComment, checkCommentLiked, checkFollowing, checkLiked, followUser, getComments, likeComment, likeVideo, unfollowUser } from '@/lib/api-action-helpers';
import { IComment } from '@/models/comment';
import mongoose from 'mongoose';
type ObjectId = mongoose.Types.ObjectId;



interface IVideoWithPopulatedCreator extends Omit<IVideo, 'creator'> {
  creator: {
    _id: ObjectId;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
}
interface ReelsPlayerProps {
  video: IVideoWithPopulatedCreator;
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

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(video.likesCount || 0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [likeStatusChecked, setLikeStatusChecked] = useState(false)



  const [commentsCount, setCommentsCount] = useState(video.commentsCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<IComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({})
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({})
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set())


  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [followStatusChecked, setFollowStatusChecked] = useState(false)




  const { data: session } = useSession()


  const handleCommentLike = async (commentId: string) => {
    if (!session?.user) {
      alert('Please login to like comments');
      return;
    }

    if (likingComments.has(commentId)) return;

    setLikingComments(prev => new Set(prev).add(commentId));

    // Optimistic update
    const wasLiked = commentLikes[commentId] || false;
    const currentCount = commentLikeCounts[commentId] || 0;

    setCommentLikes(prev => ({
      ...prev,
      [commentId]: !wasLiked
    }));

    setCommentLikeCounts(prev => ({
      ...prev,
      [commentId]: wasLiked ? currentCount - 1 : currentCount + 1
    }));

    try {
      const result = await likeComment(commentId);
      if (result.liked !== undefined) {
        const originalCnt = comments.find(c => c._id?.toString() === commentId)?.likesCount || 0;
        const newCount = result.liked ? originalCnt + 1 : Math.max(originalCnt - 1, 0);

        setCommentLikes(prev => ({
          ...prev,
          [commentId]: result.liked
        }));

        setCommentLikeCounts(prev => ({
          ...prev,
          [commentId]: newCount
        }));

        // Update the comments array with new count
        setComments(prev => prev.map(comment =>
          comment._id?.toString() === commentId
            ? { ...comment, likesCount: newCount }
            : comment
        ));
      }
      else {
        // Revert on error
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: wasLiked
        }));
        setCommentLikeCounts(prev => ({
          ...prev,
          [commentId]: comments.find(c => c._id?.toString() === commentId)?.likesCount || 0
        }));
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      // Revert on error
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: wasLiked
      }));
      setCommentLikeCounts(prev => ({
        ...prev,
        [commentId]: comments.find(c => c._id?.toString() === commentId)?.likesCount || 0
      }));
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const checkCommentLikeStatus = async (commentId: string) => {
    if (!session?.user) return;

    try {
      const result = await checkCommentLiked(commentId);
      if (result.success) {
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: result.isLiked
        }));
      }
    } catch (err) {
      console.error('Error checking comment like status:', err);
    }
  };

  const handleLike = async () => {
    if (!session?.user) {
      // console.log('Please login to like')
      return;
    }

    if (isLikeLoading || !likeStatusChecked) return;
    setIsLikeLoading(true)
    try {
      const result = await likeVideo(video._id!.toString())
      if (result.liked !== undefined) { // ✅ Check if liked property exists
        setIsLiked(result.liked)

        if (result.liked) {
          setLikesCount(c => c + 1);
        }
        else {
          setLikesCount(c => c - 1);
        }
      }
      else {
        console.error('Failed to like the video', result.error)
      }
    } catch (err) {
      console.error('Error liking video: ', err)
    } finally {
      setIsLikeLoading(false) // ✅ Always reset loading state
    }
  }
  const handleComment = () => {
    // console.log("Commented");
    setShowComments(true)
    if (comments.length === 0) {
      loadComments()
    }

  }

  const loadComments = async () => {
    if (!video._id) return;

    setCommentsLoading(true)
    try {
      const result = await getComments(video._id.toString())
      if (result.success) {
        setComments(result.comments || [])

        const likeCounts: { [key: string]: number } = {}
        result.comments?.forEach((comment: IComment) => {
          if (comment._id) {
            likeCounts[comment._id.toString()] = comment.likesCount || 0;
            // Check if user liked this comment
            if (session?.user) {
              checkCommentLikeStatus(comment._id.toString());
            }
          }
          setCommentLikeCounts(likeCounts)
        })
      }
    } catch (err) {
      console.error('Error loading comments: ', err)

    } finally {
      setCommentsLoading(false)
    }
  }

  const submitComment = async () => {
    if (!session?.user) {
      alert('Please, login')
      return
    }
    if (!session?.user || !newComment.trim() || !video._id) return;
    setIsCommenting(true)
    try {
      const result = await addComment(video._id.toString(), newComment.trim())
      if (result.success) {
        setComments(prev => [result.comment, ...prev])
        setCommentsCount(c => c + 1)
        setNewComment('')

      }
    } catch (err) {
      console.error('Error commenting: ', err)

    } finally {
      setIsCommenting(false)
    }
  }
  const handleShare = () => {
    // console.log("Share triggered");

  }
  const handleOpt = () => {
    // console.log("Options triggered");

  }

  const handleFollow = async () => {
    if (!session?.user) {
      alert('Please login to follow');
      return;
    }
    if (isFollowing || !followStatusChecked) return;
    
    const creatorId = video.creator._id as unknown as string
    
    setIsFollowLoading(true)

    try {
      let result;
      if (isFollowing) {
        result = await unfollowUser(creatorId)
      }
      else {
        result = await followUser(creatorId)

      }
      if (result.success) {
        setIsFollowing(!isFollowing)
      }
      else {
        console.error('Failed to follow')
      }
    } catch (err) {
      console.error('Follow Error: ', err)

    } finally {
      setIsFollowLoading(false)
    }
  }




  // fetch likes and follows
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (session?.user && video._id) {
        try {
          const result = await checkLiked(video._id.toString())

          if (result.success) { // ✅ More consistent check
            setIsLiked(result.isLiked)
          }
          else {
          }
        } catch (err) {
          console.error('Error checking like status', err)

        } finally {
          setLikeStatusChecked(true)
        }
      }
      else {
        setLikeStatusChecked(true)
      }
    }

    const checkFollowStatus = async () => {
      if (session?.user && video.creator) {
        try {
          const creatorId = video.creator._id as unknown as string
          const result = await checkFollowing(creatorId);
          if (result.success) {
            setIsFollowing(result.isFollowing)

          }

        } catch (err) {
          console.error('Error checking Follow status: ', err)
        } finally {
          setFollowStatusChecked(true)
        }
      }

      else {
        setFollowStatusChecked(false)
      }
    }
    checkFollowStatus()
    checkLikeStatus()
  }, [session, video._id])

  // Close modal and reset input when video changes
  useEffect(() => {
    if (isActive && showComments) {

      setShowComments(false);
      setNewComment(''); // Clear any typed comment
      setCommentsLoading(false)
      setIsCommenting(false); // Reset commenting state
    }
    // Keep comments in memory so they don't need to reload
  }, [video._id, isActive]);



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
      // console.log('Video loaded successfully');
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

  // const toggleMute = () => {
  //   const video = videoRef.current;
  //   if (!video) return;

  //   video.muted = !video.muted;
  //   setIsMuted(video.muted);
  // };


  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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

      {/* Comments Modal */}
      {showComments && (<div className='wrapper'>
        <div
          className="fixed inset-0 bg-black/50 z-[70]"
          onClick={() => setShowComments(false)}
        />
        <div className="absolute inset-x-0 bg-white z-100 flex flex-col h-2/3 bottom-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-black font-semibold text-lg">Comments</h3>
            <button
              onClick={() => setShowComments(false)}
              className="text-black hover:text-gray-600"
            >
              <X />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="text-black text-center">Loading comments...</div>
            ) : comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment._id?.toString()} className="flex space-x-3">
                  {/* usericon */}
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-bold">
                      {comment.author?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {/* username */}
                      <span className="text-black font-medium text-sm">
                        {comment.author?.username || 'User'}
                      </span>

                      {/* date */}
                      <span className="text-gray-700 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {/* content */}
                    <p className="text-black text-sm mt-1">{comment.content}</p>
                  </div>
                  <div className='flex flex-col items-center justify-center'>
                    <button
                      className={`flex items-center space-x-1 text-xs transition-colors ${commentLikes[comment._id] ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        } disabled:opacity-50`}
                      onClick={() => handleCommentLike(comment._id)}
                    >

                      <HeartIcon className={`text-pink-400 hover:fill-pink-300 ${commentLikes[comment._id] ? 'fill-red-500 text-red-500' : 'fill-transparent'
                        }`}

                      />
                    </button>
                    <span className='text-gray-500'>{comment.likesCount}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center">No comments yet</div>
            )}
          </div>

          {/* Comment Input */}
          {/* Comment Input - This should be at the bottom of your modal */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{(session?.user?.name) ? session?.user.name[0] : 'U'}</span>
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-300 text-gray-800 px-3 py-2 rounded-lg border border-gray-400 focus:border-purple-500 focus:outline-none"
                  onKeyPress={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') {
                      submitComment()
                    }
                  }}
                  onKeyDown={e => {
                    e.stopPropagation()
                  }}
                  onKeyUp={e => {
                    e.stopPropagation()
                  }}
                />
                <button
                  onClick={submitComment}
                  disabled={isCommenting || !newComment.trim()}
                  className="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-purple-700 disabled:opacity-100 disabled:cursor-not-allowed"
                >
                  {isCommenting ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      )}

      {/* Right Side Action Buttons */}
      <div className="absolute right-4 bottom-25 flex flex-col items-center space-y-6 z-10">
        {/* Like */}
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform" onClick={handleLike}>
          <div className="bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors">
            <Heart
              className={`w-6 h-6 transition-colors ${isLiked ? 'fill-red-400 text-red-400' : 'fill-transparent text-white hover:text-red-500'}`}
            />
          </div>
          <span className="text-xs mt-1 font-semibold">{formatNumber(likesCount)}</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform " onClick={handleComment}>
          <div className="bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs mt-1 font-semibold">{formatNumber(commentsCount)}</span>
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
      <div className="absolute bottom-20 left-4 right-20 z-30 text-white">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {video.creator ? video.creator.username[0].toUpperCase() : 'U'}
              </span>
            </div>
            <span className="text-white text-sm font-medium">{video.creator ? video.creator.username : 'U'}</span>
            <button className={`px-4 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${isFollowing
                ? 'bg-transparent text-white border-2 border-white hover:bg-gray-200 hover:text-black'
                : 'border-2 border-white text-white hover:bg-white hover:text-black'
              }`}
              onClick={handleFollow}
              disabled={!followStatusChecked}
            >
              {isFollowLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          <h3 className="font-bold text-lg line-clamp-2">{video.title}</h3>
          <p className="text-sm opacity-90 line-clamp-3">{video.description}</p>
          <div className="text-xs opacity-75 mt-2">
            Follow @{video.creator.username} for daily memes ...
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelsPlayer;
