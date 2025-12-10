using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaffePomodoro.Api.DTOs;
using CaffePomodoro.Api.Services;

namespace CaffePomodoro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(IUserService userService, ILogger<SettingsController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene la configuración del usuario
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var settings = await _userService.GetSettingsAsync(userId.Value);
        return Ok(settings);
    }

    /// <summary>
    /// Actualiza la configuración del usuario
    /// </summary>
    [HttpPatch]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateUserSettingsDto dto)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Validaciones
        if (dto.WorkDurationMinutes.HasValue && (dto.WorkDurationMinutes < 1 || dto.WorkDurationMinutes > 120))
            return BadRequest("Work duration must be between 1 and 120 minutes");
        
        if (dto.ShortBreakMinutes.HasValue && (dto.ShortBreakMinutes < 1 || dto.ShortBreakMinutes > 30))
            return BadRequest("Short break must be between 1 and 30 minutes");
        
        if (dto.LongBreakMinutes.HasValue && (dto.LongBreakMinutes < 1 || dto.LongBreakMinutes > 60))
            return BadRequest("Long break must be between 1 and 60 minutes");
        
        if (dto.SessionsBeforeLongBreak.HasValue && (dto.SessionsBeforeLongBreak < 1 || dto.SessionsBeforeLongBreak > 10))
            return BadRequest("Sessions before long break must be between 1 and 10");

        var settings = await _userService.UpdateSettingsAsync(userId.Value, dto);
        if (settings == null) return NotFound();

        return Ok(settings);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value 
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
