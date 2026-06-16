import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js"; // Adjust path if needed

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) {
        return res.status(401).json({ message: "Unauthorized - invalid token" });
      }

      // 1. Try to find the user in MongoDB
      let user = await User.findOne({ clerkId });

      // 2. If the user is NOT in the database, fetch them from Clerk and save them immediately
      if (!user) {
        console.log(`User ${clerkId} missing from MongoDB. Syncing on-the-fly...`);

        // Fetch the user's latest profile data directly from Clerk's servers
        const clerkUser = await clerkClient.users.getUser(clerkId);

        // Save them to MongoDB
        user = await User.create({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Anonymous User",
          profileImage: clerkUser.imageUrl,
        });

        // Sync them to Stream Chat/Video so they can actually use the rooms
        await upsertStreamUser({
          id: user.clerkId,
          name: user.name,
          image: user.profileImage,
        });

        console.log(`✅ User ${user.name} successfully synced to MongoDB!`);
      }

      // 3. Attach the MongoDB user document to the request and proceed
      req.user = user;
      next();

    } catch (error) {
      console.error("Error in protectRoute middleware:", error);
      res.status(500).json({ message: "Internal Server Error during user validation" });
    }
  },
];