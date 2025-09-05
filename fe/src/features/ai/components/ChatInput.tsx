import React, { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpIcon,
  LoadingIcon,
  SendIcon,
  TrashIcon,
  VerifiedIcon,
} from './icons/index';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onClearChat?: () => void;
}

/**
 * Component hiển thị phần nhập liệu của chat widget
 */
const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onClearChat,
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleClearChat = () => {
    if (
      onClearChat &&
      window.confirm('Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện này?')
    ) {
      onClearChat();
    }
  };

  const handleHelpClick = () => {
    onSendMessage('Tôi cần trợ giúp về cách sử dụng chatbot');
  };

  return (
    <div className="p-2 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 backdrop-blur-lg ">
      {/* Typing status indicator */}
      {isLoading && (
        <div className="flex items-center mb-2 text-xs text-neutral-500 dark:text-neutral-400 animate-pulse">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span>Nhân viên đang nhập...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.placeholder') || 'Bạn cần hỗ trợ gì không?'}
            className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full pl-4 pr-16 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/30 dark:focus:ring-primary-400/30 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-all duration-200"
            disabled={isLoading}
            autoComplete="off"
          />

          {/* Character count */}
          {input.length > 0 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-md min-w-[28px] text-center">
              {input.length}
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full p-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-1 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            !input.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? <LoadingIcon /> : <SendIcon />}
        </button>
      </form>

      {/* Footer with branding and features */}
      <div className="mt-1 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
        <div className="flex items-center">
          <VerifiedIcon className="mr-1.5 text-primary-500" />
          <span>
            {t('chat.poweredBy') || 'Powered by'}{' '}
            <span className="font-semibold text-primary-500 dark:text-primary-400">
              Shopmini AI
            </span>
          </span>
        </div>

        {onClearChat && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              title="Xóa cuộc trò chuyện"
              onClick={handleClearChat}
            >
              <TrashIcon />
            </button>

            <button
              type="button"
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              title="Trợ giúp"
              onClick={handleHelpClick}
            >
              <HelpIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
