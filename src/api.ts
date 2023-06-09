import { dapi } from "./dapi";

export function handle(req: Request, res: Response) {
  const route = dapi.utils.router.getRoute(req.UrlPath, res);

  if (dapi.utils.type.isUndef(route)) {
    req.RespContentType = "application/json; charset=utf-8";
    return dapi.utils.response.abort(`В библиотеке отсутствует функция для метода [${req.UrlPath}]: [${req.Method}]`, 404);
  }

  req.RespContentType = route.GetOptProperty("contentType", "application/json; charset=utf-8");

  const auth = dapi.utils.passport.authenticate(req);
  const isAnonymous = route.access == "anonymous";

  if (!isAnonymous && auth === null) {
    req.Session.SetProperty("url_prev_auth", dapi.utils.request.getHeader(req.Header, "referer"));
    return dapi.utils.response.abort("Необходима авторизация", 401);
  }

  try {
    const handler = OpenCodeLib(route.GetOptProperty("url"));

    let params;

    try {
      if (!dapi.utils.type.isUndef(route.params)) {
        params = dapi.utils.validator.parse(req, route.params);
      }
    } catch (error) {
      return dapi.utils.response.abort(error, 422);
    }

    return CallObjectMethod(handler, route.callback, [params, Request, Response]);
  } catch (error) {
    return dapi.utils.response.abort(error, 500);
  }
}

try {
  Response.Write(dapi.utils.response.json(handle(Request, Response), Response));
} catch (error) {
  Response.Write(dapi.utils.response.json(dapi.utils.response.abort(error), Response));
}
