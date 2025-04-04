package com.mntn.contextchat.service;

import com.mntn.contextchat.model.JiraProjectSearchResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Service
public class JiraService {

    @Value("${jira.api.url}")
    private String jiraApiUrl;

    @Value("${jira.username}")
    private String jiraUsername;

    @Value("${jira.api.token}")
    private String jiraApiToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public JiraProjectSearchResponse getAllProjects() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", getAuthHeader());

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<JiraProjectSearchResponse> response = restTemplate.exchange(
                jiraApiUrl,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        return response.getBody();
    }

    private String getAuthHeader() {
        String auth = jiraUsername + ":" + jiraApiToken;
        byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.UTF_8));
        return "Basic " + new String(encodedAuth);
    }
}
