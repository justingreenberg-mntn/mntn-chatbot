package com.mntn.contextchat.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectInsight {

    private String lastIssueUpdateTime;
    private int totalIssueCount;
}

