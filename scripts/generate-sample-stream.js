const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/streams/sample-hls');

console.log('🎬 Generating local multi-bitrate HLS test stream using FFmpeg...');

// Ensure output directories exist
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, '720p'), { recursive: true });
fs.mkdirSync(path.join(outputDir, '480p'), { recursive: true });
fs.mkdirSync(path.join(outputDir, '360p'), { recursive: true });

try {
  // Generate a 45-second animated test video with timecode, moving shapes and sine audio
  const rawVideoPath = path.join(outputDir, 'raw-source.mp4');
  console.log('Step 1: Generating high quality synthetic source video with timecode...');
  
  const genSourceCmd = `ffmpeg -y -f lavfi -i testsrc=duration=45:size=1280x720:rate=30 \\
    -f lavfi -i sine=frequency=440:duration=45 \\
    -vf "drawtext=text='StreamHub Studio Test - %{pts\\:hms}':fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=h-80" \\
    -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k \\
    "${rawVideoPath}"`;

  execSync(genSourceCmd, { stdio: 'inherit' });

  console.log('Step 2: Transcoding into multi-bitrate HLS streams (720p, 480p, 360p)...');

  // 720p stream
  execSync(
    `ffmpeg -y -i "${rawVideoPath}" -vf "scale=1280:720" -c:v libx264 -b:v 2500k -maxrate 2800k -bufsize 3500k -c:a aac -b:a 128k -hls_time 4 -hls_playlist_type vod -hls_segment_filename "${outputDir}/720p/seg_%03d.ts" "${outputDir}/720p/prog_index.m3u8"`,
    { stdio: 'inherit' }
  );

  // 480p stream
  execSync(
    `ffmpeg -y -i "${rawVideoPath}" -vf "scale=854:480" -c:v libx264 -b:v 1200k -maxrate 1400k -bufsize 1800k -c:a aac -b:a 96k -hls_time 4 -hls_playlist_type vod -hls_segment_filename "${outputDir}/480p/seg_%03d.ts" "${outputDir}/480p/prog_index.m3u8"`,
    { stdio: 'inherit' }
  );

  // 360p stream
  execSync(
    `ffmpeg -y -i "${rawVideoPath}" -vf "scale=640:360" -c:v libx264 -b:v 600k -maxrate 700k -bufsize 900k -c:a aac -b:a 64k -hls_time 4 -hls_playlist_type vod -hls_segment_filename "${outputDir}/360p/seg_%03d.ts" "${outputDir}/360p/prog_index.m3u8"`,
    { stdio: 'inherit' }
  );

  // Generate Master Playlist linking the variants
  console.log('Step 3: Creating Master M3U8 Playlist (ABR)...');
  const masterContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720,NAME="720p HD"
720p/prog_index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1296000,RESOLUTION=854x480,NAME="480p SD"
480p/prog_index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=664000,RESOLUTION=640x360,NAME="360p Low"
360p/prog_index.m3u8
`;

  fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterContent);
  
  // Clean up intermediate raw mp4
  if (fs.existsSync(rawVideoPath)) {
    fs.unlinkSync(rawVideoPath);
  }

  console.log('✅ HLS Multi-bitrate stream generation completed successfully!');
  console.log(`📁 Saved to: ${outputDir}/master.m3u8`);
} catch (err) {
  console.error('Failed to generate HLS test stream:', err);
  process.exit(1);
}

