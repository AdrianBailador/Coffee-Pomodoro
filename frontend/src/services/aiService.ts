const API_URL = import.meta.env.VITE_API_URL || 'https://coffee-pomodoro.onrender.com/api';

export interface TaskSuggestion {
  tags: string[];
  category: string;
  priority: string;
  estimatedPomodoros: number;
}

export async function getTaskSuggestions(taskTitle: string): Promise<TaskSuggestion> {
  try {
    const response = await fetch(`${API_URL}/ai/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskTitle }),
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }

    return await response.json();
  } catch (error) {
    console.error('AI suggestion error:', error);
    return getDefaultSuggestions(taskTitle);
  }
}

function getDefaultSuggestions(taskTitle: string): TaskSuggestion {
  const lower = taskTitle.toLowerCase();
  
  if (lower.includes('meeting') || lower.includes('reunión') || lower.includes('call')) {
    return { tags: ['👥 Meeting', '💼 Work'], category: 'Work', priority: 'High', estimatedPomodoros: 2 };
  }
  if (lower.includes('email') || lower.includes('correo')) {
    return { tags: ['📧 Email', '💼 Work'], category: 'Work', priority: 'Medium', estimatedPomodoros: 1 };
  }
  if (lower.includes('study') || lower.includes('estudiar') || lower.includes('learn')) {
    return { tags: ['📚 Study', '🎯 Learning'], category: 'Study', priority: 'Medium', estimatedPomodoros: 2 };
  }
  if (lower.includes('exercise') || lower.includes('gym') || lower.includes('ejercicio')) {
    return { tags: ['💪 Exercise', '❤️ Health'], category: 'Health', priority: 'Medium', estimatedPomodoros: 2 };
  }
  if (lower.includes('buy') || lower.includes('comprar') || lower.includes('shop')) {
    return { tags: ['🛒 Shopping'], category: 'Shopping', priority: 'Low', estimatedPomodoros: 1 };
  }
  
  return { tags: ['📝 Task'], category: 'Other', priority: 'Medium', estimatedPomodoros: 1 };
}