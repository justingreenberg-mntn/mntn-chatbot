package com.mntn.contextchat.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectCategory {

    private String id;
    private String name;
    private String description;
    private String self;
}

