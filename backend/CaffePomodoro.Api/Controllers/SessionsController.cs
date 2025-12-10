using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaffePomodoro.Api.DTOs;
using CaffePomodoro.Api.Services;

namespace CaffePomodoro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly IPomodoroService _pomodoroService;
    private readonly IUserService _userService;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(
        IPomodoroService pomodoroService,
        IUserService userService,
        ILogger<SessionsController> logger)
    {
        _pomodoroService = pomodoroService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Inicia una nueva sesión de pomodoro
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartSession([FromBody] StartSessionDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var settings = await _userService.GetSettingsAsync(userId.Value);
        var session = await _pomodoroService.StartSessionAsync(userId.Value, dto, settings);
        
        return Ok(session);
    }

    /// <summary>
    /// Completa una sesión
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> CompleteSession(Guid id, [FromBody] CompleteSessionDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var session = await _pomodoroService.CompleteSessionAsync(userId.Value, id, dto);
        if (session == null) return NotFound();

        return Ok(session);
    }

    /// <summary>
    /// Obtiene la sesión actual (si existe)
    /// </summary>
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentSession()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var session = await _pomodoroService.GetCurrentSessionAsync(userId.Value);
        if (session == null) return NoContent();

        return Ok(session);
    }

    /// <summary>
    /// Obtiene el historial de sesiones
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int days = 7)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var sessions = await _pomodoroService.GetSessionHistoryAsync(userId.Value, days);
        return Ok(sessions);
    }

    /// <summary>
    /// Obtiene estadísticas del día
    /// </summary>
    [HttpGet("stats/today")]
    public async Task<IActionResult> GetTodayStats()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var stats = await _pomodoroService.GetTodayStatsAsync(userId.Value);
        return Ok(stats);
    }

    /// <summary>
    /// Obtiene estadísticas de la semana
    /// </summary>
    [HttpGet("stats/week")]
    public async Task<IActionResult> GetWeeklyStats()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var stats = await _pomodoroService.GetWeeklyStatsAsync(userId.Value);
        return Ok(stats);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value 
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
