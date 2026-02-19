package com.chek.content.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.chek.content.service.ConfessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = ConfessionController.class)
@Import(ConfessionService.class)
class ConfessionControllerWebMvcTest {
  @Autowired private MockMvc mockMvc;

  @Test
  void confessionEndpointReturnsSuccessWithDefaults() throws Exception {
    mockMvc
        .perform(get("/v1/confession"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("SUCCESS"))
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.to").value("胶己人"))
        .andExpect(jsonPath("$.data.from").value("CHEK 志愿者"))
        .andExpect(jsonPath("$.data.mode").value("warm"));
  }

  @Test
  void confessionEndpointSupportsActionMode() throws Exception {
    mockMvc
        .perform(
            get("/v1/confession")
                .param("to", "游客")
                .param("from", "CHEK")
                .param("mode", "action"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("SUCCESS"))
        .andExpect(jsonPath("$.data.to").value("游客"))
        .andExpect(jsonPath("$.data.from").value("CHEK"))
        .andExpect(jsonPath("$.data.mode").value("action"))
        .andExpect(jsonPath("$.data.message").value(org.hamcrest.Matchers.containsString("小红书")))
        .andExpect(jsonPath("$.data.actionItems[0]").value(org.hamcrest.Matchers.containsString("小红书")));
  }
}
