using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaffePomodoro.Api.Infrastructure;
using CaffePomodoro.Api.Services;

namespace CaffePomodoro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ISupabaseService _supabase;
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ISupabaseService supabase,
        IUserService userService,
        ILogger<AuthController> logger)
    {
        _supabase = supabase;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Callback después de autenticación con Google
    /// El frontend envía el token de Supabase para sincronizar el usuario
    /// </summary>
    [HttpPost("sync")]
    [Authorize]
    public async Task<IActionResult> SyncUser()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var email = User.FindFirst("email")?.Value ?? "";
        var displayName = User.FindFirst("name")?.Value;
        var avatarUrl = User.FindFirst("picture")?.Value;

        try
        {
            var user = await _supabase.CreateOrUpdateUserAsync(
                userId.Value, email, displayName, avatarUrl);

            var profile = await _userService.GetProfileAsync(userId.Value);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing user {UserId}", userId);
            return StatusCode(500, "Error syncing user");
        }
    }

    /// <summary>
    /// Obtiene el perfil del usuario actual
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var profile = await _userService.GetProfileAsync(userId.Value);
        if (profile == null)
            return NotFound();

        return Ok(profile);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value 
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim))
            return null;

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
