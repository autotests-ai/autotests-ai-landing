# autotests-ai-landing

Spring Boot (Java 21) + PostgreSQL demo landing for [autotests.ai](https://autotests.ai).

- **Backend:** `backend/` — REST `GET /api/demo`, static UI (terminal слева, кнопка «Обновить»)
- **E2E:** `tests-java/` — Gradle + Selenide + Allure, env `autotests_{local,jenkins,prod}_*`
- **Deploy:** `docker-compose.yml` — только `postgres` + `backend` на `127.0.0.1:8081` (Selenoid UI остаётся на `:8080`)
- **Nginx:** `deploy/nginx/autotests.ai.conf`
- **Jenkins:** `deploy/jenkins/autotests-ai-landing-deploy.Jenkinsfile`

## Local dev

```bash
# PostgreSQL (docker)
docker compose up -d postgres

# Backend (port 8080)
cd backend && ./gradlew bootRun

# E2E smoke
cd tests-java
./gradlew testE2e -Denv=autotests_local_e2e -Dheadless=true
```

## Env profiles

| Stand | Example | baseUrl |
|-------|---------|---------|
| `autotests_local` | `autotests_local_e2e` | `http://localhost:8081/` (docker) or `8080` (`bootRun`) |
| `autotests_jenkins` | `autotests_jenkins_e2e` | `https://autotests.ai/` + Selenoid `127.0.0.1:4444` |
| `autotests_prod` | `autotests_prod_e2e` | `https://autotests.ai/` + remote Selenoid cloud |

Regenerate configs: `python scripts/gen-env-configs.py`

## Server deploy (selenoid.autotests.cloud)

```bash
sudo mkdir -p /opt/autotests-ai-landing
sudo git clone https://github.com/autotests-ai/autotests-ai-landing.git /opt/autotests-ai-landing
cd /opt/autotests-ai-landing
docker compose up -d --build
sudo cp deploy/nginx/autotests.ai.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

Jenkins job: Pipeline from SCM → `deploy/jenkins/autotests-ai-landing-deploy.Jenkinsfile`.

E2E on Jenkins agent:

```bash
cd tests-java
./gradlew testE2e -Denv=autotests_jenkins_e2e
```

## Pyramid slices

```bash
./gradlew testUnit
./gradlew testIntegration
./gradlew testApi
./gradlew testE2e
```
