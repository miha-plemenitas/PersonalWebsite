package website.testing;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Request;
import com.microsoft.playwright.Route;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

final class StampGoogleFixture {
    private static final String GOOGLE_API = "https://www.googleapis.com";
    private static final String SHEETS_API = "https://sheets.googleapis.com";
    private static final String SCRIPT_URL = "https://accounts.google.com/gsi/client";
    private static final String SHEET_PATH = "/v4/spreadsheets/stamp-fictional-file";
    private static final String TOKEN = "stamp-fictional-access-token";
    private static final String OAUTH_SCRIPT = """
            window.google = {
              accounts: { oauth2: {
                initTokenClient(config) {
                  const ready = config.client_id === 'stamp-test-only.apps.googleusercontent.com';
                  window.__stampTestOAuthState = ready ? 'ready' : 'unexpected-client-id';
                  return {
                    requestAccessToken() {
                      if (ready) queueMicrotask(() => config.callback({
                        access_token: '%s', expires_in: 3600
                      }));
                    }
                  };
                }
              } }
            };
            """.formatted(TOKEN);
    private static final String HEADER = """
            ["DATE","DAY","START","END","HOURS WORKED","NOTE"]""";
    private static final String ROWS = """
            {"values":[
              %s,
              ["2025-01-31","petek","09:00","17:00",8,"Previous month"],
              ["2025-02-03","ponedeljek","09:00","17:00",8],
              ["2025-02-04","torek","09:00","17:00",8],
              ["2025-02-05","sreda","09:00","17:00",8],
              ["2025-02-06","četrtek","09:00","17:00",8],
              ["2025-02-07","petek","09:00","17:00",8],
              ["2025-02-10","ponedeljek","09:00","17:00",8],
              ["2025-02-11","torek","09:00","17:00","8,0"],
              ["2025-02-12","sreda","09:00","17:00"],
              ["2025-02-13","četrtek","09:00","14:00",5],
              [45702,"petek","00:00","00:30",0.5,"14 February 2025"],
              ["2025-02-17","ponedeljek","09:00","17:00",8,"Future shift"]
            ]}
            """.formatted(HEADER);

    private enum Endpoint {
        OAUTH_SCRIPT, PROFILE, DRIVE, SPREADSHEET, HEADER, ROWS
    }

    private final String siteOrigin;
    private final Set<Endpoint> served = EnumSet.noneOf(Endpoint.class);
    private final List<String> blocked = new ArrayList<>();

    StampGoogleFixture(BrowserContext context, String baseUrl) {
        URI local = URI.create(baseUrl);
        if (!Set.of("http", "https").contains(local.getScheme()) || local.getHost() == null
                || local.getUserInfo() != null
                || !Set.of("127.0.0.1", "localhost", "[::1]").contains(local.getHost().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("STAMP-001 requires a loopback website.baseUrl");
        }
        siteOrigin = origin(local);
        context.route("**/*", this::route);
    }

    void expectOnlyFictionalGoogleTraffic() {
        assertTrue(blocked.isEmpty(), "Unexpected requests were blocked: " + blocked);
        assertEquals(EnumSet.allOf(Endpoint.class), served, "Expected all synthetic Google endpoints to be used");
    }

    List<String> blockedRequests() {
        return List.copyOf(blocked);
    }

    private void route(Route route) {
        Request request = route.request();
        URI url = URI.create(request.url());
        if (siteOrigin.equals(origin(url))) {
            route.resume();
            return;
        }

        Endpoint endpoint = endpoint(url);
        if (endpoint == null) {
            deny(route);
        } else if (endpoint != Endpoint.OAUTH_SCRIPT && "OPTIONS".equals(request.method())) {
            route.fulfill(new Route.FulfillOptions().setStatus(204).setHeaders(corsHeaders()));
        } else if (!"GET".equals(request.method())
                || (endpoint != Endpoint.OAUTH_SCRIPT
                    && !("Bearer " + TOKEN).equals(request.headers().get("authorization")))) {
            deny(route);
        } else {
            Route.FulfillOptions response = new Route.FulfillOptions().setStatus(200);
            if (endpoint == Endpoint.OAUTH_SCRIPT) {
                response.setContentType("application/javascript").setBody(OAUTH_SCRIPT);
            } else {
                response.setHeaders(corsHeaders()).setContentType("application/json; charset=utf-8")
                        .setBody(json(endpoint));
            }
            route.fulfill(response);
            served.add(endpoint);
        }
    }

    private static Endpoint endpoint(URI url) {
        if (SCRIPT_URL.equals(url.toString())) {
            return Endpoint.OAUTH_SCRIPT;
        }
        String host = origin(url);
        String path = url.getPath();
        if (GOOGLE_API.equals(host)) {
            if ("/oauth2/v3/userinfo".equals(path)) {
                return Endpoint.PROFILE;
            }
            if ("/drive/v3/files".equals(path)
                    && "name = 'Triglav_Delovne_Ure' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false"
                            .equals(queryParam(url, "q"))) {
                return Endpoint.DRIVE;
            }
        } else if (SHEETS_API.equals(host)) {
            String render = queryParam(url, "valueRenderOption");
            if (SHEET_PATH.equals(path)) {
                return Endpoint.SPREADSHEET;
            }
            if ((SHEET_PATH + "/values/'Fixture Timecard'!A1:F1").equals(path) && "FORMATTED_VALUE".equals(render)) {
                return Endpoint.HEADER;
            }
            if ((SHEET_PATH + "/values/'Fixture Timecard'!A:F").equals(path) && "UNFORMATTED_VALUE".equals(render)) {
                return Endpoint.ROWS;
            }
        }
        return null;
    }

    private static String json(Endpoint endpoint) {
        return switch (endpoint) {
            case PROFILE -> """
                    {"email":"stamp-fixture@example.invalid"}""";
            case DRIVE -> """
                    {"files":[{"id":"stamp-fictional-file","name":"Triglav_Delovne_Ure","mimeType":"application/vnd.google-apps.spreadsheet"}]}""";
            case SPREADSHEET -> """
                    {"properties":{"title":"Triglav_Delovne_Ure"},"sheets":[{"properties":{"sheetId":1,"title":"Fixture Timecard"}}]}""";
            case HEADER -> "{\"values\":[" + HEADER + "]}";
            case ROWS -> ROWS;
            case OAUTH_SCRIPT -> throw new IllegalArgumentException("OAuth uses a synthetic script, not JSON");
        };
    }

    private Map<String, String> corsHeaders() {
        return Map.of("Access-Control-Allow-Origin", siteOrigin,
                "Access-Control-Allow-Methods", "GET, OPTIONS",
                "Access-Control-Allow-Headers", "authorization");
    }

    private void deny(Route route) {
        blocked.add(route.request().method() + " " + route.request().url());
        route.abort();
    }

    private static String queryParam(URI url, String name) {
        if (url.getRawQuery() == null) {
            return null;
        }
        for (String entry : url.getRawQuery().split("&")) {
            if (entry.startsWith(name + "=")) {
                return URLDecoder.decode(entry.substring(name.length() + 1), StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    private static String origin(URI url) {
        return url.getScheme() + "://" + url.getRawAuthority();
    }
}
