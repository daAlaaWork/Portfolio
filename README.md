# Alaa Mahmoud — Portfolio

**Live: https://daalaawork.github.io/Portfolio/**

Concept, geometry, pipeline, engine, delivery — the stages usually split across
four hires and three handovers. This site is the record of holding the whole
line: real-time engine work, generative pipelines, the tooling teams work
inside, and the built architecture underneath it.

## What this repo is

A static site. No build step and no framework — `index.html`, one stylesheet,
one script, and a data file. The only external requests are Google Fonts and
FontAwesome.

```
index.html        markup and copy
index.css         all styling
app.js            rendering, filtering, the interactive demos
data/projects.js  the project registry — single source of truth
assets/           images, video, plates
```

Every project on the page comes from `data/projects.js`. The category and
capability registries at the top of that file drive the filter pills and the
capability lens; a project carrying a category or capability that isn't
registered there won't be reachable, which is deliberate.

## Running it locally

Any static server works:

```
python -m http.server 8000
```

Then open http://localhost:8000. If you are editing `app.js` or
`data/projects.js`, serve with no-store caching headers — otherwise the browser
keeps handing you the old file and a saved edit looks like it did nothing.

## Contact

archalaamahmoud@gmail.com
