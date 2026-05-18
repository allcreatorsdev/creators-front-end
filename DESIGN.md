# AllCreators — Design Reference

Extracted from the client's reference screenshots. The frontend must match this.
Tailwind v4 CSS-first tokens (defined in `globals.css` via `@theme`).

## Color tokens
| Token | Value | Use |
|---|---|---|
| `--color-brand` | `#2F6BFF` (vivid blue) | Primary buttons, links, active states |
| `--color-brand-hover` | `#1E54E6` | Button hover |
| `--color-bg` | `#FFFFFF` | Page / card background |
| `--color-bg-subtle` | `#FAFAFA` (zinc-50) | App canvas behind cards |
| `--color-sidebar` | `#FFFFFF` | Sidebar bg |
| `--color-nav-active` | `#F4F4F5` (zinc-100) | Active nav item / active sub-nav |
| `--color-border` | `#E4E4E7` (zinc-200) | Card & input borders |
| `--color-text` | `#0A0A0A` (zinc-950) | Headings |
| `--color-text-muted` | `#71717A` (zinc-500) | Body / secondary |
| `--color-text-faint` | `#A1A1AA` (zinc-400) | Section labels (UPPERCASE) |
| `--color-logo-from` / `--color-logo-to` | `#7C3AED` → `#4F46E5` | "A" workspace logo gradient |

### Semantic / accent (pastel bg + darker text)
- **Analyzed badge**: green `#16A34A` bg, white text, pill, `✓ Analyzed`
- **Active badge**: bg `#DCFCE7`, text `#15803D`
- **App version pill**: bg `#EEF2FF`, text `#4F46E5`
- **Plan card**: bg `#FEFCE8`, border `#FEF08A`, rocket emoji 🚀
- **Subject tags** (UPPERCASE, bold, tracking-wide, xs):
  - AUTHORITY → bg `#DCFCE7` text `#15803D`
  - AUTHENTICITY → bg `#DBEAFE` text `#1D4ED8`
  - FLASHY → bg `#FEF9C3` text `#A16207`
- **Metric chips** (xs, rounded): outlier ↗ bg `#FCE7F3` text `#BE185D` · views 👁 bg `#DBEAFE` text `#1D4ED8` · engagement ⚡ bg `#FEF9C3` text `#A16207`
- **Platform pills**: Instagram → pink-tint; TikTok → black bg/white text; YouTube → red-tint. Feed thumbnail corner badge: white rounded square with `IG`/`TT`/`YT`.

## Typography
- Sans-serif (Geist / system). Headings: `text-3xl font-bold tracking-tight` near-black. Body muted. Section labels: `text-xs font-medium uppercase tracking-wider` faint.

## Layout
- **Shell**: fixed left sidebar `w-64`, white, right content on `--color-bg-subtle`.
- **Sidebar top**: gradient rounded square "A" + "My Workspace" + vertical chevron switcher.
- **Sidebar groups**: `RESEARCH` (Feed, Saved · badge), `CREATE` (Organizer · badge), `SETUP` (Channels, Settings). Active item = `--color-nav-active`, rounded-lg, icon + label. Count badges = small gray rounded.
- **Sidebar bottom**: plan card (cream), rocket, "You're on the Starter plan / Upgrade to a full plan to unlock all features".
- **Cards**: white, `border` `--color-border`, `rounded-xl`, generous padding.
- **Primary button**: brand bg, white, `rounded-lg`, medium weight. **Secondary**: white bg + border. **Ghost** ("+ New idea"): faint text, no border.

## Pages (content mirrors screenshots → use as seed data)
- **Feed**: top bar `⚙ Customize channels` · `🔗 Add video URL` · `▾ Filters` · `Sort by`. Left filter card: SAVED FILTERS (`⭐ Top viraux 7d`), Channels, Keywords, Outlier score (0x–100x), Views (0–10,000,000), Engagement (0%–100%), Posted in last (n + Months), Platform, Status (Analyzed/Unanalyzed pill toggles), `⭐ Save filter`. Right: "Showing 12 of 23 477". 4-col grid of vertical reel cards (gradient thumb, Analyzed badge TL, platform badge TR, white title, star save BR; below: title, `@user · Today`, metric chips, `+ Take idea`).
- **Saved**: empty state card — ⭐, "No saved videos yet", "Click the star icon on a video in Feed to save it here", `Explore feed`.
- **Organizer**: subtitle "Content production pipeline grouped by your subjects". Right: `All subjects ▾` + `⚙ Manage subjects`. 5 columns Idea/Writing/Editing/Ready/Published with count + `+`. Cards: thumb + subject tag, title, platform pills, `@attribution ↗`. Footer `+ New idea`.
- **Channels**: subtitle "Pick which channels to include in your feed". Tabs Describe/Search/Add URL (active = blue underline). Describe: input + Platform + Account size + blue `Search ⏎`. Right: "Your Watchlist" + `Save`, rows (gradient avatar + platform badge, username, "Nx followers · Ny views"), `Remove all` · `↗ Export`.
- **Settings**: `App Version 4.2.0` pill. Links: Support · Changelog · Knowledge Base · Billing portal · Sign out (red). Left sub-nav: Profile/Workspaces/Subscription/Usage/Feature Flags/Connectors. Workspaces: card "My Workspace" + Active badge, "3 channels · 1 member", gear; `+ Create workspace`.

## Seed content (backend must serve this so UI = reference on first run)
- Workspace: **My Workspace**, plan **Starter**, 3 channels, 1 member. App version 4.2.0.
- Watchlist channels: **garrytan** (IG, 70K followers, 883K views), **scotchisholm** (IG, 177K, 8.5M), **foundr** (TT, 3.9M, 246M).
- Subjects: AUTHORITY, AUTHENTICITY, FLASHY.
- Organizer ideas: "Bro built a $1.3M business" (AUTHORITY, IG+TT, @starter_story, **Idea**) · "Stay consistent every single day" (AUTHENTICITY, TT, **Writing**) · "Why I quit my $250K job to do this" (FLASHY, YT, @founderslife, **Editing**).
- Feed (23,477 total; first page incl.): "Bro built a $1.3M business in 6-7 hours" @starter_story IG Analyzed 0.5x/9.5K/2% orange · "Esa es la historia de los 30,000 estudiantes…" @andresbilbao IG 0.2x/21K/2% · "I made 20 sales today 🤩" @marvinndiaye_ IG Analyzed 1.1x/34K/3% · "Everyone is copying Cédric Grolet and that's a good sign" @marvinndiaye_ IG 0.5x/14K/1% · plus TikTok/YouTube items. Saved filter: "Top viraux 7d".
