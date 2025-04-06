import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const {PGHOST , PGDATABASE , PGUSER , PGPASSWORD}=process.env;

export const sql = neon(
    `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}`
)


//  postgresql://neondb_owner:npg_MXnpL87PfGxc@ep-withered-firefly-a89epnfo-pooler.eastus2.azure.neon.tech/neondb?sslmode=require