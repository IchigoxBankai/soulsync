import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { MessageCircle, X, Send, Smile, Volume2, VolumeX, Moon, Sun, LogOut, Edit2, Play } from 'lucide-react';
import { audioController } from '../utils/audio';

export const ReactionOverlay = () => {
  const { reactions } = useSocket();

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-0 text-5xl animate-bubble-float select-none"
          style={{
            left: `${reaction.x}%`,
            animationDuration: '4s',
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
};

export const Chat = () => {
  const { messages, sendMessage, sendReaction, room, player } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef(null);

  const quickReactions = ['❤️', '😂', '😭', '👏', '🔥', '🥺'];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
    audioController.playClick();
  };

  const handleQuickReaction = (emoji) => {
    sendReaction(emoji);
    audioController.playClick();
  };

  if (!room) return null;

  return (
    <>
      {/* Quick Reaction Bar - Floating on screen bottom right */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-2">
        <div className="glass flex flex-row items-center gap-1.5 p-2 rounded-full shadow-lg border border-pink-200/50">
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="text-2xl hover:scale-130 active:scale-95 transition-all p-1"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            audioController.playClick();
          }}
          className="fixed bottom-6 right-4 z-40 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <MessageCircle size={24} />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 z-40 w-80 sm:w-96 h-[450px] glass rounded-2xl shadow-2xl flex flex-col border border-pink-200/50 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold text-sm">Room Chat</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                audioController.playClick();
              }}
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar bg-white/10 dark:bg-black/10">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 italic">
                Send a message to start chatting!
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderId === player?.id;
                const isSystem = msg.sender === 'System';

                if (isSystem) {
                  return (
                    <div key={i} className="text-center text-[11px] text-purple-600 dark:text-purple-400 font-medium py-1 px-3 bg-purple-500/10 rounded-full mx-auto max-w-[90%]">
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[80%] ${
                      isMe ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 px-1">
                      {isMe ? 'You' : msg.sender}
                    </span>
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm break-words shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Emoji Suggestions Panel */}
          {showEmojiPicker && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 flex gap-2 overflow-x-auto no-scrollbar">
              {['😀', '😘', '🥰', '🥺', '🤣', '😭', '💖', '🎉', '🌟', '🍿', '🧁', '🍕'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                    audioController.playClick();
                  }}
                  className="text-xl p-1 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white/20 dark:bg-black/20 border-t border-slate-200/30 flex gap-2 items-center">
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                audioController.playClick();
              }}
              className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                showEmojiPicker ? 'bg-slate-100 dark:bg-slate-800 text-pink-500' : ''
              }`}
            >
              <Smile size={20} />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              maxLength={100}
              className="flex-1 text-sm bg-white/60 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent dark:text-white"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white p-2 rounded-xl transition-transform hover:scale-105 active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
