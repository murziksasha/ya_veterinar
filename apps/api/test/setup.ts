import { readFileSync } from "fs";
import { join } from "path";

const envFile = readFileSync(join(__dirname, "..", ".env"), "utf8");
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}
process.env.SESSION_SECRET ||= "test-secret";
