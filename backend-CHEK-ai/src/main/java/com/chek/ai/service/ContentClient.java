package com.chek.ai.service;

import com.chek.ai.model.ResponseData;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ContentClient {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  private final RestClient restClient;

  public ContentClient(@Value("${CHEK_CONTENT_BASE_URL:http://localhost:8081}") String baseUrl) {
    this.restClient = RestClient.builder().baseUrl(baseUrl).build();
  }

  public List<WikiEntryLite> searchWiki(String query, int limit) {
    try {
      ResponseData<?> resp =
          restClient
              .get()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/v1/wiki/entries")
                          .queryParam("query", query)
                          .queryParam("limit", limit)
                          .build())
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(ResponseData.class);
      if (resp == null || !resp.isSuccess() || resp.getData() == null) return Collections.emptyList();
      String json = MAPPER.writeValueAsString(resp.getData());
      return MAPPER.readValue(
          json,
          MAPPER.getTypeFactory().constructCollectionType(List.class, WikiEntryLite.class));
    } catch (Exception e) {
      return Collections.emptyList();
    }
  }

  public List<PostLite> searchPosts(String query, int limit) {
    try {
      ResponseData<?> resp =
          restClient
              .get()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/v1/posts")
                          .queryParam("query", query)
                          .queryParam("limit", limit)
                          .build())
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(ResponseData.class);
      if (resp == null || !resp.isSuccess() || resp.getData() == null) return Collections.emptyList();
      String json = MAPPER.writeValueAsString(resp.getData());
      return MAPPER.readValue(
          json,
          MAPPER.getTypeFactory().constructCollectionType(List.class, PostLite.class));
    } catch (Exception e) {
      return Collections.emptyList();
    }
  }

  public static class WikiEntryLite {
    public long entryId;
    public String slug;
    public String title;
    public String summary;
  }

  public static class PostLite {
    public long postId;
    public String title;
    public String body;
  }
}

