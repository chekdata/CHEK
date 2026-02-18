package com.chek.content.repo;

import com.chek.content.model.price.PriceRefDTO;
import java.util.Collections;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PriceRefRepository {
  private final JdbcTemplate jdbcTemplate;

  public PriceRefRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<PriceRefDTO> search(String query, int limit) {
    if (query == null || query.isBlank()) return Collections.emptyList();
    int n = Math.max(1, Math.min(limit, 50));
    return jdbcTemplate.query(
        "SELECT id, category, subject, price_min, price_max, unit, currency, source_type, source_id "
            + "FROM chek_content_price_ref WHERE subject LIKE ? ORDER BY id DESC LIMIT ?",
        (rs, rowNum) -> {
          PriceRefDTO dto = new PriceRefDTO();
          dto.setId(rs.getLong("id"));
          dto.setCategory(rs.getString("category"));
          dto.setSubject(rs.getString("subject"));
          dto.setPriceMin(rs.getObject("price_min") == null ? null : rs.getDouble("price_min"));
          dto.setPriceMax(rs.getObject("price_max") == null ? null : rs.getDouble("price_max"));
          dto.setUnit(rs.getString("unit"));
          dto.setCurrency(rs.getString("currency"));
          dto.setSourceType(rs.getString("source_type"));
          long sourceId = rs.getLong("source_id");
          dto.setSourceId(rs.wasNull() ? null : sourceId);
          return dto;
        },
        "%" + query.trim() + "%",
        n);
  }
}

