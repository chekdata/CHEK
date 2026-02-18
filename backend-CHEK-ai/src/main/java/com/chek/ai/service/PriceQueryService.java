package com.chek.ai.service;

import com.chek.ai.model.price.PriceQueryRequest;
import com.chek.ai.model.price.PriceQueryResponse;
import com.chek.ai.model.price.PriceQueryResponse.Citation;
import com.chek.ai.model.price.PriceQueryResponse.FallbackAction;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PriceQueryService {
  private final ContentClient contentClient;

  public PriceQueryService(ContentClient contentClient) {
    this.contentClient = contentClient;
  }

  public PriceQueryResponse query(PriceQueryRequest req) {
    List<ContentClient.PriceRefDTO> refs =
        contentClient.searchPriceRefs(req.getQuery(), req.getLocation(), req.getTime());

    PriceQueryResponse resp = new PriceQueryResponse();
    if (refs.isEmpty()) {
      resp.setUncertain(true);
      resp.getTips().add("目前没有足够依据给出确定价格区间。建议发“价格求证/举报帖”并附上地点与时间。");
      FallbackAction fb = new FallbackAction();
      fb.setType("CREATE_POST_DRAFT");
      fb.setPostType("PRICE_QUESTION");
      fb.setDraftJson("{\"title\":\"价格求证\",\"body\":\"" + escape(req.getQuery()) + "\"}");
      resp.setFallbackAction(fb);
      return resp;
    }

    ContentClient.PriceRefDTO first = refs.get(0);
    resp.setUncertain(false);
    resp.setCurrency(first.currency == null || first.currency.isBlank() ? "CNY" : first.currency);
    resp.setPriceMin(first.priceMin);
    resp.setPriceMax(first.priceMax);
    resp.setUnit(first.unit);

    Citation c = new Citation();
    c.setSourceType(first.sourceType);
    c.setSourceId(String.valueOf(first.id));
    c.setTitle(first.subject);
    c.setSnippet("引用价格基准/核实举报");
    resp.getCitations().add(c);
    resp.getTips().add("如遇明显高于区间价格，建议保留证据并发布价格举报帖。");
    return resp;
  }

  private static String escape(String s) {
    if (s == null) return "";
    return s.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}

