# Step-by-Step Deployment Instructions (AWS ECS Fargate)
Location: `/aws-deployment/deployment-instructions.md`

Follow these instructions to deploy the production configuration files located in this folder to AWS ECS Fargate.

---

## Prerequisites
1.  **AWS CLI Installed & Configured** on your local machine with Administrator access.
2.  **Docker Desktop Installed** on your local machine.
3.  **Active Domain Name** configured in Route 53.
4.  **MongoDB Atlas Account** with a provisioned cluster.

---

## Step 1: Push the Docker Image to Amazon ECR

Run these commands from your local machine to build the container using the security configuration files in this directory.

1.  **Login to AWS ECR:**
    ```bash
    aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
    ```
2.  **Create Repository (One-time only):**
    ```bash
    aws ecr create-repository --repository-name smaart-backend --image-scanning-configuration scanOnPush=true --encryption-configuration encryptionType=AES256
    ```
    *(Note: `--image-scanning-configuration scanOnPush=true` ensures AWS automatically scans your Docker image layers for vulnerabilities on every push).*
3.  **Build Docker Image:**
    Run this command from the root directory of your workspace:
    ```bash
    docker build -f aws-deployment/Dockerfile -t smaart-backend:latest .
    ```
4.  **Tag the Image:**
    ```bash
    docker tag smaart-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/smaart-backend:latest
    ```
5.  **Push the Image:**
    ```bash
    docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/smaart-backend:latest
    ```

---

## Step 2: Store Secrets in AWS Secrets Manager

1.  Go to the **AWS Secrets Manager** Console.
2.  Click **Store a new secret** -> Select **Other type of secret**.
3.  Store the secrets as key/value pairs using the template defined in [production-secrets.env.example](file:///c:/Users/Vickram/Documents/SMAART/aws-deployment/production-secrets.env.example):
    *   `MONGODB_URI`
    *   `JWT_SECRET`
    *   `REDIS_HOST`
    *   `REDIS_PORT`
    *   `REDIS_PASSWORD`
    *   `OPENAI_API_KEY`
    *   `CLOUDINARY_CLOUD_NAME`
    *   `CLOUDINARY_API_KEY`
    *   `CLOUDINARY_API_SECRET`
4.  Name the secret: `production/smaart/secrets`. Copy the secret ARN.

---

## Step 3: Set up ElastiCache Serverless Redis

1.  Go to the **AWS ElastiCache** Console.
2.  Click **Redis caches** -> **Create Redis cache**.
3.  Select **Serverless** (automatic scaling and cost-effective for startups).
4.  Set Name: `smaart-redis-cluster`.
5.  Select **Transit encryption (TLS)** for secure data transfer.
6.  Choose your VPC and subnet group (Private Subnets).
7.  Attach the Redis security group (`smaart-prod-redis-sg`) created in [security-policies.md](file:///c:/Users/Vickram/Documents/SMAART/aws-deployment/security-policies.md).
8.  Once status is *Active*, copy the Endpoint address and update the value in your Secrets Manager secret.

---

## Step 4: Configure ALB with Cookie Stickiness

For WebSockets to work securely:
1.  Go to **EC2** -> **Load Balancers** -> **Create Application Load Balancer**.
2.  Place the ALB in your VPC **Public Subnets**.
3.  Attach security group `smaart-prod-alb-sg`.
4.  Create a Target Group:
    *   Target type: **IP addresses** (Required for Fargate).
    *   Protocol: **HTTP** / Port: `5000`.
    *   Health Check Path: `/api/health`.
5.  **Enable Cookie Stickiness:**
    *   Select the newly created Target Group.
    *   Click **Actions** -> **Edit attributes**.
    *   Turn on **Stickiness** -> select **Load balancer cookie**.
    *   Set expiration duration to `3600` seconds (1 hour).
6.  Create an ALB listener on port `443` (HTTPS) using your certificate from ACM, forwarding requests to the Target Group.

---

## Step 5: Deploy ECS Cluster, Task & Service

1.  **Create Cluster:** Go to **ECS** -> Clusters -> **Create Cluster** -> Name: `smaart-production-cluster`.
2.  **Register Task Definition:**
    *   Replace `<AWS_ACCOUNT_ID>` and `<REGION>` placeholders in [ecs-task-definition.json](file:///c:/Users/Vickram/Documents/SMAART/aws-deployment/ecs-task-definition.json) with your actual credentials.
    *   Register the task definition using the CLI:
        ```bash
        aws ecs register-task-definition --cli-input-json file://aws-deployment/ecs-task-definition.json
        ```
3.  **Create Service:**
    *   Go to your cluster -> Services -> Click **Create**.
    *   Launch type: **FARGATE**.
    *   Desired tasks: `2` (Highly available).
    *   VPC & Subnets: Select **Private Subnets** only.
    *   Security Group: Attach `smaart-prod-ecs-sg`.
    *   Load Balancing: Attach to the ALB configured in Step 4, choosing container name `backend` and port `5000`.
    *   Enable **Public IP**: Set to **DISABLED** (Tasks run securely inside private subnets).

---

## Step 6: Verify Infrastructure Security

Once deployment finishes, perform these security and verification checks:

1.  **Check Health Endpoint:**
    Verify that `https://api.smaartminds.com/api/health` returns `{"status": "Server is running"}`.
2.  **Verify Private Isolation:**
    Verify that your backend containers cannot be reached directly on port 5000 from outside the VPC. They must only respond through the ALB URL.
3.  **Inspect Logs in CloudWatch:**
    Go to **CloudWatch** -> Log groups -> `/ecs/smaart-backend` to verify the server connected to MongoDB Atlas and scaled WebSockets successfully via Redis.
4.  **Confirm WebSocket Sync:**
    Open two browser instances and connect to the dashboard. Trigger a notification; verify that both instances update instantly (which proves that the cross-pod Redis synchronization is working).
