# ctoumieh.github.io

Personal website of Charbel Toumieh. Plain HTML, CSS and a little JavaScript: no build step, no framework, nothing to install. GitHub Pages serves this folder as it is.

## Put it online

1. On GitHub, create a **public** repository named exactly `ctoumieh.github.io`.
2. Upload everything in this folder to it, either by dragging the files onto the repository page (**Add file → Upload files**) or with git:
   ```
   git init
   git add .
   git commit -m "Personal website"
   git branch -M main
   git remote add origin https://github.com/ctoumieh/ctoumieh.github.io.git
   git push -u origin main
   ```
3. In the repository, open **Settings → Pages**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, and save.
4. A minute or two later the site is live at <https://ctoumieh.github.io>. Every later push updates it.

To preview on your computer, run `python3 -m http.server` inside this folder and open <http://localhost:8000> (opening `index.html` directly also works). In a local preview, every frame still waiting for its picture or clip shows the file name it expects. On the live site those hints never appear.

## Still to fill in

| What | Where |
|---|---|
| Year of the ICRA paper | `index.html`, search for `Check the year` |
| Flapping-wing clip | `media/clips/ral26-xfly.mp4` (the flight video is at https://youtu.be/pVb3DoUntWI) |
| A picture or clip for five papers | `media/posters/NAME.jpg`, optionally with `media/clips/NAME.mp4`, for `icra26-shared-control`, `npj24-liseagle`, `arxiv23-latency`, `ral22-time-aware` and `jirs22-corridors` |

## The page

The menu at the top right links to the four sections:

- **About:** name, photo, one paragraph and the links.
- **Research:** the two areas, each with a looping clip, then the **Papers**, each with a picture or clip beside its title, venue and description.
- **Teaching.**
- **CV:** positions, education, awards and service, with a link to the full PDF.

All the content is in `index.html`, and each part starts with a comment banner.

## Pictures and clips

Every picture or clip on the page has a NAME and uses two files:

```
media/posters/NAME.jpg   the picture (for a clip, its first frame)
media/clips/NAME.mp4     optional: a looping clip that plays over the picture
```

Save the files under the names already written in `index.html` and they appear; nothing in the HTML needs to change. A picture can be anything that shows what is inside the paper: a key figure, a photo of the experiment, a frame of the video. The research-area frames are 16:9. A paper's frame runs the full height of the text beside it (and is never shorter than 16:9), so it is usually narrower than 16:9 and the picture's sides are cropped: keep the subject near the middle. Other shapes are centre-cropped to fit.

Until a paper's picture exists, its frame shows the venue (for example "ICRA 2026") on a light grid; on phones, such frames are left out. Without a clip, the picture simply stays still.

In place now: `swarmnxt-six-drones` (aerial swarms: the six-drone panel of the overview GIF in `swarm-nxt`, which is a collage, so running `make_clip.sh` on the whole GIF gives the full collage), `ral26-xfly` (flapping-wing flight, still only), `swarmnxt-obstacles` (SwarmNxt paper, photo), `ral26-gate` (XFly paper, photo) and `tro24-circular` (T-RO 2024, made from the circular-exchange GIF in `multi_agent_pkgs`). The Crazyflie flight clip, `tro24-crazyflie`, is not used at the moment; to show it beside the T-RO 2024 paper instead, put that name in the paper's `<video>`.

## Making clips: MP4, not GIF

A muted, looping MP4 behaves exactly like a GIF on the page, but it is far smaller and keeps a smooth frame rate. The Crazyflie GIF in `multi_agent_pkgs` is 19.7 MB; the clip made from it here is 1.4 MB.

```
bash tools/make_clip.sh INPUT NAME [START] [DURATION]
```

For example, eight seconds starting at 1 min 12 s of a flight video:

```
bash tools/make_clip.sh ~/Videos/xfly_flight.mp4 ral26-xfly 1:12 8
```

This writes `media/clips/ral26-xfly.mp4`, plus its first frame as `media/posters/ral26-xfly.jpg`, which the page shows until the video starts. It needs ffmpeg (`brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Linux). The input can be any video or a GIF.

Settings, given as environment variables in front of the command: `FPS=60` for fast manoeuvres (default 30), `WIDTH` (default 1280; 720 is plenty for a paper's frame), `CRF` for quality (default 24; lower is sharper and larger), `ASPECT=none` to keep the source framing instead of centre-cropping to the page's 16:9 frame, and `PAD=colour` to pad to 16:9 with that colour instead of cropping. The T-RO 2024 clip was made with:

```
PAD=0x2f2d2f WIDTH=720 FPS=12 bash tools/make_clip.sh circular.gif tro24-circular 0 15
```

Aim for 5 to 10 seconds and under about 3 MB per clip (under 1 MB for a paper's frame). Clips load only when they come near the screen, play while visible and pause off-screen. A pause button appears on hover (always on touch screens), and visitors whose system asks for reduced motion see the picture and a play button instead.

## Adding a paper

Copy one `<li class="paper">` block in `index.html` and change:

- the two file names in its `<video>` to a new NAME, then add `media/posters/NAME.jpg` (and the clip, if any);
- `data-line`: `swarm` or `flap`, which sets the accent colour;
- `data-label`: the short venue shown until the picture exists;
- the title and its link, where it is published, and the one- or two-sentence description.

Papers are listed newest first. To add a row to Teaching or the CV, copy one `<li>` of that list: the first `<span>` is the date or a short label, the second is the text.

## What is where

```
index.html             all content
assets/css/style.css   design; colours and fonts are defined at the top
assets/js/main.js      menu, portrait slot, pictures and clips
assets/fonts/          B612 and STIX Two Text, self-hosted (SIL Open Font License)
assets/img/            favicon and social preview card
media/posters/         pictures, and the first frame of each clip
media/clips/           looping MP4s
media/portrait.jpg     your photo (about square, face in the middle)
files/                 your CV (Charbel_Toumieh_CV.pdf)
tools/make_clip.sh     video or GIF to web clip and picture
```

The fonts are served from the site itself, so the page makes no requests to any other site.

## Custom domain (optional)

Add the domain under **Settings → Pages → Custom domain**, then update the `ctoumieh.github.io` addresses in the `<head>` of `index.html`: the canonical link, `og:url`, `og:image`, and `url` in the JSON-LD block.
