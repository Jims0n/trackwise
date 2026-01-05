'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { db as prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { fromMinorUnits } from '@/types';

// ============================================
// AI Provider Configuration
// ============================================

type AIProvider = 'gemini' | 'openai';

// Determine which provider to use based on available API keys
function getActiveProvider(): AIProvider {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return 'gemini'; // default
}

// Initialize AI clients
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================
// Currency Configuration
// ============================================

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

const CURRENCY_NAMES: Record<string, string> = {
  NGN: 'Nigerian Naira',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  GHS: 'Ghanaian Cedi',
  KES: 'Kenyan Shilling',
  ZAR: 'South African Rand',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
};

/**
 * Get the user's currency preference from the database
 */
async function getUserCurrency(userId: string): Promise<{ code: string; symbol: string; name: string }> {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { defaultCurrency: true },
  });

  const code = prefs?.defaultCurrency || 'USD';
  return {
    code,
    symbol: CURRENCY_SYMBOLS[code] || '$',
    name: CURRENCY_NAMES[code] || 'US Dollar',
  };
}

// System prompt for financial assistant
const FINANCIAL_ASSISTANT_PROMPT = `You are TrackWise AI, a friendly and knowledgeable personal finance assistant. Your role is to help users understand their spending habits, provide actionable savings tips, and answer questions about their finances.

Guidelines:
- Be concise and clear - users want quick insights, not essays
- Use encouraging and supportive language
- When discussing money, be specific with numbers when available
- Suggest practical, actionable steps
- If you don't have enough data, suggest what data would help
- Keep responses under 150 words unless specifically asked for detail
- Use emoji sparingly to add warmth (1-2 per response max)
- Never make up data - only reference what's provided
- IMPORTANT: Always use the user's preferred currency symbol when mentioning amounts`;

// ============================================
// AI Provider Abstraction
// ============================================

async function generateWithGemini(prompt: string): Promise<string> {
  if (!genAI) throw new Error('Gemini API key not configured');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!openai) throw new Error('OpenAI API key not configured');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: FINANCIAL_ASSISTANT_PROMPT },
      { role: 'user', content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

async function chatWithGemini(
  systemContext: string,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  if (!genAI) throw new Error('Gemini API key not configured');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'Hi, I need help with my finances.' }] },
      { role: 'model', parts: [{ text: systemContext }] },
      ...history.map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.content }],
      })),
    ],
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
}

async function chatWithOpenAI(
  systemContext: string,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  if (!openai) throw new Error('OpenAI API key not configured');

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContext },
    ...history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

// ============================================
// Main AI Functions
// ============================================

/**
 * Generate AI-powered financial insights based on user's transaction data
 */
export async function generateFinancialInsights(): Promise<{
  insights: string[];
  tip: string;
  error?: string;
  provider?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { insights: [], tip: '', error: 'Not authenticated' };
    }

    const provider = getActiveProvider();

    // Fetch user's currency preference
    const currency = await getUserCurrency(session.user.id);

    // Fetch last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    if (transactions.length < 3) {
      return {
        insights: ['Add more transactions to unlock AI insights!'],
        tip: 'Track at least 3 transactions to get personalized financial advice.',
        provider,
      };
    }

    // Calculate summary statistics
    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + fromMinorUnits(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + fromMinorUnits(t.amount), 0);

    const categoryTotals: Record<string, { total: number; count: number }> = {};
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const cat = t.category?.name || 'Uncategorized';
        if (!categoryTotals[cat]) {
          categoryTotals[cat] = { total: 0, count: 0 };
        }
        categoryTotals[cat].total += fromMinorUnits(t.amount);
        categoryTotals[cat].count++;
      });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      }));

    // Create prompt for AI
    const dataContext = `
User's financial summary for the last 30 days (Currency: ${currency.name}, Symbol: ${currency.symbol}):
- Total Income: ${currency.symbol}${income.toFixed(2)}
- Total Expenses: ${currency.symbol}${expenses.toFixed(2)}
- Net Savings: ${currency.symbol}${(income - expenses).toFixed(2)}
- Savings Rate: ${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%
- Transaction Count: ${transactions.length}

Top spending categories:
${topCategories.map((c, i) => `${i + 1}. ${c.category}: ${currency.symbol}${c.total.toFixed(2)} (${c.count} transactions)`).join('\n')}
`;

    const prompt = `Based on this financial data, provide exactly 3 brief insights (one sentence each) and 1 actionable tip.

${dataContext}

Respond in this exact JSON format only, no other text:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "tip": "one actionable tip"
}`;

    let response: string;

    if (provider === 'openai' && openai) {
      response = await generateWithOpenAI(prompt);
    } else if (genAI) {
      response = await generateWithGemini(prompt);
    } else {
      return { insights: [], tip: '', error: 'No AI provider configured. Add OPENAI_API_KEY or GEMINI_API_KEY to .env' };
    }

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        insights: parsed.insights || [],
        tip: parsed.tip || '',
        provider,
      };
    }

    return {
      insights: ['Unable to generate insights at this time.'],
      tip: 'Try again later.',
      provider,
    };
  } catch (error) {
    console.error('AI insights error:', error);
    return {
      insights: [],
      tip: '',
      error: `Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Chat with the AI financial assistant
 */
export async function chatWithAI(
  message: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ response: string; error?: string; provider?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { response: '', error: 'Not authenticated' };
    }

    const provider = getActiveProvider();

    // Fetch user's currency preference
    const currency = await getUserCurrency(session.user.id);

    // Fetch recent financial context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [transactions, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          date: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
        include: {
          category: { select: { name: true } },
          account: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.financialAccount.findMany({
        where: { userId: session.user.id, status: 'ACTIVE' },
        select: { name: true, type: true, balance: true },
      }),
    ]);

    // Calculate context data
    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + fromMinorUnits(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + fromMinorUnits(t.amount), 0);

    const totalBalance = accounts.reduce((sum, a) => {
      const balance = fromMinorUnits(a.balance);
      if (a.type === 'CREDIT_CARD' || a.type === 'LOAN') {
        return sum - balance;
      }
      return sum + balance;
    }, 0);

    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const cat = t.category?.name || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + fromMinorUnits(t.amount);
      });

    const financialContext = `${FINANCIAL_ASSISTANT_PROMPT}

IMPORTANT: The user's preferred currency is ${currency.name} (${currency.code}). Always use the symbol ${currency.symbol} when displaying monetary amounts.

Current Financial Context:
- Total Balance (Net Worth): ${currency.symbol}${totalBalance.toFixed(2)}
- Accounts: ${accounts.map(a => `${a.name} (${a.type}): ${currency.symbol}${fromMinorUnits(a.balance).toFixed(2)}`).join(', ')}
- Last 30 days income: ${currency.symbol}${income.toFixed(2)}
- Last 30 days expenses: ${currency.symbol}${expenses.toFixed(2)}
- Top spending: ${Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat, amt]) => `${cat}: ${currency.symbol}${amt.toFixed(2)}`)
        .join(', ')}

Remember: Be helpful, concise, and reference the actual data when answering. Always use ${currency.symbol} for amounts.`;

    let response: string;

    if (provider === 'openai' && openai) {
      response = await chatWithOpenAI(financialContext, message, conversationHistory);
    } else if (genAI) {
      response = await chatWithGemini(financialContext, message, conversationHistory);
    } else {
      return { response: '', error: 'No AI provider configured. Add OPENAI_API_KEY or GEMINI_API_KEY to .env' };
    }

    return { response, provider };
  } catch (error) {
    console.error('AI chat error:', error);
    return {
      response: '',
      error: `Failed to get response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get smart spending suggestions based on patterns
 */
export async function getSmartSuggestions(): Promise<{
  suggestions: string[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { suggestions: [], error: 'Not authenticated' };
    }

    // Fetch recent transactions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: sevenDaysAgo },
        status: 'COMPLETED',
        type: 'EXPENSE',
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    if (recentTransactions.length < 2) {
      return {
        suggestions: ['Track your daily expenses to get spending pattern alerts!'],
      };
    }

    // Quick pattern detection
    const suggestions: string[] = [];

    // Check for repeated merchants
    const descriptions = recentTransactions.map(t => t.description?.toLowerCase() || '');
    const merchantCounts: Record<string, number> = {};
    descriptions.forEach(d => {
      if (d) merchantCounts[d] = (merchantCounts[d] || 0) + 1;
    });

    const repeatedMerchants = Object.entries(merchantCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a);

    if (repeatedMerchants.length > 0) {
      suggestions.push(`You've visited "${repeatedMerchants[0][0]}" ${repeatedMerchants[0][1]} times this week`);
    }

    // Check category spending
    const categoryTotals: Record<string, number> = {};
    recentTransactions.forEach(t => {
      const cat = t.category?.name || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
    });

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCategory) {
      suggestions.push(`${topCategory[0]} is your top expense this week at $${topCategory[1].toFixed(0)}`);
    }

    return { suggestions: suggestions.slice(0, 3) };
  } catch (error) {
    console.error('Smart suggestions error:', error);
    return { suggestions: [], error: 'Failed to generate suggestions' };
  }
}

/**
 * Get the current active AI provider
 */
export async function getAIProvider(): Promise<{ provider: AIProvider; available: AIProvider[] }> {
  const available: AIProvider[] = [];
  if (process.env.GEMINI_API_KEY) available.push('gemini');
  if (process.env.OPENAI_API_KEY) available.push('openai');

  return {
    provider: getActiveProvider(),
    available,
  };
}
