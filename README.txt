IARLEY VISUALS — UPDATED SITE

FILES
- index.html, style.css, script.js: website files
- assets/: put your motion video files here (.mp4, .webm, .ogv, .ogg, .mov)
- generate-motions.js: scans assets/ and generates assets/motions.json

MOTION GALLERY SETUP
1. Copy your motion videos into assets/.
2. Run `node generate-motions.js` in this folder.
3. Upload the whole folder to your web host, including assets/motions.json.
4. Open the website through a web server/hosting, not by double-clicking index.html (fetch requires HTTP/HTTPS).

SOUND
Motion previews start muted. Each card has a MUTED / SOUND ON button. Click ↗ to open a larger player with playback controls. Browsers may block autoplay with sound, so previews intentionally start muted.

YOUTUBE VIEWS API
script.js already sums view counts for all 20 listed portfolio videos using YouTube Data API v3. To activate it, create a YouTube Data API v3 key in Google Cloud Console, restrict it to your website's HTTP referrers and YouTube Data API v3, then replace PASTE_YOUTUBE_DATA_API_KEY_HERE in script.js. A browser key is visible to visitors, so domain/API restrictions are important. For a secret key, use a server-side endpoint instead.

NOTE
A static website cannot automatically list directory contents in the browser. The included Node script generates the manifest from assets/ so every supported video is included after you run it.
