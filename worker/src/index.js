import { Kafka } from "kafkajs";
import mongoose from "mongoose";

// --- 1️⃣ Connect to MongoDB using Mongoose ---
await mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log("Mongodb connected ");

const eventSchema = new mongoose.Schema({
  site_id: { 
    type: String, required: true, index: true 
},
  event_type: { 
    type: String, required: true 
},
  path: { 
    type: String 
},
  user_id: {
     type: String 
    },
  timestamp: { 
    type: Date, default: Date.now },
});

eventSchema.index({ site_id: 1, timestamp: -1 });
eventSchema.index({ path: 1 });

const EventModel = mongoose.model("Event", eventSchema);

const kafka = new Kafka({ brokers: [process.env.KAFKA_URL] });
const consumer = kafka.consumer({
     groupId: "analytics-group" 
    });

await consumer.connect();
await consumer.subscribe({ topic: "events" });

console.log(" Kafka consumer connected listening to 'events'");

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      const event = JSON.parse(message.value.toString());
      await EventModel.create(event);
      console.log(" Saved event:", event.site_id, event.event_type);
    } catch (err) {
      console.error(" Failed to save event:", err.message);
    }
  },
});
