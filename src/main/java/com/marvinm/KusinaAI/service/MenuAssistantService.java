package com.marvinm.KusinaAI.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marvinm.KusinaAI.dto.menu.IngredientResponse;
import com.marvinm.KusinaAI.dto.menu.CostEstimationResponse;
import com.marvinm.KusinaAI.dto.menu.MenuHistoryResponse;
import com.marvinm.KusinaAI.dto.menu.MenuHealthResponse;
import com.marvinm.KusinaAI.dto.menu.MenuRecipeResponse;
import com.marvinm.KusinaAI.dto.menu.MenuSearchRequest;
import com.marvinm.KusinaAI.dto.menu.MenuSearchResponse;
import com.marvinm.KusinaAI.dto.menu.NutritionFactsResponse;
import com.marvinm.KusinaAI.dto.menu.SaveMenuHistoryRequest;
import com.marvinm.KusinaAI.entity.MenuHistoryEntity;
import com.marvinm.KusinaAI.entity.MenuSearchQuotaEntity;
import com.marvinm.KusinaAI.entity.UserEntity;
import com.marvinm.KusinaAI.repository.MenuHistoryRepository;
import com.marvinm.KusinaAI.repository.MenuSearchQuotaRepository;
import com.marvinm.KusinaAI.repository.UserRepository;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MenuAssistantService {

    private static final String GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String GEMINI_LIST_MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
    private static final Logger LOGGER = LoggerFactory.getLogger(MenuAssistantService.class);

    private final UserRepository userRepository;
    private final MenuHistoryRepository menuHistoryRepository;
    private final MenuSearchQuotaRepository menuSearchQuotaRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Map<String, CachedGeminiResult> geminiSearchCache = new ConcurrentHashMap<>();
    private volatile Instant geminiUnavailableUntil = Instant.EPOCH;
    private volatile String geminiUnavailableReason = "Google Gemini is currently unavailable. Please try again in the next 1 hour.";
    private volatile List<String> discoveredGeminiModels = List.of();
    private volatile Instant discoveredGeminiModelsAt = Instant.EPOCH;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${app.gemini.fallback-models:gemini-1.5-flash,gemini-1.5-pro}")
    private String geminiFallbackModels;

    @Value("${app.menu.daily-search-limit:5}")
    private int dailySearchLimit;

    @Value("${app.gemini.cooldown-minutes:60}")
    private long geminiCooldownMinutes;

    @Value("${app.gemini.cache-minutes:30}")
    private long geminiCacheMinutes;

    @Value("${app.gemini.model-discovery-cache-minutes:180}")
    private long geminiModelDiscoveryCacheMinutes;

    public MenuAssistantService(
        UserRepository userRepository,
        MenuHistoryRepository menuHistoryRepository,
        MenuSearchQuotaRepository menuSearchQuotaRepository
    ) {
        this.userRepository = userRepository;
        this.menuHistoryRepository = menuHistoryRepository;
        this.menuSearchQuotaRepository = menuSearchQuotaRepository;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();
    }

    public MenuSearchResponse searchMenu(String email, MenuSearchRequest request) {
        ensureGeminiAvailability();

        String query = request.query().trim();
        String cookMode = normalizeCookMode(request.cookMode());

        if (query.isEmpty()) {
            throw new IllegalArgumentException("Search query is required");
        }

        UserEntity user = getUser(email);
        MenuSearchQuotaEntity quota = getOrCreateQuota(user);

        if (quota.getSuccessfulSearches() >= dailySearchLimit) {
            throw new IllegalStateException(
                "Daily menu search limit reached (" + dailySearchLimit + "). Try again tomorrow."
            );
        }

        MenuSearchResponse result;

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            result = new MenuSearchResponse(
                buildFallbackRecipe(query, request.servings()),
                "fallback",
                "Gemini API key is not configured yet. Showing a structured sample menu response."
            );
        } else {
            try {
                MenuRecipeResponse cachedMenu = getCachedGeminiResult(query, request.servings(), cookMode);

                if (cachedMenu != null) {
                    result = new MenuSearchResponse(cachedMenu, "gemini", "Menu served from cache (Google Gemini) | Mode: " + cookModeLabel(cookMode));
                } else {
                    MenuRecipeResponse menu = searchWithGemini(query, request.servings(), cookMode);
                    cacheGeminiResult(query, request.servings(), cookMode, menu);
                    result = new MenuSearchResponse(menu, "gemini", "Menu generated by Google Gemini | Mode: " + cookModeLabel(cookMode));
                }
            } catch (GeminiUnavailableException ex) {
                throw ex;
            } catch (Exception ex) {
                LOGGER.warn("Gemini request failed for query '{}': {}", query, ex.getMessage());
                result = new MenuSearchResponse(
                    buildFallbackRecipe(query, request.servings()),
                    "fallback",
                    "Gemini request failed: " + ex.getMessage() + ". Showing a structured sample menu response instead. Mode: " + cookModeLabel(cookMode)
                );
            }
        }

        quota.setSuccessfulSearches(quota.getSuccessfulSearches() + 1);
        menuSearchQuotaRepository.save(quota);

        int remaining = Math.max(dailySearchLimit - quota.getSuccessfulSearches(), 0);

        return new MenuSearchResponse(
            result.menu(),
            result.source(),
            result.message() + " Remaining searches today: " + remaining + "."
        );
    }

    public MenuHealthResponse getMenuHealth() {
        if (isGeminiUnavailable()) {
            long retryAfterMinutes = minutesUntilAvailable();
            return new MenuHealthResponse(
                false,
                geminiUnavailableReason,
                retryAfterMinutes
            );
        }

        return new MenuHealthResponse(true, "Google Gemini is available", 0);
    }

    public MenuHistoryResponse saveHistory(String email, SaveMenuHistoryRequest request) {
        UserEntity user = getUser(email);
        MenuHistoryEntity history = new MenuHistoryEntity();
        history.setUser(user);
        history.setSearchQuery(request.searchQuery().trim());
        history.setMenuName(request.menu().menuName());
        history.setServings(request.menu().servings());
        history.setMenuJson(writeMenuJson(request.menu()));

        MenuHistoryEntity saved = menuHistoryRepository.save(history);
        return toHistoryResponse(saved);
    }

    public List<MenuHistoryResponse> getHistory(String email) {
        UserEntity user = getUser(email);
        return menuHistoryRepository.findByUserOrderByCreatedAtDesc(user).stream()
            .map(this::toHistoryResponse)
            .toList();
    }

    private MenuRecipeResponse searchWithGemini(String query, int servings, String cookMode) throws IOException, InterruptedException {
        ensureGeminiAvailability();

        String prompt = buildPrompt(query, servings, cookMode);
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", prompt))
            )),
            "generationConfig", Map.of(
                "responseMimeType", "application/json",
                "temperature", 0.6
            )
        );

        String body = objectMapper.writeValueAsString(requestBody);
        List<String> modelsToTry = resolveModelsToTry();
        boolean sawModelNotFound = false;
        String lastError = "";

        for (String modelName : modelsToTry) {
            try {
                return invokeGenerateContent(modelName, body, query, servings);
            } catch (GeminiModelNotFoundException ex) {
                sawModelNotFound = true;
                lastError = ex.getMessage();
                LOGGER.warn("Gemini model '{}' not found (404). Trying next model if available. Details: {}", modelName, lastError);
            }
        }

        if (sawModelNotFound) {
            List<String> discoveredModels = discoverGenerateContentModels();
            for (String modelName : discoveredModels) {
                if (modelsToTry.contains(modelName)) {
                    continue;
                }

                try {
                    LOGGER.info("Retrying Gemini request using discovered model '{}'.", modelName);
                    return invokeGenerateContent(modelName, body, query, servings);
                } catch (GeminiModelNotFoundException ex) {
                    lastError = ex.getMessage();
                }
            }

            throw new IllegalStateException(
                "Gemini request failed. Configured models and discovered models were not reachable. Tried configured: "
                    + String.join(", ", modelsToTry)
                    + ". Discovered: "
                    + String.join(", ", discoveredModels)
                    + ". Last provider details: "
                    + lastError
            );
        }

        throw new IllegalStateException(
            "Gemini request failed. None of the configured models were reachable. Tried: "
                + String.join(", ", modelsToTry)
                + ". Last provider details: "
                + lastError
        );
    }

    private MenuRecipeResponse invokeGenerateContent(String modelName, String body, String query, int servings)
        throws IOException, InterruptedException, GeminiModelNotFoundException {
        String url = GEMINI_ENDPOINT + modelName + ":generateContent?key="
            + URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8);

        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(45))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 429) {
            markGeminiUnavailable("Google Gemini quota has been exceeded. The application is currently not available. Please try again in the next 1 hour.");
            throw new GeminiUnavailableException(geminiUnavailableReason, minutesUntilAvailable());
        }

        if (response.statusCode() == 404) {
            throw new GeminiModelNotFoundException(summarizeProviderError(response));
        }

        if (response.statusCode() >= 400) {
            throw new IllegalStateException(summarizeProviderError(response));
        }

        JsonNode jsonNode = objectMapper.readTree(response.body());
        String candidateText = jsonNode.path("candidates")
            .path(0)
            .path("content")
            .path("parts")
            .path(0)
            .path("text")
            .asText();

        if (candidateText == null || candidateText.isBlank()) {
            throw new IllegalStateException("Gemini returned an empty response");
        }

        MenuRecipeResponse parsed = objectMapper.readValue(cleanJson(candidateText), MenuRecipeResponse.class);
        return normalizeRecipe(parsed, query, servings);
    }

    private List<String> discoverGenerateContentModels() throws IOException, InterruptedException {
        Instant now = Instant.now();
        if (!discoveredGeminiModels.isEmpty()) {
            Instant expiresAt = discoveredGeminiModelsAt.plus(Duration.ofMinutes(Math.max(geminiModelDiscoveryCacheMinutes, 1)));
            if (expiresAt.isAfter(now)) {
                return discoveredGeminiModels;
            }
        }

        String url = GEMINI_LIST_MODELS_ENDPOINT + "?key=" + URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(30))
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            throw new IllegalStateException("Unable to discover Gemini models. " + summarizeProviderError(response));
        }

        JsonNode models = objectMapper.readTree(response.body()).path("models");
        LinkedHashSet<String> discovered = new LinkedHashSet<>();

        if (models.isArray()) {
            for (JsonNode model : models) {
                boolean supportsGenerateContent = false;
                JsonNode methods = model.path("supportedGenerationMethods");
                if (methods.isArray()) {
                    for (JsonNode method : methods) {
                        if ("generateContent".equalsIgnoreCase(method.asText())) {
                            supportsGenerateContent = true;
                            break;
                        }
                    }
                }

                if (!supportsGenerateContent) {
                    continue;
                }

                String name = normalizeModelName(model.path("name").asText());
                if (!name.isBlank() && name.contains("gemini")) {
                    discovered.add(name);
                }
            }
        }

        discoveredGeminiModels = new ArrayList<>(discovered);
        discoveredGeminiModelsAt = now;
        return discoveredGeminiModels;
    }

    private List<String> resolveModelsToTry() {
        LinkedHashSet<String> models = new LinkedHashSet<>();
        models.add(normalizeModelName(geminiModel));

        if (geminiFallbackModels != null && !geminiFallbackModels.isBlank()) {
            for (String model : geminiFallbackModels.split(",")) {
                String trimmed = model.trim();
                if (!trimmed.isEmpty()) {
                    models.add(normalizeModelName(trimmed));
                }
            }
        }

        return new ArrayList<>(models);
    }

    private String normalizeModelName(String modelName) {
        String normalized = modelName == null ? "" : modelName.trim();
        if (normalized.startsWith("models/")) {
            return normalized.substring("models/".length());
        }
        return normalized;
    }

    private String summarizeProviderError(HttpResponse<String> response) {
        String body = response.body();
        if (body == null || body.isBlank()) {
            return "Gemini request failed with status " + response.statusCode();
        }

        String compactBody = body.replace('\n', ' ').replace('\r', ' ').trim();
        if (compactBody.length() > 300) {
            compactBody = compactBody.substring(0, 300) + "...";
        }

        return "Gemini request failed with status " + response.statusCode() + ": " + compactBody;
    }

    private String buildPrompt(String query, int servings, String cookMode) {
        String styleRule = switch (cookMode) {
            case "RESTAURANT_STYLE" -> "Make the dish plating and flavor profile restaurant-style while still practical for home cooking.";
            case "BUDGET_SAVER" -> "Prioritize affordable ingredients and low cooking cost while keeping flavor acceptable.";
            case "HEALTHY_LIGHT" -> "Prioritize lower oil, balanced macros, and healthier cooking methods like steaming, grilling, or sauteing.";
            case "FIESTA_PARTY" -> "Make the dish more festive and shareable for gatherings, with bold flavors and presentation.";
            default -> "Keep the dish family-friendly and practical for everyday home cooking.";
        };

        return """
            You are Kusina AI, a household cooking assistant.
            Return only valid JSON with this exact schema:
            {
              "menuName": "string",
              "description": "string",
              "servings": number,
                            "imageUrl": "string",
              "ingredients": [
                { "name": "string", "quantity": number, "unit": "string" }
              ],
                            "instructions": ["string"],
                            "nutritionFacts": {
                                "calories": number,
                                "proteinGrams": number,
                                "carbohydratesGrams": number,
                                "fatGrams": number
                            },
                            "costEstimation": {
                                "currency": "PHP",
                                "estimatedTotal": number,
                                "notes": "string"
                            }
            }

            Rules:
            - Suggest exactly one practical dish or menu for the request.
            - The request is: %s
            - Set servings to %d.
                - Cook mode is: %s.
                - Style instruction: %s
            - Include exactly one imageUrl for the dish; must be a direct https URL to an image.
            - Keep ingredient quantities numeric only.
            - Keep units short like g, kg, ml, cup, tbsp, tsp, piece.
            - Give 4 to 7 concise cooking steps.
            - No markdown, no code fences, no commentary.
                """.formatted(query, servings, cookModeLabel(cookMode), styleRule);
    }

    private MenuRecipeResponse buildFallbackRecipe(String query, int servings) {
        return new MenuRecipeResponse(
            toMenuName(query),
            "A simple household-friendly dish suggestion based on your search.",
            servings,
            List.of(
                new IngredientResponse("Chicken", 0.25 * servings, "kg"),
                new IngredientResponse("Soy sauce", 1.0 * servings, "tbsp"),
                new IngredientResponse("Garlic", 2.0 * servings, "clove"),
                new IngredientResponse("Rice", 0.75 * servings, "cup")
            ),
            List.of(
                "Prepare and portion all ingredients.",
                "Saute the garlic until aromatic.",
                "Cook the main protein with seasoning until tender.",
                "Serve the dish warm with rice."
            ),
            buildFallbackImageUrl(query),
            new NutritionFactsResponse(
                320.0 * servings,
                22.0 * servings,
                28.0 * servings,
                9.0 * servings
            ),
            new CostEstimationResponse(
                "PHP",
                85.0 * servings,
                "Estimated household ingredient cost based on average local market pricing."
            )
        );
    }

    private MenuRecipeResponse normalizeRecipe(MenuRecipeResponse parsed, String query, int servings) {
        List<IngredientResponse> ingredients = parsed.ingredients() == null
            ? List.of()
            : parsed.ingredients().stream()
                .map(ingredient -> new IngredientResponse(
                    ingredient.name(),
                    ingredient.quantity(),
                    ingredient.unit() == null || ingredient.unit().isBlank() ? "piece" : ingredient.unit()
                ))
                .toList();

        List<String> instructions = parsed.instructions() == null ? List.of() : parsed.instructions();
        String imageUrl = normalizeImageUrl(parsed.imageUrl(), query);
        NutritionFactsResponse nutritionFacts = normalizeNutritionFacts(parsed.nutritionFacts(), servings);
        CostEstimationResponse costEstimation = normalizeCostEstimation(parsed.costEstimation(), servings);

        return new MenuRecipeResponse(
            parsed.menuName() == null || parsed.menuName().isBlank() ? toMenuName(query) : parsed.menuName(),
            parsed.description() == null || parsed.description().isBlank()
                ? "AI-generated menu recommendation for your household."
                : parsed.description(),
            parsed.servings() > 0 ? parsed.servings() : servings,
            ingredients,
            instructions,
            imageUrl,
            nutritionFacts,
            costEstimation
        );
    }

    private String normalizeImageUrl(String imageUrl, String query) {
        if (imageUrl != null && !imageUrl.isBlank()) {
            String trimmed = imageUrl.trim();
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                return trimmed;
            }
        }

        return buildFallbackImageUrl(query);
    }

    private String buildFallbackImageUrl(String query) {
        String seed = query == null || query.isBlank() ? "home-cooked-dish" : query.trim();
        return "https://placehold.co/1200x800/FDF5EA/5F3A27/png?text="
            + URLEncoder.encode(seed + " dish", StandardCharsets.UTF_8);
    }

    private NutritionFactsResponse normalizeNutritionFacts(NutritionFactsResponse nutritionFacts, int servings) {
        if (nutritionFacts == null) {
            return estimatedNutritionFacts(servings);
        }

        double calories = nutritionFacts.calories() > 0 ? nutritionFacts.calories() : 320.0 * servings;
        double protein = nutritionFacts.proteinGrams() > 0 ? nutritionFacts.proteinGrams() : 22.0 * servings;
        double carbohydrates = nutritionFacts.carbohydratesGrams() > 0
            ? nutritionFacts.carbohydratesGrams()
            : 28.0 * servings;
        double fat = nutritionFacts.fatGrams() > 0 ? nutritionFacts.fatGrams() : 9.0 * servings;

        return new NutritionFactsResponse(calories, protein, carbohydrates, fat);
    }

    private CostEstimationResponse normalizeCostEstimation(CostEstimationResponse costEstimation, int servings) {
        if (costEstimation == null) {
            return estimatedCost(servings);
        }

        String currency = costEstimation.currency() == null || costEstimation.currency().isBlank()
            ? "PHP"
            : costEstimation.currency().trim();
        double estimatedTotal = costEstimation.estimatedTotal() > 0
            ? costEstimation.estimatedTotal()
            : 85.0 * servings;
        String notes = costEstimation.notes() == null || costEstimation.notes().isBlank()
            ? "Estimated household ingredient cost based on average local market pricing."
            : costEstimation.notes().trim();

        return new CostEstimationResponse(currency, estimatedTotal, notes);
    }

    private NutritionFactsResponse estimatedNutritionFacts(int servings) {
        return new NutritionFactsResponse(320.0 * servings, 22.0 * servings, 28.0 * servings, 9.0 * servings);
    }

    private CostEstimationResponse estimatedCost(int servings) {
        return new CostEstimationResponse(
            "PHP",
            85.0 * servings,
            "Estimated household ingredient cost based on average local market pricing."
        );
    }

    private MenuHistoryResponse toHistoryResponse(MenuHistoryEntity history) {
        try {
            MenuRecipeResponse menu = objectMapper.readValue(history.getMenuJson(), MenuRecipeResponse.class);
            return new MenuHistoryResponse(history.getId(), history.getSearchQuery(), history.getCreatedAt(), menu);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to read saved menu history", ex);
        }
    }

    private String writeMenuJson(MenuRecipeResponse menu) {
        try {
            return objectMapper.writeValueAsString(menu);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to save menu history", ex);
        }
    }

    private UserEntity getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalArgumentException("User account not found"));
    }

    private MenuSearchQuotaEntity getOrCreateQuota(UserEntity user) {
        LocalDate today = LocalDate.now();

        return menuSearchQuotaRepository.findByUserAndSearchDate(user, today)
            .orElseGet(() -> {
                MenuSearchQuotaEntity quota = new MenuSearchQuotaEntity();
                quota.setUser(user);
                quota.setSearchDate(today);
                quota.setSuccessfulSearches(0);
                return quota;
            });
    }

    private String cleanJson(String value) {
        String trimmed = value.trim();

        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
            trimmed = trimmed.replaceFirst("^```json", "")
                .replaceFirst("^```", "")
                .replaceFirst("```$", "")
                .trim();
        }

        return trimmed;
    }

    private String toMenuName(String query) {
        return query.substring(0, 1).toUpperCase() + query.substring(1).trim();
    }

    private void ensureGeminiAvailability() {
        if (isGeminiUnavailable()) {
            throw new GeminiUnavailableException(geminiUnavailableReason, minutesUntilAvailable());
        }
    }

    private void markGeminiUnavailable(String reason) {
        geminiUnavailableReason = reason;
        geminiUnavailableUntil = Instant.now().plus(Duration.ofMinutes(Math.max(geminiCooldownMinutes, 1)));
    }

    private boolean isGeminiUnavailable() {
        return geminiUnavailableUntil.isAfter(Instant.now());
    }

    private long minutesUntilAvailable() {
        return Math.max(Duration.between(Instant.now(), geminiUnavailableUntil).toMinutes() + 1, 1);
    }

    private MenuRecipeResponse getCachedGeminiResult(String query, int servings, String cookMode) {
        String cacheKey = buildCacheKey(query, servings, cookMode);
        CachedGeminiResult cachedResult = geminiSearchCache.get(cacheKey);

        if (cachedResult == null) {
            return null;
        }

        Instant expiresAt = cachedResult.cachedAt().plus(Duration.ofMinutes(Math.max(geminiCacheMinutes, 1)));

        if (expiresAt.isBefore(Instant.now())) {
            geminiSearchCache.remove(cacheKey);
            return null;
        }

        return cachedResult.menu();
    }

    private void cacheGeminiResult(String query, int servings, String cookMode, MenuRecipeResponse menu) {
        geminiSearchCache.put(buildCacheKey(query, servings, cookMode), new CachedGeminiResult(menu, Instant.now()));
    }

    private String buildCacheKey(String query, int servings, String cookMode) {
        return query.trim().toLowerCase() + "::" + servings + "::" + normalizeCookMode(cookMode);
    }

    private String normalizeCookMode(String cookMode) {
        if (cookMode == null || cookMode.isBlank()) {
            return "HOME_COMFORT";
        }

        String normalized = cookMode.trim().toUpperCase().replace(' ', '_').replace('-', '_');

        return switch (normalized) {
            case "RESTAURANT_STYLE", "BUDGET_SAVER", "HEALTHY_LIGHT", "FIESTA_PARTY", "HOME_COMFORT" -> normalized;
            default -> "HOME_COMFORT";
        };
    }

    private String cookModeLabel(String cookMode) {
        return switch (normalizeCookMode(cookMode)) {
            case "RESTAURANT_STYLE" -> "Restaurant Style";
            case "BUDGET_SAVER" -> "Budget Saver";
            case "HEALTHY_LIGHT" -> "Healthy Light";
            case "FIESTA_PARTY" -> "Fiesta Party";
            default -> "Home Comfort";
        };
    }

    private record CachedGeminiResult(
        MenuRecipeResponse menu,
        Instant cachedAt
    ) {
    }

    private static class GeminiModelNotFoundException extends Exception {

        GeminiModelNotFoundException(String message) {
            super(message);
        }
    }
}