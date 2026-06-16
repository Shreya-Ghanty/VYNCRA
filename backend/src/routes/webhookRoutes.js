// routes/webhookRoutes.js
import { Router } from "express";
import { Webhook } from "svix";
import express from "express";
import { connectDB } from "../lib/db.js";
import User from "../models/User.js";
import { upsertStreamUser, deleteStreamUser } from "../lib/stream.js";
import { ENV } from "../lib/env.js";

const router = Router();

// CRITICAL: Use express.raw to preserve the original signature headers
router.post(
    "/clerk",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        // Falls back to process.env if not explicitly mapped inside your ENV utility
        const WEBHOOK_SECRET = ENV.CLERK_WEBHOOK_SECRET || process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            console.error("Missing CLERK_WEBHOOK_SECRET");
            return res.status(500).json({ message: "Webhook configuration error" });
        }

        const svix_id = req.headers["svix-id"];
        const svix_timestamp = req.headers["svix-timestamp"];
        const svix_signature = req.headers["svix-signature"];

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return res.status(400).json({ message: "Missing required verification headers" });
        }

        const payload = req.body.toString();
        const wh = new Webhook(WEBHOOK_SECRET);

        let evt;

        try {
            evt = wh.verify(payload, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            });
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message);
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        await connectDB();
        const { type, data } = evt;

        try {
            // Create or Update operations
            if (type === "user.created" || type === "user.updated") {
                const { id, email_addresses, first_name, last_name, image_url } = data;

                const userData = {
                    clerkId: id,
                    email: email_addresses[0]?.email_address,
                    name: `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous User",
                    profileImage: image_url,
                };

                // Use findOneAndUpdate with upsert to prevent duplication synchronization edge cases
                const updatedUser = await User.findOneAndUpdate(
                    { clerkId: id },
                    userData,
                    { upsert: true, new: true }
                );

                // Synchronize directly with Stream
                await upsertStreamUser({
                    id: updatedUser.clerkId.toString(),
                    name: updatedUser.name,
                    image: updatedUser.profileImage,
                });

                console.log(`[Webhook] Synced user to DB and Stream: ${id}`);
            }

            // Delete operations
            if (type === "user.deleted") {
                const { id } = data;

                await User.deleteOne({ clerkId: id });
                await deleteStreamUser(id.toString());

                console.log(`[Webhook] Removed user from DB and Stream: ${id}`);
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error processing webhook database transaction:", error);
            return res.status(500).json({ message: "Error syncing user data" });
        }
    }
);

export default router;