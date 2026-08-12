package com.marvinm.menuservice.controller;

import com.marvinm.menuservice.dto.MenuSearchRequest;
import com.marvinm.menuservice.dto.MenuSearchResponse;
import com.marvinm.menuservice.service.MenuSearchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuSearchService menuSearchService;

    public MenuController(MenuSearchService menuSearchService) {
        this.menuSearchService = menuSearchService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("menu-service-ok");
    }

    @PostMapping("/search")
    public ResponseEntity<MenuSearchResponse> search(@Valid @RequestBody MenuSearchRequest request) {
        return ResponseEntity.ok(menuSearchService.search(request));
    }
}
