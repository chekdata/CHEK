package com.chek.ai.model;

public class ResponseData<T> {
  private String code;
  private String message;
  private T data;
  private boolean success;
  private String traceId;

  public static <T> ResponseData<T> ok(T data) {
    ResponseData<T> r = new ResponseData<>();
    r.code = "SUCCESS";
    r.message = "ok";
    r.data = data;
    r.success = true;
    r.traceId = "";
    return r;
  }

  public static <T> ResponseData<T> error(String code, String message) {
    ResponseData<T> r = new ResponseData<>();
    r.code = code;
    r.message = message;
    r.data = null;
    r.success = false;
    r.traceId = "";
    return r;
  }

  public String getCode() {
    return code;
  }

  public String getMessage() {
    return message;
  }

  public T getData() {
    return data;
  }

  public boolean isSuccess() {
    return success;
  }

  public String getTraceId() {
    return traceId;
  }
}

