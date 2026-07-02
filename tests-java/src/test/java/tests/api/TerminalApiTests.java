package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;

@Layer("api")
@Epic("Landing API")
@Feature("Terminal endpoint")
@DisplayName("Terminal API")
class TerminalApiTests extends ApiTestBase {

    @Test
    @Tag("api")
    @DisplayName("GET /api/terminal returns seeded PostgreSQL lines")
    void terminalEndpointReturnsSeed() {
        given()
                .when()
                .get("/api/terminal")
                .then()
                .statusCode(200)
                .body("source", equalTo("postgresql"))
                .body("lines", notNullValue())
                .body("lines.size()", greaterThanOrEqualTo(4))
                .body("lines[0].content", notNullValue())
                .body("fetchedAt", notNullValue());
    }
}
