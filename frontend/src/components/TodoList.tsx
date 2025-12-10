import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Circle, Coffee, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  completed_pomodoros: number;
  estimated_pomodoros: number;
}

interface TodoListProps {
  selectedTaskId?: string;
  onSelectTask: (taskId: string | undefined) => void;
}

export function TodoList({ selectedTaskId, onSelectTask }: TodoListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load tasks from Supabase
  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      // Guest mode - use localStorage
      const saved = localStorage.getItem('caffe-pomodoro-tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert localStorage format to match Supabase format
          setTasks(parsed.map((t: any) => ({
            id: t.id,
            title: t.title,
            is_completed: t.completed || t.is_completed || false,
            completed_pomodoros: t.pomodoros || t.completed_pomodoros || 0,
            estimated_pomodoros: t.estimated || t.estimated_pomodoros || 1
          })));
        } catch {
          setTasks([]);
        }
      }
      setLoading(false);
    }
  }, [user]);

  // Save to localStorage for guest mode
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
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (user) {
      // Logged in - save to Supabase
      const { data, error } = await supabase
        .from('todo_tasks')
        .insert({
          user_id: user.id,
          title: newTaskTitle.trim(),
          is_completed: false,
          completed_pomodoros: 0,
          estimated_pomodoros: 1,
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
      // Guest mode - save to localStorage
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        is_completed: false,
        completed_pomodoros: 0,
        estimated_pomodoros: 1
      };
      setTasks(prev => [...prev, newTask]);
    }

    setNewTaskTitle('');
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

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

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
      <button
        type="button"
        aria-label="Expand or collapse tasks"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-coffee-50 dark:bg-coffee-800"
      >
        <div className="flex items-center gap-3">
          <Coffee className="w-5 h-5 text-espresso-500" />
          <h2 className="text-lg font-semibold text-coffee-800 dark:text-coffee-100">
            Tasks ({activeTasks.length})
          </h2>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New task..."
              className="flex-1 px-4 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-800 text-coffee-800 dark:text-coffee-100"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              aria-label="Add task"
              className="px-4 py-2 rounded-lg bg-espresso-500 text-white disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {activeTasks.length === 0 ? (
            <p className="text-center py-8 text-coffee-500">No pending tasks</p>
          ) : (
            <ul className="space-y-2">
              {activeTasks.map((task) => (
                <li
                  key={task.id}
                  onClick={() => handleSelectTask(task.id)}
                  className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-coffee-50 dark:bg-coffee-800 ${
                    selectedTaskId === task.id ? 'ring-2 ring-espresso-500' : ''
                  }`}
                >
                  <button
                    type="button"
                    aria-label="Mark as completed"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(task.id);
                    }}
                    className="text-coffee-400 hover:text-emerald-500"
                  >
                    <Circle className="w-5 h-5" />
                  </button>

                  <div className="flex-1">
                    <span className="text-coffee-800 dark:text-coffee-100">{task.title}</span>
                    <div className="text-xs text-coffee-500 flex items-center gap-1 mt-1">
                      <Coffee className="w-3 h-3" />
                      {task.completed_pomodoros}/{task.estimated_pomodoros}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Delete task"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-coffee-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

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