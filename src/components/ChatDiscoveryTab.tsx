import { useState, useEffect, useRef } from 'react';
import { Plus, MessageCircle, Send, Trash2, Copy, ArrowRight, Loader, Edit2, Folder, FolderPlus, ChevronDown, ChevronRight, MoreVertical, Sparkles, Bot, Play, Pause, FastForward, Rewind, RotateCcw } from 'lucide-react';
import { supabase, ChatSession, ChatMessage, ChatFolder } from '../lib/supabase';
import {
  initializeConversation,
  getNextQuestion,
  processResponse,
  generateWorkflowSummary,
  ConversationState,
} from '../lib/conversationEngine';
import { lyzrAgentClient } from '../lib/lyzrAgentClient';
import { demoScenarios, DemoScenario } from '../lib/demoScenarios';
import type { WorkflowConfig } from './BusinessSlidersTab';

interface ChatDiscoveryTabProps {
  onComplete: (config: Partial<WorkflowConfig>) => void;
}

// Generate a unique Lyzr session ID in format: {agent_id}-{random_string}
async function generateLyzrSessionId(): Promise<string> {
  try {
    const { data } = await supabase
      .from('lyzr_api_config')
      .select('agent_id')
      .limit(1)
      .maybeSingle();

    const agentId = data?.agent_id || '691a0afa5848af7d875ae981';
    const randomSuffix = Math.random().toString(36).substring(2, 12);
    return `${agentId}-${randomSuffix}`;
  } catch (error) {
    const fallbackAgentId = '691a0afa5848af7d875ae981';
    const randomSuffix = Math.random().toString(36).substring(2, 12);
    return `${fallbackAgentId}-${randomSuffix}`;
  }
}

export default function ChatDiscoveryTab({ onComplete }: ChatDiscoveryTabProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>(initializeConversation());
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [draggedSession, setDraggedSession] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);
  const [useLyzrAgent, setUseLyzrAgent] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [playingScenario, setPlayingScenario] = useState<DemoScenario | null>(null);
  const [scenarioStep, setScenarioStep] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(1);
  const [demoPaused, setDemoPaused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const demoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingDemoRef = useRef(false);
  const demoSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeSessionId && !isPlayingDemoRef.current) {
      console.log('[DEMO] useEffect loading messages for session:', activeSessionId);
      loadMessages(activeSessionId);
    } else if (isPlayingDemoRef.current) {
      console.log('[DEMO] useEffect skipped - demo is playing');
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Only clear demo state if we're actually playing and session changed to something else
    if (isPlayingDemoRef.current && activeSessionId && demoSessionIdRef.current && activeSessionId !== demoSessionIdRef.current) {
      console.log('[DEMO] Session switched away from playing scenario, stopping demo');
      isPlayingDemoRef.current = false;
      demoSessionIdRef.current = null;
      setIsPlayingDemo(false);
      setPlayingScenario(null);
      setScenarioStep(0);
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    }
  }, [activeSessionId]);

  async function loadData() {
    try {
      setLoading(true);

      const [sessionsResult, foldersResult] = await Promise.all([
        supabase
          .from('chat_sessions')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('updated_at', { ascending: false }),
        supabase
          .from('chat_folders')
          .select('*')
          .order('sort_order', { ascending: true })
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (foldersResult.error) throw foldersResult.error;

      setSessions(sessionsResult.data || []);
      setFolders(foldersResult.data || []);

      if (sessionsResult.data && sessionsResult.data.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionsResult.data[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(sessionId: string) {
    try {
      if (isPlayingDemoRef.current) {
        console.log('[DEMO] loadMessages blocked - demo is playing');
        return;
      }

      console.log('[DEMO] loadMessages executing for session:', sessionId);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('[DEMO] loadMessages loaded', data?.length, 'messages');
      setMessages(data || []);

      const session = sessions.find(s => s.id === sessionId);
      if (session && session.extracted_data && Object.keys(session.extracted_data).length > 0) {
        const aiMessages = data?.filter(m => m.role === 'ai') || [];
        const answeredQuestions = aiMessages.filter(msg => {
          const nextMessage = data?.find(m =>
            m.role === 'user' &&
            new Date(m.created_at) > new Date(msg.created_at)
          );
          return !!nextMessage;
        }).length;

        setConversationState({
          currentStep: answeredQuestions,
          responses: {},
          extractedData: session.extracted_data as any,
        });
      } else {
        setConversationState(initializeConversation());
      }

      if (!data || data.length === 0) {
        setTimeout(() => askNextQuestion(), 500);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }

  async function createNewSession() {
    try {
      const lyzrSessionId = await generateLyzrSessionId();

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          session_name: `Workflow ${sessions.length + 1}`,
          status: 'in_progress',
          metadata: { lyzr_session_id: lyzrSessionId },
        }])
        .select()
        .single();

      if (error) throw error;

      isPlayingDemoRef.current = false;
      demoSessionIdRef.current = null;
      setIsPlayingDemo(false);
      setPlayingScenario(null);
      setSessions(prev => [data, ...prev]);
      setMessages([]);
      setConversationState(initializeConversation());
      setActiveSessionId(data.id);

      // Ask the first question after state updates
      setTimeout(() => {
        if (useLyzrAgent) {
          askLyzrAgentWithSession(data.id, '');
        } else {
          askNextQuestionForSession(data.id);
        }
      }, 500);
    } catch (err) {
      console.error('Error creating session:', err);
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Delete this conversation?')) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remaining[0]?.id || null);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  }

  async function duplicateSession(sessionId: string) {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const newLyzrSessionId = await generateLyzrSessionId();

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          session_name: `${session.session_name} (Copy)`,
          workflow_description: session.workflow_description,
          extracted_data: session.extracted_data,
          folder_id: session.folder_id,
          metadata: { lyzr_session_id: newLyzrSessionId },
          status: 'draft',
        }])
        .select()
        .single();

      if (error) throw error;
      setSessions(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error duplicating session:', err);
    }
  }

  async function renameSession(sessionId: string, newName: string) {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          session_name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, session_name: newName } : s
      ));
      setRenamingSessionId(null);
      setRenameValue('');
    } catch (err) {
      console.error('Error renaming session:', err);
    }
  }

  async function createFolder() {
    const name = prompt('Folder name:');
    if (!name) return;

    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .insert([{
          name,
          sort_order: folders.length,
        }])
        .select()
        .single();

      if (error) throw error;
      setFolders(prev => [...prev, data]);
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  }

  async function renameFolder(folderId: string, newName: string) {
    try {
      const { error } = await supabase
        .from('chat_folders')
        .update({
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderId);

      if (error) throw error;

      setFolders(prev => prev.map(f =>
        f.id === folderId ? { ...f, name: newName } : f
      ));
      setRenamingFolderId(null);
      setRenameFolderValue('');
    } catch (err) {
      console.error('Error renaming folder:', err);
    }
  }

  async function deleteFolder(folderId: string) {
    if (!confirm('Delete this folder? Conversations will be moved to the main list.')) return;

    try {
      const { error } = await supabase
        .from('chat_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      setFolders(prev => prev.filter(f => f.id !== folderId));
      await loadData();
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  }

  async function moveSessionToFolder(sessionId: string, folderId: string | null) {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          folder_id: folderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, folder_id: folderId } : s
      ));
    } catch (err) {
      console.error('Error moving session:', err);
    }
  }

  function handleDragStart(sessionId: string) {
    setDraggedSession(sessionId);
  }

  function handleDragOver(e: React.DragEvent, folderId: string | null) {
    e.preventDefault();
    setDragOverFolder(folderId);
  }

  function handleDrop(e: React.DragEvent, folderId: string | null) {
    e.preventDefault();
    if (draggedSession) {
      moveSessionToFolder(draggedSession, folderId);
    }
    setDraggedSession(null);
    setDragOverFolder(null);
  }

  function toggleFolder(folderId: string) {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function askNextQuestionForSession(sessionId: string) {
    const nextQuestion = getNextQuestion(conversationState);
    if (!nextQuestion) {
      await completeConversation();
      return;
    }

    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const aiMessage: Partial<ChatMessage> = {
      session_id: sessionId,
      role: 'ai',
      message: nextQuestion.question,
      metadata: {
        question_id: nextQuestion.id,
        question_type: nextQuestion.type,
        options: nextQuestion.options,
      },
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([aiMessage])
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
    }

    setIsTyping(false);
  }

  async function askNextQuestion() {
    if (!activeSessionId) return;

    if (useLyzrAgent) {
      await askLyzrAgent('');
    } else {
      await askNextQuestionForSession(activeSessionId);
    }
  }

  async function askLyzrAgentWithSession(sessionId: string, userMessage: string) {
    try {
      setAgentError(null);
      setIsTyping(true);

      const session = sessions.find(s => s.id === sessionId);
      let lyzrSessionId = session?.metadata?.lyzr_session_id;

      if (!lyzrSessionId) {
        lyzrSessionId = await generateLyzrSessionId();
        await supabase
          .from('chat_sessions')
          .update({ metadata: { lyzr_session_id: lyzrSessionId } })
          .eq('id', sessionId);
      }

      const userId = 'user@lyzr.ai';
      const response = await lyzrAgentClient.chat(userId, lyzrSessionId, userMessage);

      await new Promise(resolve => setTimeout(resolve, 500));

      const aiMessage: Partial<ChatMessage> = {
        session_id: sessionId,
        role: 'ai',
        message: response.response,
        metadata: {
          lyzr_session_id: response.session_id,
          lyzr_agent_id: response.agent_id,
          ...response.metadata,
        },
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([aiMessage])
        .select()
        .single();

      if (!error && data) {
        setMessages(prev => [...prev, data]);
      }

      const extractedData = lyzrAgentClient.extractWorkflowData(response);
      if (extractedData) {
        await supabase
          .from('chat_sessions')
          .update({
            extracted_data: extractedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        setConversationState(prev => ({
          ...prev,
          extractedData: { ...prev.extractedData, ...extractedData },
        }));
      }

      if (lyzrAgentClient.isConversationComplete(response)) {
        await completeConversation();
      }

      setIsTyping(false);
    } catch (error) {
      console.error('Lyzr Agent error:', error);
      setAgentError('Unable to connect to Lyzr Agent. Please toggle to Demo Mode to continue.');
      setIsTyping(false);
    }
  }

  async function askLyzrAgent(userMessage: string) {
    if (!activeSessionId) return;
    await askLyzrAgentWithSession(activeSessionId, userMessage);
  }

  async function handleUserResponse(response: any) {
    if (!activeSessionId) return;

    const messageText = typeof response === 'string' ? response : JSON.stringify(response);

    const userMessage: Partial<ChatMessage> = {
      session_id: activeSessionId,
      role: 'user',
      message: messageText,
      metadata: useLyzrAgent ? { mode: 'lyzr' } : { question_id: getNextQuestion(conversationState)?.id },
    };

    const { data: savedMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert([userMessage])
      .select()
      .single();

    if (!saveError && savedMessage) {
      setMessages(prev => [...prev, savedMessage]);
    }

    if (useLyzrAgent) {
      setUserInput('');
      setSelectedChoices([]);
      setTimeout(() => askLyzrAgent(messageText), 800);
    } else {
      const currentQuestion = getNextQuestion(conversationState);
      if (!currentQuestion) return;

      const newState = processResponse(response, conversationState);
      setConversationState(newState);

      await supabase
        .from('chat_sessions')
        .update({
          extracted_data: newState.extractedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeSessionId);

      setUserInput('');
      setSelectedChoices([]);

      setTimeout(() => askNextQuestion(), 800);
    }
  }

  async function completeConversation() {
    if (!activeSessionId) return;

    const summary = generateWorkflowSummary(conversationState.extractedData);

    await supabase
      .from('chat_sessions')
      .update({
        status: 'completed',
        workflow_description: summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeSessionId);

    const completionMessage: Partial<ChatMessage> = {
      session_id: activeSessionId,
      role: 'ai',
      message: `Perfect! I've gathered all the information I need. Based on your answers, here's what I understand:\n\n${summary}\n\nI've set up your cost calculator with these parameters. Click "Proceed to Calculator" to review and adjust the estimates.`,
      metadata: { is_completion: true },
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([completionMessage])
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
    }

    await loadData();
  }

  async function playDemoScenario(scenario: DemoScenario) {
    try {
      console.log('[DEMO] Starting demo scenario:', scenario.title);

      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert([{
          session_name: scenario.title,
          status: 'in_progress',
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('[DEMO] Created new session:', newSession.id);

      // Set refs FIRST before any state updates
      isPlayingDemoRef.current = true;
      demoSessionIdRef.current = newSession.id;

      setSessions(prev => [newSession, ...prev]);
      setMessages([]);
      setPlayingScenario(scenario);
      setScenarioStep(0);
      setIsPlayingDemo(true);
      setConversationState(initializeConversation());
      setActiveSessionId(newSession.id);

      console.log('[DEMO] Starting playback, refs:', { isPlayingDemoRef: isPlayingDemoRef.current, demoSessionIdRef: demoSessionIdRef.current });
      playNextScenarioMessage(newSession.id, scenario, 0);
    } catch (error) {
      console.error('[DEMO] Error starting demo scenario:', error);
    }
  }

  async function playNextScenarioMessage(sessionId: string, scenario: DemoScenario, step: number) {
    console.log('[DEMO] playNextScenarioMessage called:', {
      step,
      sessionId,
      demoSessionIdRef: demoSessionIdRef.current,
      isPlayingDemoRef: isPlayingDemoRef.current,
      totalSteps: scenario.conversation.length,
      demoPaused
    });

    // Check if we should stop - using ref values to avoid stale closure
    if (!isPlayingDemoRef.current || demoSessionIdRef.current !== sessionId) {
      console.log('[DEMO] Session mismatch or demo stopped, stopping', {
        isPlayingDemoRef: isPlayingDemoRef.current,
        demoSessionIdRef: demoSessionIdRef.current,
        sessionId
      });
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
      isPlayingDemoRef.current = false;
      demoSessionIdRef.current = null;
      setIsPlayingDemo(false);
      setPlayingScenario(null);
      setDemoPaused(false);
      return;
    }

    if (demoPaused) {
      console.log('[DEMO] Paused, waiting...');
      demoTimeoutRef.current = setTimeout(() => {
        playNextScenarioMessage(sessionId, scenario, step);
      }, 100);
      return;
    }

    if (step >= scenario.conversation.length) {
      console.log('[DEMO] Reached end, showing completion');
      const completionMessage: Partial<ChatMessage> = {
        session_id: sessionId,
        role: 'ai',
        message: `Perfect! I've gathered all the information I need to understand your business use case.\n\n**Here's what I understand:**\n\n${scenario.extractedData.workflow_description}\n\nI've configured the Business Calculator with intelligent estimates based on our conversation. You can now proceed to adjust the volume controls and see your cost breakdown.\n\n✨ Click "Proceed to Calculator" below to continue!`,
        metadata: { is_completion: true, demo_scenario: scenario.id },
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([completionMessage])
        .select()
        .single();

      if (!error && data) {
        setMessages(prev => [...prev, data]);
      }

      await supabase
        .from('chat_sessions')
        .update({
          status: 'completed',
          extracted_data: scenario.extractedData,
          workflow_description: scenario.extractedData.workflow_description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      setConversationState(prev => ({
        ...prev,
        extractedData: scenario.extractedData,
      }));

      isPlayingDemoRef.current = false;
      demoSessionIdRef.current = null;
      setIsPlayingDemo(false);
      setPlayingScenario(null);
      setDemoPaused(false);
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
      await loadData();
      return;
    }

    const currentMessage = scenario.conversation[step];
    const baseDelay = currentMessage.delay || 1000;
    const adjustedDelay = baseDelay / demoSpeed;

    console.log('[DEMO] Processing message:', {
      step,
      role: currentMessage.role,
      delay: adjustedDelay,
      messagePreview: currentMessage.message.substring(0, 50)
    });

    if (currentMessage.role === 'ai') {
      setIsTyping(true);
    }

    demoTimeoutRef.current = setTimeout(async () => {
      console.log('[DEMO] Timeout fired for step:', step);

      // Double-check we're still on the right session using refs
      if (!isPlayingDemoRef.current || demoSessionIdRef.current !== sessionId) {
        console.log('[DEMO] Session mismatch in timeout, stopping');
        setIsTyping(false);
        return;
      }

      if (demoPaused) {
        console.log('[DEMO] Paused in timeout, restarting same step');
        playNextScenarioMessage(sessionId, scenario, step);
        return;
      }

      console.log('[DEMO] Inserting message into DB');
      const messageData: Partial<ChatMessage> = {
        session_id: sessionId,
        role: currentMessage.role,
        message: currentMessage.message,
        metadata: { demo_scenario: scenario.id, step },
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('[DEMO] Error inserting message:', error);
      } else {
        console.log('[DEMO] Message inserted successfully:', data?.id);
      }

      if (!error && data) {
        setMessages(prev => [...prev, data]);
      }

      setIsTyping(false);
      setScenarioStep(step + 1);

      console.log('[DEMO] Scheduling next step:', step + 1);
      // Continue to next message - check refs
      if (isPlayingDemoRef.current && demoSessionIdRef.current === sessionId) {
        demoTimeoutRef.current = setTimeout(() => {
          playNextScenarioMessage(sessionId, scenario, step + 1);
        }, 500 / demoSpeed);
      } else {
        console.log('[DEMO] Session changed or demo stopped, not continuing');
      }
    }, adjustedDelay);
  }

  function handleProceedToCalculator() {
    const config: Partial<WorkflowConfig> = {
      workflow_description: conversationState.extractedData.workflow_description,
      complexity_tier: conversationState.extractedData.complexity_tier,
      emails_per_month: conversationState.extractedData.emails_per_month,
      chats_per_month: conversationState.extractedData.chats_per_month,
      voice_calls_per_month: conversationState.extractedData.voice_calls_per_month,
      docs_per_month: conversationState.extractedData.docs_per_month,
      workflow_triggers_per_day: conversationState.extractedData.workflow_triggers_per_day,
      rag_lookups: conversationState.extractedData.rag_queries,
      tool_calls: conversationState.extractedData.tool_calls,
      db_queries: conversationState.extractedData.db_queries,
      memory_ops: conversationState.extractedData.memory_ops,
      reflection_runs: conversationState.extractedData.reflection_runs,
      web_fetches: conversationState.extractedData.web_fetches,
      deep_crawl_pages: conversationState.extractedData.deep_crawl_pages,
      avg_input_tokens: conversationState.extractedData.estimated_input_tokens,
      avg_output_tokens: conversationState.extractedData.estimated_output_tokens,
      inter_agent_tokens: conversationState.extractedData.inter_agent_tokens,
      num_agents: conversationState.extractedData.num_agents,
      num_knowledge_bases: conversationState.extractedData.requires_knowledge_base ? 1 : 0,
    };

    onComplete(config);
  }

  const currentQuestion = getNextQuestion(conversationState);
  const hasCompletionMessage = messages.some(m => m.metadata?.is_completion === true);
  const isCompleted = ((!currentQuestion && messages.length > 0) || hasCompletionMessage) && !isPlayingDemo;

  const unfiledSessions = sessions.filter(s => !s.folder_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 space-y-2">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
          <button
            onClick={createFolder}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-all text-sm"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </button>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">AI Mode</span>
              <button
                onClick={() => {
                  setUseLyzrAgent(!useLyzrAgent);
                  setAgentError(null);
                  if (messages.length === 0 && activeSessionId) {
                    setTimeout(() => askNextQuestion(), 500);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useLyzrAgent ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useLyzrAgent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {useLyzrAgent ? (
                <>
                  <Sparkles className="h-3 w-3 text-green-600" />
                  <span>Lyzr Agent (Live)</span>
                </>
              ) : (
                <>
                  <Bot className="h-3 w-3 text-gray-400" />
                  <span>Demo Mode</span>
                </>
              )}
            </div>
            {agentError && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                {agentError}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {folders.map(folder => (
            <div key={folder.id}>
              <div
                className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-all ${
                  dragOverFolder === folder.id ? 'bg-blue-50 border-2 border-blue-400' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div className="flex items-center gap-2 flex-1" onClick={() => toggleFolder(folder.id)}>
                  {collapsedFolders.has(folder.id) ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <Folder className="h-4 w-4" style={{ color: folder.color }} />
                  {renamingFolderId === folder.id ? (
                    <input
                      type="text"
                      value={renameFolderValue}
                      onChange={(e) => setRenameFolderValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameFolder(folder.id, renameFolderValue);
                        if (e.key === 'Escape') setRenamingFolderId(null);
                      }}
                      onBlur={() => setRenamingFolderId(null)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-black"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm font-medium">{folder.name}</span>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFolderMenu(showFolderMenu === folder.id ? null : folder.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                  {showFolderMenu === folder.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFolderId(folder.id);
                          setRenameFolderValue(folder.name);
                          setShowFolderMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.id);
                          setShowFolderMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!collapsedFolders.has(folder.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {sessions.filter(s => s.folder_id === folder.id).map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={activeSessionId === session.id}
                      isRenaming={renamingSessionId === session.id}
                      renameValue={renameValue}
                      onSelect={() => {
                        isPlayingDemoRef.current = false;
                        demoSessionIdRef.current = null;
                        setIsPlayingDemo(false);
                        setPlayingScenario(null);
                        setActiveSessionId(session.id);
                      }}
                      onRename={(name) => renameSession(session.id, name)}
                      onStartRename={() => {
                        setRenamingSessionId(session.id);
                        setRenameValue(session.session_name);
                      }}
                      onCancelRename={() => setRenamingSessionId(null)}
                      onRenameValueChange={setRenameValue}
                      onDuplicate={() => duplicateSession(session.id)}
                      onDelete={() => deleteSession(session.id)}
                      onDragStart={() => handleDragStart(session.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {unfiledSessions.length > 0 && (
            <div
              className={`space-y-1 ${dragOverFolder === null ? 'bg-gray-50 rounded-lg p-2' : ''}`}
              onDragOver={(e) => handleDragOver(e, null)}
              onDrop={(e) => handleDrop(e, null)}
            >
              {unfiledSessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  isRenaming={renamingSessionId === session.id}
                  renameValue={renameValue}
                  onSelect={() => {
                    isPlayingDemoRef.current = false;
                    demoSessionIdRef.current = null;
                    setIsPlayingDemo(false);
                    setPlayingScenario(null);
                    setActiveSessionId(session.id);
                  }}
                  onRename={(name) => renameSession(session.id, name)}
                  onStartRename={() => {
                    setRenamingSessionId(session.id);
                    setRenameValue(session.session_name);
                  }}
                  onCancelRename={() => setRenamingSessionId(null)}
                  onRenameValueChange={setRenameValue}
                  onDuplicate={() => duplicateSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                  onDragStart={() => handleDragStart(session.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeSessionId ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-2xl px-4 py-3 rounded-2xl bg-white border border-gray-200">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-gray-200">
              {!useLyzrAgent && !isPlayingDemo && !isCompleted && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Demo Scenarios:
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {demoScenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => playDemoScenario(scenario)}
                        className={`group relative px-5 py-3 rounded-xl text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 bg-gradient-to-r ${scenario.color}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{scenario.icon}</span>
                          <div className="text-left">
                            <div className="font-semibold text-sm">{scenario.title}</div>
                            <div className="text-xs opacity-90">{scenario.description}</div>
                          </div>
                          <Play className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    Click any scenario to watch an automated conversation demo
                  </p>
                </div>
              )}

              {isCompleted ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">✅</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-green-900">Discovery Complete!</h4>
                        <p className="text-xs text-green-700 mt-1">
                          Your workflow has been analyzed and the calculator is ready with smart defaults
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleProceedToCalculator}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="h-5 w-5" />
                    Proceed to Business Calculator
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              ) : isPlayingDemo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-4 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl">
                    <div className="flex items-center gap-3">
                      {demoPaused ? (
                        <Pause className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Loader className="h-5 w-5 animate-spin text-blue-600" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          {demoPaused ? 'Demo Paused' : `Playing: ${playingScenario?.title}`}
                        </p>
                        <p className="text-xs text-blue-700">
                          Step {scenarioStep} of {playingScenario?.conversation.length} • {demoSpeed}x speed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDemoPaused(!demoPaused)}
                        className="p-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        title={demoPaused ? 'Resume' : 'Pause'}
                      >
                        {demoPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
                          isPlayingDemoRef.current = false;
                          demoSessionIdRef.current = null;
                          setIsPlayingDemo(false);
                          setPlayingScenario(null);
                          setScenarioStep(0);
                          setDemoPaused(false);
                        }}
                        className="px-4 py-2 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        Stop Demo
                      </button>
                      <button
                        onClick={() => {
                          if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
                          isPlayingDemoRef.current = false;
                          demoSessionIdRef.current = null;
                          setIsPlayingDemo(false);
                          setPlayingScenario(null);
                          setScenarioStep(0);
                          setDemoPaused(false);
                          createNewSession();
                        }}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        title="Reset and start new conversation"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4">
                    <span className="text-xs font-medium text-gray-600">Speed:</span>
                    <div className="flex gap-2">
                      {[0.5, 1, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setDemoSpeed(speed)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                            demoSpeed === speed
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : useLyzrAgent && !isTyping ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && userInput && handleUserResponse(userInput)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <button
                    onClick={() => userInput && handleUserResponse(userInput)}
                    disabled={!userInput}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              ) : currentQuestion && !isTyping ? (
                <div className="space-y-3">
                  {currentQuestion.type === 'text' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && userInput && handleUserResponse(userInput)}
                        placeholder="Type your answer..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <button
                        onClick={() => userInput && handleUserResponse(userInput)}
                        disabled={!userInput}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {currentQuestion.type === 'number' && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && userInput && handleUserResponse(parseInt(userInput) || 0)}
                        placeholder="Enter a number..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <button
                        onClick={() => userInput && handleUserResponse(parseInt(userInput) || 0)}
                        disabled={!userInput}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {currentQuestion.type === 'choice' && currentQuestion.options && (
                    <div className="space-y-2">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleUserResponse(option)}
                          className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-all"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'multiselect' && currentQuestion.options && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {currentQuestion.options.map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-black cursor-pointer transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={selectedChoices.includes(option)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedChoices(prev => [...prev, option]);
                                } else {
                                  setSelectedChoices(prev => prev.filter(c => c !== option));
                                }
                              }}
                              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => selectedChoices.length > 0 && handleUserResponse(selectedChoices)}
                        disabled={selectedChoices.length === 0}
                        className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-600 mb-6">Start a new conversation to begin</p>
              <button
                onClick={createNewSession}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  onSelect: () => void;
  onRename: (name: string) => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onRenameValueChange: (value: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}

function SessionItem({
  session,
  isActive,
  isRenaming,
  renameValue,
  onSelect,
  onRename,
  onStartRename,
  onCancelRename,
  onRenameValueChange,
  onDuplicate,
  onDelete,
  onDragStart,
}: SessionItemProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all group ${
        isActive
          ? 'bg-black text-white border-black'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => onRenameValueChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRename(renameValue);
                  if (e.key === 'Escape') onCancelRename();
                }}
                onBlur={() => onCancelRename()}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded text-black"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="font-medium truncate text-sm">{session.session_name}</p>
            )}
          </div>
          <p className={`text-xs mt-1 ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
            {new Date(session.created_at).toLocaleDateString()}
          </p>
          {session.status === 'completed' && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              Completed
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 rounded"
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
