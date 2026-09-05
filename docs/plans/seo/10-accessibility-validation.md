# SEO-10 local validation — 5 Sep 2026

Headless Chrome Lighthouse, accessibility category, default mobile emulation, local Vite site using the configured production CMS API. Two final runs per route. Production homepage before changes scored 96.

| Route | Run 1 | Run 2 |
|---|---|---|
| home | 100 | 100 |
| gallery | 100 | 100 |
| booking | 100 | 100 |
| wedding-photography-erode | 100 | 100 |
| wedding-packages-erode | 100 | 100 |
| about | 100 | 100 |
| stories | 100 | 100 |

Checks cover the content states loaded during each run; package empty-state rendering was among the verified states. They do not establish populated-state coverage, light-theme/desktop behavior, keyboard usability or screen-reader compatibility.

Dialog focus behavior has separate JSDOM regression coverage. Interactive browser unavailable; manual checks and deployment remain pending.
