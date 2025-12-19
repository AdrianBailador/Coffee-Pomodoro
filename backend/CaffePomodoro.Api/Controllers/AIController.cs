using Microsoft.AspNetCore.Mvc;
using CaffePomodoro.Api.Services;

namespace CaffePomodoro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private readonly IAIService _aiService;

    public AIController(IAIService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("suggest")]
    public async Task<IActionResult> GetSuggestions([FromBody] SuggestRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TaskTitle))
        {
            return BadRequest("Task title is required");
        }

        var suggestions = await _aiService.GetTaskSuggestions(request.TaskTitle);
        return Ok(suggestions);
    }
}

public class SuggestRequest
{
    public string TaskTitle { get; set; } = "";
}