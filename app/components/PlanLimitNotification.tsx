'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface PlanLimitNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const PlanLimitNotification: React.FC<PlanLimitNotificationProps> = ({ 
  isVisible, 
  onClose 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 via-red-500 to-orange-500 text-white shadow-lg"
        >
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm md:text-base">
                    Video Upload Limitation Notice
                  </h3>
                  <p className="text-xs md:text-sm text-white/90 mt-1">
                    Very sorry to let you know my video transformation limits exceeded. You can still choose to upload a video and see how the process looks like but the video won't play. You can enjoy other reels 
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href="https://imagekit.io/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  <span>Upgrade Plan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlanLimitNotification;
