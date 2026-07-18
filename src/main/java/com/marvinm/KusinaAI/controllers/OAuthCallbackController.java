package com.marvinm.KusinaAI.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OAuthCallbackController {

    @GetMapping("/oauth/callback")
    public String callback() {
        return "forward:/index.html";
    }
}