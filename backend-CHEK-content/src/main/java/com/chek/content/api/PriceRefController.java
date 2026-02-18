package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.price.PriceRefDTO;
import com.chek.content.repo.PriceRefRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class PriceRefController {
  private final PriceRefRepository priceRefRepository;

  public PriceRefController(PriceRefRepository priceRefRepository) {
    this.priceRefRepository = priceRefRepository;
  }

  @GetMapping("/priceRefs/search")
  public ResponseData<List<PriceRefDTO>> search(
      @RequestParam(name = "query") String query,
      @RequestParam(name = "location", required = false) String location,
      @RequestParam(name = "timeRange", required = false) String timeRange) {
    // MVP: ignore location/timeRange for now; keep them in API for future refinement
    return ResponseData.ok(priceRefRepository.search(query, 20));
  }
}

