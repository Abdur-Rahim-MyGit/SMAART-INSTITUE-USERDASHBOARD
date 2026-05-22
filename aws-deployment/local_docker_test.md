# Local Docker Verification & Testing Guide
Location: `/aws-deployment/local_docker_test.md`

Use this guide to build, run, and test the production-hardened container configuration locally on your development machine using Docker Desktop before deploying to AWS.

---

## Step 1: Adjust Your Local Database Connection
Before running the container, check your backend environment configuration:
1.  Open the `/back-end/.env` file.
2.  Inspect the `MONGODB_URI` variable:
    *   **Cloud Database (MongoDB Atlas):** Leave the URI as-is.
    *   **Local Database (Running on your host PC):** Change `localhost` or `127.0.0.1` to `host.docker.internal`.
        *   *Why?* The container runs in its own network space. Using `host.docker.internal` allows the container to talk to services running on your local machine.
        *   *Example:* `MONGODB_URI=mongodb://host.docker.internal:27017/minds`

---

## Step 2: Build the Container
Because your backend source files and `package.json` are inside the `/back-end` directory, you must run the build command with that directory as the execution context.

1.  Open your terminal/PowerShell and navigate to the `back-end` directory:
    ```bash
    cd back-end
    ```
2.  Build the Docker image referencing the production Dockerfile in the `aws-deployment` folder:
    ```bash
    docker build -f ../aws-deployment/Dockerfile -t smaart-backend:local .
    ```

---

## Step 3: Run the Container Locally
Launch the built container while passing your local `.env` configuration file:

```bash
docker run -p 5000:5000 --env-file .env smaart-backend:local
```

### Explanation of flags:
*   `-p 5000:5000`: Maps port `5000` inside the container to port `5000` on your host machine.
*   `--env-file .env`: Automatically loads and injects all environment variables from your local `.env` file into the container.
*   `smaart-backend:local`: Specifies the tag of the image we built in Step 2.

---

## Step 4: Verification Checks

1.  **Observe Terminal Logs:**
    The container should start up and print standard server initialization output:
    ```text
    🚀 Server running: http://localhost:5000
    🔌 WebSocket: ws://localhost:5000/ws/notifications
    ✅ MongoDB connected successfully
    ```
2.  **Test the Health Endpoint:**
    Open your web browser or run a `curl` request to verify the server is responding to HTTP requests:
    ```bash
    curl http://localhost:5000/api/health
    ```
    Expected JSON response:
    ```json
    {"status": "Server is running"}
    ```
3.  **To Stop the Container:**
    Press `Ctrl + C` in your terminal to gracefully stop the container.
