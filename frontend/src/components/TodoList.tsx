import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Circle, Coffee, ChevronDown, ChevronUp, Calendar, Clock, FileText, X, Sparkles, Tag, Lock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getTaskSuggestions } from '../services/aiService';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  completed_pomodoros: number;
  estimated_pomodoros: number;
  due_date: string | null;
  duration_days: number;
  notes: string | null;
  tags: string[];
  category: string;
  priority: string;
}

interface TodoListProps {
  selectedTaskId?: string;
  onSelectTask: (taskId: string | undefined) => void;
  onUpgradeClick?: () => void;
}

const MAX_FREE_TASKS = 4;

export function TodoList({ selectedTaskId, onSelectTask, onUpgradeClick }: TodoListProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(1);
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskCategory, setNewTaskCategory] = useState('Other');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState(1);
  const [customTag, setCustomTag] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  // AI Suggestions (stored separately until user clicks)
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([]);
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState('');
  const [aiSuggestedPriority, setAiSuggestedPriority] = useState('');
  const [aiSuggestedPomodoros, setAiSuggestedPomodoros] = useState(0);

  const isGuest = localStorage.getItem('caffe-pomodoro-guest') === 'true';

  useEffect(() => {
    if (user) {
      loadTasks();
    } else if (isGuest) {
      const saved = localStorage.getItem('caffe-pomodoro-tasks');
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch {
          setTasks([]);
        }
      }
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user && tasks.length > 0) {
      localStorage.setItem('caffe-pomodoro-tasks', JSON.stringify(tasks));
    }
  }, [tasks, user]);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todo_tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleGetAISuggestions = async () => {
    if (!newTaskTitle.trim()) return;

    // Check if premium
    if (!isPremium) {
      if (onUpgradeClick) {
        onUpgradeClick();
      }
      return;
    }

    setAiLoading(true);
    try {
      const suggestions = await getTaskSuggestions(newTaskTitle);
      setAiSuggestedTags(suggestions.tags);
      setAiSuggestedCategory(suggestions.category);
      setAiSuggestedPriority(suggestions.priority);
      setAiSuggestedPomodoros(suggestions.estimatedPomodoros);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    }
    setAiLoading(false);
  };

  const handleOpenAddForm = () => {
    // Check task limit for free users
    if (!isPremium && activeTasks.length >= MAX_FREE_TASKS) {
      if (onUpgradeClick) {
        onUpgradeClick();
      }
      return;
    }
    setShowAddForm(true);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Double check task limit
    if (!isPremium && activeTasks.length >= MAX_FREE_TASKS) {
      if (onUpgradeClick) {
        onUpgradeClick();
      }
      return;
    }

    const newTask: Partial<Task> = {
      title: newTaskTitle.trim(),
      is_completed: false,
      completed_pomodoros: 0,
      estimated_pomodoros: newTaskPomodoros,
      due_date: newTaskDueDate || null,
      duration_days: newTaskDuration,
      notes: newTaskNotes.trim() || null,
      tags: newTaskTags,
      category: newTaskCategory,
      priority: newTaskPriority
    };

    if (user) {
      const { data, error } = await supabase
        .from('todo_tasks')
        .insert({
          user_id: user.id,
          ...newTask,
          display_order: tasks.length
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
      } else if (data) {
        setTasks(prev => [...prev, data]);
      }
    } else {
      const taskWithId: Task = {
        ...newTask as Task,
        id: Date.now().toString()
      };
      setTasks(prev => [...prev, taskWithId]);
    }

    resetForm();
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskDuration(1);
    setNewTaskNotes('');
    setNewTaskTags([]);
    setNewTaskCategory('Other');
    setNewTaskPriority('Medium');
    setNewTaskPomodoros(1);
    setShowAddForm(false);
    setShowSuggestions(false);
    setCustomTag('');
    setAiSuggestedTags([]);
    setAiSuggestedCategory('');
    setAiSuggestedPriority('');
    setAiSuggestedPomodoros(0);
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = !task.is_completed;

    if (user) {
      const { error } = await supabase
        .from('todo_tasks')
        .update({
          is_completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }
    }

    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, is_completed: newStatus } : t
    ));

    if (taskId === selectedTaskId) {
      onSelectTask(undefined);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (user) {
      const { error } = await supabase
        .from('todo_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));

    if (taskId === selectedTaskId) {
      onSelectTask(undefined);
    }
  };

  const handleSelectTask = (taskId: string) => {
    onSelectTask(selectedTaskId === taskId ? undefined : taskId);
  };

  const handleEditNotes = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingNotes(task.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!editingTaskId) return;

    if (user) {
      const { error } = await supabase
        .from('todo_tasks')
        .update({ notes: editingNotes.trim() || null })
        .eq('id', editingTaskId);

      if (error) {
        console.error('Error updating notes:', error);
        return;
      }
    }

    setTasks(prev => prev.map(t =>
      t.id === editingTaskId ? { ...t, notes: editingNotes.trim() || null } : t
    ));

    setEditingTaskId(null);
    setEditingNotes('');
  };

  const removeTag = (tagToRemove: string) => {
    setNewTaskTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !newTaskTags.includes(customTag.trim())) {
      setNewTaskTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return null;

    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-500' };
    if (diffDays === 0) return { text: 'Today', color: 'text-amber-500' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-blue-500' };
    if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-emerald-500' };

    return {
      text: dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      color: 'text-coffee-500'
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-coffee-100 text-coffee-700 dark:bg-coffee-800 dark:text-coffee-300';
    }
  };

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const tasksRemaining = MAX_FREE_TASKS - activeTasks.length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-coffee-900 rounded-2xl shadow-lg p-8 border border-coffee-200 dark:border-coffee-700">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-coffee-200 border-t-espresso-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-coffee-500">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-coffee-900 rounded-2xl shadow-lg overflow-hidden border border-coffee-200 dark:border-coffee-700">
      {/* Notes Edit Modal */}
      {editingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-coffee-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-coffee-800 dark:text-coffee-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-espresso-500" />
                Task Notes
              </h3>
              <button
                onClick={() => setEditingTaskId(null)}
                className="p-1 text-coffee-400 hover:text-coffee-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="Add notes for this task..."
              rows={5}
              aria-label="Task notes"
              className="w-full px-4 py-3 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="flex-1 py-2 rounded-lg bg-espresso-500 text-white font-medium hover:bg-espresso-600 transition-colors"
              >
                Save Notes
              </button>
              <button
                onClick={() => setEditingTaskId(null)}
                className="px-4 py-2 rounded-lg bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Expand or collapse tasks"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-coffee-50 dark:bg-coffee-800"
      >
        <div className="flex items-center gap-3">
          <Coffee className="w-5 h-5 text-espresso-500" />
          <h2 className="text-lg font-semibold text-coffee-800 dark:text-coffee-100">
            Tasks ({activeTasks.length}{!isPremium && `/${MAX_FREE_TASKS}`})
          </h2>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Task Limit Warning for Free Users */}
          {!isPremium && tasksRemaining <= 1 && tasksRemaining > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {tasksRemaining} task remaining on free plan
              </p>
            </div>
          )}

          {/* Add Task Button / Form */}
          {!showAddForm ? (
            <button
              onClick={handleOpenAddForm}
              className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl transition-colors ${
                !isPremium && activeTasks.length >= MAX_FREE_TASKS
                  ? 'border-coffee-200 dark:border-coffee-700 text-coffee-400 cursor-pointer'
                  : 'border-coffee-200 dark:border-coffee-700 text-coffee-500 hover:border-espresso-500 hover:text-espresso-500'
              }`}
            >
              {!isPremium && activeTasks.length >= MAX_FREE_TASKS ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Upgrade to add more tasks</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add new task</span>
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleAddTask} className="space-y-3 p-4 bg-coffee-50 dark:bg-coffee-800 rounded-xl overflow-hidden">
              {/* Task Title + AI Button */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="new-task-title" className="sr-only">Task name</label>
                  <input
                    id="new-task-title"
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => {
                      setNewTaskTitle(e.target.value);
                      setShowSuggestions(false);
                    }}
                    placeholder="Task name..."
                    autoFocus
                    aria-label="Task name"
                    className="w-full px-4 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGetAISuggestions}
                  disabled={!newTaskTitle.trim() || aiLoading}
                  className={`px-3 py-2 rounded-lg text-white disabled:opacity-50 transition-all flex items-center gap-1 ${
                    isPremium
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`}
                  aria-label={isPremium ? 'Get AI suggestions' : 'AI suggestions (Premium)'}
                  title={isPremium ? 'Get AI suggestions' : 'Upgrade to Premium for AI suggestions'}
                >
                  {aiLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isPremium ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* AI Suggestions (click to apply) */}
              {showSuggestions && (aiSuggestedTags.length > 0 || aiSuggestedCategory || aiSuggestedPriority || aiSuggestedPomodoros > 0) && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">AI Suggestions (click to apply)</span>
                  </div>

                  {/* Suggested Tags */}
                  {aiSuggestedTags.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-purple-600 dark:text-purple-400">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {aiSuggestedTags.map((tag, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!newTaskTags.includes(tag)) {
                                setNewTaskTags(prev => [...prev, tag]);
                              }
                              setAiSuggestedTags(prev => prev.filter(t => t !== tag));
                            }}
                            className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Category, Priority, Pomodoros */}
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestedCategory && aiSuggestedCategory !== newTaskCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTaskCategory(aiSuggestedCategory);
                          setAiSuggestedCategory('');
                        }}
                        className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                      >
                        + 📁 {aiSuggestedCategory}
                      </button>
                    )}

                    {aiSuggestedPriority && aiSuggestedPriority !== newTaskPriority && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTaskPriority(aiSuggestedPriority);
                          setAiSuggestedPriority('');
                        }}
                        className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                      >
                        + ⚡ {aiSuggestedPriority}
                      </button>
                    )}

                    {aiSuggestedPomodoros > 0 && aiSuggestedPomodoros !== newTaskPomodoros && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTaskPomodoros(aiSuggestedPomodoros);
                          setAiSuggestedPomodoros(0);
                        }}
                        className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                      >
                        + 🍅 {aiSuggestedPomodoros} pomodoro{aiSuggestedPomodoros > 1 ? 's' : ''}
                      </button>
                    )}

                    {/* Apply All Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewTaskTags(prev => [...prev, ...aiSuggestedTags.filter(t => !prev.includes(t))]);
                        if (aiSuggestedCategory) setNewTaskCategory(aiSuggestedCategory);
                        if (aiSuggestedPriority) setNewTaskPriority(aiSuggestedPriority);
                        if (aiSuggestedPomodoros > 0) setNewTaskPomodoros(aiSuggestedPomodoros);
                        setAiSuggestedTags([]);
                        setAiSuggestedCategory('');
                        setAiSuggestedPriority('');
                        setAiSuggestedPomodoros(0);
                      }}
                      className="px-3 py-1 text-xs rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors font-medium"
                    >
                      Apply All
                    </button>
                  </div>
                </div>
              )}

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-xs text-coffee-500 dark:text-coffee-400">
                  <Tag className="w-3 h-3" />
                  Tags
                </label>

                {/* Selected Tags */}
                {newTaskTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newTaskTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-espresso-100 dark:bg-espresso-800 text-espresso-700 dark:text-espresso-200 border border-espresso-200 dark:border-espresso-600"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Tags */}
                <div className="flex flex-wrap gap-1">
                  {['💼 Work', '📚 Study', '🏠 Home', '💪 Health', '📧 Email', '👥 Meeting', '🛒 Shopping', '💰 Finance', '🎨 Creative', '🔧 Maintenance'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!newTaskTags.includes(tag)) {
                          setNewTaskTags(prev => [...prev, tag]);
                        }
                      }}
                      disabled={newTaskTags.includes(tag)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${newTaskTags.includes(tag)
                        ? 'bg-coffee-200 dark:bg-coffee-700 text-coffee-400 dark:text-coffee-500 border-coffee-200 dark:border-coffee-700 cursor-not-allowed'
                        : 'bg-white dark:bg-coffee-900 text-coffee-600 dark:text-coffee-300 border-coffee-200 dark:border-coffee-600 hover:border-espresso-500 hover:text-espresso-500'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Add custom tag..."
                    aria-label="Custom tag"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!customTag.trim()}
                    className="px-3 py-1.5 text-sm rounded-lg bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Priority & Category Row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="new-task-priority" className="flex items-center gap-1 text-xs text-coffee-500 dark:text-coffee-400 mb-1">
                    ⚡ Priority
                  </label>
                  <select
                    id="new-task-priority"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    aria-label="Priority"
                    className="w-full px-3 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="new-task-category" className="flex items-center gap-1 text-xs text-coffee-500 dark:text-coffee-400 mb-1">
                    📁 Category
                  </label>
                  <select
                    id="new-task-category"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    aria-label="Category"
                    className="w-full px-3 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-500"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Study">Study</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Home">Home</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="new-task-notes" className="flex items-center gap-1 text-xs text-coffee-500 dark:text-coffee-400 mb-1">
                  <FileText className="w-3 h-3" />
                  Notes (optional)
                </label>
                <textarea
                  id="new-task-notes"
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                  aria-label="Task notes"
                  className="w-full px-3 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-500 resize-none"
                />
              </div>

              {/* Due Date & Pomodoros Row */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="w-full sm:flex-1 overflow-hidden">
                  <label htmlFor="new-task-due-date" className="flex items-center gap-1 text-xs text-coffee-500 dark:text-coffee-400 mb-1">
                    <Calendar className="w-3 h-3" />
                    Due date
                  </label>
                  <input
                    id="new-task-due-date"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    aria-label="Due date"
                    className="w-full box-border px-3 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-500"
                    style={{ maxWidth: '100%' }}
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <label htmlFor="new-task-pomodoros" className="flex items-center gap-1 text-xs text-coffee-500 dark:text-coffee-400 mb-1">
                    <Coffee className="w-3 h-3" />
                    Pomodoros
                  </label>
                  <input
                    id="new-task-pomodoros"
                    type="number"
                    value={newTaskPomodoros}
                    onChange={(e) => setNewTaskPomodoros(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="20"
                    aria-label="Estimated pomodoros"
                    className="w-full px-3 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 py-2 rounded-lg bg-espresso-500 text-white font-medium disabled:opacity-50 hover:bg-espresso-600 transition-colors"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          {activeTasks.length === 0 ? (
            <p className="text-center py-8 text-coffee-500">No pending tasks</p>
          ) : (
            <ul className="space-y-2">
              {activeTasks.map((task) => {
                const dueDateInfo = formatDueDate(task.due_date);
                return (
                  <li
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer bg-coffee-50 dark:bg-coffee-800 ${selectedTaskId === task.id ? 'ring-2 ring-espresso-500' : ''
                      }`}
                  >
                    <button
                      type="button"
                      aria-label="Mark as completed"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(task.id);
                      }}
                      className="mt-0.5 text-coffee-400 hover:text-emerald-500"
                    >
                      <Circle className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-coffee-800 dark:text-coffee-100">{task.title}</span>
                        {task.priority && task.priority !== 'Medium' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs px-1.5 py-0.5 rounded-full bg-coffee-100 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes preview */}
                      {task.notes && (
                        <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-1 line-clamp-1">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {/* Pomodoros */}
                        <div className="text-xs text-coffee-500 flex items-center gap-1">
                          <Coffee className="w-3 h-3" />
                          {task.completed_pomodoros}/{task.estimated_pomodoros}
                        </div>

                        {/* Due Date */}
                        {dueDateInfo && (
                          <div className={`text-xs flex items-center gap-1 ${dueDateInfo.color}`}>
                            <Calendar className="w-3 h-3" />
                            {dueDateInfo.text}
                          </div>
                        )}

                        {/* Duration */}
                        {task.duration_days > 1 && (
                          <div className="text-xs text-coffee-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.duration_days}d
                          </div>
                        )}

                        {/* Category */}
                        {task.category && task.category !== 'Other' && (
                          <div className="text-xs text-coffee-500">
                            📁 {task.category}
                          </div>
                        )}

                        {/* Notes indicator */}
                        {task.notes && (
                          <div className="text-xs text-coffee-500 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Edit notes"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNotes(task);
                        }}
                        className="p-1 text-coffee-400 hover:text-espresso-500"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete task"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="p-1 text-coffee-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="pt-4 border-t border-coffee-200 dark:border-coffee-700">
              <button
                type="button"
                aria-label="Show completed tasks"
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-sm text-coffee-500 flex items-center gap-2"
              >
                {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Completed ({completedTasks.length})
              </button>

              {showCompleted && (
                <ul className="mt-2 space-y-2">
                  {completedTasks.map((task) => (
                    <li key={task.id} className="group flex items-center gap-3 p-3 rounded-lg bg-coffee-50/50 dark:bg-coffee-800/50">
                      <button
                        type="button"
                        aria-label="Unmark task"
                        onClick={() => handleToggleComplete(task.id)}
                        className="text-emerald-500"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <span className="flex-1 text-coffee-500 line-through">{task.title}</span>
                      <button
                        type="button"
                        aria-label="Delete task"
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}