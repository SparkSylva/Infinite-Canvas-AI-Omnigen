export interface StylePreset {
  id: string;
  name?: string;
  imageUrl?: string;
  prompt: string;
}
export type GenerationTypeItem = {
  id: string;        // unique
  label: string;
  tag?: string[];
  description?: string;
  prompt?: string;       // the prefix of the task of this type
  preset?: StylePreset[]; // the preset list of this type
};

// ========= IMAGE PRESETS =========

// 1) style: photography 
export const photoStylePreset: StylePreset[] = [
  { id: 'cinematic-photo', name: 'Cinematic Photo', prompt: 'Moody cinematic look with shallow depth, 50mm perspective, soft film grain, rich contrast, balanced highlights, natural color.' },
  { id: 'film-noir-bw', name: 'Film Noir B&W', prompt: 'High-contrast black-and-white noir, hard key at forty-five degrees, deep shadows, sharp silhouettes, smoky atmosphere, tense mood.' },
  { id: 'vintage-polaroid', name: 'Vintage Polaroid', prompt: 'Vintage Polaroid aesthetic with soft highlights, subtle vignette, pastel palette, gentle fade, creamy skin tones, nostalgic warmth.' },
  { id: 'editorial-minimal', name: 'Editorial Minimal', prompt: 'Minimal editorial composition, clean lines, generous negative space, neutral palette, precise geometry, restrained styling, gallery-ready sophistication.' },
  { id: 'street-documentary', name: 'Street Documentary', prompt: 'Authentic street documentary tone, natural light, candid framing, subtle grain, layered backgrounds, fleeting gestures, unposed realism, urban immediacy.' },
  { id: 'teal-orange', name: 'Teal & Orange', prompt: 'Teal-and-orange grading with warm skin, cool shadows, crisp microcontrast, cinematic pop, sunlit glow, contemporary blockbuster palette.' },
  { id: 'hdr-realism', name: 'HDR Realism', prompt: 'High-dynamic-range realism, balanced highlights, lifted shadows, micro-detail textures, neutral color, clean whites, natural contrast, lifelike clarity.' },
  { id: 'pastel-soft-glow', name: 'Pastel Soft Glow', prompt: 'Airy pastel atmosphere with soft glow, low contrast, dreamy highlights, delicate haze, gentle transitions, soothing romantic palette.' },
];

// 2) style: illustration
export const illustrationStylePreset: StylePreset[] = [
  { id: 'watercolor-soft', name: 'Watercolor Soft', prompt: 'Soft watercolor washes, feathered edges, textured paper grain, gentle bleeding, muted hues, calm atmosphere, hand-painted charm.' },
  { id: 'oil-impasto', name: 'Oil Impasto', prompt: 'Rich oil impasto with thick strokes, tactile ridges, warm pigments, glossy accents, dramatic lighting, museum-canvas presence.' },
  { id: 'ink-line', name: 'Ink Line', prompt: 'Crisp ink linework, flat graphic fills, disciplined hatching, bold contours, high readability, modern monochrome illustration style.' },
  { id: 'flat-vector', name: 'Flat Vector', prompt: 'Flat vector geometry, uniform fills, minimal shading, clean icons, playful proportions, brand-friendly clarity, bright accessible palette.' },
  { id: 'isometric-tech', name: 'Isometric Tech', prompt: 'Precision isometric diagramming, 30-degree guides, clean edges, modular components, labeled parts, tech schematic clarity, systematic organization.' },
  { id: 'blueprint', name: 'Blueprint', prompt: 'Classic blueprint aesthetics, white linework on cobalt grid, construction callouts, dimension arrows, technical drafting cadence, engineered minimalism.' },
  { id: 'children-book', name: 'Children\'s Book', prompt: 'Whimsical children’s book charm, rounded shapes, soft pastels, friendly faces, cozy scenes, gentle humor, bedtime storytelling warmth.' },
  { id: 'manga-tone', name: 'Manga Tone', prompt: 'Dynamic manga aesthetics, screentone shading, bold panels, speed lines, expressive faces, action emphasis, high-contrast storytelling rhythm.' },
];

// 3) style: 3D
export const threeDStylePreset: StylePreset[] = [
  { id: 'clay-3d', name: 'Clay 3D', prompt: 'Matte clay render with rounded edges, soft subsurface scattering, gentle occlusion, sculpted simplicity, studio lighting, tactile warmth.' },
  { id: 'low-poly', name: 'Low-Poly', prompt: 'Low-poly modeling, flat shading, visible facets, simplified volumes, playful minimalism, crisp silhouettes, game-ready aesthetic charm.' },
  { id: 'voxel', name: 'Voxel', prompt: 'Voxel art built from cubic blocks, orthographic feeling, chunky silhouettes, limited palette, retro charm, pixel-sculpted dimension.' },
  { id: 'plastic-toy', name: 'Plastic Toy', prompt: 'Glossy plastic toy surfaces, simple shaders, bright saturated colors, studio reflections, playful proportions, molded seams, cheerful presentation.' },
  { id: 'photoreal-raytraced', name: 'Photoreal Ray-Traced', prompt: 'Photoreal ray-traced rendering, crisp reflections, global illumination, accurate materials, soft shadows, fine detail, believable physical lighting.' },
  { id: 'neon-edge', name: 'Neon Edge', prompt: 'Dark base with neon rim lights, glowing edges, high contrast, reflective accents, cyber aesthetic, futuristic mood, graphic intensity.' },
];

// 4) style: animation
export const animePreset: StylePreset[] = [
  { id: '90s-anime', name: '90s Anime', prompt: 'Classic 90s anime styling, bold outlines, limited palette, halftone shading, simple backgrounds, heartfelt expressions, nostalgic Saturday-morning energy.' },
  { id: 'ghibli-style', name: 'Ghibli Style', prompt: 'Ghibli-inspired warmth, hand-painted textures, gentle natural light, pastoral palettes, cozy interiors, breezy skies, tender adventurous spirit.' },
  { id: 'disney-style', name: 'Disney Style', prompt: 'Polished Disney animation charm, expressive eyes, rounded shapes, smooth shading, vibrant colors, musical whimsy, family-friendly cinematic sparkle.' },
  { id: 'pixar-style', name: 'Pixar Style', prompt: 'Pixar-style stylized realism, supple subsurface skin, soft cinematic lighting, playful sincerity, meticulous detail, heartfelt storytelling atmosphere.' },
  { id: 'cartoon-style', name: 'Cartoon Style', prompt: 'Cheerful cartoon simplicity, thick outlines, flat colors, exaggerated proportions, bouncy timing feel, friendly humor, approachable character design.' },
];

// ✅ Lighting
export const lightPreset: StylePreset[] = [
  { id: 'softbox', name: 'Softbox Even', prompt: 'Front-left softbox around thirty-five degrees, medium-low intensity, wide diffuse spread, gentle wrap, clean highlights, flattering professional balance.' },
  { id: 'three-point', name: 'Three-Point', imageUrl: '/assets/create/relight/preset/lighting-options/three-point.webp', prompt: 'Balanced three-point setup: left key medium, right fill low, rear rim crisp; dimensional separation, natural faces, controlled reflections.' },
  { id: 'high-key', name: 'High Key', imageUrl: '/assets/create/relight/preset/lighting-options/high-key.webp', prompt: 'Bright high-key lighting, multi-source soft fill, high but diffused intensity, lifted shadows, airy atmosphere, gentle contrast, polished clarity.' },
  { id: 'low-key', name: 'Low Key', imageUrl: '/assets/create/relight/preset/lighting-options/low-key.webp', prompt: 'Hard key from right around fifty degrees, medium-high intensity, deep sculpted shadows, dramatic contrast, dark surround, defined highlights.' },
  { id: 'product-spot', name: 'Product Spotlight', imageUrl: '/assets/create/relight/preset/lighting-options/product-spot.webp', prompt: 'Tight overhead spotlight, concentrated center with rapid falloff, circular pool, surrounding darkness, theatrical focus, crisp edges, jewel-box emphasis.' },
  { id: 'color-gel', name: 'Color Gel Mix', imageUrl: '/assets/create/relight/preset/lighting-options/color-gel.webp', prompt: 'Magenta key from left, cyan fill from right, reflective accents, saturated highlights, playful chroma contrast, nightlife attitude, stylized pop.' },
  { id: 'reflective', name: 'Reflective Control', imageUrl: '/assets/create/relight/preset/lighting-options/reflective.webp', prompt: 'Large low-intensity front-left key, flagged control for speculars, gentle back-right kicker, polished highlights, smooth surfaces, premium product sheen.' },
  { id: 'ring-light', name: 'Ring Light', imageUrl: '/assets/create/relight/preset/lighting-options/ring-light.webp', prompt: 'Lens-centered ring light, medium intensity, even shadowless illumination, circular catchlights, flattering skin, beauty focus, direct symmetrical presentation.' },
  { id: 'golden-hour', name: 'Golden Hour', imageUrl: '/assets/create/relight/preset/lighting-options/golden-hour.webp', prompt: 'Warm low sun about fifteen degrees, medium intensity, elongated soft shadows, gentle haze, golden rims, outdoor glow, nostalgic radiance.' },
  { id: 'blue-hour', name: 'Blue Hour', imageUrl: '/assets/create/relight/preset/lighting-options/blue-hour.webp', prompt: 'Cool ambient skylight from above, low-medium intensity, soft contrast, subtle city glow, clean midtones, tranquil palette, evening calm.' },
  { id: 'backlit', name: 'Backlit Rim', imageUrl: '/assets/create/relight/preset/lighting-options/backlit.webp', prompt: 'Strong backlight slightly above horizon, medium-high intensity, crisp rim outline, faint frontal fill, gentle flare, luminous silhouette drama.' },
  { id: 'dappled', name: 'Dappled Sun', imageUrl: '/assets/create/relight/preset/lighting-options/dappled.webp', prompt: 'Sunlight filtered through leaves, medium key from above-right, irregular mottled shadows, organic highlights, summery texture, relaxed garden feeling.' },
  { id: 'overcast', name: 'Overcast Soft', imageUrl: '/assets/create/relight/preset/lighting-options/overcast.webp', prompt: 'Large sky-sized softbox effect, low-medium intensity, omnidirectional fill, diffuse shadows, neutral color, flattering skin, evenly balanced exposure.' },
  { id: 'dramatic', name: 'Dramatic Contrast', imageUrl: '/assets/create/relight/preset/lighting-options/dramatic.webp', prompt: 'Hard key from left about sixty degrees, medium-high intensity, steep falloff, selective highlights, bold contrast, cinematic sculpted mood.' },
  { id: 'neon', name: 'Neon Mix', imageUrl: '/assets/create/relight/preset/lighting-options/neon.webp', prompt: 'Cyan wash from right, magenta from left, reflective surfaces catching color, saturated reflections, nightlife vibe, vibrant urban energy.' },
  { id: 'candlelight', name: 'Candlelight', imageUrl: '/assets/create/relight/preset/lighting-options/candlelight.webp', prompt: 'Warm candlelike point source below front, low intensity, rapid falloff, gentle flicker, intimate shadows, amber highlights, cozy atmosphere.' }
];

// ✅ Backgrounds
export const backgroundPreset: StylePreset[] = [
  { id: 'white', name: 'Studio White', imageUrl: '/assets/create/relight/preset/background-options/white.webp', prompt: 'Pure seamless white sweep, soft floor gradient, shadow-free clarity, clinical cleanliness, product-ready minimalism, bright neutral professional backdrop.' },
  { id: 'gradient', name: 'Smooth Gradient', imageUrl: '/assets/create/relight/preset/background-options/gradient.webp', prompt: 'Smooth tonal gradient, subtle color transition, gentle vignetting, added depth, elegant simplicity, unobtrusive background supporting primary subject.' },
  { id: 'studio', name: 'Pro Studio', imageUrl: '/assets/create/relight/preset/background-options/studio.webp', prompt: 'Neutral studio environment, controlled walls, uncluttered floor, light-friendly surfaces, tidy corners, professional control, versatile production space.' },
  { id: 'wooden', name: 'Wood Surface', imageUrl: '/assets/create/relight/preset/background-options/wooden.webp', prompt: 'Warm wooden tabletop, visible grain texture, handcrafted tone, artisanal feel, cozy color, natural imperfections, rustic culinary presentation.' },
  { id: 'marble', name: 'Marble Slab', imageUrl: '/assets/create/relight/preset/background-options/marble.webp', prompt: 'Polished marble slab, elegant veining, cool luxury, reflective sheen, refined minimalism, premium product staging, timeless editorial sophistication.' },
  { id: 'colorblock', name: 'Color Block', imageUrl: '/assets/create/relight/preset/background-options/colorblock.webp', prompt: 'Bold solid color field, saturated tone, modern minimal composition, graphic punch, strong separation, brand-forward clarity, contemporary vibe.' },
  { id: 'textured', name: 'Subtle Texture', imageUrl: '/assets/create/relight/preset/background-options/textured.webp', prompt: 'Fine textured backdrop with subtle pattern, adds interest, maintains simplicity, gentle variation, tasteful depth, photography-friendly surface.' },
  { id: 'geometric', name: 'Geometric Pattern', imageUrl: '/assets/create/relight/preset/background-options/geometric.webp', prompt: 'Clean geometric patterning, contemporary shapes, rhythmic repetition, modern design accent, crisp lines, visual structure supporting focused subjects.' },
  { id: 'urban', name: 'Urban City', imageUrl: '/assets/create/relight/preset/background-options/urban.webp', prompt: 'Suggestive urban cityscape, architectural lines, distant glass reflections, implied traffic glow, energetic atmosphere, contemporary metropolitan backdrop.' },
  { id: 'nature', name: 'Nature Set', imageUrl: '/assets/create/relight/preset/background-options/nature.webp', prompt: 'Lush natural setting, greenery layers, soft ambient light, organic textures, tranquil mood, gentle depth, restorative outdoor atmosphere.' },
  { id: 'beach', name: 'Coastal Beach', imageUrl: '/assets/create/relight/preset/background-options/beach.webp', prompt: 'Sandy shoreline with gentle waves, bright horizon, airy sunlight, coastal breeze suggestion, relaxed vacation mood, summery openness.' },
  { id: 'forest', name: 'Forest Fog', imageUrl: '/assets/create/relight/preset/background-options/forest.webp', prompt: 'Backlit forest clearing, thin mist, rays through branches, damp ground texture, serene atmosphere, emerald tones, contemplative woodland calm.' },
  { id: 'mountain', name: 'Mountain View', imageUrl: '/assets/create/relight/preset/background-options/mountain.webp', prompt: 'Dramatic mountain vista, distant ridgelines, crisp air haze, layered depth, alpine grandeur, panoramic scale, inspiring outdoor perspective.' },
  { id: 'cafe', name: 'Cozy Café', imageUrl: '/assets/create/relight/preset/background-options/cafe.webp', prompt: 'Warm café interior, window reflections, wood and ceramic textures, intimate seating, cozy light, lived-in ambience, lifestyle storytelling.' },
  { id: 'loft', name: 'Industrial Loft', imageUrl: '/assets/create/relight/preset/background-options/loft.webp', prompt: 'Industrial loft character, exposed brick, broad factory windows, steel details, soft daylight spill, urban chic, creative workspace energy.' },
  { id: 'abstract', name: 'Abstract Art', imageUrl: '/assets/create/relight/preset/background-options/abstract.webp', prompt: 'Expressive abstract backdrop, painterly gestures, layered textures, artistic motion, color interplay, evocative mood, dynamic nonliteral environment.' }
];

// 7) Relight + Background (paired for realistic consistency)
export const relightAndBgChangePreset: StylePreset[] = [
  // ===== Portrait =====
  {
    id: 'portrait-goldenhour-beach',
    name: 'Portrait · Golden Hour Beach',
    imageUrl: '/assets/create/relight/preset/lighting-options/golden-hour.webp',
    prompt: 'Warm low sun fifteen degrees left, long soft shadows, gentle haze; open sunset beach, orange horizon, soft waves, flattering skin.'
  },
  {
    id: 'portrait-window-minimalinterior',
    name: 'Portrait · Window Light Minimal Interior',
    imageUrl: '/assets/create/relight/preset/lighting-options/overcast.webp',
    prompt: 'Side window light forty-five degrees with soft falloff, subtle rim; minimal white kitchen background, clean lines, daylight ambience, neutral balance.'
  },
  {
    id: 'portrait-bluehour-rooftop',
    name: 'Portrait · Blue Hour Rooftop',
    imageUrl: '/assets/create/relight/preset/lighting-options/blue-hour.webp',
    prompt: 'Cool ambient sky fill, low contrast, calm reflections; rooftop at dusk, city skyline silhouettes, light haze, smooth skin, delicate catchlights.'
  },
  {
    id: 'portrait-noir-topspot-charcoal',
    name: 'Portrait · Noir Top-Spot on Charcoal',
    imageUrl: '/assets/create/relight/preset/lighting-options/product-spot.webp',
    prompt: 'Overhead spotlight with tight beam, dramatic falloff, high contrast; charcoal gradient background, gentle vignette, crisp edges, classic cinematic noir.'
  },
  {
    id: 'portrait-neon-alleymix',
    name: 'Portrait · Neon Alley Mix',
    imageUrl: '/assets/create/relight/preset/lighting-options/neon.webp',
    prompt: 'Magenta key left, cyan fill right, mild flare; neon signage alley background, wet pavement reflections, saturated highlights, preserved natural detail.'
  },

  // ===== E-commerce / Product =====
  {
    id: 'product-softbox-studiowhite',
    name: 'Product · Softbox on Studio White',
    imageUrl: '/assets/create/relight/preset/lighting-options/softbox.webp',
    prompt: 'Diffuse top softbox, even exposure, gentle gradients; seamless studio white sweep background, clean catalog aesthetic, accurate color, minimal reflections.'
  },
  {
    id: 'product-luxury-spot-pedestal',
    name: 'Product · Luxury Spotlight on Pedestal',
    prompt: 'Key spotlight with tight beam, subtle rim separation, controlled speculars; museum pedestal background in darkness, deep contrast, polished highlights.'
  },
  {
    id: 'product-tech-neonalley',
    name: 'Product · Tech Neon Alley',
    prompt: 'Magenta key, cyan fill shaping glossy surfaces; neon alley background, wet pavement reflections, saturated accents, crisp silhouette, futuristic mood.'
  },
  {
    id: 'product-topdown-deskflatlay',
    name: 'Product · Top-Down Desk Flatlay',
    prompt: 'Top-down product view, soft overhead key, gentle bounce; tidy wooden desk flatlay, neat props, clean spacing, natural texture, editorial feel.'
  },
  {
    id: 'product-translucent-backlight-glass',
    name: 'Product · Translucent Backlight (Glass/Beverage)',
    prompt: 'Strong backlight revealing liquid density and gradients, subtle front fill for label clarity; café window, soft interior bokeh, refreshing mood.'
  },

  // ===== Food & Beverage =====
  {
    id: 'food-window-kitchendaylight',
    name: 'Food · Window Daylight in Minimal Kitchen',
    prompt: 'Side window daylight at forty-five degrees, soft falloff and appetizing highlights; minimal kitchen background, warm wooden shelves, fresh editorial styling.'
  },
  {
    id: 'food-overcast-concrete',
    name: 'Food · Overcast on Concrete',
    prompt: 'Diffuse overcast top light, shadowless balance; raw concrete surface background with subtle texture, rustic artisanal vibe, true ingredient color.'
  },

  // ===== Fashion / People Full-Body =====
  {
    id: 'fashion-rim-duskrooftop',
    name: 'Fashion · Rim Light at Dusk Rooftop',
    prompt: 'Strong back rim with soft front fill, flowing fabric catching breeze; dusk rooftop background, blue sky, city haze, elongated silhouettes.'
  },
  {
    id: 'fashion-goldenhour-urbanstreet',
    name: 'Fashion · Golden Hour Urban Street',
    prompt: 'Warm low sun from camera left, long soft shadows; urban street background with gentle bokeh, glow, vibrant color, cinematic style.'
  },

  // ===== Jewelry / Cosmetics =====
  {
    id: 'jewelry-spot-charcoalgradient',
    name: 'Jewelry · Specular Spot on Charcoal',
    prompt: 'Narrow key with controlled speculars, soft rim separation; deep charcoal gradient background, gentle vignette, crisp micro-contrast, gemstone brilliance.'
  },
  {
    id: 'cosmetics-pastelgradient-threepoint',
    name: 'Cosmetics · Pastel Gradient Three-Point',
    prompt: 'Soft key, gentle fill, clean rim; cosmetics arranged on smooth pastel gradient background, velvety highlights, minimal glare, premium beauty presentation.'
  },

  // ===== Automotive / Large Object =====
  {
    id: 'auto-neon-rim-alley',
    name: 'Automotive · Neon Rim in Alley',
    prompt: 'Strong rim with soft frontal fill on reflective bodywork; neon alley background, wet ground reflections, saturated highlights, dramatic silhouette.'
  },

  // ===== Pets / Lifestyle =====
  {
    id: 'pet-morning-homedaylight',
    name: 'Pet · Morning Home Daylight',
    prompt: 'Bright morning light with long gentle shadows, cool crisp air; minimal interior background, cozy mood, soft fur detail, natural color.'
  },

  // ===== Art / Mood Pieces =====
  {
    id: 'art-candle-concrete',
    name: 'Art · Candlelight on Concrete',
    prompt: 'Warm candlelike point source with fast falloff and soft flicker; raw concrete wall background, rich shadows, intimate atmosphere, painterly warmth.'
  },

  // ===== Corporate / Utility Headshot =====
  {
    id: 'headshot-softbox-studiowhite',
    name: 'Headshot · Softbox on Studio White',
    prompt: 'Large frontal softbox key with gentle fill, minimal shadow; seamless studio white background, neutral balance, corporate clarity, crisp facial detail.'
  },

  // ===== Editorial / Grit =====
  {
    id: 'editorial-threepoint-concrete',
    name: 'Editorial · Three-Point on Concrete',
    prompt: 'Key at forty-five degrees, soft fill, subtle rim; scuffed concrete wall background with side texture, medium contrast, magazine portrait energy.'
  }
];

// ========= VIDEO PRESETS =========

// 1) camera movement (narrative, no duration)
export const cameraMovePreset: StylePreset[] = [
  { id: 'cam-dollyin-24mm-5s', name: 'Dolly-In (24mm, 5s)', prompt: 'Slow dolly in with 24mm perspective, steady approach, settle just before subject, gentle perspective compression.' },
  { id: 'cam-dollyout-reveal', name: 'Dolly-Out Reveal', prompt: 'Start close, dolly outward to a composed wide reveal, maintain horizon stability, progressively unveil surrounding environment.' },
  { id: 'cam-orbit-clockwise-10s', name: 'Orbit CW 180° (10s)', prompt: 'Shoulder-level clockwise orbit, smooth constant speed, maintain subject framing, background parallax emphasizes depth, elegant circular movement.' },
  { id: 'cam-slider-lr-3s', name: 'Slider L→R (3s)', prompt: 'Subtle slider move left to right across subject, stable horizon, foreground elements create parallax, measured lateral pacing.' },
  { id: 'cam-craneup-reveal', name: 'Crane Up Reveal', prompt: 'Rise from waist level to overhead, expanding context, reveal spatial layout, graceful vertical arc, maintain smooth acceleration and deceleration.' },
  { id: 'cam-tilt-down-detail', name: 'Tilt Down Detail', prompt: 'Tilt downward from face to hands, controlled pace, hold detail precisely, keep focus consistent, intimate emphasis on gesture.' },
  { id: 'cam-whippan-transition', name: 'Whip Pan Transition', prompt: 'Fast whip pan to the right, intentional motion blur mid-move, cut on the blur peak for transition.' },
  { id: 'cam-rackfocus-2s', name: 'Rack Focus (2s)', prompt: 'Shift focus from foreground element to subject, linear pull, smooth breathing control, decisive landing on eyes.' },
  { id: 'cam-topdown-static', name: 'Top-Down Static', prompt: 'Locked ninety-degree overhead view, stable frame, orthographic feel, arranged composition reads clearly, graphic order emphasized.' },
  { id: 'cam-pov-walkthrough', name: 'POV Walkthrough', prompt: 'Forward POV at walking cadence, subtle handheld sway, natural footsteps implied, exploratory movement through space.' },
  { id: 'cam-parallax-fg', name: 'Parallax Foreground', prompt: 'Place near foreground for parallax; track laterally right; maintain subject mid-frame; layered depth increases dimensional interest.' },
  { id: 'cam-crashzoom-1s', name: 'Crash Zoom (1s)', prompt: 'Rapid crash zoom inward, dramatic emphasis, brief settle on target, retain compositional balance, energetic punctuation.' },
  { id: 'cam-dutch-roll-10deg', name: 'Dutch Angle Roll', prompt: 'Dutch tilt around ten degrees, slow corrective roll to level, unsettling start resolving into composed equilibrium.' },
  { id: 'cam-handheld-push', name: 'Handheld Push-In', prompt: 'Controlled handheld push-in, micro-jitter texture, breathing motion, close on logo, intimate proximity without losing framing discipline.' },
];

// 2) human action (narrative, no duration)
export const humanActionPreset: StylePreset[] = [
  { id: 'act-kiss-forehead', name: 'Forehead Kiss', prompt: 'Soft forehead kiss, eyes gently closed, relaxed breath, tender contact, lingering closeness, comforting warmth between partners.' },
  { id: 'act-hug-tight', name: 'Tight Hug', prompt: 'Close embrace, bodies align, slight sway, shoulders relax, deep exhale, reassuring pressure, shared stillness, affectionate security.' },
  { id: 'act-speech-openpalms', name: 'Speech Open-Palms', prompt: 'Deliver a short line, open palms at chest, measured cadence, steady eye contact, single nod emphasizing sincerity.' },
  { id: 'act-model-turn-pose', name: 'Model Turn & Pose', prompt: 'Walk three steps forward, pivot on left foot, settle into three-quarter pose, chin slightly raised, confident posture.' },
  { id: 'act-cry-subtle', name: 'Subtle Cry', prompt: 'Tears gather, shoulders quiver slightly, gaze lowers, hand brushes cheek, restrained emotion, vulnerable presence, quiet heartbreak.' },
  { id: 'act-laugh-headback', name: 'Laugh Head-Back', prompt: 'Sudden laughter, head tilts back, eyes brighten, hand taps chest once, buoyant energy, spontaneous joy.' },
  { id: 'act-type-lookup', name: 'Type & Look-Up', prompt: 'Rapid typing rhythm, brief glance toward camera, small confident smile, return to keys, focused productivity continues.' },
  { id: 'act-phone-pace', name: 'Call & Pace', prompt: 'Phone at ear, relaxed pacing, free hand gesturing lightly, nods during listening, conversational flow, calm engagement.' },
  { id: 'act-walktalk-side', name: 'Walk-and-Talk', prompt: 'Side-by-side walking, heads turn to speak, coordinated pace, occasional hand gesture, easy rapport, fluid conversation.' },
  { id: 'act-point-screen', name: 'Point Screen', prompt: 'Point deliberately to four corners in sequence, pause at center, confident presentation stance, clear instructional intent.' },
  { id: 'act-bag-showcase', name: 'Bag Showcase', prompt: 'Raise bag to chest height, rotate slowly one-eighty degrees, display zipper action smoothly, attentive showroom poise.' },
  { id: 'act-drink-sip', name: 'Sip & Pause', prompt: 'Take a slow sip, eyes relax, soft exhale, set cup down gently, appreciative expression, quiet satisfaction.' },
  { id: 'act-chef-sprinkle', name: 'Chef Sprinkle', prompt: 'Sprinkle herbs from roughly thirty centimeters, graceful wrist motion, aromatic flourish, centered finish, appetizing presentation.' },
  { id: 'act-athlete-stretch', name: 'Athlete Stretch', prompt: 'Quad stretch each leg, steady balance, measured breathing, shake arms loose twice, ready posture, composed athletic focus.' },
  { id: 'act-window-gaze', name: 'Window Gaze', prompt: 'Hands in pockets, gaze toward window, weight shifts subtly, reflective mood, relaxed stance, thoughtful calm presence.' },
  { id: 'act-surprised-stepback', name: 'Surprised Step-Back', prompt: 'Quiet gasp, eyebrows lift, half step backward, hand rises to mouth, heightened alertness, spontaneous startled reaction.' },
];

// 3) product video (narrative, no duration, no fps)
export const productVideoPreset: StylePreset[] = [
  { id: 'prod-turntable-360', name: 'Turntable 360°', prompt: 'Rotating turntable completes a full circle; locked camera; macro inserts at telephoto; light bar sweeps to sculpt highlights.' },
  { id: 'prod-dollyin-lightshift', name: 'Dolly-In + Light Shift', prompt: 'Slow dolly toward logo, texture gradually emerging as key light shifts from cool white to warm sunlight.' },
  { id: 'prod-topdown-unbox', name: 'Top-Down Unbox', prompt: 'Ninety-degree overhead unboxing; stepwise reveal of components; occasional close-ups; softbox at forty-five with gentle bounce fill.' },
  { id: 'prod-hero-backlight-haze', name: 'Hero Backlight + Haze', prompt: 'Side-to-side slider across hero; thin atmospheric haze; strong backlight rim defines form; settle centered for dramatic emphasis.' },
  { id: 'prod-splash-reveal', name: 'Liquid Splash Reveal', prompt: 'Locked composition captures liquid pour; bright backlight through fluid; brief strobe-like flicker freezes droplets, crisp sparkling reveal.' },
  { id: 'prod-callouts-track', name: 'Orbit + Callouts', prompt: 'Half-orbit at steady speed; graphical callouts track features; neutral daylight balance; clean background; informative yet cinematic presentation.' },
  { id: 'prod-jewelry-glint', name: 'Jewelry Glint', prompt: 'Macro telephoto frames jewelry; tiny incremental rotations; narrow light sweeps create traveling sparkle, prismatic fire across facets.' },
  { id: 'prod-footwear-runby', name: 'Footwear Run-by', prompt: 'Low-angle tracking left to right; runner passes; natural daylight; conclude on static sole close-up revealing tread detail.' },
  { id: 'prod-skincare-smear', name: 'Skincare Smear', prompt: 'Macro top-down framing; slow dolly; controlled smear of product; cool daylight progressively warms toward flattering vanity tone.' },
  { id: 'prod-ports-rackfocus', name: 'Ports Rack-Focus', prompt: 'Macro focus pull travels across ports; subtle tilt; cool rim light separates edges; endpoints clearly defined for readability.' },
  { id: 'prod-exploded-assembly', name: 'Exploded + Assembly', prompt: 'Begin assembled hero, sudden crash-zoom impact; components explode outward then reassemble; constant warm tungsten feel, cohesive mechanical clarity.' },
  { id: 'prod-stopmotion-loop', name: 'Stop-Motion Loop', prompt: 'Locked overhead stop-motion; object advances per frame in playful steps; neutral lighting; seamless looping cadence suggests perpetual motion.' },
];


export const imageEditPreset: StylePreset[] = [


  // === hairstyle / makeup change ===
  {
    id: 'image-edit-hairstyle-replace',
    name: 'Hairstyle Replace',
    prompt:
      'In image, keep the same identity, pose, and framing. Change hairstyle to {hairstyle} at {length}; keep natural hairline; maintain original hair color unless specified as {hairColor}. Preserve skin texture and expression.'
  },
  {
    id: 'image-edit-haircolor',
    name: 'Hair Color Change',
    prompt:
      'In image, keep identity and hairstyle shape. Change hair color to {hairColor} with realistic tone, roots, and reflections; no changes to face or makeup; match scene lighting.'
  },
  {
    id: 'image-edit-makeup-refresh',
    name: 'Natural Makeup Refresh',
    prompt:
      'In image, preserve identity and expression. Add natural makeup: soft skin balance, subtle blush, defined brows, {lipColor} lips, and gentle eye highlight; no change to hairstyle, outfit, or framing.'
  },

  // === view / composition (caution to change, emphasize not to pull the facial geometry) ===
  {
    id: 'image-edit-view-3q-left',
    name: 'Rotate to 3/4 Left View',
    prompt:
      'For the person in image, keep identity and core facial geometry. Adjust camera view to a subtle 3/4 left angle while preserving proportions; maintain same lens feel; keep background coherence; avoid warping.'
  },
  {
    id: 'image-edit-profile-right',
    name: 'Profile Right View',
    prompt:
      'Transform image to a clean right-profile portrait. Maintain identity, keep hairstyle continuity and ear/neck details; simple studio backdrop; consistent exposure; no pose changes besides the profile turn.'
  },

  // === background change / scene migration ===
  {
    id: 'image-edit-bg-studio-white',
    name: 'Background → Pure Studio White',
    prompt:
      'Replace image background with seamless studio white (slight floor gradient). Keep subject identity, edge fidelity, and shadows; keep outfit colors and exposure unchanged; catalog-ready look.'
  },
  {
    id: 'image-edit-bg-lifestyle',
    name: 'Background → Lifestyle Scene',
    prompt:
      'Move the subject from image into a {scene} lifestyle background (e.g., sunlit living room, street café). Maintain identity, scale, and lighting direction; add context props subtly; avoid altering pose.'
  },

  // === lighting reset / relight ===
  {
    id: 'image-edit-relight-softbox',
    name: 'Relight: Softbox Key + Gentle Fill',
    prompt:
      'Relight image with a soft key at 45° and gentle fill from the opposite side; soft shadows, realistic skin specular highlights, no change to identity or composition.'
  },
  {
    id: 'image-edit-relight-golden-hour',
    name: 'Relight: Golden Hour',
    prompt:
      'Apply warm low-angle golden-hour lighting to image; long soft shadows and subtle rim light; preserve identity, colors, and camera framing.'
  },

  // === product photography / e-commerce (model+product / pure product) ===
  {
    id: 'image-edit-product-on-model',
    name: 'Product-on-Model Composite',
    prompt:
      'Use Image 1 as the reference product and image as the model. Place the product correctly on the model with accurate scale, perspective, and shadows; preserve the model’s identity and pose; match materials and brand color exactly.'
  },
  {
    id: 'image-edit-product-clean-catalog',
    name: 'Clean Catalog Packshot',
    prompt:
      'From image, isolate the product onto a white e-commerce background with soft floor shadow; keep true color and material; remove logos or dust if not essential; maintain consistent angle for catalog series.'
  },
  {
    id: 'image-edit-product-colorways',
    name: 'Brand Color Variants',
    prompt:
      'For the product in image, generate {colorwayList} color variants. Keep materials and reflections unchanged; identical angle and framing for all variants; precise brand color matching.'
  },
  // === interior design / furniture virtual staging ===
  {
    id: 'image-edit-furniture-staging',
    name: 'Virtual Furniture Staging',
    prompt:
      'In image, keep the room architecture, walls, floor, and windows unchanged. Replace empty space with {furnitureStyle} furniture set (e.g., modern Scandinavian sofa, coffee table, bookshelf). Ensure correct scale, perspective, and natural shadows; integrate realistically into the room.'
  },
  {
    id: 'image-edit-style-redesign',
    name: 'Interior Style Redesign',
    prompt:
      'Redesign the interior of image to match {interiorStyle} (e.g., minimalism, industrial loft, Japanese Zen). Preserve room layout and dimensions; swap furniture, décor, and color palette accordingly; keep consistent lighting direction and reflections.'
  },
  {
    id: 'image-edit-furniture-tryon',
    name: 'Furniture Try-On (Image 1 → Room)',
    prompt:
      'Use the furniture from Image 1 and place it into the room from image 2. Match scale, angle, and floor shadows precisely; preserve room structure and lighting; ensure the furniture fits naturally without distorting perspective.'
  },
  {
    id: 'image-edit-lighting-mood',
    name: 'Interior Lighting Mood Change',
    prompt:
      'Relight image interior with {lightingStyle} (e.g., warm evening lamp glow, bright noon daylight, moody blue ambient). Keep the same room layout and furniture; adjust shadows and reflections to match the new light source.'
  },
  {
    id: 'image-edit-room-colorway',
    name: 'Room Color Variants',
    prompt:
      'From image, generate multiple colorway variants for the walls, floor, and furniture upholstery ({colorwayList}). Keep the same furniture shapes, room structure, and perspective; realistic material texture preservation.'
  },
  {
    id: 'image-edit-realestate-staging',
    name: 'Real Estate Empty → Furnished',
    prompt:
      'Stage the empty room in image with tasteful {furnitureStyle} furnishing, including sofa, dining set, rug, and décor. Ensure realism in scale, shadows, and reflections; maintain the original flooring, windows, and architecture unchanged.'
  },
  // === multiple image synthesis / style transfer ===
  {
    id: 'image-edit-style-transfer',
    name: 'Style Transfer (Image 1 → image)',
    prompt:
      'Apply the visual style from Image 1 to image 2: palette, texture, and rendering character; preserve the subject’s identity and composition from image 2; keep proportions and facial geometry stable.'
  },
  {
    id: 'image-edit-scene-blend',
    name: 'Blend Two Photos into One Scene',
    prompt:
      'Combine Image 1 and image into a single coherent scene. Harmonize lighting and perspective; maintain identities and object details; add realistic contact shadows and exposure balance.'
  },

  // === image repair / cleaning ===
  {
    id: 'image-edit-clean-retouch',
    name: 'Clean Retouch (No Identity Change)',
    prompt:
      'Retouch image: remove dust/scratches, fix minor blemishes, reduce harsh noise; maintain pores and natural texture; strictly no identity, shape, or age change.'
  },
  {
    id: 'image-edit-remove-object',
    name: 'Remove Unwanted Object',
    prompt:
      'From image, remove {object}; reconstruct the background realistically with matching patterns, perspective, and lighting; keep subject identity and edges intact.'
  },

  // === headshot / professional image (multiple scenes consistent素材） ===
  {
    id: 'image-edit-pro-headshot',
    name: 'Professional Headshot Set',
    prompt:
      'From image, produce a professional headshot look: neutral studio background, soft three-point light, crisp eyes, natural skin. Keep identity exact; crop to {aspectRatio}; wardrobe minor cleanup only.'
  },
  {
    id: 'image-edit-social-pfp-styles',
    name: 'Social Profile Picture Styles',
    prompt:
      'From image, generate stylized profile variations: {stylesList} (e.g., flat illustration, anime, 3D). Keep identity/features consistent; center composition; clean background per style.'
  },

  // === scene expansion / unify aspect ratio ===
  {
    id: 'image-edit-outpaint',
    name: 'Outpainting (Scene Expansion)',
    prompt:
      'Expand image outward to {aspectRatio}. Extend environment coherently with matching perspective and lighting; preserve subject identity and original composition balance.'
  },
  {
    id: 'image-edit-ratio-unify',
    name: 'Unify Aspect Ratio for Series',
    prompt:
      'Recompose image to {aspectRatio} while preserving subject identity and key content. Add or crop background minimally to maintain brand-consistent framing.'
  },

  // === clothing sub-category / hairstyle try-on (commercial commonly used) ===
  {
    id: 'image-edit-try-on-top',
    name: 'Try-On: Tops Only',
    prompt:
      'Apply the top garment from Image 1 to the person in image 2. Keep identity and pose; realistic fabric fit and sleeve length; align collar and shoulder seams with proper shadows.'
  },
  {
    id: 'image-edit-try-on-shoes',
    name: 'Try-On: Shoes Only',
    prompt:
      'Apply the shoes from Image 1 onto the person in image 2 with correct foot orientation and ground contact shadows; keep identity, stance, and outfit unchanged.'
  }
];










export const baseGenerationTypeSettings: Record<string, any[]> = {

  "default": [
    {
      id: "default",
      label: "Default",
      description: "Not set any add prompt",
      prompt: "",
      preset: []
    }
  ],

};


// ========= PROMPT LIBRARY SETTINGS（示例合并） =========

export const promptLibrarySettings: Record<string, any[]> = {
  "nano banana image edit": [
    {
      id: 'what-ai-edit-cando',
      label: 'What AI Edit Can Do',
      description: 'What AI Edit Can Do With Your Image',
      prompt: '',
      preset: imageEditPreset,
    },
  ],
  'Image Style': [
    {
      id: 'Anime',
      label: 'Anime',
      description: 'Anime stylization presets',
      prompt: '',
      preset: animePreset,
    },
    {
      id: 'Photography-Styles',
      label: 'Photography Styles',
      description: 'Cinematic, editorial, documentary looks',
      prompt: 'Style:',
      preset: photoStylePreset,
    },
    {
      id: 'Illustration-Styles',
      label: 'Illustration Styles',
      description: 'Vector, watercolor, manga, blueprint',
      prompt: 'Style:',
      preset: illustrationStylePreset,
    },
    {
      id: '3D-Styles',
      label: '3D Styles',
      description: 'Clay, low-poly, voxel, photoreal',
      prompt: 'Style:',
      preset: threeDStylePreset,
    },
  ],

  'Image Relight': [
    {
      id: 'Lighting-Design',
      label: 'Lighting Design',
      description: 'Lighting conditions and atmosphere',
      prompt: 'change the lighting of the image.',
      preset: lightPreset,
    },
  ],

  'Image Background': [
    {
      id: 'Background-Scenes',
      label: 'Background Scenes',
      description: 'Concrete environments / backdrops',
      prompt: 'Background:',
      preset: backgroundPreset,
    },
  ],

  'Video Camera': [
    {
      id: 'Classic-Camera-Moves',
      label: 'Classic Camera Moves',
      description: 'Dolly, orbit, crane, rack focus, whip pan',
      prompt: 'camera move:',
      preset: cameraMovePreset,
    },
  ],

  'Video Motion': [
    {
      id: 'Human-Actions',
      label: 'Human Actions',
      description: 'Specific performer micro-actions',
      prompt: 'action:',
      preset: humanActionPreset,
    },
  ],

  'Video Product': [
    {
      id: 'product-video-recipes',
      label: 'Product Video Recipes',
      description: 'Camera moves with optional light changes',
      prompt: 'Recipe:',
      preset: productVideoPreset,
    },
  ],

};




