package com.chek.ai.service;

import com.chek.ai.model.ai.AiAskRequest;
import com.chek.ai.model.ai.AiAskResponse;
import com.chek.ai.model.ai.AiAskResponse.Citation;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiAskService {
  private final ContentClient contentClient;

  public AiAskService(ContentClient contentClient) {
    this.contentClient = contentClient;
  }

  public AiAskResponse ask(AiAskRequest req) {
    String q = req == null ? "" : String.valueOf(req.getQuery()).trim();

    List<ContentClient.WikiEntryLite> wiki = contentClient.searchWiki(q, 5);
    List<ContentClient.PostLite> posts = contentClient.searchPosts(q, 5);

    AiAskResponse resp = new AiAskResponse();

    if (wiki.isEmpty() && posts.isEmpty()) {
      resp.setUncertain(true);
      resp.setAnswer(
          "我现在没找到足够依据给出确定答案。给你添麻烦了，真诚抱歉。\n"
              + "你可以先去「有知」搜一下；如果情况更具体（时间/地点/人数/预算），欢迎直接发一条「相辅」，大家会更好帮你。");
      resp.getTips().add("建议补充：时间、地点、人数、预算、是否带娃/老人。");
      return resp;
    }

    resp.setUncertain(true);
    resp.setAnswer("我不敢拍胸口说一定对，但我先帮你把相关内容捞出来，你可以先看这些：");
    resp.getTips().add("如果还没解决，发相辅把时间地点说清楚，会更快。");

    for (ContentClient.WikiEntryLite e : wiki) {
      if (e == null) continue;
      Citation c = new Citation();
      c.setSourceType("WIKI");
      c.setSourceId(String.valueOf(e.entryId));
      c.setTitle(e.title);
      c.setUrl("/wiki/" + e.slug);
      resp.getCitations().add(c);
    }
    for (ContentClient.PostLite p : posts) {
      if (p == null) continue;
      Citation c = new Citation();
      c.setSourceType("POST");
      c.setSourceId(String.valueOf(p.postId));
      c.setTitle(p.title == null || p.title.isBlank() ? "相辅" : p.title);
      c.setUrl("/p/" + p.postId);
      resp.getCitations().add(c);
    }

    return resp;
  }
}

