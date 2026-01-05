'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '@/app/actions/ai';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const QUICK_QUESTIONS = [
    'How much did I spend this month?',
    'What are my top expenses?',
    'Am I saving enough?',
    'Show my spending trends',
];

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const result = await chatWithAI(text, history);

            if (result.error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `Sorry, I encountered an error: ${result.error}`,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: result.response,
                    },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className={cn(
                    'fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-lg',
                    'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
                    'flex items-center justify-center',
                    isOpen && 'hidden'
                )}
            >
                <Bot className="w-6 h-6" />
                <motion.div
                    className="absolute inset-0 rounded-full bg-white/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.button>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />

                        {/* Chat Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed inset-x-0 bottom-0 z-50 bg-[rgb(var(--card))] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border))]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">TrackWise AI</h3>
                                        <p className="text-xs text-[rgb(var(--foreground-muted))]">Your financial assistant</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full hover:bg-[rgb(var(--background-secondary))]"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                                            <Bot className="w-8 h-8 text-violet-500" />
                                        </div>
                                        <h4 className="font-medium mb-2">Hi! I'm your AI assistant 👋</h4>
                                        <p className="text-sm text-[rgb(var(--foreground-muted))] mb-6">
                                            Ask me anything about your finances
                                        </p>

                                        {/* Quick Questions */}
                                        <div className="space-y-2">
                                            {QUICK_QUESTIONS.map((question) => (
                                                <motion.button
                                                    key={question}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => sendMessage(question)}
                                                    className="block w-full text-left px-4 py-3 rounded-xl bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--background-secondary))]/80 text-sm transition-colors"
                                                >
                                                    {question}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                'flex gap-3',
                                                message.role === 'user' && 'flex-row-reverse'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                                    message.role === 'user'
                                                        ? 'bg-[rgb(var(--primary))] text-white'
                                                        : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                                                )}
                                            >
                                                {message.role === 'user' ? (
                                                    <User className="w-4 h-4" />
                                                ) : (
                                                    <Bot className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                                                    message.role === 'user'
                                                        ? 'bg-[rgb(var(--primary))] text-white rounded-tr-md'
                                                        : 'bg-[rgb(var(--background-secondary))] rounded-tl-md'
                                                )}
                                            >
                                                {message.content}
                                            </div>
                                        </motion.div>
                                    ))
                                )}

                                {/* Loading indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-[rgb(var(--background-secondary))]">
                                            <div className="flex gap-1">
                                                <motion.div
                                                    className="w-2 h-2 rounded-full bg-[rgb(var(--foreground-muted))]"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                />
                                                <motion.div
                                                    className="w-2 h-2 rounded-full bg-[rgb(var(--foreground-muted))]"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                />
                                                <motion.div
                                                    className="w-2 h-2 rounded-full bg-[rgb(var(--foreground-muted))]"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-[rgb(var(--border))] safe-bottom">
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask about your finances..."
                                        className="flex-1 px-4 py-3 rounded-xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/50 text-sm"
                                    />
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => sendMessage(input)}
                                        disabled={!input.trim() || isLoading}
                                        className={cn(
                                            'px-4 rounded-xl transition-colors flex items-center justify-center',
                                            input.trim() && !isLoading
                                                ? 'bg-[rgb(var(--primary))] text-white'
                                                : 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--foreground-muted))]'
                                        )}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
