package com.mntn.contextchat.controller;

import com.mntn.contextchat.model.JiraProjectDTO;
import com.mntn.contextchat.service.JiraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jira")
public class JiraController {

    @Autowired
    private JiraService jiraService;

    @GetMapping("/projects")
    public List<JiraProjectDTO> getProjects() {
        return jiraService.getAllProjects();
    }
}