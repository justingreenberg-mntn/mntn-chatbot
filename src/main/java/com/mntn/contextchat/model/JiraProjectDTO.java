package com.mntn.contextchat.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class JiraProjectDTO {

    private String id;
    private String key;
    private String name;

    @JsonProperty("projectTypeKey")
    private String projectType;

    private boolean simplified;

    @JsonProperty("avatarUrls")
    private Map<String, String> avatarUrls;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void

