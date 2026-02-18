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

  public List<PriceRefDTO> searchPriceRefs(String query, String location, String timeRange) {
    try {
      ResponseData<?> resp =
          restClient
              .get()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/v1/priceRefs/search")
                          .queryParam("query", query)
                          .queryParamIfPresent("location", location == null || location.isBlank() ? java.util.Optional.empty() : java.util.Optional.of(location))
                          .queryParamIfPresent("timeRange", timeRange == null || timeRange.isBlank() ? java.util.Optional.empty() : java.util.Optional.of(timeRange))
                          .build())
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(ResponseData.class);
      if (resp == null || !resp.isSuccess() || resp.getData() == null) return Collections.emptyList();
      String json = MAPPER.writeValueAsString(resp.getData());
      return MAPPER.readValue(
          json, MAPPER.getTypeFactory().constructCollectionType(List.class, PriceRefDTO.class));
    } catch (Exception e) {
      return Collections.emptyList();
    }
  }

  public static class PriceRefDTO {
    public long id;
    public String category;
    public String subject;
    public Double priceMin;
    public Double priceMax;
    public String unit;
    public String currency;
    public String sourceType;
    public Long sourceId;
  }
}

