using CaffePomodoro.Api.DTOs;
using CaffePomodoro.Api.Infrastructure;
using CaffePomodoro.Api.Models;
using Supabase.Postgrest;

namespace CaffePomodoro.Api.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetTasksAsync(Guid userId);
    Task<TaskDto?> GetTaskByIdAsync(Guid userId, Guid taskId);
    Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskDto dto);
    Task<TaskDto?> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskDto dto);
    Task<bool> DeleteTaskAsync(Guid userId, Guid taskId);
    Task<TaskDto?> IncrementPomodoroAsync(Guid userId, Guid taskId);
    Task<IEnumerable<TaskDto>> ReorderTasksAsync(Guid userId, List<Guid> taskIds);
}

public class TaskService : ITaskService
{
    private readonly ISupabaseService _supabase;
    private readonly ILogger<TaskService> _logger;

    public TaskService(ISupabaseService supabase, ILogger<TaskService> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<IEnumerable<TaskDto>> GetTasksAsync(Guid userId)
    {
        try
        {
            var response = await _supabase.GetClient()
                .From<TodoTask>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Order("display_order", Constants.Ordering.Ascending)
                .Get();

            return response.Models.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tasks for user {UserId}", userId);
            return Enumerable.Empty<TaskDto>();
        }
    }

    public async Task<TaskDto?> GetTaskByIdAsync(Guid userId, Guid taskId)
    {
        try
        {
            var response = await _supabase.GetClient()
                .From<TodoTask>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("id", Constants.Operator.Equals, taskId.ToString())
                .Single();

            return response != null ? MapToDto(response) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting task {TaskId}", taskId);
            return null;
        }
    }

    public async Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskDto dto)
    {
        var task = new TodoTask
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = dto.Title,
            Description = dto.Description,
            EstimatedPomodoros = dto.EstimatedPomodoros,
            Priority = dto.Priority,
            IsCompleted = false,
            CompletedPomodoros = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            DisplayOrder = int.MaxValue
        };

        await _supabase.GetClient()
            .From<TodoTask>()
            .Insert(task);

        return MapToDto(task);
    }

    public async Task<TaskDto?> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskDto dto)
    {
        try
        {
            var response = await _supabase.GetClient()
                .From<TodoTask>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("id", Constants.Operator.Equals, taskId.ToString())
                .Single();

            if (response == null) return null;

            if (dto.Title != null) response.Title = dto.Title;
            if (dto.Description != null) response.Description = dto.Description;
            if (dto.IsCompleted.HasValue)
            {
                response.IsCompleted = dto.IsCompleted.Value;
                response.CompletedAt = dto.IsCompleted.Value ? DateTime.UtcNow : null;
            }
            if (dto.EstimatedPomodoros.HasValue) response.EstimatedPomodoros = dto.EstimatedPomodoros.Value;
            if (dto.Priority.HasValue) response.Priority = dto.Priority.Value;
            if (dto.DisplayOrder.HasValue) response.DisplayOrder = dto.DisplayOrder.Value;
            
            response.UpdatedAt = DateTime.UtcNow;

            await _supabase.GetClient()
                .From<TodoTask>()
                .Filter("id", Constants.Operator.Equals, taskId.ToString())
                .Update(response);

            return MapToDto(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating task {TaskId}", taskId);
            return null;
        }
    }

    public async Task<bool> DeleteTaskAsync(Guid userId, Guid taskId)
    {
        try
        {
            await _supabase.GetClient()
                .From<TodoTask>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("id", Constants.Operator.Equals, taskId.ToString())
                .Delete();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting task {TaskId}", taskId);
            return false;
        }
    }

    public async Task<TaskDto?> IncrementPomodoroAsync(Guid userId, Guid taskId)
    {
        try
        {
            var response = await _supabase.GetClient()
                .From<TodoTask>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("id", Constants.Operator.Equals, taskId.ToString())
                .Single();

            if (response == null) return null;

            response.CompletedPomodoros++;
            response.UpdatedAt = DateTime.UtcNow;

            await _supabase.GetClient()
                .From<TodoTask>()
                .Filter("id", Constants.Operator.Equals, taskId.ToString())
                .Update(response);

            return MapToDto(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing pomodoro for task {TaskId}", taskId);
            return null;
        }
    }

    public async Task<IEnumerable<TaskDto>> ReorderTasksAsync(Guid userId, List<Guid> taskIds)
    {
        try
        {
            for (int i = 0; i < taskIds.Count; i++)
            {
                var taskId = taskIds[i];
                var response = await _supabase.GetClient()
                    .From<TodoTask>()
                    .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                    .Filter("id", Constants.Operator.Equals, taskId.ToString())
                    .Single();

                if (response != null)
                {
                    response.DisplayOrder = i;
                    await _supabase.GetClient()
                        .From<TodoTask>()
                        .Filter("id", Constants.Operator.Equals, taskId.ToString())
                        .Update(response);
                }
            }

            return await GetTasksAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering tasks for user {UserId}", userId);
            return Enumerable.Empty<TaskDto>();
        }
    }

    private static TaskDto MapToDto(TodoTask task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.IsCompleted,
        task.EstimatedPomodoros,
        task.CompletedPomodoros,
        task.Priority,
        task.CreatedAt,
        task.CompletedAt,
        task.DisplayOrder
    );
}