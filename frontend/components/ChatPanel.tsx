"use client";

import React, { useState } from "react";
import { X, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export function ChatPanel({ isOpen, onClose, messages, onSendMessage }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-white text-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <h3 className="text-base font-bold text-slate-900">In-Meeting Chat</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No messages yet. Send a message to start chatting!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#0E71EB]">{msg.sender}</span>
                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              </div>
              <p className="text-xs text-slate-800 break-words">{msg.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex items-center space-x-2 bg-slate-50 shrink-0">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0E71EB]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-[#0E71EB] hover:bg-[#005CE6] text-white p-2 rounded-xl disabled:opacity-40 transition-colors shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
