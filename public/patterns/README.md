# Managing the collar fabric patterns

Everything shown in the "Fabric" step of the collar builder comes from
**`catalogue.json`** in this folder. You can add, remove, rename, or mark a
pattern out of stock by editing that one file — no other file needs to
change.

## Editing on GitHub (no software to install)

1. Go to the repository on github.com and open `public/patterns/catalogue.json`.
2. Click the pencil (✏️) icon in the top right to edit.
3. Make your change (see below), then scroll down and click **Commit
   changes**. The live site updates automatically.
4. To add a new photo: go back to the `public/patterns` folder, click **Add
   file → Upload files**, and drag the image in.

## The file format

`catalogue.json` is a list of patterns. Each one looks like this:

```json
{
  "code": "1c",
  "category": "floral",
  "name_cz": "lesní louka",
  "name_en": "forest meadow",
  "status": "active",
  "widths": ["25", "40"],
  "image": "c1 forest meadow.png"
}
```

| Field | What it means |
|---|---|
| `code` | A short unique ID for this pattern. Must not be the same as any other entry. Once set, don't change it — leave it as-is even when renaming or editing. |
| `category` | Which tab it appears under. Must be exactly one of: `floral`, `stripes`, `mono`, `random`. |
| `name_cz` | The Czech name shown to customers. |
| `name_en` | The English name shown to customers. |
| `note_cz` / `note_en` | *(optional — only add these two lines if needed)* A small note under the name, e.g. `"50 % polyester"`. Leave both out entirely for a pattern with no note. |
| `status` | One of three values — see below. |
| `widths` | Which collar width(s) this pattern can be used on: `["25", "40"]` for both (the normal case), `["40"]` for 40mm-only, `["25"]` for 25mm-only. A pattern not available for the width a customer picked simply doesn't show up — this is different from `out_of_stock`, which still shows the pattern but greyed out. |
| `image` | The exact filename of the photo in this folder (spelling, spaces and capital letters all have to match exactly). |

### `status` — the three options

- `"active"` — shown normally, customers can select it.
- `"out_of_stock"` — still shown (greyed out, with an "Out of stock" /
  "Vyprodáno" label) so customers know it exists, but it can't be selected.
- `"hidden"` — completely removed from the site, as if it didn't exist.
  Use this instead of deleting the entry if you might bring the pattern back
  later.

### Common tasks

- **Add a new pattern**: upload its photo to this folder, then add a new
  entry to `catalogue.json` (copy an existing one and change every field,
  including a fresh `code`).
- **Remove a pattern**: change its `status` to `"hidden"` (safest — you can
  restore it later) or delete its whole `{ ... }` entry.
- **Rename a pattern**: edit `name_cz` and/or `name_en`.
- **Mark something out of stock**: change `status` to `"out_of_stock"`.
  Change it back to `"active"` when it's available again.
- **Restrict a pattern to one width**: set `widths` to just `["25"]` or
  `["40"]`.

### A few things to double-check before saving

- Every entry needs a comma `,` after its closing `}` **except the very last
  one** in the list.
- Text always goes in double quotes `"like this"`.
- If the site looks broken after an edit, the most common cause is a missing
  comma or quote — compare your change against a neighbouring entry that
  still works.

Adding a brand-new category (a 5th tab) isn't supported by this file alone —
that needs a small code change, so just ask for that separately if you need
one.
