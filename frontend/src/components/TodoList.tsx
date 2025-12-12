import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Circle, Coffee, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  completed_pomodoros: number;
  estimated_pomodoros: number;
  due_date: string | null;
  duration_days: number;
}

interface TodoListProps {
  selectedTaskId?: string;
  onSelectTask: (taskId: string | undefined) => void;
}

export function TodoList({ selectedTaskId, onSelectTask }: TodoListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Partial<Task> = {
      title: newTaskTitle.trim(),
      is_completed: false,
      completed_pomodoros: 0,
      estimated_pomodoros: 1,
      due_date: newTaskDueDate || null,
      duration_days: newTaskDuration
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

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskDuration(1);
    setShowAddForm(false);
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
       {/* Add Task Button / Form */}
{!showAddForm ? (
  <button
    onClick={() => setShowAddForm(true)}
    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-coffee-200 dark:border-coffee-700 rounded-xl text-coffee-500 hover:border-espresso-500 hover:text-espresso-500 transition-colors"
  >
    <Plus className="w-5 h-5" />
    <span>Add new task</span>
  </button>
) : (
  <form onSubmit={handleAddTask} className="space-y-3 p-4 bg-coffee-50 dark:bg-coffee-800 rounded-xl">
    {/* Task Title */}
    <div>
      <label htmlFor="new-task-title" className="sr-only">Task name</label>
      <input
        id="new-task-title"
        type="text"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        placeholder="Task name..."
        autoFocus
        aria-label="Task name"
        className="w-full px-4 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500"
      />
    </div>

    {/* Due Date & Duration Row */}
    <div className="flex gap-3">
      {/* Due Date */}
      <div className="flex-1">
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
          className="w-full px-3 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-900 text-coffee-800 dark:text-coffee-100 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-500"
        />
      </div>

      {/* Duration */}
      <div className="w-24">
        <label htmlFor="new-task-duration" className="flex items-center gap-1 text-xs text-coffee-500 dark:text-coffee-400 mb-1">
          <Clock className="w-3 h-3" />
          Days
        </label>
        <input
          id="new-task-duration"
          type="number"
          value={newTaskDuration}
          onChange={(e) => setNewTaskDuration(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
          max="30"
          aria-label="Duration in days"
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
        onClick={() => {
          setShowAddForm(false);
          setNewTaskTitle('');
          setNewTaskDueDate('');
          setNewTaskDuration(1);
        }}
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
                    className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer bg-coffee-50 dark:bg-coffee-800 ${
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
                      className="mt-0.5 text-coffee-400 hover:text-emerald-500"
                    >
                      <Circle className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <span className="text-coffee-800 dark:text-coffee-100 block">{task.title}</span>
                      <div className="flex items-center gap-3 mt-1">
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