This project implements a high-performance analytics backend capable of handling a large number of incoming website events.
It uses an asynchronous event processing pipeline for speed and scalability, with separate services for ingestion, background processing, and reporting.

Architecture Overview

Service	                   Purpose
post_Service	      Receives website analytics events (e.g., page_view) and immediately enqueues them to Kafka for processing.
worker              Service	Background worker that consumes events from Kafka and writes them to MongoDB.
report_service    	Exposes a /stats API to query aggregated analytics data from MongoDB.


Architecture Diagram

+------------+       POST /event        +------------------+
|   Browser  | -----------------------> | Ingestion Service |
+------------+                          +------------------+
                                              |
                                              | Kafka (async queue)
                                              v
                                      +------------------+
                                      | Processor Worker |
                                      +------------------+
                                              |
                                              | MongoDB writes
                                              v
                                      +------------------+
                                      |   MongoDB (DB)   |
                                      +------------------+
                                              ^
                                              | Aggregation queries
                                              |
                                      +------------------+
                                      | Reporting API    |
                                      +------------------+


Architecture Decision: Asynchronous Processing
 Why Kafka?
The Ingestion API must be extremely fast — it cannot wait for DB writes.
Incoming events are pushed to a Kafka topic (events), which acts as a buffer.
The worker Service consumes messages at its own pace, ensuring no data loss even under high load.
This decouples the ingestion layer from the database, allowing both to scale independently.

Flow:
Client → post_Service: Sends event data via POST /event.
Ingestion → Kafka: The event is validated and published to the events topic.
worker → MongoDB: The worker consumes from Kafka and saves each event in MongoDB.
report_Service: Aggregates and returns summaries via GET /stats.

Setup Instructions

First, make sure Kafka and MongoDB are installed and running locally on your system.
Next, clone this repository using the command:
git clone https://github.com/yourusername/website-analytics-backend.git
Then go inside the project folder:
cd website-analytics-backend.
Run npm install to install all required dependencies.
Create a file named .env in the project root and add the following environment variables:
MONGO_URL=mongodb://localhost:27017/analytics_db
KAFKA_BROKER=localhost:9092

Now, start the three services one by one:
post_Service (Fast Event API): Run npm run start:api
worker Service (Kafka Consumer): Run npm run start:processor
report_Service (Analytics API): Run npm run start:report

Once all services are running, you can start sending events and fetching analytics data.

To send an event, use:

curl -X POST http://localhost:3000/event \
-H "Content-Type: application/json" \
-d '{"site_id":"site123","event_type":"page_view","path":"/home","user_id":"user1"}'

To view summarized analytics:
curl "http://localhost:4000/stats?site_id=site123"



                                      

