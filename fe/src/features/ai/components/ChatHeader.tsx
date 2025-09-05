import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, LightningIcon } from './icons/index';
import { GeminiServiceType } from '../services/geminiService';

interface ChatHeaderProps {
  onClose: () => void;
  geminiService: GeminiServiceType;
}

/**
 * Component hiển thị header của chat widget
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose, geminiService }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white p-2 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/30">
            <LightningIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xl tracking-tight">
              {t('chat.title') || 'Trợ lý AI'}
            </h3>
            <p className="text-sm text-white/90 font-medium">
              AI Shopping Assistant
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="Đóng chat"
        >
          <CloseIcon />
        </button>
      </div>

      {/* AI Status Info */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {geminiService.isReady() ? (
            <>
              <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-xs font-semibold">Gemini AI</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="text-xs text-white/90">Smart Mode</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-xs font-semibold">Demo Mode</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="text-xs text-white/90">Limited</span>
              </div>
            </>
          )}
        </div>

        {/* Đã loại bỏ Online indicator */}
      </div>
    </div>
  );
};

export default ChatHeader;
