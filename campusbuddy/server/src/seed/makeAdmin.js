// Usage: npm run make-admin -- someone@example.com
// Turns an existing account into an admin. The person must have registered first.
import mongoose from 'mongoose';
import dns from 'node:dns';
import { config } from '../config.js';
import { User } from '../models/User.js';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Please give the email address, for example: npm run make-admin -- me@example.com');
  process.exit(1);
}

try {
  if (config.dnsServers.length) dns.setServers(config.dnsServers);
  await mongoose.connect(config.mongoUri);
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No account found for ${email}. Register it on the site first, then run this again.`);
    process.exitCode = 1;
  } else {
    user.role = 'admin';
    await user.save();
    console.log(`${email} is now an admin. Sign out and back in on the website.`);
  }
} catch (err) {
  console.error('Failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
