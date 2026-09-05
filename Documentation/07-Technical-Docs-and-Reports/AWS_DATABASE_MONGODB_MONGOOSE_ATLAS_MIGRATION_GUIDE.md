# SMAART Institute Database Guide: MongoDB, Mongoose, Atlas, and AWS Migration

Last updated: 2026-05-21

## What this document covers

This guide explains, specifically for the SMAART Institute codebase:

1. How the database is wired today.
2. What `MongoDB`, `Mongoose`, and `MongoDB Atlas` each do.
3. What your AWS options are if you want to move away from Atlas.
4. Cost comparison in INR.
5. Which AWS option is best for SMAART.
6. Step-by-step migration paths.
7. Exact repo changes you should make.

## Current SMAART Database Architecture

### What the code uses today

The current backend uses:

- `MongoDB` as the database
- `Mongoose` as the ODM library
- `MONGODB_URI` environment variable as the connection string

Main connection point:

- [back-end/server.js](../back-end/server.js)

The app connects like this:

```js
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minds';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true
})
```

### Mongoose usage in this repo

Package file:

- [back-end/package.json](../back-end/package.json)

It currently uses:

- `mongoose: ^7.0.0`

### Important note

If you move databases:

- **Mongoose usually stays**
- only the **database endpoint and compatibility target** change

That means:

- if you stay on MongoDB Atlas, Mongoose code stays almost unchanged
- if you move to self-managed MongoDB on AWS, Mongoose code also mostly stays unchanged
- if you move to Amazon DocumentDB, Mongoose stays, but some MongoDB features may behave differently

## What each term means

### MongoDB

MongoDB is the document database engine.

### Mongoose

Mongoose is the Node.js ODM used by SMAART to define schemas and interact with MongoDB collections.

### MongoDB Atlas

Atlas is MongoDB's managed cloud service. Atlas can itself run on AWS, Azure, or GCP.

This is an important point:

- You can already be "on AWS" while still using Atlas, if your Atlas cluster is hosted in an AWS region.

## Important finding in this repo

Most runtime code correctly uses `process.env.MONGODB_URI`.

But some scripts contain hardcoded Atlas connection strings and local Mongo URIs. Examples include:

- `back-end/scripts/check_user_data.js`
- `back-end/scripts/reconcile_progress_data.js`
- `back-end/scripts/reset_user_data.js`
- `back-end/scripts/list_enrollments_detailed.js`
- `back-end/scripts/trace_enrollment.js`
- `back-end/scripts/list_users.js`
- `back-end/scripts/test_college_search.js`

Before any migration, these should be cleaned to use environment variables only.

## Your realistic AWS options

For SMAART, there are 3 realistic database hosting options:

1. **Keep MongoDB Atlas, but use AWS region in Atlas**
2. **Move to Amazon DocumentDB**
3. **Run self-managed MongoDB on AWS EC2**

## Option 1: Keep Atlas, place it on AWS

This is the easiest path.

### What changes

- Your database remains MongoDB Atlas
- Atlas cluster can be provisioned in AWS region such as Mumbai
- app still uses `mongodb+srv://...`
- Mongoose code stays almost exactly the same

### Pros

- lowest migration risk
- no major code rewrite
- full MongoDB compatibility
- easiest for current SMAART models and scripts

### Cons

- managed service cost can rise as usage grows
- less infrastructure control than self-managed MongoDB
- separate billing/vendor from core AWS services

## Option 2: Move to Amazon DocumentDB

Amazon DocumentDB is AWS's MongoDB-compatible managed database.

### Pros

- AWS-native managed database
- integrates well with AWS networking, IAM, CloudWatch, backups
- easier operations than self-managed MongoDB

### Cons

- not full MongoDB feature parity
- some aggregation/index/query behaviors can differ
- compatibility testing is mandatory

For SMAART, this option is possible, but you must test carefully because this repo uses many Mongoose models, ObjectIds, nested schemas, and reporting flows.

## Option 3: Self-managed MongoDB on EC2

You run MongoDB Community or Enterprise on EC2 yourself.

### Pros

- full MongoDB behavior
- full control
- can be cheaper at some sizes
- Mongoose compatibility is best because it is real MongoDB

### Cons

- you manage backups
- you manage patching
- you manage failover
- you manage replica sets
- operational burden is highest

## My recommendation for SMAART

### Best near-term option

**Atlas on AWS region**

Reason:

- minimum risk
- no Mongoose rewrite
- easiest migration
- fastest production move

### Best full-AWS managed option

**Amazon DocumentDB**, but only after compatibility testing.

### Best control / lowest long-term infra dependence

**Self-managed MongoDB replica set on EC2**

but this is operationally the heaviest.

## Pricing reference date and INR conversion

Pricing changes over time, so validate again before production decisions.

For INR conversions in this document, I am using:

- **1 USD = INR 96.3422**

Source checked on 2026-05-21:

- XE USD/INR page: https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=USD&To=INR

### Important pricing note

- INR values below are approximate conversions from USD
- GST, AWS taxes, support plans, backups, cross-AZ traffic, and add-ons may increase final billing
- Mumbai region pricing can differ from US pricing examples

## Official pricing references used

### MongoDB Atlas

- MongoDB pricing: https://www.mongodb.com/pricing

Key official values seen:

- Free: `$0/hour`
- Flex: `$0.011/hour`, up to `$30/month`
- Dedicated: starts at `$0.08/hour`, from `$56.94/month`

### Amazon DocumentDB

- AWS DocumentDB pricing: https://aws.amazon.com/documentdb/pricing/

Key official values seen in pricing/examples:

- storage as low as `$0.10/GB/month`
- backup beyond included free backup: as low as `$0.02/GB/month`
- serverless standard example: `$0.0822 per DCU-hour`
- I/O price in standard example: `$0.20 per million I/Os`
- `db.r5.large` example:
  - Standard example monthly total: `$449.42/month`
  - I/O-Optimized example monthly total: `$459.86/month`

## Cost comparison in INR

## 1. MongoDB Atlas pricing in INR

### Atlas Free

- USD: `$0/hour`
- INR: `Rs 0`

### Atlas Flex

Official:

- `$0.011/hour`
- up to `$30/month`

Approx INR:

- `0.011 x 96.3422 = Rs 1.06/hour`
- `30 x 96.3422 = Rs 2,890.27/month`

### Atlas Dedicated starting tier

Official:

- `$0.08/hour`
- starts at `$56.94/month`

Approx INR:

- `0.08 x 96.3422 = Rs 7.71/hour`
- `56.94 x 96.3422 = Rs 5,486.92/month`

### Atlas pricing interpretation for SMAART

Atlas is usually excellent for:

- MVP
- early production
- small to medium growth
- teams that want low ops burden

## 2. Amazon DocumentDB pricing in INR

### Storage

Official pricing page says storage is as low as:

- `$0.10/GB/month`

Approx INR:

- `0.10 x 96.3422 = Rs 9.63/GB/month`

### Additional backup storage

Official pricing page says beyond included backup:

- as low as `$0.02/GB/month`

Approx INR:

- `0.02 x 96.3422 = Rs 1.93/GB/month`

### Serverless compute

Official example:

- `$0.0822 per DCU-hour`

Approx INR:

- `0.0822 x 96.3422 = Rs 7.92 per DCU-hour`

### I/O cost for standard configuration

Official example:

- `$0.20 per million I/Os`

Approx INR:

- `0.20 x 96.3422 = Rs 19.27 per million I/Os`

### DocumentDB example: two `db.r5.large` cluster

Official AWS example totals:

- Standard: `$449.42/month`
- I/O-Optimized: `$459.86/month`

Approx INR:

- Standard: `449.42 x 96.3422 = Rs 43,297.72/month`
- I/O-Optimized: `459.86 x 96.3422 = Rs 44,303.55/month`

### DocumentDB pricing interpretation for SMAART

DocumentDB gets expensive once you move into multi-instance production shape.

It is attractive if:

- you want managed AWS-native service
- you are okay paying more for operations simplicity
- your app is AWS-heavy and needs integrated networking/security

## 3. Self-managed MongoDB on EC2

This is the hardest one to give a single official number for because cost depends on:

- EC2 instance family
- EBS volume size
- EBS volume type
- number of replica set nodes
- backup strategy
- cross-AZ design

So unlike Atlas and DocumentDB, self-managed MongoDB pricing is architecture-dependent.

### What you must budget

At minimum:

1. EC2 instances
2. EBS volumes
3. snapshots
4. data transfer across AZs if applicable
5. monitoring/logging

### Practical SMAART production note

A serious production replica set usually means:

- 3 nodes minimum
- each node on EC2
- each node with EBS

That can be cost-effective, but only if your team is comfortable operating databases.

## Quick pricing summary

### Lowest ops burden

- Atlas

### AWS-native managed

- DocumentDB

### Highest control

- Self-managed MongoDB on EC2

### Best price-to-effort ratio for SMAART

- Atlas in AWS region, unless there is a hard AWS-native requirement

## Which option should SMAART choose?

### Choose Atlas on AWS if:

- you want fast migration
- you want full MongoDB compatibility
- you want lowest engineering risk
- your team does not want to run databases manually

### Choose DocumentDB if:

- leadership wants AWS-managed services only
- the team accepts compatibility testing and possible query changes
- infra centralization matters more than exact MongoDB parity

### Choose self-managed MongoDB on EC2 if:

- you need full MongoDB feature compatibility
- you want maximum control
- your DevOps team can own backups, patching, monitoring, failover

## Repo-specific migration impact

## What stays the same in all options

- Mongoose models
- most schema definitions
- most business logic
- `MONGODB_URI` pattern

## What changes depending on the target

### If moving Atlas region only

Only:

- `MONGODB_URI`
- Atlas networking
- IP allowlist / VPC peering / PrivateLink if used

### If moving to DocumentDB

Change:

- `MONGODB_URI`
- TLS settings
- compatibility testing
- some query/index behavior validation

### If moving to EC2 MongoDB

Change:

- `MONGODB_URI`
- infrastructure provisioning
- backups
- replica set
- security groups
- monitoring

## Step-by-step: Move SMAART from Atlas to Atlas on AWS region

This is the simplest path.

### Step 1

Create a new Atlas cluster in AWS region near your users, such as Mumbai.

### Step 2

Export current data from the existing cluster.

### Step 3

Import to the new Atlas cluster.

### Step 4

Update `MONGODB_URI` in backend environment.

### Step 5

Run staging validation:

- login
- registration
- assessment flow
- course flow
- notifications
- community
- vision boards

### Step 6

Cut production traffic to the new Atlas URI.

## Step-by-step: Move SMAART from Atlas to Amazon DocumentDB

This is the AWS-managed migration path.

## Phase 1: Readiness

### Step 1

Inventory MongoDB features used by SMAART.

Important repo areas:

- all Mongoose models under `back-end/models`
- aggregation-heavy routes
- reporting flows
- user, enrollment, community, assessment, career features

### Step 2

Remove hardcoded connection strings in scripts and standardize everything on `MONGODB_URI`.

### Step 3

Create a compatibility test checklist.

At minimum verify:

- ObjectId-based queries
- indexing behavior
- unique constraints
- aggregations
- update operators
- transactions if any future use exists

## Phase 2: Provision DocumentDB

### Step 4

Create VPC and subnets across multiple AZs.

### Step 5

Create DocumentDB cluster.

### Step 6

Enable TLS.

### Step 7

Create security groups allowing backend access only.

### Step 8

Create parameter groups if required.

## Phase 3: Data migration

### Step 9

Export data from Atlas using `mongodump`.

### Step 10

Import to DocumentDB using `mongorestore`.

### Step 11

Recreate indexes and validate collections.

## Phase 4: App configuration

### Step 12

Update backend env:

```env
MONGODB_URI=mongodb://<username>:<password>@<docdb-endpoint>:27017/<dbname>?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

Important:

- DocumentDB often requires TLS
- retry behavior may differ
- some URI flags may need adjustment

### Step 13

If needed, add CA certificate handling in Node runtime or connection options.

### Step 14

Run full app validation in staging.

## Phase 5: Production cutover

### Step 15

Freeze writes briefly if required.

### Step 16

Run final sync.

### Step 17

Switch `MONGODB_URI`.

### Step 18

Monitor:

- connection errors
- slow queries
- write failures
- auth failures

## Step-by-step: Move SMAART to self-managed MongoDB on EC2

This is the highest-control path.

## Phase 1: Infrastructure

### Step 1

Create VPC and private subnets.

### Step 2

Launch at least 3 EC2 instances for a replica set.

### Step 3

Attach EBS volumes.

### Step 4

Configure security groups:

- allow only backend servers and admin bastion
- do not expose MongoDB publicly

## Phase 2: MongoDB setup

### Step 5

Install MongoDB on all nodes.

### Step 6

Enable authentication.

### Step 7

Enable TLS if required.

### Step 8

Initialize replica set.

### Step 9

Create database users and roles.

## Phase 3: Backups and monitoring

### Step 10

Set up backups:

- snapshots
- `mongodump`
- retention policy

### Step 11

Set up monitoring:

- CloudWatch
- system metrics
- MongoDB slow query logs

## Phase 4: Migration

### Step 12

Export Atlas data.

### Step 13

Restore to EC2 MongoDB.

### Step 14

Update backend `MONGODB_URI`.

### Step 15

Validate all flows.

## Exact files in this repo to review

### Runtime

- [back-end/server.js](../back-end/server.js)
- all files under [back-end/models](../back-end/models)

### Scripts to clean

Search and normalize all direct URI usage:

- hardcoded `mongodb+srv://`
- hardcoded `mongodb://localhost`

### Package dependency

- [back-end/package.json](../back-end/package.json)

## Mongoose compatibility note

Mongoose itself does not need to be replaced.

That is the key point.

For SMAART:

- `Mongoose` remains the ODM
- only the connection target changes

What may need adjustment is not Mongoose, but:

- connection string flags
- TLS settings
- incompatible database engine behavior if using DocumentDB

## Final recommendation for SMAART

### If you want the safest move

Use **MongoDB Atlas on AWS region**.

### If you want fully AWS-managed database

Use **Amazon DocumentDB**, but first run a proper compatibility test cycle.

### If you want maximum control and full MongoDB behavior

Use **self-managed MongoDB on EC2**, but only if you have strong DevOps ownership.

## Best path in order

1. Clean all hardcoded URIs in scripts.
2. Standardize all environments on `MONGODB_URI`.
3. Decide target:
   - Atlas on AWS
   - DocumentDB
   - EC2 MongoDB
4. Stand up staging database.
5. Migrate sample production data.
6. Run end-to-end validation.
7. Cut over production.

## Source links

- MongoDB pricing: https://www.mongodb.com/pricing
- Amazon DocumentDB pricing: https://aws.amazon.com/documentdb/pricing/
- XE USD/INR: https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=USD&To=INR
