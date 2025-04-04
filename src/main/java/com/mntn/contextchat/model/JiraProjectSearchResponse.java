package com.mntn.contextchat.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class JiraProjectSearchResponse {

    private boolean isLast;
    private int maxResults;
    private String nextPage;
    private String self;
    private int startAt;
    private int total;
    private List<JiraProject> values;
}
