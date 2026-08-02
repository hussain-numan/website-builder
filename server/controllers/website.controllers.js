import { generateResponse } from "../config/openRouter.js";
import User from "../models/user.model.js";
import Website from "../models/website.model.js";
import extractCodeResponse from "../utils/extractCodeResponse.js";

const masterPrompt = `
You are a WORLD-CLASS Principal Frontend Architect, Senior Product Designer, Creative Director, and Elite UI/UX Engineer.

Your job is to create visually stunning, premium, production-grade websites that look like they were designed by a top Silicon Valley product team in 2026–2027.

USER REQUIREMENT:
{USER_PROMPT}

MISSION:
Build an extremely polished, visually premium, fully functional website with exceptional UI, microinteractions, spacing, hierarchy, responsiveness, and real-world usability.

DESIGN QUALITY (NON-NEGOTIABLE):
The result MUST look like a premium startup website worth $20,000+.

Visual inspiration level:
- Apple
- Stripe
- Linear
- Framer
- Vercel
- Notion
- Raycast
- Airbnb
- Modern SaaS landing pages
- Premium agency portfolio sites

STRICTLY FORBIDDEN:
- Ugly UI
- Generic layouts
- Template-looking designs
- Basic hero sections
- Amateur spacing
- Poor typography
- Repeated card layouts
- Empty sections
- Boring buttons
- Broken responsiveness
- Horizontal scrolling
- Lorem ipsum
- Fake placeholder content
- Generic stock appearance
- Repetitive sections
- Dead buttons
- Empty navigation
- Cheap shadows
- Old-school gradients
- Bootstrap-looking UI

TECH STACK RULES:
- ONLY HTML, CSS, JavaScript
- NO frameworks
- NO libraries
- NO Tailwind
- NO Bootstrap
- NO React
- NO external CSS
- NO external JS
- NO CDN
- NO external fonts
- System fonts only

FILE STRUCTURE:
- EXACTLY ONE HTML FILE
- EXACTLY ONE <style> tag
- EXACTLY ONE <script> tag
- iframe srcdoc compatible
- Fully self-contained

VISUAL DESIGN REQUIREMENTS:
Must include:
- Glassmorphism where appropriate
- Premium gradients
- Soft glow effects
- Professional spacing system
- Layered depth
- Beautiful cards
- Modern navbar
- Smooth hover states
- Premium CTA buttons
- Rich section composition
- Strong visual hierarchy
- Animated UI interactions
- Elegant borders
- Modern shadows
- Smooth reveal animations
- Premium loading feel
- Scroll animations
- Interactive components

LAYOUT REQUIREMENTS:
Must include:
1. Hero section
2. Features/services section
3. About/company section
4. Testimonials/social proof
5. Pricing or portfolio showcase
6. Contact section
7. Footer
8. Responsive navbar

HERO SECTION MUST HAVE:
- Strong headline
- Supporting copy
- Premium CTA buttons
- Secondary CTA
- Beautiful visual composition
- Background effects
- Animated elements
- Premium modern feeling

RESPONSIVENESS (ABSOLUTE REQUIREMENT):
Mobile-first design.

Must work perfectly on:
- Mobile (<768px)
- Tablet (768–1024px)
- Desktop (>1024px)

REQUIRED:
- CSS Grid
- Flexbox
- Media queries
- Fluid typography
- Relative units
- Touch-friendly UI
- Perfect mobile spacing
- Collapsible navbar
- Single-column mobile layouts

IMAGES:
Only use:
https://images.unsplash.com/

Every image URL MUST include:
?auto=format&fit=crop&w=1200&q=80

Images MUST:
- Be relevant
- Feel premium
- Match brand aesthetic
- Be responsive
- Never overflow

FUNCTIONALITY:
Everything MUST work.

Required:
- Working navbar navigation
- Smooth scrolling
- Animated section transitions
- JS-powered interactions
- Working buttons
- Hover states
- Active states
- Contact form validation
- Scroll reveal animations
- Interactive UI feedback

SPA REQUIREMENTS:
Create a SPA-like experience.

Required sections/pages:
- Home
- About
- Services or Features
- Portfolio or Showcase
- Contact

Rules:
- No page reloads
- JavaScript navigation
- Active navbar states
- Smooth transitions
- At least one visible page initially
- If using:
.page { display:none }

Then MUST include:
.page.active { display:block }

ANIMATION REQUIREMENTS:
Use premium subtle animations:
- Fade-in
- Slide-up
- Hover lift
- Card interaction
- Button press effects
- Smooth transitions
- Scroll reveals
- Floating visuals
- Elegant microinteractions

CODE QUALITY:
- Senior-level clean code
- Readable
- Organized
- Maintainable
- Production-ready
- Semantic HTML
- Accessible structure

OUTPUT FORMAT:
Respond with EXACTLY this structure and nothing else before or after it.
Do NOT wrap the code in JSON and do NOT escape it - output the raw HTML directly.

@@MESSAGE@@
<one professional confirmation sentence>
@@CODE@@
<FULL COMPLETE HTML DOCUMENT, ending with </html>>

ABSOLUTE RULES:
- NO JSON
- NO markdown
- NO backticks
- NO explanations outside the format above
- NO extra text
- NO truncation
- FULL website only, must end with </html>
- FINISHED production-ready result
`;

export const generateWebsite = async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Generate Website Request:", prompt);
    if (!prompt) {
      return res.status(400).json({ message: "prompt is required" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    if (user.credits < 50) {
      return res.status(400).json({
        message: "you don't have enough credits to generate a website",
      });
    }

    const finalPrompt = masterPrompt.replace("USER_PROMPT", prompt);
    let raw = await generateResponse(finalPrompt);
    let parsed = await extractCodeResponse(raw);

    if (!parsed) {
      raw = await generateResponse(
        finalPrompt + "\n\nFOLLOW THE EXACT @@MESSAGE@@ / @@CODE@@ FORMAT.",
      );
      parsed = await extractCodeResponse(raw);
    }

    if (!parsed?.code) {
      console.log("ai returned invalid response", raw);
      return res.status(400).json({ message: "ai returned invalid response" });
    }

    if (!parsed.complete) {
      console.log("ai response was truncated, length:", raw?.length);
      return res.status(400).json({
        message:
          "The generated website was too large and got cut off. Try a shorter or more specific description.",
      });
    }

    const website = await Website.create({
      user: user._id,
      title: prompt.slice(0, 60),
      latestCode: parsed.code,
      conversation: [
        {
          role: "user",
          content: prompt,
        },
        {
          role: "ai",
          content: parsed.message,
        },
      ],
    });

    user.credits = user.credits - 50;
    await user.save();

    return res.status(201).json({
      websiteId: website._id,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Generate Website Error:", error);
    return res
      .status(500)
      .json({ message: `generate website error : ${error}` });
  }
};

export const getWebsiteById = async (req, res) => {
  try {
    const website = await Website.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!website) {
      return res.status(400).json({ message: "website not found" });
    }
    return res.status(200).json(website);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `get website by id error ${error}` });
  }
};

export const changes = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "prompt is required" });
    }
    const website = await Website.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!website) {
      return res.status(400).json({ message: "website not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    if (user.credits < 25) {
      return res.status(400).json({
        message: "you don't have enough credits to generate a website",
      });
    }

    const updatePrompt = `UPDATE THIS HTML WEBSITE.

CURRENT CODE:
${website.latestCode}

USER REQUEST:
${prompt}

Respond with EXACTLY this structure and nothing else before or after it.
Do NOT wrap the code in JSON and do NOT escape it - output the raw HTML directly.

@@MESSAGE@@
<short confirmation sentence>
@@CODE@@
<UPDATED FULL HTML DOCUMENT, ending with </html>>`;

    let raw = await generateResponse(updatePrompt);
    let parsed = await extractCodeResponse(raw);

    if (!parsed) {
      raw = await generateResponse(
        updatePrompt + "\n\nFOLLOW THE EXACT @@MESSAGE@@ / @@CODE@@ FORMAT.",
      );
      parsed = await extractCodeResponse(raw);
    }

    if (!parsed?.code) {
      console.log("ai returned invalid response", raw);
      return res.status(400).json({ message: "ai returned invalid response" });
    }

    if (!parsed.complete) {
      console.log("ai response was truncated, length:", raw?.length);
      return res.status(400).json({
        message:
          "The generated update was too large and got cut off. Try a shorter or more specific request.",
      });
    }

    website.conversation.push(
      { role: "ai", content: parsed.message },
      { role: "user", content: prompt },
    );

    website.latestCode = parsed.code;

    await website.save();

    user.credits = user.credits - 25;
    await user.save();

    return res.status(201).json({
      message: parsed.message,
      code: parsed.code,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Update Website Error:", error);
    return res.status(500).json({ message: `update website error : ${error}` });
  }
};

export const getAll = async (req, res) => {
  try {
    const websites = await Website.find({ user: req.user._id }).lean();

    // Recompute the public URL from the current FRONTEND_URL instead of the
    // value stored at deploy time, so links stay correct even if the domain
    // config changes after a site was deployed.
    const withFreshUrls = websites.map((w) =>
      w.deployed
        ? { ...w, deployUrl: `${process.env.FRONTEND_URL}/site/${w.slug}` }
        : w,
    );

    return res.status(200).json(withFreshUrls);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `get all websites error : ${error}` });
  }
};

export const deploy = async (req, res) => {
  try {
    const website = await Website.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!website) {
      return res.status(400).json({ message: "website not found" });
    }

    if (!website.slug) {
      website.slug =
        website.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 60) + website._id.toString().slice(-5);
    }

    website.deployed = true;
    website.deployUrl = `${process.env.FRONTEND_URL}/site/${website.slug}`;
    await website.save();

    return res.status(200).json({
      url: website.deployUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `deploy website error : ${error}` });
  }
};


export const getBySlug = async (req, res) => {
  try {
    // Public route: anyone with the link can view a deployed site, so this
    // intentionally does not require auth or filter by owner.
    const website = await Website.findOne({
      slug: req.params.slug,
      deployed: true,
    }).select("title latestCode slug")

    if (!website) {
      return res.status(400).json({ message: "website not found" })
    }

    return res.status(200).json(website)
  } catch (error) {
    return res.status(500).json({ message: `get by slug website error: ${error.message || error}` })
  }
}
