# Comprehensive AWS Hosting & Deployment Guide for SMAART Minds

## 1. Executive Summary, Feasibility & Time to Deploy

### A. Feasibility
**Score: Highly Feasible (10/10).** The MERN stack (MongoDB, Express, React, Node.js) with Socket.io WebSockets is an industry-standard pattern perfectly suited for AWS. AWS provides native scaling, zero downtime updates, and a highly resilient global network that will run SMAART Minds securely and extremely fast.

### B. Architecture Choice
- **Frontend:** Amazon S3 + CloudFront (Highly scalable, effectively ₹0 starting cost).
- **Backend:** Amazon EC2 (IaaS, cheapest, most control). We recommend **Amazon EC2 with PM2 and Nginx** for the most cost-effective and flexible approach from scratch.
- **Database:** MongoDB Atlas (AWS-hosted, integrates seamlessly).

### C. Deployment Time Estimation
*Assuming all accounts (AWS, MongoDB Atlas, Domain Registrar) are registered and ready to use.*
- **Phase 1 (Database Setup):** ~15 minutes
- **Phase 2 (EC2 Backend Deployment):** ~45 - 60 minutes
- **Phase 3 (S3/CloudFront Frontend Deployment):** ~30 minutes
- **Phase 4 (Domains & SSL):** ~20 - 30 minutes (Dependent on global DNS propagation)
- **Total Estimated Setup Time:** **1.5 to 2.5 hours** for a single developer.

---

## 2. Cost Estimation (Monthly)

| Service | Free Tier / Startup Phase | Production Phase (Scaling) |
| :--- | :--- | :--- |
| **Amazon EC2 (Backend)** | ₹0 (t2.micro for 12 months) | ~₹1,250 - ₹2,500 (t3.small/medium) |
| **Amazon S3 (Frontend Storage)** | ₹0 (5GB free) | ~₹40 (Storage is cheap) |
| **Amazon CloudFront (CDN)** | ₹0 (1TB free data out) | ~₹400 - ₹850 (Based on traffic) |
| **MongoDB Atlas (Database)** | ₹0 (M0 Sandbox Cluster) | ~₹5,000 (M10 Dedicated Cluster) |
| **AWS Route 53 (DNS)** | ₹40 per hosted zone | ₹40 per hosted zone + query costs |
| **AWS ACM (SSL Certificates)**| ₹0 (Always Free) | ₹0 (Always Free) |
| **Total Estimated Cost** | **~₹40 / month** | **~₹6,730 - ₹8,430 / month** |

*(Note: Pricing is estimated based on an exchange rate of roughly 1 USD = 83 INR. AWS bills in USD, so exact INR amounts will fluctuate slightly with exchange rates.)*

---

## 3. Step-by-Step Deployment Guide (From Scratch)

### Phase 1: Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create an account.
2. Build a Database: Select **M0 Free Tier**. Select **AWS** as the cloud provider and choose the region closest to your users (e.g., `ap-south-1` Mumbai or `us-east-1` N. Virginia).
3. **Security / Network Access:** Go to "Network Access" and click "Add IP Address". Choose "Allow Access from Anywhere" (`0.0.0.0/0`) for now, or whitelist your specific AWS EC2 Elastic IP later.
4. **Database Access:** Create a user (e.g., `smaartadmin`) and generate a secure password.
5. **Connection String:** Click "Connect" -> "Connect your application". Copy the connection string. Replace `<password>` with your password. You will use this in your Backend `.env`.

### Phase 2: Backend Deployment (Amazon EC2 + PM2 + Nginx)
*Why EC2? It gives you full control and is free for the first 12 months.*

#### A. Launching the EC2 Instance
1. Log in to AWS Management Console and go to **EC2**.
2. Click **Launch Instance**.
3. **Name:** `Smaart-Minds-Backend`
4. **AMI:** Choose **Ubuntu Server 24.04 LTS**.
5. **Instance Type:** `t2.micro` (Free tier eligible).
6. **Key Pair:** Create a new key pair (RSA, `.pem`), download it securely.
7. **Network Settings:** 
   - Allow SSH traffic from Anywhere.
   - Allow HTTP traffic from the internet.
   - Allow HTTPS traffic from the internet.
8. Click **Launch Instance**.

#### B. Connecting and Installing Dependencies
1. Open terminal on your local PC and SSH into the instance:
   `ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>`
2. Update the server:
   `sudo apt update && sudo apt upgrade -y`
3. Install Node.js & npm:
   `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
   `sudo apt install -y nodejs`
4. Install Git:
   `sudo apt install git -y`
5. Install PM2 (to keep Node.js running forever):
   `sudo npm install pm2@latest -g`

#### C. Deploying Backend Code
1. Clone your repository:
   `git clone <your-github-repo-url> smaart-minds`
2. Navigate to backend:
   `cd smaart-minds/SMAART-INSTITUE-USERDASHBOARD/back-end`
3. Install dependencies:
   `npm install`
4. Create your environment file:
   `nano .env`
   *(Paste your MongoDB URI, OpenAI keys, Cloudinary credentials, etc. Ensure `PORT=5000`)*
5. Start the server with PM2:
   `pm2 start server.js --name "smaart-backend"`
6. Ensure PM2 starts on reboot:
   `pm2 startup`
   `pm2 save`

#### D. Setting up Nginx Reverse Proxy (For WebSockets & SSL)
1. Install Nginx:
   `sudo apt install nginx -y`
2. Configure Nginx:
   `sudo nano /etc/nginx/sites-available/default`
3. Replace the contents with:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com; # Replace with your domain or IP

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Test and restart Nginx:
   `sudo nginx -t`
   `sudo systemctl restart nginx`

### Phase 3: Frontend Deployment (Amazon S3 + CloudFront)

#### A. Build the Frontend Locally
1. Open your `front-end/.env` file locally.
2. Change the API URL to point to your new EC2 Public IP or API Domain:
   `VITE_API_URL=http://<your-ec2-ip-or-domain>`
3. Run the build command:
   `npm run build`
   *(This creates a `dist` folder)*

#### B. Setup S3 Bucket
1. Go to **AWS S3** and click **Create bucket**.
2. **Bucket Name:** `app.yourdomain.com` (Must be unique).
3. **Block Public Access:** Leave this **ON** (We will use CloudFront OAC for secure access).
4. Click **Create bucket**.
5. Upload the entire contents of your `dist` folder into this bucket.

#### C. Setup CloudFront (CDN)
1. Go to **AWS CloudFront** and click **Create Distribution**.
2. **Origin Domain:** Select your newly created S3 bucket.
3. **Origin Access:** Choose **Origin access control settings (recommended)** and click **Create control setting**.
4. **Viewer Protocol Policy:** Choose **Redirect HTTP to HTTPS**.
5. **Web Application Firewall (WAF):** Choose "Do not enable security protections" (to save costs).
6. **Default Root Object:** Type `index.html`.
7. Click **Create Distribution**.
8. **CRITICAL S3 Policy Step:** After creation, CloudFront will give you a yellow banner saying "The S3 bucket policy needs to be updated". Click **Copy policy**, go back to your S3 bucket -> Permissions -> Bucket Policy, and paste it there.
9. **Fix React Router (SPA Routing):**
   - In CloudFront, go to your distribution -> **Error pages**.
   - Create custom error response:
     - HTTP error code: `404` -> Customize response -> Path: `/index.html`, Status: `200 OK`.
     - HTTP error code: `403` -> Customize response -> Path: `/index.html`, Status: `200 OK`.

### Phase 4: Custom Domains & SSL (Route 53 & Let's Encrypt)

#### A. Frontend Domain
1. Go to **AWS Route 53** -> Hosted Zones -> Create Hosted Zone for `yourdomain.com`.
2. Point your domain registrar (GoDaddy, Namecheap) to the Route 53 Nameservers.
3. Create a Record:
   - Name: `app` (for app.yourdomain.com)
   - Type: `A - IPv4 address`
   - Alias: `Yes`
   - Route traffic to: `Alias to CloudFront distribution`. Select your CloudFront distribution.
4. **Frontend SSL:** Use AWS Certificate Manager (ACM) in `us-east-1` to request a free certificate for `app.yourdomain.com` and attach it to your CloudFront distribution settings.

#### B. Backend Domain & SSL
1. In Route 53, create a Record:
   - Name: `api` (for api.yourdomain.com)
   - Type: `A - IPv4 address`
   - Value: `<Your-EC2-Public-IP-Address>`
2. **Backend SSL (Let's Encrypt):**
   - SSH into your EC2 instance.
   - Install Certbot:
     `sudo apt install certbot python3-certbot-nginx -y`
   - Run Certbot to automatically configure SSL for Nginx:
     `sudo certbot --nginx -d api.yourdomain.com`
   - Make sure you update your frontend `.env` to use `https://api.yourdomain.com` and rebuild/re-upload to S3.

---

## 4. Maintenance & Operations
- **To update frontend:** Run `npm run build`, upload `dist` contents to S3, and go to CloudFront -> Invalidations -> Create invalidation for `/*`.
- **To update backend:** SSH into EC2, `git pull`, `npm install`, and `pm2 restart all`.
- **Monitoring:** Use `pm2 monit` on your EC2 instance to watch live backend logs. Use AWS Billing Dashboard with budget alerts to avoid unexpected costs.
