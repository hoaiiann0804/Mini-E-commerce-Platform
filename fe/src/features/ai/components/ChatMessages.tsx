import React, { RefObject } from 'react';
import { Message } from '../types/Message';
import { UserIcon } from './icons';
import MessageBubble from './MessageBubble';

interface ChatMessagesProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  user?: any;
}

/**
 * Component hiển thị danh sách tin nhắn trong chat
 */
const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  onSuggestionClick,
  messagesEndRef,
  user,
}) => {
  return (
    <div className="chat-messages flex-1 overflow-y-auto p-6 sm:p-6 space-y-4 bg-gradient-to-b from-neutral-50/80 via-white/50 to-neutral-50/80 dark:from-neutral-800/80 dark:via-neutral-900/50 dark:to-neutral-800/80 min-h-[300px] max-h-[50vh] sm:max-h-[400px] scrollbar-thin scrollbar-thumb-primary-200 dark:scrollbar-thumb-primary-800 scrollbar-track-transparent">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.sender === 'ai' && (
            <div className="relative">
              {/* Nhân viên ảo - Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-800 shadow-lg flex-shrink-0 mr-2 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzYzNjZGMSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjODI4QUZGIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRjVGNUY1IiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGRkZGRkYiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0idXJsKCNncmFkMSkiLz4KICA8cGF0aCBkPSJNMTAwIDE3NUMxMzUuODk5IDE3NSAxNjUgMTQ1Ljg5OSAxNjUgMTEwQzE2NSA3NC4xMDE1IDEzNS44OTkgNDUgMTAwIDQ1QzY0LjEwMTUgNDUgMzUgNzQuMTAxNSAzNSAxMTBDMzUgMTQ1Ljg5OSA2NC4xMDE1IDE3NSAxMDAgMTc1WiIgZmlsbD0idXJsKCNncmFkMikiLz4KICA8cGF0aCBkPSJNNjUgOTBDNjUgODIuMjY4IDcxLjI2OCA3NiA3OSA3NkM4Ni43MzIgNzYgOTMgODIuMjY4IDkzIDkwQzkzIDk3LjczMiA4Ni43MzIgMTA0IDc5IDEwNEM3MS4yNjggMTA0IDY1IDk3LjczMiA2NSA5MFoiIGZpbGw9IiM0MjQyNDIiLz4KICA8cGF0aCBkPSJNMTA3IDkwQzEwNyA4Mi4yNjggMTEzLjI2OCA3NiAxMjEgNzZDMTI4LjczMiA3NiAxMzUgODIuMjY4IDEzNSA5MEMxMzUgOTcuNzMyIDEyOC43MzIgMTA0IDEyMSAxMDRDMTEzLjI2OCAxMDQgMTA3IDk3LjczMiAxMDcgOTBaIiBmaWxsPSIjNDI0MjQyIi8+CiAgPHBhdGggZD0iTTc1IDEyNUM4NSAxMzUgMTE1IDEzNSAxMjUgMTI1IiBzdHJva2U9IiM0MjQyNDIiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTEwMCAxNzVDMTM1Ljg5OSAxNzUgMTY1IDE0NS44OTkgMTY1IDExMEMxNjUgNzQuMTAxNSAxMzUuODk5IDQ1IDEwMCA0NUM2NC4xMDE1IDQ1IDM1IDc0LjEwMTUgMzUgMTEwQzM1IDE0NS44OTkgNjQuMTAxNSAxNzUgMTAwIDE3NVoiIHN0cm9rZT0iIzYzNjZGMSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo="
                  alt="AI Assistant"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback nếu ảnh không tải được
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236366f1'%3E%3Cpath fill-rule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z' clip-rule='evenodd'/%3E%3C/svg%3E";
                  }}
                />
              </div>

              {/* Online indicator */}
              <div className="absolute bottom-0 right-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800"></div>

              {/* Online indicator - không hiển thị typing indicator ở đây nữa */}
            </div>
          )}

          {/* User avatar - chỉ hiển thị cho tin nhắn của người dùng */}
          {message.sender === 'user' && (
            <div className="ml-2 order-2">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-300" />
                )}
              </div>
            </div>
          )}

          <MessageBubble
            message={message}
            onSuggestionClick={onSuggestionClick}
          />
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
