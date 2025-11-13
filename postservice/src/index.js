import express from "express";
import { Kafka } from "kafkajs";

const app = express();
app.use(express.json());

const kafka = new Kafka({ 
    brokers: [process.env.KAFKA_URL] 
});
const producer = kafka.producer();

await producer.connect();

app.post("/events", async (req, res) => {
  const { site_id, event_type, path, user_id, timestamp } = req.body;
  if (!site_id || !event_type)
    return res.status(400).json({
 error: " site_id and event_type required " 
});

  await producer.send({
    topic: "events",
    messages: [{ 
        value: JSON.stringify(req.body) 
    }],
  });

  return res.json({ success: true });
});

app.listen(process.env.PORT, () => console.log("sever running at ",process.env.PORT));
