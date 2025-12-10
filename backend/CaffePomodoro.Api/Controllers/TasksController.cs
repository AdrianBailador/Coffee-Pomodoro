using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaffePomodoro.Api.DTOs;
using CaffePomodoro.Api.Services;

namespace CaffePomodoro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(ITaskService taskService, ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todas las tareas del usuario
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTasks()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var tasks = await _taskService.GetTasksAsync(userId.Value);
        return Ok(tasks);
    }

    /// <summary>
    /// Obtiene una tarea específica
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTask(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var task = await _taskService.GetTaskByIdAsync(userId.Value, id);
        if (task == null) return NotFound();

        return Ok(task);
    }

    /// <summary>
    /// Crea una nueva tarea
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest("Title is required");

        var task = await _taskService.CreateTaskAsync(userId.Value, dto);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    /// <summary>
    /// Actualiza una tarea
    /// </summary>
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var task = await _taskService.UpdateTaskAsync(userId.Value, id, dto);
        if (task == null) return NotFound();

        return Ok(task);
    }

    /// <summary>
    /// Elimina una tarea
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var success = await _taskService.DeleteTaskAsync(userId.Value, id);
        if (!success) return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Incrementa el contador de pomodoros completados para una tarea
    /// </summary>
    [HttpPost("{id:guid}/increment-pomodoro")]
    public async Task<IActionResult> IncrementPomodoro(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var task = await _taskService.IncrementPomodoroAsync(userId.Value, id);
        if (task == null) return NotFound();

        return Ok(task);
    }

    /// <summary>
    /// Reordena las tareas
    /// </summary>
    [HttpPost("reorder")]
    public async Task<IActionResult> ReorderTasks([FromBody] List<Guid> taskIds)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var tasks = await _taskService.ReorderTasksAsync(userId.Value, taskIds);
        return Ok(tasks);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value 
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
