-- nova.lua — cliamp visualizer: a braille wall that glows AND thickens to the EQ.
--
-- The pane is mapped into 10 concentric rings by a selectable distance metric
-- (circle/diamond/wings). The innermost ring is
-- driven by the lowest EQ band (32 Hz bass), each ring outward by the next band,
-- the outermost by the highest (16 kHz treble). Each cell recolors by its ring's
-- smoothed level on a themed ANSI-256 ramp, AND its braille glyph blooms (gains
-- dots toward center) as the ring heats — so the wall gains matter on peaks, not
-- just brightness. Audio drives color and glyph density; it never moves the art.
--
-- See AGENTS.md for durable design principles, CHECKPOINT.md for session state.

local p = plugin.register({
    name        = "Nova",
    type        = "visualizer",
    version     = "1.0.0",
    description = "Braille/Light wall visualizer — EQ-driven glow with presets, themes, and bloom mutation",
})

-- ---------- Configuration (read once at load) --------------------------------
-- Strip trailing inline comments from config values. Some TOML parsers (including
-- the one cliamp may use) leak #-comments into the value string, so "vantablack"
-- becomes "vantablack   # comment" — which fails exact key lookups.

local function clean(v)
    if v == nil then return nil end
    if type(v) ~= "string" then return v end
    -- Strip trailing #-comment (TOML parser leaks them), then surrounding quotes
    v = string.gsub(v, "%s*#.*$", "")
    v = string.gsub(v, '^%s*"', "")
    v = string.gsub(v, '"%s*$', "")
    return v
end

-- Boolean config: accepts ONLY true, false, 1, 0. Everything else → default.
local function bool_cfg(key, default)
    local raw = p:config(key)
    if type(raw) == "boolean" then return raw end
    if type(raw) == "number" then
        if raw == 1 then return true end
        if raw == 0 then return false end
    end
    -- TOML parser may return booleans as strings.
    if type(raw) == "string" then
        local v = clean(raw):lower()
        if v == "1" or v == "true" then return true end
        if v == "0" or v == "false" then return false end
    end
    return default
end

local cfg_art_path   = clean(p:config("art_path"))
-- start: the procedural wall's resting glyph when no art_path is given. The wall
-- is generated on load (no file needed) -- "black" starts empty (⠀, U+2800) and
-- blooms dots in from nothing as the music lights each ring; "stipple" starts at
-- the faint least-dense texture (⠡, U+2821, the old dots_braille look) that
-- thickens toward solid. Same additive toward-center bloom either way; only the
-- resting floor differs. art_path (if set) overrides this with a loaded file.
local cfg_start = clean(p:config("start")) or "black"
local START_GLYPH = { black = 0x2800, stipple = 0x2824 }
local start_cp = START_GLYPH[cfg_start] or START_GLYPH["stipple"]
local cfg_color_mode = clean(p:config("color_mode")) or "glow"
local cfg_mono_color = tonumber(clean(p:config("mono_color"))) or 11
local cfg_attack     = tonumber(clean(p:config("attack"))) or 0.55
if cfg_attack  < 0 then cfg_attack  = 0 elseif cfg_attack  > 1 then cfg_attack  = 1 end
local cfg_release    = tonumber(clean(p:config("release"))) or 0.18
if cfg_release < 0 then cfg_release = 0 elseif cfg_release > 1 then cfg_release = 1 end
local cfg_overdrive  = tonumber(clean(p:config("overdrive"))) or 0.78
if cfg_overdrive < 0 then cfg_overdrive = 0 elseif cfg_overdrive > 1 then cfg_overdrive = 1 end
local cfg_tilt       = tonumber(clean(p:config("tilt"))) or 0.0
local cfg_theme_name = clean(p:config("theme")) or "aurora"
local cfg_ring_shape = clean(p:config("ring_shape")) or "circle"
local cfg_cycle_secs = tonumber(clean(p:config("cycle_seconds"))) or 20
if cfg_cycle_secs < 2 then cfg_cycle_secs = 2 end  -- guard against 0/typo thrash
local cfg_fit        = clean(p:config("fit")) or "fill"

local cfg_debug = bool_cfg("debug", false)

-- Gate: noise gate threshold — clamp bands below this to exactly 0 before the
-- color and bloom paths read them. The round-mapping ramp-index fix bumped
-- low-level signal up one visible stop, making the outer rings glow faintly on
-- quiet passages. A small gate (~0.08-0.12) restores a clean noise floor without
-- affecting real musical content. 0 = off (default).
local cfg_gate = tonumber(clean(p:config("gate"))) or 0.0
if cfg_gate < 0   then cfg_gate = 0.0 end
if cfg_gate > 0.5 then cfg_gate = 0.5 end

-- Ceiling: limiter threshold — clamp bands ABOVE this to the ceiling value.
-- Pairs with gate to form a compressor lane: bands between gate and ceiling pass
-- through untouched; below gate = silence, above ceiling = clamped flat.
-- 1.0 = off (default); try 0.2-0.6 to constrain color while letting bloom
-- animate in a narrow shimmer band.
local cfg_ceiling = tonumber(clean(p:config("ceiling"))) or 1.0
if cfg_ceiling < 0.01 then cfg_ceiling = 0.01 end
if cfg_ceiling > 1.0  then cfg_ceiling = 1.0 end

-- Knee: response curve shaping the level→brightness mapping. 1.0 = linear
-- (default, no change). > 1.0 = hard knee (darker, more contrast toward the
-- top); < 1.0 = soft knee (brighter, more even). Applied after gate, before
-- ceiling — same as EQ before limiter in a mastering chain.
local cfg_knee = tonumber(clean(p:config("knee"))) or 1.0
if cfg_knee < 0.1 then cfg_knee = 0.1 end
if cfg_knee > 3.0 then cfg_knee = 3.0 end

-- Cell aspect ratio: terminal cells are ~2x tall, so x-distances are scaled
-- down so circles read round instead of egg-shaped. 0.5 is the standard for
-- most terminal fonts; dial up if your font is unusually wide, down if narrow.
local cfg_cell_aspect = tonumber(clean(p:config("cell_aspect"))) or 0.5
if cfg_cell_aspect < 0.2 then cfg_cell_aspect = 0.2 end
if cfg_cell_aspect > 2.0 then cfg_cell_aspect = 2.0 end

-- Canvas cap: the render cost is LINEAR in drawn cells (draw_w*draw_h), so on a
-- very large pane (fit=fill fullscreen on a 4K terminal) the per-frame work can
-- get heavy. max_cols/max_rows clamp the DRAWN grid; the art is then centered in
-- the (larger) pane with the existing letterbox padding. 0 = unlimited (default),
-- so normal panes are completely unchanged. NOTE for fit=fill: a cap necessarily
-- makes the wall a centered block instead of edge-to-edge (you can't fill more
-- columns than you draw) -- that's the deliberate cost/coverage trade. Use
-- frame_skip instead if you want true edge-to-edge fill on a huge screen.
local cfg_max_cols = tonumber(clean(p:config("max_cols"))) or 0
local cfg_max_rows = tonumber(clean(p:config("max_rows"))) or 0
if cfg_max_cols < 0 then cfg_max_cols = 0 end
if cfg_max_rows < 0 then cfg_max_rows = 0 end

-- Render rate: cliamp ticks a visualizer at ~20 FPS while playing. For a smoothed
-- glow wall, rendering every frame is often more than the eye needs. render_rate
-- is the FRACTION of frames actually rendered, 0..1: 1.0 renders every frame (full
-- ~20 FPS, default -- no change), 0.5 renders half (~10 FPS), 0.25 renders 1 in 4
-- (~5 FPS). On the un-rendered frames the last output string is REUSED, cutting
-- AVERAGE render cost by ~(1-rate) regardless of pane size -- and unlike the
-- canvas cap it keeps fit=fill edge-to-edge (it trades refresh rate, not coverage).
-- Audio state (smoothing/heat/bloom) still advances every frame so the envelope
-- never freezes; only the expensive cell loop is skipped. A bass-transient ONSET
-- force-renders even on a skipped frame so kick FLARES are never dropped.
--
-- A rate of 0 would mean "never render," which is meaningless, so anything below
-- 0.25 is bumped to 0.25 (1-in-4, the slowest sane setting); above 1.0 clamps to
-- full rate. The continuous rate maps to an integer skip count internally
-- (skip = round(1/rate) - 1), so effective stops are ~{1.0, 0.5, 0.33, 0.25}.
local cfg_render_rate = tonumber(clean(p:config("render_rate")))
if cfg_render_rate == nil then cfg_render_rate = 1.0 end
if cfg_render_rate > 1.0 then cfg_render_rate = 1.0 end
if cfg_render_rate < 0.25 then cfg_render_rate = 0.25 end

-- Bresenham-style render-rate gate: called at TOP of render() to bail before any work.
-- Accumulates render_rate each frame; renders when accumulator crosses 1.0.
local render_accum = 0

local function should_render(render_rate)
    if render_rate <= 0 then return false end
    if render_rate >= 1 then return true end
    render_accum = render_accum + render_rate
    if render_accum >= 1 then
        render_accum = render_accum - 1
        return true
    end
    return false
end

-- Bloom: glyph bloom mutation — as a braille cell heats, OR in dots so the
-- glyph thickens toward solid (toward full). Like CRT phosphor bloom: the wall
-- gains matter on peaks. Only braille glyphs (U+2800..U+28FF) mutate; anything
-- else is left as-is. Default ON (nova is a braille-wall plugin). Toggle off
-- to keep glyphs fixed.
local cfg_bloom = bool_cfg("bloom", true)

-- Bloom envelope: dots fill/shed on their OWN attack/release, separate from
-- color smoothing — so the wall can pop dots in fast and melt them away slowly,
-- like CRT phosphor persistence. bloom_attack = fill speed (high=snappy),
-- bloom_release = shed speed (low=lingering trail). Both 1.0 = track instantly.
local cfg_bloom_attack  = tonumber(clean(p:config("bloom_attack")))  or 0.6
local cfg_bloom_release = tonumber(clean(p:config("bloom_release"))) or 0.15
if cfg_bloom_attack  < 0 then cfg_bloom_attack  = 0 elseif cfg_bloom_attack  > 1 then cfg_bloom_attack  = 1 end
if cfg_bloom_release < 0 then cfg_bloom_release = 0 elseif cfg_bloom_release > 1 then cfg_bloom_release = 1 end
-- cool over time instead of snapping off, so a kick flashes-and-fades.
-- sustain = fraction of heat RETAINED per frame: higher = longer tail.
-- 0 = no retention = instant snap (old behavior); ~0.85 = long glowing tail.
local cfg_sustain = tonumber(clean(p:config("sustain"))) or 0.82
if cfg_sustain < 0 then cfg_sustain = 0 elseif cfg_sustain > 0.97 then cfg_sustain = 0.97 end
-- Blend: only when a bass ring punches PEAK FLARE does it warm the ring just
-- outside it (band1->band2, band2->band3). Modest flares stay in place; only a
-- full slam blooms outward. Default on; toggle off for clean rings (e.g. CRT art).
local cfg_blend = bool_cfg("blend", true)

-- ring_blend: smooth the band boundaries by interpolating the LEVEL between the
-- two bands a cell sits between, instead of snapping to the nearest. Default ON.
-- Config comes in as a string ("true"/"false") or possibly a real bool; treat
-- anything explicitly falsey as off, everything else (incl. nil) as on.
local cfg_ring_blend = bool_cfg("ring_blend", true)

-- Track whether the user EXPLICITLY set each preset-controllable key.
-- true = user set it (cfg_* holds their value); false/nil = use preset.
-- user_set is a table keyed by config name so new knobs auto-register.
local user_set = {}
-- Ordered list of every config key presets are allowed to control.
-- Adding a knob = add it here + an entry in ASSIGN below.
local PRESET_KEYS = {
    "attack", "release", "overdrive", "tilt", "gate", "ceiling", "knee",
    "bloom_attack", "bloom_release", "sustain",
    "blend", "ring_blend", "bloom",
    "theme", "ring_shape", "fit", "start", "color_mode",
    "mono_color", "cycle_seconds", "cell_aspect",
    "max_cols", "max_rows", "render_rate",
    "cycle_presets", "cycle_themes", "debug",
}
for _, key in ipairs(PRESET_KEYS) do
    user_set[key] = (p:config(key) ~= nil)
end

-- ---------- Ring distance metric --------------------------------------------
-- Rings are level sets of a distance-from-center metric on the OUTPUT grid.
-- The shape of a ring is determined entirely by which metric we use; band
-- index, color, and everything downstream are identical across shapes.
--   diamond : Manhattan  d = |dx| + |dy|       -> nested diamonds
--   circle  : Euclidean  d = sqrt(dx^2 + dy^2) -> nested circles
-- dist() receives deltas that are ALREADY absolute AND already x-scaled (the
-- caller applies the *0.5 terminal-cell aspect correction before calling), so
-- this function is pure geometry and is reused verbatim for both the max_d
-- normalization and the per-cell band lookup -- they can never diverge.
local DIST = {
    circle   = function(adx, ady) return math.sqrt(adx * adx + ady * ady) end,
}

-- ring_shape = "cycle" auto-rotates through all shapes every cycle_seconds
-- for hands-free review. Anchored to load-time so it always starts on "circle".
local CYCLE_ORDER = { "circle" }
local cycle_mode  = (cfg_ring_shape == "cycle")
local cycle_t0    = os.time()

-- Resolve the active distance metric for THIS frame.
local function active_dist()
    if cycle_mode then
        local elapsed = os.time() - cycle_t0
        if elapsed < 0 then elapsed = 0 end
        local idx = (math.floor(elapsed / cfg_cycle_secs) % #CYCLE_ORDER) + 1
        local name = CYCLE_ORDER[idx]
        return DIST[name], name
    end
    -- 8bit64k modified-- too much hedging
    --return (DIST[cfg_ring_shape] or DIST["circle"]),
    --       (DIST[cfg_ring_shape] and cfg_ring_shape or "circle")
    return DIST[cfg_ring_shape], cfg_ring_shape
end

-- ---------- ANSI helpers -----------------------------------------------------

-- Hoist hot math functions to file-scope locals: in Lua a `math.floor` call is
-- two hash lookups (math, then floor) every time; locals skip that. Matters in
-- the per-cell render loop (thousands of cells per frame at fullscreen).
local floor = math.floor
local abs   = math.abs
local sqrt  = math.sqrt

local ESC = string.char(27)

-- ---------- Truecolor detection ---------------------------------------------
-- Auto-detect terminal truecolor support (COLORTERM env var).
-- Config flag "truecolor" (boolean) overrides: false = force ANSI 256.
local cfg_truecolor
do
    local raw = p:config("truecolor")
    if type(raw) == "boolean" then
        cfg_truecolor = raw
    else
        local ct = os.getenv("COLORTERM") or ""
        cfg_truecolor = (ct == "truecolor" or ct == "24bit")
    end
end

-- ---------- ANSI 256 → RGB lookup -------------------------------------------
-- Standard 16 system colors + 6×6×6 cube + 24 grayscale steps.
-- Used for: (1) populating FG[] with truecolor escapes, (2) ANSI fallback
-- when truecolor is off but a theme defines glow.
local ANSI_RGB = {}
do
    -- Standard 16 colors
    local std = {
        {0,0,0}, {128,0,0}, {0,128,0}, {128,128,0},
        {0,0,128}, {128,0,128}, {0,128,128}, {192,192,192},
        {128,128,128}, {255,0,0}, {0,255,0}, {255,255,0},
        {0,0,255}, {255,0,255}, {0,255,255}, {255,255,255},
    }
    for i = 0, 15 do ANSI_RGB[i] = std[i + 1] end
    -- 6×6×6 color cube (16–231)
    for i = 16, 231 do
        local n = i - 16
        local r = math.floor(n / 36)
        local g = math.floor((n % 36) / 6)
        local b = n % 6
        ANSI_RGB[i] = { r == 0 and 0 or r * 40 + 55,
                        g == 0 and 0 or g * 40 + 55,
                        b == 0 and 0 or b * 40 + 55 }
    end
    -- Grayscale (232–255)
    for i = 232, 255 do
        local g = (i - 232) * 10 + 8
        ANSI_RGB[i] = { g, g, g }
    end
end

-- Map an arbitrary RGB to the nearest ANSI 256 index (Euclidean distance).
-- Used for ANSI fallback when truecolor is off and a theme defines glow.
local function rgb_to_ansi256(r, g, b)
    local best, best_dist = 0, 1/0
    for i = 0, 255 do
        local cr, cg, cb = ANSI_RGB[i][1], ANSI_RGB[i][2], ANSI_RGB[i][3]
        local d = (r-cr)*(r-cr) + (g-cg)*(g-cg) + (b-cb)*(b-cb)
        if d < best_dist then best, best_dist = i, d end
    end
    return best
end

-- ---------- FG escape table (dual-mode: ANSI 256 or truecolor) ---------------
-- FG[n] holds the SGR foreground escape for color index n.
-- ANSI 256 mode: FG[0..255] = "\27[38;5;Nm" (precomputed as before).
-- Truecolor mode: FG[0..255] = "\27[38;2;R;G;Bm" mapped from ANSI_RGB.
-- Palette indices 256+ are populated dynamically by resolve_theme().
local FG = {}
if cfg_truecolor then
    for n = 0, 255 do
        local r, g, b = ANSI_RGB[n][1], ANSI_RGB[n][2], ANSI_RGB[n][3]
        FG[n] = ESC .. "[38;2;" .. r .. ";" .. g .. ";" .. b .. "m"
    end
else
    for n = 0, 255 do FG[n] = ESC .. "[38;5;" .. n .. "m" end
end
local function fg256(n) return FG[n] or (ESC .. "[38;5;" .. n .. "m") end
local function bg256(n) return ESC .. "[48;5;" .. n .. "m" end
local function reset()  return ESC .. "[0m" end

-- ---------- Theme resolver (RGB-native, truecolor or ANSI fallback) ----------
-- All themes define glow/overdrive as {r,g,b} tables. In truecolor mode we
-- allocate virtual color indices (256+), populate FG[] with 24-bit escapes,
-- and build integer ramps from those indices. When truecolor is off, RGB
-- stops are mapped to nearest ANSI 256 via rgb_to_ansi256() — no palette
-- allocation needed. glow_color() always returns an integer → hot path unchanged.
local palette = {}
local next_color = 256

-- Resolve a theme into {glow_ramp, overdrive_ramp, glow_n, overdrive_n}.
local function resolve_theme(tp)
    if cfg_truecolor then
        local gr, odr = {}, {}
        for _, rgb in ipairs(tp.glow) do
            local c = next_color
            next_color = next_color + 1
            palette[c] = rgb
            FG[c] = ESC .. "[38;2;" .. rgb[1] .. ";" .. rgb[2] .. ";" .. rgb[3] .. "m"
            gr[#gr + 1] = c
        end
        for _, rgb in ipairs(tp.overdrive) do
            local c = next_color
            next_color = next_color + 1
            palette[c] = rgb
            FG[c] = ESC .. "[38;2;" .. rgb[1] .. ";" .. rgb[2] .. ";" .. rgb[3] .. "m"
            odr[#odr + 1] = c
        end
        return gr, odr, #gr, #odr
    else
        -- Truecolor off → map RGB stops to nearest ANSI 256
        local gr, odr = {}, {}
        for _, rgb in ipairs(tp.glow) do
            gr[#gr + 1] = rgb_to_ansi256(rgb[1], rgb[2], rgb[3])
        end
        for _, rgb in ipairs(tp.overdrive) do
            odr[#odr + 1] = rgb_to_ansi256(rgb[1], rgb[2], rgb[3])
        end
        return gr, odr, #gr, #odr
    end
end

-- ---------- Braille bloom mutation ----------------------------------------
-- A braille glyph is U+2800 + an 8-bit dot mask. "Toward full" = OR additional
-- dots into the base glyph as level rises, ending at solid ⣿ (U+28FF). Dots are
-- added in a bottom-up visual order so the cell appears to FILL UP, like a tiny
-- sub-cell level meter. Only braille codepoints mutate; callers pass nil for
-- non-braille cells (which are never touched).
--
-- IMPORTANT: cliamp runs gopher-lua (Lua 5.1) — NO native bitwise operators
-- (>> << | &) and no bit32. All bit work below is plain arithmetic on powers of
-- two, which is 5.1-safe. (Local `lua` may be 5.3+ and parse bitops fine; the
-- host would silently fail to load them. Verified gopher-lua = yuin/gopher-lua.)
--
-- Braille dot bit layout (cell is 2 cols x 4 rows):
--   col0: r0=1 r1=2 r2=4 r3=64    col1: r0=8 r1=16 r2=32 r3=128
--
-- DENSITY FILLS TOWARD CENTER. nova maps the art into concentric rings around
-- the pane center, so as the wall heats the matter should accrete TOWARD that
-- center, reinforcing the radial structure -- not always bottom-up. A cell LEFT
-- of center fills from its RIGHT edge inward; a cell ABOVE center fills from its
-- BOTTOM up; corners fill from the dot nearest the center. We pick a fill order
-- per cell by the SIGN of its offset from center (dirx, diry in {-1,0,1}).
--
-- The 9 orders below fill toward center. They are paired so that vertically-
-- mirrored cells (diry=-1 vs +1) and horizontally-mirrored cells (dirx=-1 vs +1)
-- are exact dot-mirrors of each other at every fill count. The three CENTER-AXIS
-- orders (any dirx or diry == 0) list dots in mirror-PAIRS (or quads for dead
-- center) so that, combined with the even/quad add-snap in thicken(), a cell
-- sitting ON the center row/column fills symmetrically about that axis -- a
-- single-dot step can never land off-axis and break the mirror. Keyed
-- FILL_ORDERS[dirx][diry] with dirx,diry in {-1,0,1}.
local FILL_ORDERS = {
    [-1] = {  -- cell LEFT of center (center is to the right)
        [-1] = {128,32,64,16,4,8,2,1},   -- up-left:  toward down-right corner
        [ 0] = {16,32,8,128,2,4,1,64},   -- left:     V-pairs, lean right (col1 first)
        [ 1] = {8,16,1,32,2,128,4,64},   -- dn-left:  toward up-right corner
    },
    [ 0] = {  -- cell on the vertical center line
        [-1] = {64,128,4,32,2,16,1,8},   -- up:       H-pairs, lean down (rows 3,2 first)
        [ 0] = {2,4,16,32,1,64,8,128},   -- on-center: quads (inner then outer)
        [ 1] = {1,8,2,16,4,32,64,128},   -- down:     H-pairs, lean up (rows 0,1 first)
    },
    [ 1] = {  -- cell RIGHT of center (center is to the left)
        [-1] = {64,4,128,2,32,1,16,8},   -- up-right: toward down-left corner
        [ 0] = {2,4,1,64,16,32,8,128},   -- right:    V-pairs, lean left (col0 first)
        [ 1] = {1,2,8,4,16,64,32,128},   -- dn-right: toward up-left corner
    },
}

-- Encode a codepoint in 0x2800..0x28FF as 3-byte UTF-8 (no bitops; div/mod).
-- All braille codepoints are 3-byte: lead 0xE2, then two continuation bytes.
local braille_cache = {}   -- [codepoint] -> utf8 string, memoized
local function braille_char(cp)
    local s = braille_cache[cp]
    if s then return s end
    local b1 = 0xE0 + floor(cp / 4096)
    local b2 = 0x80 + (floor(cp / 64) % 64)
    local b3 = 0x80 + (cp % 64)
    s = string.char(b1, b2, b3)
    braille_cache[cp] = s
    return s
end

-- OR a single power-of-two bit into a mask (5.1-safe): add it only if not set.
local function set_bit(mask, bit)
    if floor(mask / bit) % 2 == 0 then return mask + bit end
    return mask
end

-- thicken(base_cp, level, fill_order, dkey) -> thickened glyph string, MEMOIZED.
-- add = round(level*8) in 0..8. For CENTER-AXIS cells the add is snapped down so
-- mirror-pairs (or quads at dead center) are always completed: a cell ON the
-- center row/column would otherwise add a single off-axis dot at odd fill counts
-- and visibly break the wall's mirror symmetry. dkey = (dirx+1)*3 + (diry+1), so
-- we recover dirx/diry to decide the snap: dkey 4 = dead center (quads, mult-of-4),
-- dkey in {1,3,5,7} = one axis is centered (pairs, even). Off-axis cells unchanged.
-- thicken_cache[dkey][base_cp][add].
local thicken_cache = {}
local function thicken(base_cp, level, fill_order, dkey)
    local add = floor(level * 8 + 0.5)
    if add < 0 then add = 0 elseif add > 8 then add = 8 end
    -- center-axis add-snap (keeps mirror pairs/quads whole)
    if dkey == 4 then          -- dead center (dirx==0 and diry==0): quads
        add = add - (add % 4)
    elseif dkey % 2 == 1 then  -- one axis centered (dkey 1,3,5,7): pairs
        add = add - (add % 2)
    end
    local dcache = thicken_cache[dkey]
    if not dcache then dcache = {}; thicken_cache[dkey] = dcache end
    local row = dcache[base_cp]
    if row then
        local hit = row[add]
        if hit then return hit end
    else
        row = {}
        dcache[base_cp] = row
    end
    local mask = base_cp - 0x2800
    for k = 1, add do mask = set_bit(mask, fill_order[k]) end
    local s = braille_char(0x2800 + mask)
    row[add] = s
    return s
end

-- ---------- Color presets (single swap point for upstream theme integration) ---
-- All themes now use 15-stop RGB ramps (glow / overdrive). Truecolor
-- mode renders native 24-bit; ANSI fallback auto-maps to nearest 256 color.
-- Ramp length is arbitrary — glow_color() adapts to any n >= 2.
-- When cliamp exposes theme_colors(), add a from_cliamp_theme() function that
-- builds a dynamic glow ramp from the hex anchor colors.

local PRESETS = {
    sol = {
        name = "Sol (G-type main sequence, ~5,800K)",
        -- 15-stop skewed: subsampled from 21-stop power-curve (pos = (i/20)^0.7).
        -- Dark-end detail preserved; bright-end snap coarsened proportionally.
        glow = {
            {8,8,8}, {35,13,13},
            {147,61,0}, {184,95,0},
            {227,95,0}, {246,95,0},
            {255,109,0}, {255,118,0}, {255,126,0},
            {255,142,0}, {255,150,0},
            {255,177,0}, {255,191,0},
            {255,233,0}, {255,255,0},
        },
        overdrive = {
            {255,233,0}, {255,255,0},
            {0,255,255}, {255,255,255},
        },
    },
    crt = {
        name = "CRT Green Phosphor",
        glow = {
            {8,8,8},
            {4,51,4},
            {0,115,0}, {0,135,0},
            {0,175,0}, {0,195,0},
            {0,235,0}, {0,255,0}, {0,255,67},
            {47,255,67}, {95,255,0},
            {135,255,0}, {155,255,0},
            {195,255,0}, {215,255,0},
        },
        overdrive = {
            {195,255,0}, {215,255,0},
            {0,255,255}, {255,255,255},
        },
    },
    sirius = {
        name = "Sirius (A1 main sequence, ~9,900K)",
        glow = {
            {0,0,0}, {4,4,4},
            {23,23,23}, {38,38,38},
            {68,68,68}, {83,83,83},
            {113,113,113}, {128,128,128}, {143,143,143},
            {178,178,178}, {198,198,198},
            {228,228,228}, {233,233,233},
            {246,246,246}, {255,255,255},
        },
        overdrive = {
            {246,246,246}, {255,255,255},
            {0,255,255}, {255,255,255},
        },
    },
    aurora = {
        name = "Aurora (teal-cyan-green)",
        glow = {
            {8,8,8},
            {4,51,51},
            {0,115,115}, {0,135,135},
            {0,175,135}, {0,195,135},
            {0,235,135}, {0,255,135}, {47,255,115},
            {115,255,95}, {135,255,95},
            {175,255,95}, {195,255,95},
            {215,255,175}, {215,255,255},
        },
        overdrive = {
            {215,255,175}, {215,255,255},
            {0,255,255}, {255,255,255},
        },
    },
    rigel = {
        name = "Rigel (B8 blue supergiant, ~12,000K)",
        glow = {
            {4,4,24}, {4,8,51},
            {0,24,95}, {0,51,135},
            {0,87,175}, {0,135,215},
            {0,175,255}, {51,195,255}, {95,215,255},
            {135,231,255}, {175,243,255},
            {195,247,255}, {215,251,255},
            {231,253,255}, {247,255,255},
        },
        overdrive = {
            {231,253,255}, {247,255,255},
            {0,255,255}, {255,255,255},
        },
    },
    antares = {
        name = "Antares (M1 red supergiant, ~3,500K)",
        glow = {
            {20,2,2}, {36,2,4},
            {63,0,8}, {95,0,16},
            {127,0,24}, {155,0,40},
            {183,4,56}, {207,16,79}, {227,40,103},
            {241,71,127}, {251,103,155},
            {255,135,183}, {255,167,207},
            {255,199,227}, {255,231,247},
        },
        overdrive = {
            {255,199,227}, {255,231,247},
            {0,255,255}, {255,255,255},
        },
    },

}
-- ---------- Preset profiles (dynamics + behavior bundled for one-knob feel) ----
-- Each profile sets defaults for the dynamics/config keys that shape how the
-- wall MOVES and FEELS. The user's explicit TOML keys ALWAYS override. Keys not
-- listed in a profile fall back to the "reference" profile values.
-- preset = reference | transient | nebula | plasma | afterglow | analog
-- cycle_presets = true to auto-rotate through all of them on the cycle_seconds timer.
local PRESET_PROFILES = {
    -- Presets bundle dynamics + theme + ring_shape into a single feel.
    -- Keys not listed fall back to the "reference" profile values.
    ["reference"] = {
        -- theme = "aurora",  ring_shape = "circle",
        attack = 0.55,  release = 0.18,
        overdrive = 0.92,  sustain = 0.82,  blend = true,
        bloom_attack = 0.60,  bloom_release = 0.25,
        gate = 0.00,  knee = 1.00,  tilt = 0.00,
        ring_blend = true,
    },
    transient = {
        -- theme = "aurora",  ring_shape = "circle",
        attack = 1.00,  release = 0.25,
        overdrive = 0.96,  sustain = 0.90,  blend = true,
        bloom_attack = 1.00,  bloom_release = 0.95,
        gate = 0.20,  knee = 1.00,  tilt = 0.00,
        ring_blend = true,
    },
    nebula = {
        -- theme = "aurora",  ring_shape = "circle",
        attack = 0.30,  release = 0.08,
        overdrive = 0.97,  sustain = 0.90,  blend = false,
        bloom_attack = 0.40,  bloom_release = 0.05,
        gate = 0.00,  knee = 0.60,  tilt = 0.40,
        ring_blend = true,
    },
    plasma = {
        -- theme = "aurora",  ring_shape = "circle",
        attack = 0.65,  release = 0.10,
        overdrive = 0.90,  sustain = 0.88,  blend = true,
        bloom_attack = 0.45,  bloom_release = 0.23,
        gate = 0.03,  knee = 0.90,  tilt = 0.20,
        ring_blend = true,
    },
    afterglow = {
        -- theme = "aurora",  ring_shape = "circle",
        attack = 0.30,  release = 0.05,
        overdrive = 0.98,  sustain = 0.90,  blend = false,
        bloom_attack = 0.05,  bloom_release = 0.90,
        gate = 0.00,  knee = 2.60,  tilt = 0.50,
        ring_blend = true,
    },
    analog = {
        -- theme = "aurora",  ring_shape = "circle",
        attack = 0.85,  release = 1.00,
        overdrive = 0.95,  sustain = 0.95,  blend = false,
        bloom_attack = 1.00,  bloom_release = 0.85,
        tilt = 0.30,
        ring_blend = true,
    },
    demo = {
        cycle_presets = true, cycle_themes = true, cycle_seconds = 7, debug = true,
        theme = "sol",  ring_shape = "circle",
        bloom = true,  start = "black",
    },

}

-- Resolve active behavior preset. preset = "default" | profile name.
-- cycle_presets = true rotates through all profiles on cycle_seconds (same timer
-- as ring_shape cycle) so you can preview without config edits.
local cfg_preset_name = clean(p:config("preset")) or "reference"

-- cycle_presets: auto-rotate presets.
local cycle_presets = bool_cfg("cycle_presets", false)

-- cycle_themes: auto-rotate color themes independently of presets.
-- Same timer (cycle_t0 + cycle_seconds) so both axes stay in sync.
local cycle_themes = bool_cfg("cycle_themes", false)

local CYCLE_PRESET_NAMES = { "reference", "transient", "nebula", "plasma", "afterglow", "analog" }
local CYCLE_THEME_NAMES  = { "sol", "sirius", "rigel", "antares", "aurora" }


-- Resolve the active profile for THIS frame. In fixed mode this is constant;
-- in cycle mode it advances with wall-clock time (same cycle_t0 as ring_shape).
local function active_profile()
    if cycle_presets then
        local elapsed = os.time() - cycle_t0
        if elapsed < 0 then elapsed = 0 end
        local idx = (math.floor(elapsed / cfg_cycle_secs) % #CYCLE_PRESET_NAMES) + 1
        local name = CYCLE_PRESET_NAMES[idx]
        return PRESET_PROFILES[name] or {}, name
    end
    return PRESET_PROFILES[cfg_preset_name] or {}, cfg_preset_name
end

local active_preset = PRESETS[cfg_theme_name]
local glow_ramp, overdrive_ramp, glow_n, overdrive_n = resolve_theme(active_preset)

local function glow_color(level, hot)
    local ramp, n
    if hot then ramp, n = overdrive_ramp, overdrive_n
    else        ramp, n = glow_ramp, glow_n end
    -- Round (not floor) so the TOP ramp stop is reachable below level==1.0.
    -- With floor, the brightest color only appeared at an exact 1.0, which the
    -- smoothed/heat level basically never hits — so the peak (e.g. white) was
    -- effectively unreachable. Rounding spreads stops evenly across [0,1].
    local idx = floor(level * (n - 1) + 0.5) + 1
    if idx < 1 then idx = 1 elseif idx > n then idx = n end
    return ramp[idx]
end


local function preset_assign(key, v)
    if key == "theme" then
        if v ~= cfg_theme_name then
            local tp = PRESETS[v]
            if tp then
                cfg_theme_name = v
                glow_ramp, overdrive_ramp, glow_n, overdrive_n = resolve_theme(tp)
            end
        end
    elseif key == "ring_shape" then
        if v == "cycle" then
            cfg_ring_shape = "cycle"
            cycle_mode = true
        elseif DIST[v] then
            cfg_ring_shape = v
            cycle_mode = false
        end
    elseif key == "fit" then
        cfg_fit = v
    elseif key == "start" then
        cfg_start = v
        start_cp = START_GLYPH[v] or START_GLYPH["stipple"]
    elseif key == "color_mode" then
        cfg_color_mode = v
    -- numerics
    elseif key == "attack" then cfg_attack = v
    elseif key == "release" then cfg_release = v
    elseif key == "overdrive" then cfg_overdrive = v
    elseif key == "tilt" then cfg_tilt = v
    elseif key == "gate" then cfg_gate = v
    elseif key == "ceiling" then cfg_ceiling = v
    elseif key == "knee" then cfg_knee = v
    elseif key == "bloom_attack" then cfg_bloom_attack = v
    elseif key == "bloom_release" then cfg_bloom_release = v
    elseif key == "sustain" then cfg_sustain = v
    -- booleans
    elseif key == "blend" then cfg_blend = v
    elseif key == "ring_blend" then cfg_ring_blend = v
    elseif key == "bloom" then cfg_bloom = v
    -- additional knobs
    elseif key == "mono_color" then cfg_mono_color = v
    elseif key == "cycle_seconds" then cfg_cycle_secs = v
    elseif key == "cell_aspect" then cfg_cell_aspect = v
    elseif key == "max_cols" then cfg_max_cols = v
    elseif key == "max_rows" then cfg_max_rows = v
    elseif key == "render_rate" then
        cfg_render_rate = v
    elseif key == "cycle_presets" then
        cycle_presets = v
        cycle_t0 = os.time()
    elseif key == "cycle_themes" then
        cycle_themes = v
        cycle_t0 = os.time()
    elseif key == "debug" then cfg_debug = v
    end
end

-- ---------- Art loading + ring precompute ------------------------------------
-- Loaded once. art_cells[y][x] = display-cell glyph; art_code[y][x] = braille
-- codepoint (or nil for non-braille). Ring band index is computed per-cell in
-- the render loop from the distance metric, not precomputed.

local art_lines   = nil
local art_cells   = nil    -- [y][x] -> single display-cell glyph string
local art_code    = nil    -- [y][x] -> braille codepoint if braille cell, else nil
local art_w       = 0      -- max display width across rows
local art_h       = 0
local load_error  = nil    -- non-nil string => render the placeholder

-- Count display columns: UTF-8 lead bytes only (continuation bytes 0x80..0xBF
-- don't advance a column). Single-width BMP assumption — fine for ASCII art.
local function visible_cols(s)
    local n = 0
    for i = 1, #s do
        local b = s:byte(i)
        if b < 0x80 or b >= 0xC0 then n = n + 1 end
    end
    return n
end

-- Expand a leading ~ or $HOME / ${HOME} to the absolute home dir. cliamp's
-- fs layer calls Go's os.ReadFile/os.Stat directly, which do NOT expand the
-- shell tilde — so we must do it here or "~/foo" silently fails to load.
local function expand_path(path)
    if not path or path == "" then return path end
    local home = os.getenv("HOME") or os.getenv("USERPROFILE")
    if home then
        if path == "~" then
            return home
        elseif path:sub(1, 2) == "~/" then
            return home .. path:sub(2)
        end
        path = path:gsub("%${HOME}", home):gsub("%$HOME", home)
    end
    return path
end

-- Procedurally generate a uniform braille wall -- no file needed. Every cell is
-- the same `start_cp` base glyph; the render loop then lights + thickens it from
-- the EQ exactly as it would a loaded file. We fill a fixed source grid (35x188,
-- matching the old dots_braille.txt dims) so fit=contain/fill behave identically
-- to the file the wall used to ship as. art_code[y][x] = start_cp everywhere
-- (uniform), so bloom mutation has its base with zero per-cell decode.
local GEN_W, GEN_H = 188, 35
local function generate_wall()
    art_lines, load_error = nil, nil
    art_w, art_h = GEN_W, GEN_H
    -- When bloom is off, an empty base gives a blank wall. Override to full
    -- braille (⣿) so the wall is always visible regardless of start.
    local cp = start_cp
    if not cfg_bloom and cp == 0x2800 then
        cp = 0x28FF
    end
    local glyph = braille_char(cp)
    local is_braille = (cp >= 0x2800 and cp <= 0x28FF)
    art_cells = {}
    art_code  = {}
    for y = 1, art_h do
        local row  = {}
        local crow = {}
        for x = 1, art_w do
            row[x] = glyph
            if is_braille then crow[x] = cp end
        end
        art_cells[y] = row
        art_code[y]  = crow
    end
end

local function load_art()
    art_lines, art_cells, art_code = nil, nil, nil
    art_w, art_h, load_error = 0, 0, nil

    -- No art_path => procedural wall (the default; no file dependency).
    if not cfg_art_path or cfg_art_path == "" then
        generate_wall()
        return
    end
    local path = expand_path(cfg_art_path)
    if not (cliamp and cliamp.fs and cliamp.fs.exists(path)) then
        load_error = "nova: art file not found: " .. tostring(path)
        return
    end

    local data = cliamp.fs.read(path)
    if not data or data == "" then
        load_error = "nova: art file empty or unreadable"
        return
    end

    -- Split into lines (strip a trailing newline, tolerate CRLF).
    local lines = {}
    data = data:gsub("\r\n", "\n"):gsub("\r", "\n")
    for line in (data .. "\n"):gmatch("(.-)\n") do
        lines[#lines + 1] = line
    end
    -- Drop a single trailing empty line from the terminal newline.
    if #lines > 0 and lines[#lines] == "" then lines[#lines] = nil end
    if #lines == 0 then
        load_error = "nova: art file has no rows"
        return
    end

    art_lines = lines
    art_h = #lines
    for _, l in ipairs(lines) do
        local w = visible_cols(l)
        if w > art_w then art_w = w end
    end
    if art_w == 0 then
        load_error = "nova: art file has zero width"
        art_lines = nil
        return
    end

    -- Pre-extract each row into a flat array of display-cell glyphs so render
    -- can index art cells in O(1) (avoids re-walking UTF-8 every frame).
    -- art_code[y][x] = the braille codepoint (0x2800..0x28FF) if the cell is a
    -- braille glyph, else nil. Precomputed so bloom mutation never decodes
    -- UTF-8 in the hot loop.
    art_cells = {}
    art_code  = {}
    for y = 1, art_h do
        local row = {}
        local crow = {}
        local s = art_lines[y]
        local seen, i, n = 0, 1, #s
        while i <= n do
            local b = s:byte(i)
            local len = 1
            if b >= 0xF0 then len = 4
            elseif b >= 0xE0 then len = 3
            elseif b >= 0xC0 then len = 2 end
            seen = seen + 1
            row[seen] = s:sub(i, i + len - 1)
            -- braille is the 3-byte sequence 0xE2 0xA0..0xA3 0x80..0xBF =>
            -- codepoint 0x2800..0x28FF. Decode without bitops (5.1-safe).
            if len == 3 and b == 0xE2 then
                local b2 = s:byte(i + 1)
                local b3 = s:byte(i + 2)
                if b2 and b3 then
                    local cp = ((b - 0xE0) * 4096)
                             + ((b2 - 0x80) * 64) + (b3 - 0x80)
                    if cp >= 0x2800 and cp <= 0x28FF then crow[seen] = cp end
                end
            end
            i = i + len
        end
        -- pad short rows with spaces to art_w
        for x = seen + 1, art_w do row[x] = " " end
        art_cells[y] = row
        art_code[y]  = crow
    end
end

-- ---------- Per-instance state -----------------------------------------------

local smoothed  = {0,0,0,0,0,0,0,0,0,0}
-- Overdrive "heat" for the two bass bands: latches on a transient ONSET, then
-- decays slowly so the flare flashes-and-fades.
local heat      = {0, 0}
-- Slow-moving baseline of each bass band's level. A flare fires only when the
-- live level jumps a margin ABOVE this baseline (a transient onset = a kick),
-- NOT when bass merely sits high — cliamp's bands are pre-smoothed and often
-- peg near the top, so an absolute-threshold trigger fires constantly and the
-- flare/bleed stop reading as events. The baseline tracks the recent average so
-- only genuine punches stand out.
local bass_base = {0, 0}
-- effective[] = the level the COLOR uses per band each frame: smoothed plus any
-- overdrive heat (bands 1-2) and peak-flare bleed (into the adjacent ring +1).
-- Built once per frame; the per-cell color path reads this instead of smoothed[]
-- so the flare is uniform across each concentric ring (correct) and costs nothing per cell.
local effective = {0,0,0,0,0,0,0,0,0,0}
-- Bloom envelope per band: chases effective[] with its own attack/release so
-- dots fill/shed on a separate timescale from color (phosphor-persistence feel).
-- This is the level bloom mutation reads (NOT effective[] directly).
local bloom      = {0,0,0,0,0,0,0,0,0,0}
-- Bloom bleed: per-ring boost from overdrive bleed to adjacent rings.
-- Bloom bleed is a separate per-band array that stores the spillover heat
-- as the color bleed so the two channels read as one percussive event.
-- Set during the effective[] build phase, applied after the bloom envelope.
local bloom_bleed = {0,0,0,0,0,0,0,0,0,0}

-- Cached last render output for should_render() to return on skipped frames.
-- Pane dimensions cached so a resize forces a fresh render (stale cache = wrong shape).
local last_output = nil
local last_rows = 0
local last_cols = 0
local last_shown_preset = nil
local last_profile_name = nil

-- Ring geometry cache: precomputed per-cell values to avoid sqrt/distance math
-- in the hot render loop. Rebuilt when draw_w, draw_h, cell_aspect, or ring_shape
-- changes. ring_cache[oy] = {lo={}, frac={}, band={}, fo={}, dk={}}
local ring_cache = nil
local ring_cache_w = 0
local ring_cache_h = 0
local ring_cache_aspect = 0
local ring_cache_shape = ""

-- Source column map: sx_map[ox] = source column for output column ox.
-- Rebuilt when draw_w changes.
local sx_map = nil
local sx_map_w = 0

function p:init(rows, cols)
    for i = 1, 10 do smoothed[i] = 0; effective[i] = 0; bloom[i] = 0 end
    heat[1], heat[2] = 0, 0
    bass_base[1], bass_base[2] = 0, 0
    for i = 1, 10 do bloom_bleed[i] = 0 end
    last_output = nil
    last_shown_preset = nil
    last_profile_name = nil
    ring_cache = nil
    sx_map = nil
    load_art()
end

function p:destroy() end

-- ---------- Render helpers ---------------------------------------------------

local function placeholder(rows, cols, msg)
    -- Centered single-line error/status message. Always a string.
    local lines = {}
    local mid = math.floor(rows / 2) + 1
    local pad = math.max(0, math.floor((cols - #msg) / 2))
    for r = 1, rows do
        if r == mid then
            lines[r] = string.rep(" ", pad) .. fg256(208) .. msg .. reset()
        else
            lines[r] = ""
        end
    end
    return table.concat(lines, "\n")
end

-- ---------- The render loop --------------------------------------------------

function p:render(bands, frame, rows, cols)
    
    -- 8bit64k modified: get out fast if we are tuned by render_rate.
    -- Respect pane resize: if dimensions changed, force a fresh render.
    if (not should_render(cfg_render_rate))
       and last_output ~= nil
       and rows == last_rows and cols == last_cols then
        return last_output
    end  
    
    -- Resolve active profile once per rendered frame. Guard on name change:
    -- only re-apply preset values when the profile actually rotates.
    local prof, pname = active_profile()
    if pname ~= last_profile_name then
        last_profile_name = pname
        for key, v in pairs(prof) do
            if not user_set[key] then
                preset_assign(key, v)
            end
        end
    end

    -- cycle_themes: independently rotate the color theme on the same timer.
    -- Runs after profile overlay so it can override a profile's theme choice.
    if cycle_themes and not user_set["theme"] then
        local elapsed = os.time() - cycle_t0
        if elapsed < 0 then elapsed = 0 end
        local idx = (math.floor(elapsed / cfg_cycle_secs) % #CYCLE_THEME_NAMES) + 1
        local tname = CYCLE_THEME_NAMES[idx]
        if tname ~= cfg_theme_name then
            local tp = PRESETS[tname]
            if tp then
                cfg_theme_name = tname
                glow_ramp, overdrive_ramp, glow_n, overdrive_n = resolve_theme(tp)
            end
        end
    end

    -- Debug: track the active preset name so the footer can show it.
    if cfg_debug then
        last_shown_preset = pname
    end

    -- Always advance smoothing state, even on error/hidden paths, so a resume
    -- never shows cold state.
    for i = 1, 10 do
        local raw = bands[i] or 0
        -- spectral tilt: gently lift higher bands so sparse treble still lights
        -- the outer rings. tilt=0 disables.
        if cfg_tilt > 0 then
            raw = raw * (1.0 + cfg_tilt * (i - 1) / 9)
        end
        if raw > 1.0 then raw = 1.0 end
        if raw < 0.0 then raw = 0.0 end
        if raw > smoothed[i] then
            smoothed[i] = smoothed[i] + (raw - smoothed[i]) * cfg_attack
        else
            smoothed[i] = smoothed[i] - (smoothed[i] - raw) * cfg_release
        end
    end

    -- Build effective[] = the level the COLOR uses this frame. Start from the
    -- smoothed levels, then layer overdrive flare + white-hot bleed on the bass.
    for i = 1, 10 do effective[i] = smoothed[i] end

    -- Overdrive flare on the two bass bands (1,2), TRANSIENT-triggered. A flare
    -- fires on a kick ONSET — when the live level jumps a margin above its slow
    -- baseline AND clears the overdrive floor — not merely when bass sits high
    -- (which it often does). On a fired onset, heat latches to the live level
    -- (fast attack); otherwise heat is RETAINED at cfg_sustain per frame so the
    -- flare flashes then cools. effective = max(smoothed, heat), so the fading
    -- tail never dims below the live level. cfg_sustain=0 => no tail => snap.
    local BASE_RATE   = 0.05   -- baseline EMA: slow, so it tracks recent average
    local ONSET_MARGIN = 0.18  -- live must exceed baseline by this to be an onset
    -- The flare detector measures against the CEILING-LIMITED level, not the raw
    -- smoothed signal. Ceiling is a hard cap on what the wall can express, so a
    -- band can never behave as if it exceeded the cap: with ceiling=0.80 and
    -- overdrive=0.90 the overdrive threshold is UNREACHABLE -> no flare, no bleed,
    -- and (critically) no bloom_bleed, which is a separate array the final ceiling
    -- clamp never touches. ceiling=1.0 (off) leaves the detector unchanged.
    for i = 1, 2 do
        local s = smoothed[i]
        if cfg_ceiling < 1.0 and s > cfg_ceiling then s = cfg_ceiling end
        local onset = (s >= cfg_overdrive)
                      and (s >= bass_base[i] + ONSET_MARGIN)
        if onset and s > heat[i] then
            heat[i] = s                           -- latch hot on the punch
        else
            heat[i] = heat[i] * cfg_sustain      -- retain a fraction; tail cools
            if heat[i] < s then heat[i] = s end
        end
        if heat[i] > effective[i] then effective[i] = heat[i] end
        -- advance the slow baseline AFTER the onset test (so the spike itself
        -- doesn't immediately raise the bar it has to clear).
        bass_base[i] = bass_base[i] + (s - bass_base[i]) * BASE_RATE
    end

    -- Bleed: ONLY when a bass ring reaches PEAK FLARE (heat at the very top of
    -- the overdrive ramp) does it warm the ring just outside it (1->2, 2->3).
    -- A modest flare stays put; only a full slam blooms outward. Scaled by how
    -- far past the peak-flare cutoff we are, so it's proportional, clamped to <= 1.
    if cfg_blend then
        local FLARE_PEAK = cfg_overdrive > 0.92 and cfg_overdrive or 0.92  -- bleed gate: at least overdrive floor, never below
        for i = 1, 2 do
            if heat[i] >= FLARE_PEAK then
                local over = (heat[i] - FLARE_PEAK) / (1 - FLARE_PEAK)  -- 0..1
                local spill = 0.45 * over            -- partial warmth, never full
                local tgt = i + 1                    -- ring just outside
                local v = effective[tgt] + spill
                if v > 1 then v = 1 end
                if v > effective[tgt] then effective[tgt] = v end
            end
        end
        -- Bloom bleed: the same overdrive that spills COLOR into adjacent rings
        -- also THICKENS them — the wall bulges outward from the impact. Bloom
        -- bleed reaches +1 and +2 rings (vs color's +1 only) because mechanical
        -- deformation travels further than heat. Decays at cfg_sustain so the
        -- bloom bump shares the flare's tail, reading as one percussive event.
        for i = 1, 10 do
            bloom_bleed[i] = bloom_bleed[i] * cfg_sustain
        end
        for i = 1, 2 do
            if heat[i] >= FLARE_PEAK then
                local over = (heat[i] - FLARE_PEAK) / (1 - FLARE_PEAK)
                local spill = 0.45 * over
                local t1 = i + 1
                if spill > bloom_bleed[t1] then bloom_bleed[t1] = spill end
                local t2 = i + 2
                if t2 <= 10 and spill * 0.5 > bloom_bleed[t2] then
                    bloom_bleed[t2] = spill * 0.5
                end
            end
        end
    else
        -- When bleed is off, clear any residual bloom bleed and decay.
        for i = 1, 10 do bloom_bleed[i] = 0 end
    end

    -- Gate: clamp bands below cfg_gate to 0. Runs after the full effective[]
    -- layer is built (smoothed + heat + bleed). 0 = off (default).
    if cfg_gate > 0 then
        for i = 1, 10 do
            if effective[i] < cfg_gate then effective[i] = 0 end
        end
    end

    -- Knee: shape the response curve. Applied after gate so bands that were
    -- clamped to 0 stay at 0 regardless of knee.
    if cfg_knee ~= 1.0 then
        for i = 1, 10 do
            if effective[i] > 0 then
                effective[i] = effective[i] ^ cfg_knee
            end
        end
    end

    -- Ceiling: final hard clamp on the COLOR path — nothing escapes past this.
    -- Last in the gate→knee→ceiling chain, like a limiter at mastering output.
    -- (The flare detector above is ALSO ceiling-limited so overdrive/bleed can
    -- never fire above the cap; this clamp is the color path's final guarantee.)
    -- 1.0 = off (default).
    if cfg_ceiling < 1.0 then
        for i = 1, 10 do
            if effective[i] > cfg_ceiling then effective[i] = cfg_ceiling end
        end
    end

    -- Bloom envelope: chase effective[] with its OWN attack/release so dots
    -- fill fast and shed slow (CRT phosphor persistence) independent of color.
    -- Only advanced when bloom is on. bloom[] is what the glyph mutation reads.
    if cfg_bloom then
        for i = 1, 10 do
            local target = effective[i]
            if target > bloom[i] then
                bloom[i] = bloom[i] + (target - bloom[i]) * cfg_bloom_attack
            else
                bloom[i] = bloom[i] - (bloom[i] - target) * cfg_bloom_release
            end
        end
        -- Add bloom bleed boost on top of the normal envelope. Bleed decays
        -- at cfg_sustain (same clock as color) so the two channels feel like
        -- one percussive event hitting the wall.
        for i = 1, 10 do
            if bloom_bleed[i] > 0 then
                local v = bloom[i] + bloom_bleed[i]
                if v > 1 then v = 1 end
                bloom[i] = v
            end
        end
    end
    if load_error then
        return placeholder(rows, cols, load_error)
    end
    -- Lazy-load: if init() didn't run (or hasn't yet), load on first render.
    -- This makes the plugin robust to host init-timing differences. art_cells is
    -- the sentinel (set by BOTH the file loader and the procedural generator);
    -- art_lines is only set on the file path, so don't gate on it here.
    if not art_cells and not load_error then
        load_art()
    end
    if load_error then
        return placeholder(rows, cols, load_error)
    end
    if not art_cells then
        return placeholder(rows, cols, "nova: no art loaded")
    end
    if rows < 1 or cols < 1 then return "" end

    -- Canvas cap: clamp the grid we actually DRAW into. The art is sized against
    -- the capped dimensions, then centered in the FULL pane below (existing
    -- letterbox padding). Cost is linear in drawn cells, so this bounds the
    -- per-frame work on huge panes. 0 = unlimited. We never draw larger than the
    -- real pane either way.
    local cap_rows = rows
    local cap_cols = cols
    if cfg_max_rows > 0 and cap_rows > cfg_max_rows then cap_rows = cfg_max_rows end
    if cfg_max_cols > 0 and cap_cols > cfg_max_cols then cap_cols = cfg_max_cols end

    -- Fit the art into the (capped) canvas. Two modes:
    --   contain (default): scale DOWN preserving aspect, centered, letterboxed.
    --     Right for pictures (Ruby, CRT) where the shape must be preserved.
    --   fill: stretch each axis independently to the FULL canvas, edge to edge,
    --     no letterbox. Right for textures like the braille wall where there's
    --     no "correct" shape to keep. (With a cap < pane, fill reaches the cap,
    --     not the pane edge -- a centered block; that's the cost/coverage trade.)
    -- Never scales a source axis beyond the canvas in either mode.
    local draw_h, draw_w
    if cfg_fit == "fill" then
        draw_h = cap_rows
        draw_w = cap_cols
    else
        draw_h = art_h
        draw_w = art_w
        if draw_h > cap_rows then draw_h = cap_rows end
        if draw_w > cap_cols then draw_w = cap_cols end
        -- preserve aspect-ish: if one axis must shrink, shrink the other in step
        -- so the face doesn't get grotesquely squished. Use the tighter ratio.
        local sh = draw_h / art_h
        local sw = draw_w / art_w
        local s  = (sh < sw) and sh or sw
        draw_h = math.max(1, math.floor(art_h * s + 0.5))
        draw_w = math.max(1, math.floor(art_w * s + 0.5))
        if draw_h > cap_rows then draw_h = cap_rows end
        if draw_w > cap_cols then draw_w = cap_cols end
    end

    -- Ring geometry computed on the OUTPUT grid (resolution-independent).
    -- Rings are level sets of the selected distance metric (circle/diamond/
    -- circle); x scaled 0.5 for the ~2:1 terminal cell aspect ratio so circles
    -- read as circles, not eggs. Band 1 (bass) = center, 10 = edge.
    -- Resolve the metric ONCE per frame (in cycle mode it advances with the
    -- wall clock; resolving once keeps the whole frame on a single shape).
    local dist, shape_name = active_dist()
    local ocx = (draw_w + 1) / 2
    local ocy = (draw_h + 1) / 2
    local max_d = 0
    do
        local dx = (draw_w - ocx) * cfg_cell_aspect
        local dy = (draw_h - ocy)
        max_d = dist(dx, dy)
        if max_d <= 0 then max_d = 1 end
    end

    local left_pad = floor((cols - draw_w) / 2)
    local top_pad  = floor((rows - draw_h) / 2)
    local pad_str  = string.rep(" ", left_pad)

    -- Per-frame scalars hoisted out of the loops (avoid recomputing per cell).
    local inv_dw = art_w / draw_w     -- source-col scale
    local inv_dh = art_h / draw_h     -- source-row scale
    local nine_over_maxd = 9 / max_d  -- pos = d * this
    local is_pass  = (cfg_color_mode == "passthrough")
    local is_mono  = (cfg_color_mode == "mono")
    local do_bloom  = cfg_bloom
    local do_blend = cfg_ring_blend

    -- Rebuild ring geometry cache if pane dimensions, aspect, or shape changed.
    -- This eliminates sqrt/distance math from the per-cell hot loop.
    if ring_cache == nil or ring_cache_w ~= draw_w or ring_cache_h ~= draw_h
       or ring_cache_aspect ~= cfg_cell_aspect or ring_cache_shape ~= shape_name then
        local cell_aspect = cfg_cell_aspect
        ring_cache = {}
        for oy = 1, draw_h do
            local dy = abs(oy - ocy)
            local diry = (oy < ocy) and -1 or ((oy > ocy) and 1 or 0)
            local fill_row = FILL_ORDERS[-1][diry]
            local fill_mid = FILL_ORDERS[0][diry]
            local fill_rgt = FILL_ORDERS[1][diry]
            local row = { lo = {}, frac = {}, band = {}, fo = {}, dk = {} }
            for ox = 1, draw_w do
                local dx = abs(ox - ocx) * cell_aspect
                local pos = dist(dx, dy) * nine_over_maxd
                if pos < 0 then pos = 0 elseif pos > 9 then pos = 9 end
                local lo = floor(pos)
                if lo > 8 then lo = 8 end
                row.lo[ox] = lo
                row.frac[ox] = pos - lo
                row.band[ox] = 1 + floor(pos + 0.5)
                if row.band[ox] < 1 then row.band[ox] = 1
                elseif row.band[ox] > 10 then row.band[ox] = 10 end
                if ox < ocx then
                    row.fo[ox] = fill_row
                    row.dk[ox] = 0 * 3 + (diry + 1)
                elseif ox > ocx then
                    row.fo[ox] = fill_rgt
                    row.dk[ox] = 2 * 3 + (diry + 1)
                else
                    row.fo[ox] = fill_mid
                    row.dk[ox] = 1 * 3 + (diry + 1)
                end
            end
            ring_cache[oy] = row
        end
        ring_cache_w = draw_w
        ring_cache_h = draw_h
        ring_cache_aspect = cfg_cell_aspect
        ring_cache_shape = shape_name
    end

    -- Rebuild source column map when draw_w changes.
    if sx_map == nil or sx_map_w ~= draw_w then
        sx_map = {}
        for ox = 1, draw_w do
            local sx = floor((ox - 0.5) * inv_dw) + 1
            if sx < 1 then sx = 1 elseif sx > art_w then sx = art_w end
            sx_map[ox] = sx
        end
        sx_map_w = draw_w
    end

    local out = {}
    for _ = 1, top_pad do out[#out + 1] = "" end

    for oy = 1, draw_h do
        -- map output row -> source row (nearest neighbor)
        local sy = floor((oy - 0.5) * inv_dh) + 1
        if sy < 1 then sy = 1 elseif sy > art_h then sy = art_h end
        local srow  = art_cells[sy]
        local scode = art_code[sy]

        -- Precomputed ring geometry for this row (avoids sqrt/distance per cell).
        local rd = ring_cache[oy]

        local parts = { pad_str }
        local np = 1                 -- track append index (avoid #parts per cell)
        local last_color = nil
        for ox = 1, draw_w do
            local sx = sx_map[ox]
            local ch = srow[sx] or " "

            if is_pass then
                np = np + 1; parts[np] = ch
            else
                local lvl, dlvl
                if do_blend then
                    local lo, frac = rd.lo[ox], rd.frac[ox]
                    lvl = effective[lo + 1] + (effective[lo + 2] - effective[lo + 1]) * frac
                    dlvl = bloom[lo + 1] + (bloom[lo + 2] - bloom[lo + 1]) * frac
                else
                    local band = rd.band[ox]
                    lvl = effective[band]
                    dlvl = bloom[band]
                end

                local color
                if is_mono then
                    color = cfg_mono_color
                else
                    color = glow_color(lvl, lvl >= cfg_overdrive)
                end

                -- bloom: thicken braille glyph (cached lookup). braille cells only.
                -- Fill order and dkey are precomputed in ring_cache.
                if do_bloom and scode then
                    local base_cp = scode[sx]
                    if base_cp then
                        ch = thicken(base_cp, dlvl, rd.fo[ox], rd.dk[ox])
                    end
                end

                if color ~= last_color then
                    np = np + 1; parts[np] = FG[color] or fg256(color)
                    last_color = color
                end
                np = np + 1; parts[np] = ch
            end
        end
        if not is_pass then
            np = np + 1; parts[np] = reset()
        end
        out[#out + 1] = table.concat(parts)
    end

    for _ = #out + 1, rows do out[#out + 1] = "" end

    -- Debug footer: show preset + theme on the last row.
    if cfg_debug and rows > 0 and last_shown_preset then
        local label = " [" .. last_shown_preset .. " + " .. cfg_theme_name .. "] "
        local lc = visible_cols(label)
        local pad = math.floor((cols - lc) / 2)
        if pad < 0 then pad = 0 end
        out[rows] = fg256(244) .. bg256(232) .. string.rep(" ", pad) .. label .. reset()
    end

    local result = table.concat(out, "\n")
    last_output = result
    last_rows = rows
    last_cols = cols
    return result
end
