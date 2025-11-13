import express from "express";
import mongoose from "mongoose";

const app = express();

await mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log(" Mongodb connected..");

const eventSchema = new mongoose.Schema({
  site_id: {
     type: String, required: true 
    },
  event_type: {
     type: String, required: true },
  path: { 
    type: String },
  user_id: { 
    type: String },
  timestamp: { 
    type: Date, default: Date.now },
});

const Event = mongoose.model("Event", eventSchema);

app.get("/stats", async (req, res) => {
  try {
    const { site_id, date } = req.query;
    if (!site_id)
      return res.status(400).json({ error: "site_id required  " });

    const matchStage = { site_id };
    if (date) {
      matchStage.timestamp = {
        $gte: new Date(`${date}T00:00:00Z`),
        $lt: new Date(`${date}T23:59:59Z`),
      };
    }

    const agg = await Event.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$path",
          views: { $sum: 1 },
          users: { $addToSet: "$user_id" },
        },
      },
      {
        $project: {
          path: "$_id",
          views: 1,
          users: 1,
          unique_users: { $size: "$users" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    const total_views = agg.reduce((acc, a) => acc + a.views, 0);
    const unique_users = new Set(
      agg.flatMap((a) => a.users)
    ).size;

    res.json({
      site_id,
      date,
      total_views,
      unique_users,
      top_paths: agg.map((a) => ({
        path: a.path,
        views: a.views,
      })),
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(4000, () =>
  console.log(" Reporting service running on port 4000")
);
