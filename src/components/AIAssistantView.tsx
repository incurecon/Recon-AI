import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  User as UserIcon,
  Bot,
  HelpCircle,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { ReconciliationSession, ChatMessage } from '../types.js';
import { fetchJson } from '../utils/apiHelper.js';

interface AIAssistantViewProps {
  session: ReconciliationSession | null;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ session }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am IncuRecon AI Assistant, trained as a Senior Financial Auditor and CPA.
      
I have access to your active reconciliation dataset:
- **Internal Ledger**: ${session?.internalFileName || 'Sample Ledger'}
- **Bank Statement**: ${session?.externalFileName || 'Sample Statement'}
- **Matched Rate**: ${session ? session.matchRate.toFixed(1) : '94.2'}%

How can I assist you with your audit today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const presetPrompts = [
    'Why is transaction INV-44012 flagged as duplicate?',
    'How do I resolve the AWS cloud fee amount discrepancy?',
    'Suggest adjusting journal entries for missing bank debits',
    'How can our business improve internal controls against ghost payments?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const { data } = await fetchJson<{ reply?: string; error?: string }>('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          sessionId: session?.id,
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || data.error || 'I analyzed your query. Please verify the vendor invoice.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[78vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">AI Financial Auditor Assistant</h3>
            <p className="text-[10px] text-slate-500">
              Powered by Gemini 3.6 Flash | Context: {session ? session.id : 'General Advice'}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'reset-1',
                sender: 'assistant',
                text: 'Chat history reset. Ask me anything about your financial audit or reconciliation rules.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
          title="Clear Conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl p-4 rounded-xl space-y-1 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              <div
                className={`flex items-center justify-between gap-4 text-[10px] mb-1 ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                <span className="font-semibold">
                  {msg.sender === 'user' ? 'You' : 'IncuRecon AI'}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs italic">
              AI Auditor is evaluating transaction records...
            </div>
          </div>
        )}
      </div>

      {/* Preset Prompts Chips */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 overflow-x-auto flex gap-2">
        {presetPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask AI about unmatched transactions, journal entries, or fraud prevention..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
