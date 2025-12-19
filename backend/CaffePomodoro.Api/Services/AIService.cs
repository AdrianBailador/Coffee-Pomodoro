using System.Text;
using System.Text.Json;

namespace CaffePomodoro.Api.Services;

public interface IAIService
{
    Task<TaskSuggestion> GetTaskSuggestions(string taskTitle);
}

public class TaskSuggestion
{
    public List<string> Tags { get; set; } = new();
    public string Category { get; set; } = "";
    public string Priority { get; set; } = "Medium";
    public int EstimatedPomodoros { get; set; } = 1;
}

public class AIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<AIService> _logger;

    public AIService(IConfiguration configuration, ILogger<AIService> logger)
    {
        _httpClient = new HttpClient();
        _apiKey = configuration["Gemini:ApiKey"] ?? "";
        _logger = logger;
    }

    public async Task<TaskSuggestion> GetTaskSuggestions(string taskTitle)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Gemini API key not configured");
            return GetDefaultSuggestion(taskTitle);
        }

        try
        {
            var prompt = $@"Analyze this task and return a JSON response with suggestions.
Task: ""{taskTitle}""

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  ""tags"": [""tag1"", ""tag2""],
  ""category"": ""Work|Personal|Study|Health|Finance|Shopping|Home|Other"",
  ""priority"": ""High|Medium|Low"",
  ""estimatedPomodoros"": 1-8
}}

Rules:
- Tags: 2-4 relevant emoji+word tags like ""💼 Work"", ""📧 Email"", ""👥 Meeting"", ""📚 Study"", ""💪 Exercise"", ""🛒 Shopping"", ""🏠 Home"", ""💰 Finance""
- Category: Choose the most appropriate one
- Priority: Based on typical urgency of such tasks
- EstimatedPomodoros: Estimate based on task complexity (1 pomodoro = 25 min)";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}",
                content
            );

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini API error: {StatusCode}", response.StatusCode);
                return GetDefaultSuggestion(taskTitle);
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var geminiResponse = JsonSerializer.Deserialize<JsonElement>(responseJson);

            var textResponse = geminiResponse
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            // Clean up response (remove markdown code blocks if present)
            textResponse = textResponse?.Replace("```json", "").Replace("```", "").Trim();

            var suggestion = JsonSerializer.Deserialize<TaskSuggestion>(textResponse!, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return suggestion ?? GetDefaultSuggestion(taskTitle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Gemini API");
            return GetDefaultSuggestion(taskTitle);
        }
    }

    private TaskSuggestion GetDefaultSuggestion(string taskTitle)
    {
        // Fallback con reglas simples
        var suggestion = new TaskSuggestion
        {
            Tags = new List<string> { "📝 Task" },
            Category = "Other",
            Priority = "Medium",
            EstimatedPomodoros = 1
        };

        var lower = taskTitle.ToLower();

        if (lower.Contains("meeting") || lower.Contains("reunión") || lower.Contains("call"))
        {
            suggestion.Tags = new List<string> { "👥 Meeting", "💼 Work" };
            suggestion.Category = "Work";
        }
        else if (lower.Contains("email") || lower.Contains("correo"))
        {
            suggestion.Tags = new List<string> { "📧 Email", "💼 Work" };
            suggestion.Category = "Work";
        }
        else if (lower.Contains("study") || lower.Contains("estudiar") || lower.Contains("learn"))
        {
            suggestion.Tags = new List<string> { "📚 Study", "🎯 Learning" };
            suggestion.Category = "Study";
        }
        else if (lower.Contains("exercise") || lower.Contains("gym") || lower.Contains("ejercicio"))
        {
            suggestion.Tags = new List<string> { "💪 Exercise", "❤️ Health" };
            suggestion.Category = "Health";
        }
        else if (lower.Contains("buy") || lower.Contains("comprar") || lower.Contains("shop"))
        {
            suggestion.Tags = new List<string> { "🛒 Shopping" };
            suggestion.Category = "Shopping";
        }

        return suggestion;
    }
}