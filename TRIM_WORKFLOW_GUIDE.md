# Video Trim & Compress Workflow Implementation Guide

## Overview
A complete client-side video trimming and compression workflow has been added to your running gait analysis app. Users can now clip 2-3 strides (~6-12 seconds, max 10s) and compress videos before analysis using ffmpeg.wasm in the browser.

## New Routes

### `/trim` - Video Trim & Compress Page
- **Purpose**: Allow users to select, trim, and compress video clips before analysis
- **Auth Required**: Yes (redirects to home if not logged in)
- **Credits Cost**: 5 credits per analysis submission

## New Components

### 1. `components/trim/video-trim-editor.tsx`
Main editor component with:
- Drag & drop video upload (max 500MB)
- Video player with playback controls
- Timeline range selector for in/out points
- Compression preset selector (Fast 720p / Small 540p / Cut Only)
- Real-time duration validation (max 10s)
- Progress indicator during compression
- Preview of compressed clip
- Submit button to create analysis

### 2. `components/trim/timeline-range.tsx`
Interactive timeline with:
- Draggable start/end markers
- Visual range selection
- Click-and-drag to move entire selection
- Time display at both ends
- Duration display in the middle

### 3. `lib/ffmpeg-client.ts`
FFmpeg.wasm integration utilities:
- `loadFFmpeg()`: Lazy-loads FFmpeg from CDN
- `trimAndTranscode()`: Trims and compresses video
- `estimateOutputSize()`: Calculates estimated file size
- `formatDuration()`: Formats seconds to mm:ss.ms
- `formatFileSize()`: Formats bytes to human-readable size

## Compression Presets

### Fast (720p, ~2 Mbps)
\`\`\`
-vf scale=-2:720 -r 30 -c:v libx264 -crf 23 -preset veryfast -c:a aac -b:a 128k
\`\`\`
Best quality, larger file size

### Small (540p, ~1 Mbps)
\`\`\`
-vf scale=-2:540 -r 30 -c:v libx264 -crf 28 -preset veryfast -c:a aac -b:a 96k
\`\`\`
Balanced quality/size, faster upload

### Cut Only
\`\`\`
-c copy
\`\`\`
Just trim, no re-encoding (fastest, but less compatible)

## User Flow

1. **Entry Points**:
   - Home page: "上傳影片" button
   - App header: "Upload Video" button (when logged in)
   - Both route to `/trim` if user is logged in

2. **Upload & Trim**:
   - User uploads video file
   - System extracts duration and sets default 10s range
   - User adjusts in/out points using:
     - Draggable timeline markers
     - "Set In" / "Set Out" buttons (use current playback time)
     - Manual adjustment by clicking timeline

3. **Compression**:
   - User selects preset (Fast 720p is default)
   - Clicks "開始壓縮" (Start Compress)
   - Progress bar shows transcoding progress
   - Compressed preview is shown when complete

4. **Submission**:
   - User clicks "送交分析" (Submit Analysis)
   - System consumes 5 credits
   - Redirects to `/analyze` page with analysis

## Validation & Constraints

### File Size Limits
- Input: Max 500MB (shows error if exceeded)
- Output: Varies by preset (~1-2 MB per second of video)

### Duration Limits
- Maximum clip length: 10 seconds
- Recommended: 6-12 seconds (2-3 strides)
- Submit button disabled if > 10s

### FFmpeg Availability
- Loads ffmpeg.wasm from CDN on page load
- Shows fallback message if browser doesn't support
- Gracefully handles loading failures

## Internationalization (i18n)

All new strings are available in both Chinese and English:

### Chinese (zh)
- `trimTitle`: "選擇剪輯片段（建議 2–3 個 stride，約 6–12 秒）"
- `clipHint1`: "請在「穩定速度」下擷取片段，避免加速、減速或休息畫面。"
- `presetFast`: "快速：720p，~2 Mbps"
- ...and 20+ more trim-specific translations

### English (en)
- `trimTitle`: "Select a Clip (2–3 strides recommended, ~6-12s)"
- `clipHint1`: "Select a steady-speed segment; avoid acceleration, deceleration or rest."
- `presetFast`: "Fast: 720p ~2 Mbps"
- ...matching translations

## Technical Implementation

### FFmpeg.wasm Integration
\`\`\`typescript
// Loads from unpkg CDN
const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"
await ffmpeg.load({
  coreURL: `${baseURL}/ffmpeg-core.js`,
  wasmURL: `${baseURL}/ffmpeg-core.wasm`,
})
\`\`\`

### Trim Command Structure
\`\`\`bash
ffmpeg -i input.mp4 -ss {start} -to {end} [filters] output.mp4
\`\`\`

### Progress Tracking
\`\`\`typescript
ffmpeg.on("progress", ({ progress }) => {
  onProgress?.(Math.round(progress * 100))
})
\`\`\`

## Browser Compatibility

### Supported
- Chrome 90+
- Edge 90+
- Firefox 90+
- Safari 15.4+ (limited, may be slower)

### Not Supported
- Older mobile browsers
- IE11 (not supported by ffmpeg.wasm)

Fallback message shown if ffmpeg.wasm can't load.

## Performance Considerations

### Memory Usage
- FFmpeg runs entirely in browser memory
- 500MB file limit prevents browser crashes
- Warn users if input > 500MB

### Processing Time
- Fast 720p: ~1-2x real-time (10s clip = 10-20s processing)
- Small 540p: ~1-1.5x real-time (10s clip = 10-15s processing)
- Cut Only: Near instant (just trimming, no re-encoding)

### Network
- FFmpeg.wasm core (~31MB) downloaded once, then cached
- Video files never sent to server during compression
- Only compressed clip uploaded for analysis

## Testing Scenarios

### Happy Path
1. User logs in
2. Clicks "Upload Video"
3. Selects 1-minute running video
4. Adjusts timeline to 8-second segment
5. Selects "Fast 720p"
6. Clicks compress
7. Waits ~15 seconds
8. Reviews preview
9. Submits analysis
10. Redirected to analyze page

### Edge Cases Handled
- ❌ No file selected → Error message
- ❌ Duration > 10s → Submit disabled, warning shown
- ❌ FFmpeg fails to load → Fallback message shown
- ❌ Compression error → Error shown, can retry
- ❌ Insufficient credits → Error, prompted to upgrade
- ❌ File > 500MB → Rejected on upload

## Future Enhancements (Optional)

1. **Stride Detection**: Auto-detect foot contacts and suggest ideal clip range
2. **Server-side Fallback**: If ffmpeg.wasm fails, upload to server for processing
3. **Multiple Clips**: Batch trim multiple segments from one video
4. **Advanced Filters**: Brightness, contrast, rotation adjustments
5. **Thumbnail Preview**: Show video thumbnails along timeline
6. **Keyboard Shortcuts**: Space to play/pause, arrow keys to adjust in/out

## Troubleshooting

### FFmpeg Won't Load
- Check browser console for CORS errors
- Verify unpkg.com is accessible
- Try different browser or clear cache

### Compression Fails
- Try "Cut Only" preset (no re-encoding)
- Select shorter clip
- Try smaller source file

### Poor Output Quality
- Use "Fast 720p" instead of "Small 540p"
- Check source video quality
- Ensure good lighting in original recording

---

## Quick Reference

**Entry**: Home → Click "Upload Video" → `/trim`

**Max Duration**: 10 seconds

**Recommended**: 6-12 seconds (2-3 strides)

**Credits Cost**: 5 per analysis

**Presets**: Fast 720p (default) | Small 540p | Cut Only

**Browser**: Modern Chrome/Edge/Firefox (Safari may be slower)
