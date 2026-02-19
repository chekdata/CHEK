package com.chek.content.model.confession;

import java.util.List;

public record ConfessionPayload(
    String to, String from, String mode, String message, List<String> actionItems) {}
