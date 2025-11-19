# Project Risks, Mitigations, and Fallbacks
## 1. Hydrant Scripts Not Working on Our End
* Risk: Translating Hydrant’s Python scripts for scraping the MIT course catalog does not translate cleanly into TypeScript for backend use.
* Mitigation:
  *	Validate Output Against Hydrant’s Reference Data: After translating each module, compare the JSON output to Hydrant’s original JSON to ensure accuracy and completeness.
  *	Modular Translation Approach: Break Hydrant’s Python scraper into small logical parts (HTML fetching, parsing, cleaning, structuring) and translate incrementally.
  * Cache Scraped Data: Reduce performance strain by caching scraped results and updating them periodically instead of scraping frequently.
* Fallback:
  *	Option A: Keep Hydrant’s Python scraper as-is and run it as a separate service or cron job that outputs JSON for the TypeScript backend.
  * Option B: Switch to direct HTML scraping of the MIT Catalog/Registrar using TypeScript-native libraries.
  * Option C: Allow users to upload CourseRoad–exported JSON files. Parse and cache these courses. (Times/days would be missing, so users may need to enter them manually.)
## 2. FERPA-Adjacent Privacy & Safety Risks
  * Risk:
    * An adversary could guess or access someone’s class schedule, leading to stalking, harassment, or safety threats.
  * Mitigation:
    * Require MIT email verification through OAuth (Touchstone / Duo).
    * Make schedules visible only to accepted friends — never public.
    * Allow blacklist controls so users can block specific people from viewing their schedules.
  * Fallback:
    * If safe schedule visibility cannot be guaranteed:
    * Restrict sharing to similarity scores only (e.g., “You share 2 classes”) without showing times.
    * Remove shared schedule views entirely, keeping schedules private to each user.
## 3. Users Don’t Adopt the App (Network Effect Problem)
  * Risk:
    * A scheduling-with-friends app is only valuable when many friends join—early adoption may be slow.
  * Mitigation:
    * Ensure the app is fully useful even with 0 friends (personal schedule planner + course discovery).
    * Create targeted MIT groups (class year, dorm, student orgs) so users join public groups even without friends on the app.
  * Fallback:
    * If adoption remains low:
    * Pivot to a personal smart-scheduler with optional social features.
    * Add “public groups” (clubs, dorms, majors) so usefulness doesn’t depend only on friends.
## 4. Visualizing Overlapping Schedules May Be Too Complex
  * Risk:
    * Displaying multiple students’ schedules cleanly may require complex UI and could lead to clutter or heavy front-end engineering.
  * Mitigation:
    * Start with simple static visualizations (weekly grid) and add interactivity later.
    * Use existing TypeScript-compatible calendar libraries instead of building from scratch.
    * Build modular UI components for individual schedules, pairwise comparisons, etc.
    * Conduct quick user testing to refine layout before full implementation.
  * Fallback:
    * If visual overlapping becomes too difficult:
    * Users only view their own schedule, and clicking a course shows a list of friends/group members taking that course at the same time instead of a combined visual overlay.
