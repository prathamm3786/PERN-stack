import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import productRoutes from "./routes/productRoutes.js"; //
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";
import path from "path";
dotenv.config();
const app = express();

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(cors()); // Enable CORS for all routes
app.use(helmet({
  contentSecurityPolicy: false
})); // Security middleware
app.use(morgan("dev")); // Logging middleware


const PORT = process.env.PORT || 5000;
const __dirname = path.resolve(); // Get the current directory name

app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({
          error: "Too many requests",
        });
      } else if (decision.reason.isBot()) {
        res.status(403).json({
          error: "Bot access denied",
        });
      }else{
        res.status(403).json({
          error: "Access denied",
        });
      }
      return;
    } 

    next();
    if(decision.results.some((result)=> result.reason.isBot() && result.reason.isSpoofed())){
        res.status(403).json({
            error: "Spoofed access denied",
        });
        return;
    }
  } catch (error) {
    console.log("Acrjet error:", error);
    next(error); // Pass the error to the next middleware
    
  }
});

app.use("/api/products", productRoutes); // Route for product-related endpoints
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/dist")));
  app.get(".", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend","dist", "index.html"));
  });
}

async function initDB() {
  try {
    await sql`
            CREATE TABLE IF NOT EXISTS products(
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`;

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing the database:", error);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
