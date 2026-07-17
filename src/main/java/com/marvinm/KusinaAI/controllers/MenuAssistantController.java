package com.marvinm.KusinaAI.controllers;

import com.marvinm.KusinaAI.dto.menu.MenuHistoryResponse;
import com.marvinm.KusinaAI.dto.menu.MenuHealthResponse;
import com.marvinm.KusinaAI.dto.menu.MenuSearchRequest;
import com.marvinm.KusinaAI.dto.menu.MenuSearchResponse;
import com.marvinm.KusinaAI.dto.menu.SaveMenuHistoryRequest;
import com.marvinm.KusinaAI.service.GeminiUnavailableException;
import com.marvinm.KusinaAI.service.MenuAssistantService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menu")
public class MenuAssistantController {

    private final MenuAssistantService menuAssistantService;

    public MenuAssistantController(MenuAssistantService menuAssistantService) {
        this.menuAssistantService = menuAssistantService;
    }

    @GetMapping("/health")
    public MenuHealthResponse health() {
        return menuAssistantService.getMenuHealth();
    }

    @PostMapping("/search")
    public ResponseEntity<?> search(Authentication authentication, @Valid @RequestBody MenuSearchRequest request) {
        try {
            MenuSearchResponse response = menuAssistantService.searchMenu(authentication.getName(), request);
            return ResponseEntity.ok(response);
        } catch (GeminiUnavailableException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "message", ex.getMessage(),
                    "retryAfterMinutes", ex.getRetryAfterMinutes()
                ));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/history")
    public MenuHistoryResponse saveHistory(
        Authentication authentication,
        @Valid @RequestBody SaveMenuHistoryRequest request
    ) {
        return menuAssistantService.saveHistory(authentication.getName(), request);
    }

    @GetMapping("/history")
    public List<MenuHistoryResponse> history(Authentication authentication) {
        return menuAssistantService.getHistory(authentication.getName());
    }
}