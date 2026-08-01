import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const websiteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "Untitled Website",
    },

    latestCode: {
      type: String,
      required: true,
      default: "",
    },

    conversation: {
      type: [messageSchema],
      default: [],
    },

    deployed: {
      type: Boolean,
      default: false,
    },

    deployUrl: {
      type: String,
      default: "",
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      default: () => `website-${Date.now()}`,
    },
  },
  { timestamps: true },
);

const Website = mongoose.model("Website", websiteSchema);

export default Website;
