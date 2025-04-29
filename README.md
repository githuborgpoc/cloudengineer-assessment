📋 User Management App - Documentation
============================================

🌟 Overview
-----------

A simple **Node.js Express** app that lets users:

-   ➕ Add new user data (**name**, **email**) into a **MySQL** database.

-   👀 View a list of users, with data **cached in Redis** for ⚡ 1 hour to boost performance.


🚀 Main Features - Application
------------------------------

-   📝 **Add Users**

    -   Form available at `/add-data-form` to submit user details into MySQL.

-   📋 **List Users**

    -   Endpoint `/users` lists all users.

    -   First checks Redis cache.

    -   If cache is empty ➡️ fetches from MySQL ➡️ caches the result in Redis (TTL: 1 hour).

* * * * *

🏗️ Architecture
----------------

```
AWS VPC

 └── ECS Cluster

      └── ECS Service

           └── ECS Task (Running 4 Containers)

                ├── Node.js App (webapp)

                ├── Redis (cache)

                ├── MySQL (database)

                └── Nginx (reverse proxy)
```

🛠️ Tech Stack
--------------

| Layer | Technology |
| --- | --- |
| **Backend** | Node.js (Express) |
| **Database** | MySQL |
| **Cache** | Redis |
| **Web Server** | Nginx |
| **Infrastructure** | Terraform |

* * * * *

⚙️ CI/CD Pipeline
-----------------

GitHub Actions workflows are defined under `.github/workflows/`:

-   📦 `build.yml`

-   🚀 `deploy.yml`

### 🔑 Pre-requisites

-   Set the following secrets in GitHub repository:

    -   `AWS_ACCESS_KEY_ID`

    -   `AWS_SECRET_ACCESS_KEY`

    -   `AWS_ACCOUNT_ID`

-   Configure AWS Region inside each pipeline YAML file.

-   Provision infrastructure (VPC, ECS, etc.) via **Terraform** before running deployments.

### 🛠️ build.yml --- Build & Push

-   Triggered by:

    -   📥 Manual (`workflow_dispatch`)

    -   🔄 Automatic Pushes to `main` or `prod` branches.

-   Actions:

    -   Sets up AWS CLI and authenticates to Amazon ECR.

    -   Builds Docker images for **webapp**, **redis**, **nginx**, and **mysql**.

    -   Tags and pushes images to ECR (`image_tag` or Git commit SHA).

    -   Prints the pushed image URIs for verification.

### 🚀 deploy.yml --- Deploy to ECS

-   Triggered manually with an `image_tag` input (Available at the end of Build Pipeline).

-   Actions:

    -   Sets up AWS CLI credentials.

    -   Updates ECS Task Definition JSON with new image tags via `jq`.

    -   Registers the updated task definition and retrieves its ARN.

    -   Updates the ECS service to use the new task definition → completes deployment.

* * * * *

📢 Notes
--------

-   Redis caching is set for **1 hour** (3600 seconds).

-   Infrastructure must be deployed before first run.

-   ECR repos must exist prior to image push.