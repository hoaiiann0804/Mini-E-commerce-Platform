import { useState, useRef, useEffect, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { CHAT_WIDGET_CONFIG, GREETING_MESSAGE } from '../constants/chatWidget';
import { Message } from '../components/ChatWidget';

export const useChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number }>(CHAT_WIDGET_CONFIG.DEFAULT_SIZE);
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWidgetRef = useRef<Rnd | null>(null);
  const chatWidgetDomRef = useRef<HTMLDivElement>(null); // For DOM element access
  const isOpenRef = useRef(isOpen);

  // Load saved size from localStorage
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem(
        CHAT_WIDGET_CONFIG.STORAGE_KEYS.SIZE
      );
      if (savedSize) {
        setSize(JSON.parse(savedSize));
      }
    } catch (error) {
      console.error('Error loading saved chat widget size:', error);
    }
  }, []);

  // Initialize greeting message
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: Message = {
        ...GREETING_MESSAGE,
        id: Date.now().toString(),
        suggestions: [...GREETING_MESSAGE.suggestions],
      };
      setMessages([greeting]);
    }
  }, [messages.length]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle open/close state changes
  useEffect(() => {
    isOpenRef.current = isOpen;

    if (isOpen) {
      document.body.classList.add('chat-widget-open');

      // Center position calculation
      const centerX = Math.max(0, (window.innerWidth - size.width) / 2);
      const bottomY = Math.max(
        0,
        window.innerHeight -
          size.height -
          CHAT_WIDGET_CONFIG.POSITION_OFFSET.bottom
      );
      setPosition({ x: centerX, y: bottomY });

      // Prevent outside clicks from closing
      const preventClose = (e: MouseEvent) => {
        if (
          chatWidgetDomRef.current &&
          !chatWidgetDomRef.current.contains(e.target as Node)
        ) {
          e.stopPropagation();
        }
      };

      const preventEscapeClose = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          e.preventDefault();
        }
      };

      document.addEventListener('click', preventClose, true);
      document.addEventListener('mousedown', preventClose, true);
      document.addEventListener('keydown', preventEscapeClose, true);

      return () => {
        document.removeEventListener('click', preventClose, true);
        document.removeEventListener('mousedown', preventClose, true);
        document.removeEventListener('keydown', preventEscapeClose, true);
        document.body.classList.remove('chat-widget-open');
      };
    } else {
      document.body.classList.remove('chat-widget-open');
    }
  }, [isOpen, size.width, size.height]);

  // Handle window resize
  useEffect(() => {
    if (isOpen) {
      const handleWindowResize = () => {
        const centerX = Math.max(0, (window.innerWidth - size.width) / 2);
        const bottomY = Math.max(
          0,
          window.innerHeight -
            size.height -
            CHAT_WIDGET_CONFIG.POSITION_OFFSET.bottom
        );
        setPosition({ x: centerX, y: bottomY });
      };

      window.addEventListener('resize', handleWindowResize);
      return () => window.removeEventListener('resize', handleWindowResize);
    }
  }, [isOpen, size.width, size.height]);

  const toggleChat = useCallback(
    (event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      if (isOpen) return; // Only allow opening, not closing

      setIsOpen(true);
      isOpenRef.current = true;
    },
    [isOpen]
  );

  const closeChat = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setIsOpen(false);
    isOpenRef.current = false;
    document.body.classList.remove('chat-widget-open');
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
      );
    },
    []
  );

  const applyChanges = useCallback(() => {
    localStorage.setItem(
      CHAT_WIDGET_CONFIG.STORAGE_KEYS.SIZE,
      JSON.stringify(size)
    );

    const confirmMessage: Message = {
      id: Date.now().toString(),
      text: 'Đã áp dụng thay đổi! Kích thước cửa sổ chat đã được lưu.',
      sender: 'ai',
      suggestions: ['Cảm ơn', 'Tùy chỉnh thêm'],
    };

    addMessage(confirmMessage);
  }, [size, addMessage]);

  return {
    // State
    isOpen,
    position,
    size,
    messages,

    // Refs
    messagesEndRef,
    chatWidgetRef,
    chatWidgetDomRef,
    isOpenRef,

    // Actions
    toggleChat,
    closeChat,
    addMessage,
    removeMessage,
    updateMessage,
    applyChanges,
    setSize,
    setPosition,
    setMessages,
  };
};
