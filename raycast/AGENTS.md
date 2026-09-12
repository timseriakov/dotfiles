# Raycast notes for future agents

## Kill Process on pre-Tahoe Raycast

The current Store version of `Kill Process` requires Raycast `v1.104.1`, so it cannot be installed on the user's Raycast `v1.93.2`. This is a Raycast v1 API mismatch, not a reason to upgrade macOS to Tahoe.

Use the older source revision whose parent is `67bf5d48d2c47d4a885a46f7a8ed419c3fec56ee`. Commit `f4ea41ccf6698212c4c4465069bdb4e6f69275d8` raised `@raycast/api` from `^1.90.0` to `^1.104.1`.

The local clone is kept here:

```text
~/Documents/Raycast Extensions/extensions/extensions/kill-process
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin 67bf5d48d2c47d4a885a46f7a8ed419c3fec56ee
git checkout 67bf5d48d2c47d4a885a46f7a8ed419c3fec56ee -- extensions/kill-process
cd extensions/kill-process
npm ci
npm run dev
```

After Raycast reports the extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. Keep the source directory and do not run `npm update` or `npm audit fix`, because changing the locked dependency versions can reintroduce the incompatibility.

Do not install the current Store version, change its API dependency by hand, unblock macOS Tahoe update domains, or upgrade Raycast unless the user explicitly asks for that migration.

## Color Picker on pre-Tahoe Raycast

The current Store version requires Raycast `v1.104.6`. The newer historical version also requires Xcode to compile Swift, which is unavailable when only Command Line Tools are active.

Use the legacy source revision `bd9cd5b1f15aeb9ca97eb99bcc44524c1890aaab`. It uses `@raycast/api ^1.58.0` and includes a universal `assets/color-picker` helper, so it builds without Xcode and works with Raycast `v1.93.2`.

The clean local worktree is kept here:

```text
~/Documents/Raycast Extensions/color-picker-legacy-pre-xcode/extensions/color-picker
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin bd9cd5b1f15aeb9ca97eb99bcc44524c1890aaab
git worktree add --detach "$HOME/Documents/Raycast Extensions/color-picker-legacy-pre-xcode" bd9cd5b1f15aeb9ca97eb99bcc44524c1890aaab
cd "$HOME/Documents/Raycast Extensions/color-picker-legacy-pre-xcode"
git sparse-checkout init --cone --sparse-index
git sparse-checkout set extensions/color-picker
cd extensions/color-picker
npm ci
npm run dev
```

After Raycast reports the extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. This revision contains only the original Pick Color, menu bar, and color history workflow; newer commands such as Color Wheel and Color Names are not included.

## Downloads Manager on pre-Tahoe Raycast

The current Store version requires Raycast `v1.104.6`. Use commit `4489a6a3376220498f156d52eb52a2039e446085`, which uses `@raycast/api ^1.53.3` and builds on Raycast `v1.93.2`.

The clean local worktree is kept here:

```text
~/Documents/Raycast Extensions/downloads-manager-legacy/extensions/downloads-manager
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin 4489a6a3376220498f156d52eb52a2039e446085
git worktree add --detach "$HOME/Documents/Raycast Extensions/downloads-manager-legacy" 4489a6a3376220498f156d52eb52a2039e446085
cd "$HOME/Documents/Raycast Extensions/downloads-manager-legacy"
git sparse-checkout init --cone --sparse-index
git sparse-checkout set extensions/downloads-manager
cd extensions/downloads-manager
npm ci
npm run dev
```

## qBittorrent on pre-Tahoe Raycast

The current Store version requires Raycast `v1.104.11`. Use commit `da13c46043e71dad93d97d4e7a9002ffd2ea339a`, which uses `@raycast/api ^1.92.1` and builds on Raycast `v1.93.2`. The extension's package name is historically misspelled as `qbitorrent`; this is also the installed directory name.

The clean local worktree is kept here:

```text
~/Documents/Raycast Extensions/qbittorrent-legacy/extensions/qbittorrent
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin da13c46043e71dad93d97d4e7a9002ffd2ea339a
git worktree add --detach "$HOME/Documents/Raycast Extensions/qbittorrent-legacy" da13c46043e71dad93d97d4e7a9002ffd2ea339a
cd "$HOME/Documents/Raycast Extensions/qbittorrent-legacy"
git sparse-checkout init --cone --sparse-index
git sparse-checkout set extensions/qbittorrent
cd extensions/qbittorrent
npm ci
npm run dev
```

After Raycast reports either extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. Do not run `npm update` or `npm audit fix`, because changing the locked dependency versions can reintroduce the incompatibility.

## Google Search on pre-Tahoe Raycast

The current Store version requires Raycast `v1.104.21`. Use commit `eb665ff3671cf512d5209dbca35913c8831f865f`, which uses `@raycast/api ^1.44.0` and builds on Raycast `v1.93.2`. The following Windows release already requires `v1.103.4`.

The clean local worktree is kept here:

```text
~/Documents/Raycast Extensions/google-search-legacy/extensions/google-search
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin eb665ff3671cf512d5209dbca35913c8831f865f
git worktree add --detach "$HOME/Documents/Raycast Extensions/google-search-legacy" eb665ff3671cf512d5209dbca35913c8831f865f
cd "$HOME/Documents/Raycast Extensions/google-search-legacy"
git sparse-checkout init --cone --sparse-index
git sparse-checkout set extensions/google-search
cd extensions/google-search
npm ci
npm run dev
```

After Raycast reports the extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. Do not run `npm update` or `npm audit fix`, because changing the locked dependency versions can reintroduce the incompatibility.

## Coffee on pre-Tahoe Raycast

The current Store version requires Raycast `v2.1.2`. Use commit `d480d47a5c3271f36134614ecdc49b2d447bccf2`, which uses `@raycast/api ^1.91.0` and `@raycast/utils ^1.12.5`, and builds on Raycast `v1.93.2`.

The clean local worktree is kept here:

```text
~/Documents/Raycast Extensions/coffee-legacy/extensions/coffee
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin d480d47a5c3271f36134614ecdc49b2d447bccf2
git worktree add --detach "$HOME/Documents/Raycast Extensions/coffee-legacy" d480d47a5c3271f36134614ecdc49b2d447bccf2
cd "$HOME/Documents/Raycast Extensions/coffee-legacy"
git sparse-checkout init --cone --sparse-index
git sparse-checkout set extensions/coffee
cd extensions/coffee
npm ci
npm run dev
```

After Raycast reports the extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. Do not run `npm update` or `npm audit fix`, because changing the locked dependency versions can reintroduce the incompatibility.

## Raindrop.io on pre-Tahoe Raycast

The current Store version requires Raycast `v1.103.2`. Use commit `990e1ad484fa4cd28b9a5f08823c87c3e003977b`, which uses `@raycast/api ^1.79.1` and `@raycast/utils ^1.16.3`, and builds on Raycast `v1.93.2`. The next September 2025 revision raises the API requirement to `^1.102.6`.

The clean local worktree is kept here:

```text
~/Documents/Raycast Extensions/raindrop-io-legacy/extensions/raindrop-io
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin 990e1ad484fa4cd28b9a5f08823c87c3e003977b
git worktree add --detach "$HOME/Documents/Raycast Extensions/raindrop-io-legacy" 990e1ad484fa4cd28b9a5f08823c87c3e003977b
cd "$HOME/Documents/Raycast Extensions/raindrop-io-legacy"
git sparse-checkout init --cone --sparse-index
git sparse-checkout set extensions/raindrop-io
cd extensions/raindrop-io
npm ci
npm run dev
```

After Raycast reports the extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. Do not run `npm update` or `npm audit fix`, because changing the locked dependency versions can reintroduce the incompatibility.

Important compatibility fix for Raycast `1.93.2`: commit `ddfd61f96f66a867059a917e681052ad07af8cc4` replaced Raycast `useFetch` with manual pagination but called the global `fetch`, which is undefined in this Raycast runtime. Keep these two lines in `src/hooks/useBookmarks.ts`:

```ts
import fetch from "node-fetch";
const data = (await response.json()) as BookmarksResponse;
```

Without them, `Add Bookmarks` fails with `fetch is not defined`, including when launched from qutebrowser.

The prefilled qutebrowser form comes from commit `92742e8c2ed52f0abf57ed28a16994bb1055b6f3` (`feat(raindrop-io): prefill add form from launch context`, 2025-09-01). Because that commit requires a newer Raycast, keep its `src/add.tsx` change locally: read `props.launchContext.url/title` and pass them as `defaultLink` and `defaultValues` to `BookmarkForm`. Without it, qutebrowser can open `Add Bookmarks`, but the Link and Title fields stay empty.

Keep the lifecycle fix from `/Users/tim/dev/pet-old/raycast-raindrop-io-ext`: `add.tsx` must await the animated toast hide, call `closeMainWindow({ clearRootSearch: true, popToRootType: PopToRootType.Immediate })`, then show the success toast. `BookmarkForm` must type `onSaved` as `void | Promise<void>`, await it, and skip its local reset when an external `onSaved` callback is supplied. Otherwise `Add Bookmarks` remains open after a successful save.

## Tailscale on pre-Tahoe Raycast

The current Store version requires Raycast `v1.104.5`. Use commit `e1c17d0c953fd1c883f3dad19c97cf56992ecb97`, which uses `@raycast/api ^1.77.3` and `@raycast/utils ^1.9.0`, and builds on Raycast `v1.93.2`. The February 2026 revision is where the API requirement was raised to `^1.104.5`.

The clean local worktree is kept here:

```text
~/Documents/Raycast Extensions/tailscale-legacy/extensions/tailscale
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin e1c17d0c953fd1c883f3dad19c97cf56992ecb97
git worktree add --detach "$HOME/Documents/Raycast Extensions/tailscale-legacy" e1c17d0c953fd1c883f3dad19c97cf56992ecb97
cd "$HOME/Documents/Raycast Extensions/tailscale-legacy"
git sparse-checkout init --cone --sparse-index
git sparse-checkout set extensions/tailscale
cd extensions/tailscale
npm ci
npm run dev
```

After Raycast reports the extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. Do not run `npm update` or `npm audit fix`, because changing the locked dependency versions can reintroduce the incompatibility.
