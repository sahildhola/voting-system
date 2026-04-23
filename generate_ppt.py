"""
Generates VoteChain.pptx — a comprehensive presentation for the
blockchain voting system project.
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from copy import deepcopy

# ─── Theme ────────────────────────────────────────────────────────────────────
BG_DARK      = RGBColor(0x0B, 0x0F, 0x1A)   # slide background
BG_PANEL     = RGBColor(0x14, 0x1B, 0x2D)   # card / panel
BG_ACCENT    = RGBColor(0x1E, 0x2A, 0x47)   # accent card
PRIMARY      = RGBColor(0x6C, 0x8B, 0xF2)   # primary blue
ACCENT_GREEN = RGBColor(0x3D, 0xD6, 0x8C)
ACCENT_RED   = RGBColor(0xEF, 0x5E, 0x6A)
ACCENT_GOLD  = RGBColor(0xF5, 0xB8, 0x3E)
TEXT_PRIMARY = RGBColor(0xE7, 0xEC, 0xF5)
TEXT_MUTED   = RGBColor(0x9A, 0xA6, 0xBE)
BORDER       = RGBColor(0x2A, 0x35, 0x54)

FONT_TITLE = "Calibri"
FONT_BODY  = "Calibri"
FONT_MONO  = "Consolas"

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SLIDE_W = prs.slide_width
SLIDE_H = prs.slide_height
BLANK   = prs.slide_layouts[6]


# ─── Helpers ─────────────────────────────────────────────────────────────────
def set_bg(slide, color=BG_DARK):
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    bg.line.fill.background()
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    bg.shadow.inherit = False
    return bg


def add_text(slide, left, top, width, height, text,
             font=FONT_BODY, size=14, bold=False, color=TEXT_PRIMARY,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, italic=False):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.margin_left = tf.margin_right = Emu(0)
    tf.margin_top = tf.margin_bottom = Emu(0)
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    lines = text.split("\n") if isinstance(text, str) else text
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        run = p.add_run()
        run.text = line
        run.font.name = font
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color
    return tb


def add_rect(slide, left, top, width, height, fill=BG_PANEL, line=BORDER, line_w=0.75):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    s.adjustments[0] = 0.06
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(line_w)
    s.shadow.inherit = False
    return s


def add_header(slide, title, subtitle=None, tag=None):
    # Accent stripe
    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                    Inches(0), Inches(0), SLIDE_W, Inches(0.07))
    stripe.line.fill.background()
    stripe.fill.solid(); stripe.fill.fore_color.rgb = PRIMARY
    stripe.shadow.inherit = False

    if tag:
        add_text(slide, Inches(0.55), Inches(0.25), Inches(3), Inches(0.3),
                 tag.upper(), size=10, bold=True, color=PRIMARY)
    add_text(slide, Inches(0.5), Inches(0.45), Inches(12.3), Inches(0.7),
             title, font=FONT_TITLE, size=30, bold=True, color=TEXT_PRIMARY)
    if subtitle:
        add_text(slide, Inches(0.5), Inches(1.05), Inches(12.3), Inches(0.35),
                 subtitle, size=13, color=TEXT_MUTED)
    # Divider
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                  Inches(0.5), Inches(1.5),
                                  SLIDE_W - Inches(1.0), Emu(12700))
    line.line.fill.background()
    line.fill.solid(); line.fill.fore_color.rgb = BORDER
    line.shadow.inherit = False


def add_footer(slide, page, total):
    add_text(slide, Inches(0.5), Inches(7.15), Inches(6), Inches(0.3),
             "VoteChain • Blockchain Voting System", size=9, color=TEXT_MUTED)
    add_text(slide, Inches(7.0), Inches(7.15), Inches(5.8), Inches(0.3),
             f"{page} / {total}", size=9, color=TEXT_MUTED, align=PP_ALIGN.RIGHT)


# ─── Slide builders ──────────────────────────────────────────────────────────
def slide_title():
    s = prs.slides.add_slide(BLANK)
    set_bg(s, BG_DARK)
    # Decorative gradient blocks
    for i, (w, h, x, y, c) in enumerate([
        (Inches(5), Inches(5), Inches(8.5), Inches(-1), BG_PANEL),
        (Inches(3.5), Inches(3.5), Inches(10), Inches(3.5), BG_ACCENT),
        (Inches(1.2), Inches(1.2), Inches(1.3), Inches(5.8), PRIMARY),
    ]):
        r = s.shapes.add_shape(MSO_SHAPE.OVAL, x, y, w, h)
        r.line.fill.background()
        r.fill.solid(); r.fill.fore_color.rgb = c
        r.shadow.inherit = False

    # Chip
    chip = add_rect(s, Inches(1.3), Inches(1.4), Inches(2.6), Inches(0.45),
                    fill=BG_PANEL, line=PRIMARY)
    add_text(s, Inches(1.3), Inches(1.4), Inches(2.6), Inches(0.45),
             "⛓  DECENTRALIZED VOTING", size=11, bold=True,
             color=PRIMARY, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    add_text(s, Inches(1.3), Inches(2.1), Inches(10), Inches(1.4),
             "VoteChain", font=FONT_TITLE, size=72, bold=True, color=TEXT_PRIMARY)
    add_text(s, Inches(1.3), Inches(3.5), Inches(10), Inches(0.7),
             "A Full-Stack Blockchain Voting System",
             size=26, color=PRIMARY, bold=True)
    add_text(s, Inches(1.3), Inches(4.2), Inches(10), Inches(0.6),
             "Solidity • Hardhat • Node.js • Express • MongoDB • React • ethers.js",
             size=14, color=TEXT_MUTED, italic=True)

    # Stat cards
    stats = [("100%", "Tamper-Proof", ACCENT_GREEN),
             ("1:1",  "Voter → Wallet", PRIMARY),
             ("On-Chain", "Audit Trail",  ACCENT_GOLD)]
    for i, (big, small, col) in enumerate(stats):
        x = Inches(1.3 + i*2.6)
        add_rect(s, x, Inches(5.4), Inches(2.4), Inches(1.2),
                 fill=BG_PANEL, line=BORDER)
        add_text(s, x, Inches(5.5), Inches(2.4), Inches(0.5),
                 big, size=22, bold=True, color=col, align=PP_ALIGN.CENTER)
        add_text(s, x, Inches(6.0), Inches(2.4), Inches(0.4),
                 small, size=11, color=TEXT_MUTED, align=PP_ALIGN.CENTER)

    add_text(s, Inches(0.5), Inches(7.05), Inches(12.3), Inches(0.35),
             "Presented by: Project Team   •   Tech Stack Overview & Architecture",
             size=10, color=TEXT_MUTED, align=PP_ALIGN.CENTER)


def slide_toc():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Table of Contents", "Everything covered in this presentation", "agenda")
    items = [
        ("01", "Project Overview",         "What VoteChain is and why it matters"),
        ("02", "Problem & Motivation",     "Why traditional voting needs blockchain"),
        ("03", "Key Features",             "Core capabilities of the platform"),
        ("04", "Technology Stack",         "Every tool used, by layer"),
        ("05", "System Architecture",      "End-to-end data flow"),
        ("06", "Project Structure",        "Repository layout"),
        ("07", "Smart Contract",           "VotingSystem.sol in detail"),
        ("08", "Backend Design",           "Express API, models, services"),
        ("09", "Frontend Design",          "React pages and components"),
        ("10", "API Endpoints",            "All REST routes"),
        ("11", "Database Schema",          "MongoDB models"),
        ("12", "Security Model",           "6 layers of protection"),
        ("13", "User Flows",               "Voter & admin journeys"),
        ("14", "Deployment & Setup",       "4-terminal quick start"),
        ("15", "Testing",                  "Hardhat test coverage"),
        ("16", "Future Work & Conclusion", "Roadmap and summary"),
    ]
    cols = 2
    card_w = Inches(6.0); card_h = Inches(0.6)
    for i, (num, title, desc) in enumerate(items):
        col = i % cols; row = i // cols
        x = Inches(0.5 + col*6.4); y = Inches(1.7 + row*0.65)
        add_rect(s, x, y, card_w, card_h, fill=BG_PANEL, line=BORDER)
        add_text(s, x + Inches(0.15), y, Inches(0.7), card_h,
                 num, size=16, bold=True, color=PRIMARY, anchor=MSO_ANCHOR.MIDDLE)
        add_text(s, x + Inches(0.85), y + Inches(0.05), Inches(5.0), Inches(0.3),
                 title, size=13, bold=True, color=TEXT_PRIMARY)
        add_text(s, x + Inches(0.85), y + Inches(0.3), Inches(5.0), Inches(0.3),
                 desc, size=10, color=TEXT_MUTED)


def slide_overview():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Project Overview", "A decentralized voting application", "01")

    # Left — description
    add_rect(s, Inches(0.5), Inches(1.8), Inches(6.5), Inches(5.1))
    add_text(s, Inches(0.75), Inches(2.0), Inches(6.0), Inches(0.4),
             "What is VoteChain?", size=18, bold=True, color=PRIMARY)
    paras = [
        "VoteChain is a full-stack decentralized voting platform that records every ballot on an Ethereum-compatible blockchain.",
        "",
        "Administrators create elections, add candidates, and register voters. Voters cast ballots signed by their own wallet — the vote is stored on-chain where nobody, including the server operator, can alter it.",
        "",
        "A MongoDB database mirrors the chain for fast reads and user management, while React + ethers.js give users a familiar web-app experience backed by cryptographic guarantees.",
    ]
    add_text(s, Inches(0.75), Inches(2.5), Inches(6.0), Inches(4.3),
             "\n".join(paras), size=13, color=TEXT_PRIMARY)

    # Right — highlight cards
    data = [
        ("Decentralized",  "No single party controls the record.",  ACCENT_GREEN),
        ("Transparent",    "Every vote emits an auditable event.",  PRIMARY),
        ("Immutable",      "`require(!voter.hasVoted)` on-chain.",  ACCENT_GOLD),
        ("Time-Locked",    "Voting windows enforced by timestamp.", ACCENT_RED),
    ]
    for i, (t, d, col) in enumerate(data):
        row = i // 2; col_i = i % 2
        x = Inches(7.25 + col_i*2.95); y = Inches(1.8 + row*2.55)
        add_rect(s, x, y, Inches(2.85), Inches(2.45), fill=BG_PANEL, line=col)
        add_text(s, x, y + Inches(0.25), Inches(2.85), Inches(0.45),
                 t, size=18, bold=True, color=col, align=PP_ALIGN.CENTER)
        add_text(s, x + Inches(0.2), y + Inches(0.9), Inches(2.5), Inches(1.4),
                 d, size=12, color=TEXT_PRIMARY, align=PP_ALIGN.CENTER)


def slide_problem():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Problem & Motivation",
               "Why traditional voting systems need a blockchain rethink", "02")
    problems = [
        ("Centralized Trust",    "A single authority can modify, delete or hide votes.",          ACCENT_RED),
        ("Opaque Processes",     "Voters cannot independently verify that their vote was counted.", ACCENT_GOLD),
        ("Vulnerable to Fraud",  "Ballot stuffing, duplicate voting, coerced insider edits.",     ACCENT_RED),
        ("No Audit Trail",       "Paper trails are slow; digital systems often have no trail.",   ACCENT_GOLD),
        ("High Operating Cost",  "Physical polling stations and manual counting are expensive.",  PRIMARY),
        ("Low Turnout",          "Geography and time barriers depress participation.",            PRIMARY),
    ]
    for i, (t, d, col) in enumerate(problems):
        row = i // 3; ci = i % 3
        x = Inches(0.5 + ci*4.26); y = Inches(1.8 + row*2.7)
        add_rect(s, x, y, Inches(4.1), Inches(2.55), fill=BG_PANEL, line=BORDER)
        # icon dot
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL,
                                 x + Inches(0.25), y + Inches(0.3),
                                 Inches(0.4), Inches(0.4))
        dot.line.fill.background()
        dot.fill.solid(); dot.fill.fore_color.rgb = col
        dot.shadow.inherit = False
        add_text(s, x + Inches(0.8), y + Inches(0.25), Inches(3.2), Inches(0.5),
                 t, size=15, bold=True, color=TEXT_PRIMARY)
        add_text(s, x + Inches(0.25), y + Inches(1.0), Inches(3.7), Inches(1.4),
                 d, size=12, color=TEXT_MUTED)

    add_text(s, Inches(0.5), Inches(7.0), Inches(12.3), Inches(0.3),
             "→ VoteChain replaces trust in institutions with trust in cryptography.",
             size=12, italic=True, color=ACCENT_GREEN, align=PP_ALIGN.CENTER)


def slide_features():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Key Features", "What VoteChain can do, end to end", "03")
    features = [
        ("Role-Based Access",       "Admin & voter roles with JWT-protected routes.",        PRIMARY),
        ("Wallet Auto-Provision",   "Each voter is issued an Ethereum wallet on signup.",    ACCENT_GREEN),
        ("On-Chain Elections",      "Elections, candidates, voters live on Solidity.",       ACCENT_GOLD),
        ("Time-Locked Voting",      "Start/end timestamps enforced on-chain.",               ACCENT_RED),
        ("One-Vote-Per-Wallet",     "Hard-enforced by contract + compound DB index.",        PRIMARY),
        ("Real-Time Results",       "Aggregated from blockchain events + MongoDB.",          ACCENT_GREEN),
        ("Tie Detection",           "Results API flags ties instead of picking a winner.",   ACCENT_GOLD),
        ("Admin Dashboard",         "Users, elections, blockchain stats in one view.",       PRIMARY),
        ("Blockchain Explorer",     "View chain ID, block number, contract in-app.",         ACCENT_GREEN),
        ("Rate Limiting",           "5 votes/hour, 100 API calls / 15 min.",                 ACCENT_RED),
        ("Vote History",            "Every voter can audit their own votes + tx hashes.",    PRIMARY),
        ("Finalisation Flow",       "Admins finalize; winner recorded forever.",             ACCENT_GOLD),
    ]
    cols = 3
    for i, (t, d, col) in enumerate(features):
        ci = i % cols; ri = i // cols
        x = Inches(0.5 + ci*4.26); y = Inches(1.75 + ri*1.32)
        add_rect(s, x, y, Inches(4.1), Inches(1.22), fill=BG_PANEL, line=BORDER)
        bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                 x, y, Inches(0.12), Inches(1.22))
        bar.line.fill.background()
        bar.fill.solid(); bar.fill.fore_color.rgb = col
        bar.shadow.inherit = False
        add_text(s, x + Inches(0.3), y + Inches(0.15), Inches(3.7), Inches(0.4),
                 t, size=13, bold=True, color=TEXT_PRIMARY)
        add_text(s, x + Inches(0.3), y + Inches(0.55), Inches(3.7), Inches(0.65),
                 d, size=10.5, color=TEXT_MUTED)


def slide_stack():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Technology Stack", "Every library, organized by layer", "04")
    layers = [
        ("Smart Contract",  PRIMARY, [
            "Solidity 0.8.24", "Hardhat", "Hardhat Toolbox", "Chai + Ethers", "OpenZeppelin-style patterns",
        ]),
        ("Backend API",     ACCENT_GREEN, [
            "Node.js + Express 4", "MongoDB Atlas + Mongoose 8",
            "ethers.js 6", "JWT (jsonwebtoken)", "bcryptjs",
            "helmet, cors, morgan", "express-rate-limit", "express-validator", "dotenv, nodemon",
        ]),
        ("Frontend SPA",    ACCENT_GOLD, [
            "React 18", "React Router v6", "axios", "ethers.js 6",
            "react-hot-toast", "recharts (charts)", "date-fns", "CSS variables theme",
        ]),
        ("Dev & Infra",     ACCENT_RED, [
            "Hardhat local node (:8545)", "MongoDB Atlas cloud", "npm workspaces",
            "Chain ID 31337", "Custom deploy.js + seed.js",
        ]),
    ]
    for i, (title, col, items) in enumerate(layers):
        ci = i % 2; ri = i // 2
        x = Inches(0.5 + ci*6.4); y = Inches(1.75 + ri*2.7)
        add_rect(s, x, y, Inches(6.1), Inches(2.55), fill=BG_PANEL, line=col)
        add_text(s, x + Inches(0.25), y + Inches(0.15), Inches(5.7), Inches(0.4),
                 title, size=16, bold=True, color=col)
        body = "  •  ".join(items)
        add_text(s, x + Inches(0.25), y + Inches(0.7), Inches(5.7), Inches(1.8),
                 body, size=12, color=TEXT_PRIMARY)


def slide_architecture():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "System Architecture", "Browser → API → MongoDB → Ethereum node", "05")

    # Layer boxes (horizontal pipeline)
    layers = [
        ("Browser",          "React SPA :3000\naxios + ethers.js", PRIMARY),
        ("REST API",         "Express :5000\nJWT • helmet • rate limit", ACCENT_GREEN),
        ("Database",         "MongoDB Atlas\nUsers • Elections • Votes", ACCENT_GOLD),
        ("Blockchain",       "Hardhat :8545\nVotingSystem.sol", ACCENT_RED),
    ]
    bw = Inches(2.8); bh = Inches(2.0)
    gap = Inches(0.3)
    start_x = Inches(0.5)
    y = Inches(2.3)
    for i, (title, desc, col) in enumerate(layers):
        x = start_x + (bw + gap) * i
        add_rect(s, x, y, bw, bh, fill=BG_PANEL, line=col, line_w=1.5)
        add_text(s, x, y + Inches(0.2), bw, Inches(0.45),
                 title, size=17, bold=True, color=col, align=PP_ALIGN.CENTER)
        add_text(s, x + Inches(0.15), y + Inches(0.75), bw - Inches(0.3), Inches(1.2),
                 desc, size=11.5, color=TEXT_PRIMARY, align=PP_ALIGN.CENTER)
        # Arrow between boxes
        if i < len(layers) - 1:
            ax = x + bw + Inches(0.02)
            arrow = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                       ax, y + Inches(0.85), Inches(0.26), Inches(0.3))
            arrow.line.fill.background()
            arrow.fill.solid(); arrow.fill.fore_color.rgb = TEXT_MUTED
            arrow.shadow.inherit = False

    # Below — data flows
    add_text(s, Inches(0.5), Inches(4.7), Inches(12.3), Inches(0.4),
             "Data Flows", size=15, bold=True, color=PRIMARY)
    flows = [
        "① User logs in → JWT issued by Express → stored in React AuthContext.",
        "② Admin creates election → Express calls `createElectionOnChain` via ethers → event saved to MongoDB with txHash.",
        "③ Voter casts ballot → frontend POSTs private key → backend signs tx with voter wallet → chain stores vote + event.",
        "④ Results page → reads from MongoDB (fast) and verifies via blockchain `getElection` when available.",
    ]
    for i, f in enumerate(flows):
        add_text(s, Inches(0.7), Inches(5.15 + i*0.38), Inches(12), Inches(0.35),
                 f, size=12, color=TEXT_PRIMARY)


def slide_structure():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Project Structure", "Repository layout at a glance", "06")

    tree = (
        "voting-blockchain/\n"
        "├─ blockchain/                   ← Solidity + Hardhat\n"
        "│  ├─ contracts/VotingSystem.sol\n"
        "│  ├─ scripts/deploy.js\n"
        "│  ├─ test/VotingSystem.test.js\n"
        "│  └─ hardhat.config.js\n"
        "│\n"
        "├─ backend/                      ← Express REST API\n"
        "│  └─ src/\n"
        "│     ├─ server.js\n"
        "│     ├─ models/     (User, Election, Vote)\n"
        "│     ├─ controllers/(auth, vote, election, admin)\n"
        "│     ├─ routes/     (auth, vote, election, admin, blockchain)\n"
        "│     ├─ middleware/ (auth.middleware)\n"
        "│     └─ utils/      (blockchain.service, seed)\n"
        "│\n"
        "├─ frontend/                     ← React SPA\n"
        "│  └─ src/\n"
        "│     ├─ App.js\n"
        "│     ├─ pages/       (Login, Register, Dashboard, ...)\n"
        "│     ├─ components/  (Sidebar, BlockchainBar, ...)\n"
        "│     ├─ context/     (AuthContext)\n"
        "│     └─ utils/       (api, helpers, deployment.json)\n"
        "│\n"
        "├─ package.json  (workspace scripts)\n"
        "└─ README.md\n"
    )
    add_rect(s, Inches(0.5), Inches(1.75), Inches(7.5), Inches(5.35),
             fill=BG_PANEL, line=BORDER)
    add_text(s, Inches(0.75), Inches(1.9), Inches(7.1), Inches(5.1),
             tree, font=FONT_MONO, size=11, color=TEXT_PRIMARY)

    # Right — highlights
    x = Inches(8.25); y = Inches(1.75)
    add_rect(s, x, y, Inches(4.55), Inches(5.35), fill=BG_ACCENT, line=PRIMARY)
    add_text(s, x + Inches(0.25), y + Inches(0.2), Inches(4.05), Inches(0.5),
             "Highlights", size=17, bold=True, color=PRIMARY)
    highlights = [
        ("3 top-level apps",       "blockchain • backend • frontend"),
        ("1 smart contract",       "VotingSystem.sol"),
        ("4 REST controllers",     "auth • vote • election • admin"),
        ("5 route files",          "+ /api/blockchain health"),
        ("3 Mongo models",         "User • Election • Vote"),
        ("11 React pages",         "voter + admin areas"),
        ("1 shared deployment.json", "copied to backend & frontend"),
    ]
    for i, (t, d) in enumerate(highlights):
        yy = y + Inches(0.85 + i*0.6)
        add_text(s, x + Inches(0.25), yy, Inches(4.05), Inches(0.28),
                 "▸ " + t, size=12, bold=True, color=TEXT_PRIMARY)
        add_text(s, x + Inches(0.55), yy + Inches(0.28), Inches(3.8), Inches(0.28),
                 d, size=11, color=TEXT_MUTED)


def slide_contract():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Smart Contract — VotingSystem.sol",
               "Solidity 0.8.24 • 312 lines • the source of truth", "07")

    # Left — structs
    add_rect(s, Inches(0.5), Inches(1.75), Inches(6.0), Inches(2.7),
             fill=BG_PANEL, line=PRIMARY)
    add_text(s, Inches(0.7), Inches(1.85), Inches(5.6), Inches(0.4),
             "Data Structures", size=15, bold=True, color=PRIMARY)
    code_structs = (
        "struct Candidate { id; name; party; imageHash;\n"
        "                   voteCount; active; }\n\n"
        "struct Election  { id; title; description;\n"
        "                   startTime; endTime;\n"
        "                   active; finalized; totalVotes;\n"
        "                   candidateIds[]; }\n\n"
        "struct Voter     { isRegistered; hasVoted;\n"
        "                   votedCandidateId;\n"
        "                   votedElectionId;\n"
        "                   registrationTime; }"
    )
    add_text(s, Inches(0.7), Inches(2.2), Inches(5.6), Inches(2.2),
             code_structs, font=FONT_MONO, size=10, color=TEXT_PRIMARY)

    # Left — events
    add_rect(s, Inches(0.5), Inches(4.55), Inches(6.0), Inches(2.6),
             fill=BG_PANEL, line=ACCENT_GOLD)
    add_text(s, Inches(0.7), Inches(4.65), Inches(5.6), Inches(0.4),
             "Events (audit trail)", size=15, bold=True, color=ACCENT_GOLD)
    events = (
        "ElectionCreated(electionId, title, start, end)\n"
        "CandidateAdded(electionId, candidateId, name, party)\n"
        "VoterRegistered(electionId, voter)\n"
        "VoteCast(electionId, candidateId, voter)\n"
        "ElectionFinalized(electionId, winnerId, winnerName)\n"
        "ElectionStatusChanged(electionId, active)"
    )
    add_text(s, Inches(0.7), Inches(5.0), Inches(5.6), Inches(2.1),
             events, font=FONT_MONO, size=10.5, color=TEXT_PRIMARY)

    # Right — functions
    add_rect(s, Inches(6.8), Inches(1.75), Inches(6.0), Inches(5.4),
             fill=BG_PANEL, line=ACCENT_GREEN)
    add_text(s, Inches(7.0), Inches(1.85), Inches(5.6), Inches(0.4),
             "Functions", size=15, bold=True, color=ACCENT_GREEN)

    sections = [
        ("Admin only", [
            "createElection(title, desc, start, end)",
            "addCandidate(eid, name, party, imageHash)",
            "registerVoter(eid, voterAddress)",
            "toggleElectionStatus(eid)",
            "finalizeElection(eid) → (winnerId, winnerName)",
        ]),
        ("Voter", ["castVote(electionId, candidateId)"]),
        ("View / public", [
            "getElection(id)  • getAllElections()",
            "getElectionCandidates(id)",
            "getVoterStatus(eid, addr)",
            "getCandidate(id)  • getAdmin()",
            "getElectionCount() • getCandidateCount()",
        ]),
    ]
    yy = Inches(2.25)
    for title, items in sections:
        add_text(s, Inches(7.0), yy, Inches(5.6), Inches(0.3),
                 title, size=12, bold=True, color=ACCENT_GREEN)
        yy += Inches(0.3)
        for it in items:
            add_text(s, Inches(7.15), yy, Inches(5.5), Inches(0.26),
                     "• " + it, font=FONT_MONO, size=10.5, color=TEXT_PRIMARY)
            yy += Inches(0.26)
        yy += Inches(0.1)


def slide_contract_guarantees():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Contract Guarantees",
               "Invariants enforced at the Solidity level", "07.b")

    items = [
        ("Admin-only mutations",
         "modifier onlyAdmin checks msg.sender == admin. Any non-admin call to createElection, addCandidate, registerVoter or finalizeElection reverts.",
         PRIMARY),
        ("Election must exist",
         "modifier electionExists verifies 0 < id ≤ electionCounter before touching storage.",
         ACCENT_GREEN),
        ("Voting window enforced",
         "modifier electionActive requires active flag + block.timestamp ∈ [start, end].",
         ACCENT_GOLD),
        ("No double voting",
         "require(!voter.hasVoted) before the vote is recorded. Storage flip is atomic.",
         ACCENT_RED),
        ("Registration required",
         "Voter must have called registerVoter (by admin) before casting a ballot.",
         PRIMARY),
        ("Candidate scoped to election",
         "Loops over election.candidateIds to verify candidateId belongs to the election.",
         ACCENT_GREEN),
        ("Time sanity on creation",
         "require(startTime < endTime && endTime > block.timestamp).",
         ACCENT_GOLD),
        ("Finalisation is idempotent",
         "require(!finalized) — winner is computed once, stored in event forever.",
         ACCENT_RED),
    ]
    for i, (t, d, col) in enumerate(items):
        ci = i % 2; ri = i // 2
        x = Inches(0.5 + ci*6.4); y = Inches(1.75 + ri*1.32)
        add_rect(s, x, y, Inches(6.1), Inches(1.22), fill=BG_PANEL, line=BORDER)
        bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                 x, y, Inches(0.12), Inches(1.22))
        bar.line.fill.background(); bar.fill.solid()
        bar.fill.fore_color.rgb = col; bar.shadow.inherit = False
        add_text(s, x + Inches(0.3), y + Inches(0.1), Inches(5.7), Inches(0.4),
                 t, size=13, bold=True, color=TEXT_PRIMARY)
        add_text(s, x + Inches(0.3), y + Inches(0.5), Inches(5.7), Inches(0.75),
                 d, size=10.5, color=TEXT_MUTED)


def slide_backend():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Backend Design",
               "Express REST API bridging users, MongoDB and the blockchain", "08")

    # Columns: Controllers / Middleware / Service
    cols = [
        ("Controllers", PRIMARY, [
            "auth.controller       (register, login, profile)",
            "election.controller   (CRUD, candidates, results)",
            "vote.controller       (register, cast, history, status)",
            "admin.controller      (users, finalize, dashboard)",
        ]),
        ("Middleware & Security", ACCENT_GREEN, [
            "auth.middleware.protect   (JWT verify)",
            "auth.middleware.isAdmin   (RBAC)",
            "helmet()                  (headers)",
            "cors({ origin: FRONTEND_URL })",
            "rate-limit  100/15m api • 5/1h cast",
            "express.json({ limit: '10mb' })",
        ]),
        ("blockchain.service.js", ACCENT_GOLD, [
            "initBlockchain()",
            "createElectionOnChain(...)",
            "addCandidateOnChain(...)",
            "registerVoterOnChain(...)",
            "castVoteOnChain(eid, cid, voterKey)",
            "finalizeElectionOnChain(id)",
            "getBlockchainStats()",
            "createWallet()  •  fundWallet(addr, '1.0')",
        ]),
    ]
    bw = Inches(4.1); bh = Inches(5.3)
    for i, (title, col, items) in enumerate(cols):
        x = Inches(0.5 + i*4.26); y = Inches(1.75)
        add_rect(s, x, y, bw, bh, fill=BG_PANEL, line=col)
        add_text(s, x + Inches(0.2), y + Inches(0.2), bw - Inches(0.4), Inches(0.4),
                 title, size=15, bold=True, color=col)
        yy = y + Inches(0.8)
        for it in items:
            add_text(s, x + Inches(0.25), yy, bw - Inches(0.4), Inches(0.42),
                     "• " + it, font=FONT_MONO, size=10.5, color=TEXT_PRIMARY)
            yy += Inches(0.5)


def slide_frontend():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Frontend Design",
               "React SPA with role-aware routing and blockchain awareness", "09")

    # Pages card
    add_rect(s, Inches(0.5), Inches(1.75), Inches(6.1), Inches(5.4),
             fill=BG_PANEL, line=PRIMARY)
    add_text(s, Inches(0.7), Inches(1.85), Inches(5.7), Inches(0.4),
             "Pages (src/pages/*)", size=15, bold=True, color=PRIMARY)
    voter = [("Login",        "Email + password"),
             ("Register",     "Creates wallet, shows private key once"),
             ("Dashboard",    "Overview of upcoming & active elections"),
             ("Elections",    "List + filter by status"),
             ("ElectionDetail","Candidates, Countdown, cast vote"),
             ("MyVotes",      "History + tx hashes"),
             ("Profile",      "Name, wallet address, edit")]
    admin = [("AdminDashboard",     "Stats + recent activity"),
             ("AdminCreateElection","Form with dynamic candidates"),
             ("AdminUsers",         "Toggle active / register voters"),
             ("BlockchainExplorer", "Chain ID, block number, contract")]
    yy = Inches(2.25)
    add_text(s, Inches(0.7), yy, Inches(5.7), Inches(0.3),
             "Voter", size=12, bold=True, color=ACCENT_GREEN)
    yy += Inches(0.3)
    for n, d in voter:
        add_text(s, Inches(0.85), yy, Inches(5.6), Inches(0.28),
                 f"• {n} — {d}", size=11, color=TEXT_PRIMARY)
        yy += Inches(0.28)
    yy += Inches(0.05)
    add_text(s, Inches(0.7), yy, Inches(5.7), Inches(0.3),
             "Admin", size=12, bold=True, color=ACCENT_GOLD)
    yy += Inches(0.3)
    for n, d in admin:
        add_text(s, Inches(0.85), yy, Inches(5.6), Inches(0.28),
                 f"• {n} — {d}", size=11, color=TEXT_PRIMARY)
        yy += Inches(0.28)

    # Components + context
    add_rect(s, Inches(6.75), Inches(1.75), Inches(6.0), Inches(2.6),
             fill=BG_PANEL, line=ACCENT_GREEN)
    add_text(s, Inches(6.95), Inches(1.85), Inches(5.6), Inches(0.4),
             "Reusable Components", size=15, bold=True, color=ACCENT_GREEN)
    comps = ["Sidebar         — role-aware navigation",
             "BlockchainBar   — live chain status banner",
             "ElectionCard    — summary tile on lists",
             "Countdown       — ticks to election start/end"]
    for i, c in enumerate(comps):
        add_text(s, Inches(6.95), Inches(2.3 + i*0.4), Inches(5.6), Inches(0.35),
                 "• " + c, font=FONT_MONO, size=11, color=TEXT_PRIMARY)

    # State + utils
    add_rect(s, Inches(6.75), Inches(4.45), Inches(6.0), Inches(2.7),
             fill=BG_PANEL, line=ACCENT_GOLD)
    add_text(s, Inches(6.95), Inches(4.55), Inches(5.6), Inches(0.4),
             "State & Utilities", size=15, bold=True, color=ACCENT_GOLD)
    items = [
        "context/AuthContext — user, token, isAdmin, isAuthenticated",
        "utils/api.js        — axios instance with Bearer header",
        "utils/helpers.js    — formatting, dates, status colors",
        "utils/deployment.json — contract address + ABI",
        "react-router v6     — <Protected> + role redirects",
        "react-hot-toast     — success / error notifications",
        "recharts            — bar charts for results",
    ]
    for i, c in enumerate(items):
        add_text(s, Inches(6.95), Inches(5.0 + i*0.3), Inches(5.7), Inches(0.28),
                 "• " + c, size=11, color=TEXT_PRIMARY)


def slide_api():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "API Endpoints", "Every route exposed by the backend", "10")

    groups = [
        ("Auth  /api/auth", PRIMARY, [
            ("POST", "/register",        "Create voter + wallet + JWT"),
            ("POST", "/login",           "Return JWT"),
            ("GET",  "/profile",         "Current user"),
            ("PUT",  "/profile",         "Update name"),
        ]),
        ("Elections  /api/elections", ACCENT_GREEN, [
            ("GET",  "/",                "List (paginate, filter by status)"),
            ("GET",  "/:id",             "Single election + voterStatus"),
            ("GET",  "/:id/results",     "Results, winner, isTie"),
            ("POST", "/",                "Create election (admin)"),
            ("POST", "/:id/candidates",  "Add candidate (admin)"),
        ]),
        ("Votes  /api/votes", ACCENT_GOLD, [
            ("POST", "/register",        "Register voter for election"),
            ("POST", "/cast",            "Cast signed vote (5/hr limit)"),
            ("GET",  "/history",         "My vote history"),
            ("GET",  "/status/:eid",     "My status for an election"),
        ]),
        ("Admin  /api/admin", ACCENT_RED, [
            ("GET",   "/dashboard",              "Stats + recent activity"),
            ("GET",   "/users",                  "All users + search"),
            ("PATCH", "/users/:id/toggle",       "Enable / disable user"),
            ("POST",  "/elections/:id/finalize", "Finalize + declare winner"),
            ("POST",  "/register-voter",         "Register voter (admin)"),
        ]),
        ("Blockchain  /api/blockchain", PRIMARY, [
            ("GET",  "/stats", "chainId • blockNumber • contract • counts"),
        ]),
    ]
    y = Inches(1.7)
    for title, col, rows in groups:
        card_h = Inches(0.45 + 0.33 * len(rows))
        add_rect(s, Inches(0.5), y, Inches(12.3), card_h,
                 fill=BG_PANEL, line=col)
        add_text(s, Inches(0.7), y + Inches(0.05), Inches(9), Inches(0.35),
                 title, size=12, bold=True, color=col)
        for j, (m, p, d) in enumerate(rows):
            yy = y + Inches(0.4 + j*0.33)
            add_text(s, Inches(0.7),  yy, Inches(0.9), Inches(0.3),
                     m, font=FONT_MONO, size=10.5, bold=True,
                     color=ACCENT_GREEN if m == "GET" else
                           ACCENT_GOLD  if m == "POST" else
                           PRIMARY      if m == "PUT" else
                           ACCENT_RED)
            add_text(s, Inches(1.65), yy, Inches(3.8), Inches(0.3),
                     p, font=FONT_MONO, size=10.5, color=TEXT_PRIMARY)
            add_text(s, Inches(5.55), yy, Inches(7.2), Inches(0.3),
                     d, size=10.5, color=TEXT_MUTED)
        y += card_h + Inches(0.04)


def slide_db():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Database Schema",
               "Three MongoDB collections mirror on-chain state", "11")

    schemas = [
        ("User", PRIMARY, [
            "name, email (unique), password (bcrypt, select:false)",
            "role: 'voter' | 'admin'",
            "walletAddress (lowercase, sparse)",
            "nationalId (unique, sparse)",
            "isActive: Boolean (default true)",
            "registeredElections[ { electionId, hasVoted, txHash } ]",
            "lastLogin, profileImage, timestamps",
        ]),
        ("Election", ACCENT_GREEN, [
            "blockchainId (on-chain counter)",
            "title, description, startTime, endTime",
            "candidates[ { blockchainId, name, party, description, voteCount } ]",
            "status: pending | active | ended | finalized",
            "totalVotes, winnerId, winnerName, txHash",
            "createdBy → User",
            "registeredVoters[ { userId, walletAddress, txHash } ]",
            "virtual voterCount  +  computeStatus() method",
        ]),
        ("Vote", ACCENT_GOLD, [
            "election → Election,  voter → User",
            "electionBlockchainId, candidateBlockchainId, candidateName",
            "voterWalletAddress (lowercase)",
            "txHash (unique), blockNumber, gasUsed, timestamp",
            "UNIQUE compound index (election, voter)",
            "→ enforces 1 vote per voter per election at DB layer",
        ]),
    ]
    y = Inches(1.75)
    heights = [Inches(1.7), Inches(1.85), Inches(1.65)]
    for (name, col, fields), h in zip(schemas, heights):
        add_rect(s, Inches(0.5), y, Inches(12.3), h, fill=BG_PANEL, line=col)
        add_text(s, Inches(0.75), y + Inches(0.1), Inches(3), Inches(0.4),
                 name, size=16, bold=True, color=col)
        add_text(s, Inches(3.75), y + Inches(0.1), Inches(9), Inches(0.4),
                 "mongoose.Schema", size=10.5, italic=True, color=TEXT_MUTED,
                 align=PP_ALIGN.RIGHT)
        body = "\n".join("• " + f for f in fields)
        add_text(s, Inches(0.75), y + Inches(0.5), Inches(11.8), h - Inches(0.55),
                 body, font=FONT_MONO, size=10.5, color=TEXT_PRIMARY)
        y += h + Inches(0.08)


def slide_security():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Security Model", "Six layers of defence", "12")
    items = [
        ("On-chain `require(!voter.hasVoted)`",
         "Solidity refuses any second ballot from the same wallet — the database can never overwrite this.", ACCENT_GREEN),
        ("Time-locked voting window",
         "block.timestamp compared to startTime/endTime at call time. Outside the window, the tx reverts.", ACCENT_GOLD),
        ("Admin-only mutations",
         "onlyAdmin modifier plus backend isAdmin middleware gate election creation, candidates, finalisation.", PRIMARY),
        ("Compound DB uniqueness",
         "Mongo compound unique index (election, voter) backs up the on-chain check for defence in depth.", ACCENT_RED),
        ("Private-key signing of votes",
         "Voter's wallet signs castVote — server never stores long-term keys. Vote is non-repudiable.", PRIMARY),
        ("JWT auth + rate limits",
         "7-day JWTs, 100 req / 15 min API, 5 vote attempts / hour, helmet() secure headers, CORS allow-list.", ACCENT_GOLD),
    ]
    for i, (t, d, col) in enumerate(items):
        ci = i % 2; ri = i // 2
        x = Inches(0.5 + ci*6.4); y = Inches(1.75 + ri*1.72)
        add_rect(s, x, y, Inches(6.1), Inches(1.6), fill=BG_PANEL, line=BORDER)
        # Shield icon
        sh = s.shapes.add_shape(MSO_SHAPE.PENTAGON,
                                x + Inches(0.2), y + Inches(0.2),
                                Inches(0.5), Inches(0.5))
        sh.line.fill.background()
        sh.fill.solid(); sh.fill.fore_color.rgb = col
        sh.shadow.inherit = False
        add_text(s, x + Inches(0.85), y + Inches(0.15), Inches(5.1), Inches(0.4),
                 t, size=13.5, bold=True, color=TEXT_PRIMARY)
        add_text(s, x + Inches(0.85), y + Inches(0.55), Inches(5.1), Inches(1.0),
                 d, size=11, color=TEXT_MUTED)


def slide_flows():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "User Flows", "End-to-end journeys for voter and admin", "13")

    # Voter flow
    add_rect(s, Inches(0.5), Inches(1.75), Inches(12.3), Inches(2.45),
             fill=BG_PANEL, line=ACCENT_GREEN)
    add_text(s, Inches(0.7), Inches(1.85), Inches(11.9), Inches(0.4),
             "Voter Flow", size=15, bold=True, color=ACCENT_GREEN)
    voter_steps = [
        "Register",         "Wallet\nGenerated",     "Login",
        "Browse\nElections","Register\nfor Election","Cast\nVote",
        "View Tx\nHistory",
    ]
    step_w = Inches(1.55); step_h = Inches(1.2)
    gx = Inches(0.75); gy = Inches(2.35)
    gap = Inches(0.15)
    for i, txt in enumerate(voter_steps):
        x = gx + (step_w + gap) * i
        add_rect(s, x, gy, step_w, step_h, fill=BG_ACCENT, line=ACCENT_GREEN)
        add_text(s, x, gy, step_w, step_h,
                 txt, size=11, bold=True, color=TEXT_PRIMARY,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        if i < len(voter_steps) - 1:
            ax = x + step_w + Emu(0)
            arr = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                     ax - Inches(0.05), gy + Inches(0.48),
                                     Inches(0.2), Inches(0.25))
            arr.line.fill.background()
            arr.fill.solid(); arr.fill.fore_color.rgb = TEXT_MUTED
            arr.shadow.inherit = False

    # Admin flow
    add_rect(s, Inches(0.5), Inches(4.35), Inches(12.3), Inches(2.75),
             fill=BG_PANEL, line=ACCENT_GOLD)
    add_text(s, Inches(0.7), Inches(4.45), Inches(11.9), Inches(0.4),
             "Admin Flow", size=15, bold=True, color=ACCENT_GOLD)
    admin_steps = [
        "Admin\nLogin", "Create\nElection", "Add\nCandidates",
        "Register\nVoters", "Monitor\nDashboard", "Finalize\n+ Winner",
        "Audit\nChain",
    ]
    gy = Inches(5.0)
    for i, txt in enumerate(admin_steps):
        x = gx + (step_w + gap) * i
        add_rect(s, x, gy, step_w, step_h, fill=BG_ACCENT, line=ACCENT_GOLD)
        add_text(s, x, gy, step_w, step_h,
                 txt, size=11, bold=True, color=TEXT_PRIMARY,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        if i < len(admin_steps) - 1:
            ax = x + step_w + Emu(0)
            arr = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                     ax - Inches(0.05), gy + Inches(0.48),
                                     Inches(0.2), Inches(0.25))
            arr.line.fill.background()
            arr.fill.solid(); arr.fill.fore_color.rgb = TEXT_MUTED
            arr.shadow.inherit = False

    add_text(s, Inches(0.5), Inches(6.4), Inches(12.3), Inches(0.3),
             "Each step emits a signed transaction that becomes part of the permanent audit log.",
             size=11, italic=True, color=TEXT_MUTED, align=PP_ALIGN.CENTER)


def slide_deploy():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Deployment & Setup", "Four terminals — local first", "14")

    terms = [
        ("T1 — Blockchain Node", PRIMARY, [
            "cd blockchain",
            "npm install",
            "npx hardhat node",
            "# 20 test accounts, keep running",
        ]),
        ("T2 — Deploy Contract", ACCENT_GREEN, [
            "cd blockchain",
            "npm run deploy",
            "# Copy CONTRACT_ADDRESS",
            "# deployment.json copied to backend + frontend",
        ]),
        ("T3 — Backend API", ACCENT_GOLD, [
            "cd backend",
            "cp .env.example .env",
            "# set MONGODB_URI / CONTRACT_ADDRESS / ADMIN_PRIVATE_KEY",
            "npm install && npm run seed && npm run dev",
        ]),
        ("T4 — React Frontend", ACCENT_RED, [
            "cd frontend",
            "npm install",
            "npm start",
            "# open http://localhost:3000",
        ]),
    ]
    for i, (title, col, lines) in enumerate(terms):
        ci = i % 2; ri = i // 2
        x = Inches(0.5 + ci*6.4); y = Inches(1.75 + ri*2.25)
        add_rect(s, x, y, Inches(6.1), Inches(2.15), fill=BG_PANEL, line=col)
        add_text(s, x + Inches(0.25), y + Inches(0.1), Inches(5.7), Inches(0.4),
                 title, size=14, bold=True, color=col)
        add_text(s, x + Inches(0.25), y + Inches(0.55), Inches(5.7), Inches(1.55),
                 "\n".join(lines), font=FONT_MONO, size=11, color=TEXT_PRIMARY)

    # Env vars
    add_rect(s, Inches(0.5), Inches(6.3), Inches(12.3), Inches(0.85),
             fill=BG_ACCENT, line=PRIMARY)
    add_text(s, Inches(0.75), Inches(6.35), Inches(12), Inches(0.35),
             "Backend .env",
             size=12, bold=True, color=PRIMARY)
    add_text(s, Inches(0.75), Inches(6.65), Inches(12), Inches(0.5),
             "PORT=5000 • MONGODB_URI=... • JWT_SECRET=... • "
             "BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545 • "
             "CONTRACT_ADDRESS=0x... • ADMIN_PRIVATE_KEY=0x... • FRONTEND_URL=http://localhost:3000",
             font=FONT_MONO, size=9.5, color=TEXT_MUTED)


def slide_testing():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Testing", "Hardhat + Chai smart-contract test suite", "15")

    add_rect(s, Inches(0.5), Inches(1.75), Inches(6.0), Inches(5.4),
             fill=BG_PANEL, line=PRIMARY)
    add_text(s, Inches(0.75), Inches(1.85), Inches(5.5), Inches(0.4),
             "test/VotingSystem.test.js", size=15, bold=True, color=PRIMARY)
    groups = [
        ("Deployment", ["Sets correct admin", "Starts with zero elections"]),
        ("Election Management", [
            "Creates election + emits event",
            "Rejects non-admin creation",
            "Adds candidates + emits event",
        ]),
        ("Voting", [
            "Registered voter can cast vote",
            "Double voting reverts",
            "Unregistered voter reverts",
        ]),
        ("Finalisation", [
            "Finalize finds winner by max votes",
            "Emits ElectionFinalized(id, winner)",
        ]),
    ]
    yy = Inches(2.3)
    for title, items in groups:
        add_text(s, Inches(0.75), yy, Inches(5.5), Inches(0.3),
                 "describe: " + title, size=12, bold=True, color=ACCENT_GREEN)
        yy += Inches(0.3)
        for it in items:
            add_text(s, Inches(0.95), yy, Inches(5.3), Inches(0.27),
                     "✔ " + it, size=11, color=TEXT_PRIMARY)
            yy += Inches(0.27)
        yy += Inches(0.1)

    # Right — run command + coverage map
    add_rect(s, Inches(6.8), Inches(1.75), Inches(6.0), Inches(2.0),
             fill=BG_ACCENT, line=ACCENT_GREEN)
    add_text(s, Inches(7.0), Inches(1.85), Inches(5.6), Inches(0.4),
             "Run", size=14, bold=True, color=ACCENT_GREEN)
    add_text(s, Inches(7.0), Inches(2.3), Inches(5.6), Inches(1.4),
             "cd blockchain\nnpx hardhat test\n\n# or from repo root:\nnpm run test:contract",
             font=FONT_MONO, size=12, color=TEXT_PRIMARY)

    add_rect(s, Inches(6.8), Inches(3.9), Inches(6.0), Inches(3.25),
             fill=BG_PANEL, line=ACCENT_GOLD)
    add_text(s, Inches(7.0), Inches(4.0), Inches(5.6), Inches(0.4),
             "Coverage Map", size=14, bold=True, color=ACCENT_GOLD)
    cov = [
        "✔ Admin access control",
        "✔ Election lifecycle (create → active → finalize)",
        "✔ Candidate management",
        "✔ Voter registration",
        "✔ Vote casting (happy path + all reverts)",
        "✔ Event emission (5 event types covered)",
        "✔ Time-lock behaviour via hardhat network-helpers",
        "• Manual: integration with Express + Mongo",
        "• Manual: React UI (end-to-end flows)",
    ]
    for i, line in enumerate(cov):
        add_text(s, Inches(7.0), Inches(4.4 + i*0.3), Inches(5.6), Inches(0.28),
                 line, size=11, color=TEXT_PRIMARY)


def slide_future():
    s = prs.slides.add_slide(BLANK); set_bg(s)
    add_header(s, "Future Work & Conclusion",
               "Where VoteChain goes next — and why it matters", "16")

    # Future roadmap
    add_rect(s, Inches(0.5), Inches(1.75), Inches(7.5), Inches(5.4),
             fill=BG_PANEL, line=PRIMARY)
    add_text(s, Inches(0.75), Inches(1.85), Inches(7), Inches(0.4),
             "Roadmap", size=16, bold=True, color=PRIMARY)
    roadmap = [
        ("MetaMask integration",    "Remove server-held private keys; users sign with MetaMask or WalletConnect."),
        ("Public testnet deploy",   "Deploy to Sepolia / Polygon Amoy for shareable demo URLs."),
        ("IPFS for candidate data", "Replace placeholder imageHash with real IPFS CIDs."),
        ("Zero-knowledge privacy",  "zk-SNARK proofs so votes are verifiable but anonymous."),
        ("Multi-sig admin",         "Replace single admin key with a Gnosis Safe."),
        ("Mobile-first PWA",        "Installable PWA + push notifications for election events."),
        ("Accessibility & i18n",    "WCAG AA audit; multi-language strings."),
        ("Analytics dashboard",     "Turnout over time, candidate share, block-by-block stats."),
    ]
    for i, (t, d) in enumerate(roadmap):
        yy = Inches(2.35 + i*0.58)
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL,
                                 Inches(0.75), yy + Inches(0.12),
                                 Inches(0.18), Inches(0.18))
        dot.line.fill.background()
        dot.fill.solid(); dot.fill.fore_color.rgb = PRIMARY
        dot.shadow.inherit = False
        add_text(s, Inches(1.05), yy, Inches(6.8), Inches(0.3),
                 t, size=12.5, bold=True, color=TEXT_PRIMARY)
        add_text(s, Inches(1.05), yy + Inches(0.28), Inches(6.8), Inches(0.3),
                 d, size=10.5, color=TEXT_MUTED)

    # Conclusion
    add_rect(s, Inches(8.25), Inches(1.75), Inches(4.55), Inches(5.4),
             fill=BG_ACCENT, line=ACCENT_GREEN)
    add_text(s, Inches(8.5), Inches(1.85), Inches(4.1), Inches(0.4),
             "Conclusion", size=16, bold=True, color=ACCENT_GREEN)
    concl = [
        "VoteChain proves that a modern web app can deliver the ergonomics voters expect",
        "— while still handing every ballot to an immutable ledger for verification.",
        "",
        "• Solidity for the source of truth",
        "• Express + MongoDB for speed",
        "• React for UX",
        "• JWT + ethers.js for secure integration",
        "",
        "The result: a voting system that is hard to tamper with, easy to audit, and simple enough to run from four terminals on a laptop.",
    ]
    add_text(s, Inches(8.5), Inches(2.35), Inches(4.1), Inches(4.6),
             "\n".join(concl), size=11.5, color=TEXT_PRIMARY)

    # Thank you
    add_text(s, Inches(0.5), Inches(7.02), Inches(12.3), Inches(0.35),
             "Thank you  •  Questions?",
             size=13, bold=True, color=PRIMARY, align=PP_ALIGN.CENTER)


# ─── Build deck ───────────────────────────────────────────────────────────────
builders = [
    slide_title,
    slide_toc,
    slide_overview,
    slide_problem,
    slide_features,
    slide_stack,
    slide_architecture,
    slide_structure,
    slide_contract,
    slide_contract_guarantees,
    slide_backend,
    slide_frontend,
    slide_api,
    slide_db,
    slide_security,
    slide_flows,
    slide_deploy,
    slide_testing,
    slide_future,
]
for fn in builders:
    fn()

# Add footers (skip title slide)
total = len(prs.slides)
for idx, slide in enumerate(prs.slides, 1):
    if idx == 1:
        continue
    add_footer(slide, idx, total)

out = r"D:\voting-blockchain\VoteChain_Presentation.pptx"
prs.save(out)
print(f"OK  {total} slides  ->  {out}")
